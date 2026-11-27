import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const directives = (policy: string) =>
  Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...values] = directive.split(" ");
      return [name, values];
    }),
  );

const deployed = { isDev: false, isDeployed: true, supabaseUrl: "https://abc.supabase.co", posthogHost: "https://eu.i.posthog.com" };

describe("contentSecurityPolicy", () => {
  it("interdit les plugins, l'intégration dans un cadre et le changement de base", () => {
    const csp = directives(contentSecurityPolicy(deployed));
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["frame-ancestors"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
    expect(csp["default-src"]).toEqual(["'self'"]);
  });

  it("n'autorise que les origines utilisées par l'application", () => {
    const csp = directives(contentSecurityPolicy(deployed));
    expect(csp["img-src"]).toEqual(["'self'", "data:", "blob:", "https://image.tmdb.org", "https://abc.supabase.co"]);
    expect(csp["frame-src"]).toEqual(["https://www.youtube-nocookie.com"]);
    expect(csp["connect-src"]).toEqual(["'self'", "blob:", "https://eu.i.posthog.com", "https://eu-assets.i.posthog.com"]);
    expect(csp["script-src"]).toContain("https://eu-assets.i.posthog.com");
    expect(csp["form-action"]).toEqual([
      "'self'",
      "https://checkout.stripe.com",
      "https://billing.stripe.com",
      "https://accounts.google.com",
      "https://abc.supabase.co",
    ]);
  });

  it("réduit une adresse à son origine et ignore une adresse invalide", () => {
    const csp = directives(contentSecurityPolicy({ ...deployed, supabaseUrl: "https://abc.supabase.co/rest/v1", posthogHost: "pas une url" }));
    expect(csp["img-src"]).toContain("https://abc.supabase.co");
    expect(csp["img-src"]).not.toContain("https://abc.supabase.co/rest/v1");
    expect(csp["connect-src"]).toContain("https://eu.i.posthog.com");
    expect(directives(contentSecurityPolicy({ ...deployed, supabaseUrl: undefined }))["img-src"]).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://image.tmdb.org",
    ]);
  });

  it("force https seulement une fois déployé ; websocket du rechargement à chaud en développement", () => {
    expect(contentSecurityPolicy(deployed)).toContain("upgrade-insecure-requests");
    const local = contentSecurityPolicy({ isDev: true, isDeployed: false, supabaseUrl: "http://127.0.0.1:54321" });
    expect(local).not.toContain("upgrade-insecure-requests");
    expect(directives(local)["connect-src"]).toContain("ws:");
    expect(directives(local)["img-src"]).toContain("http://127.0.0.1:54321");
  });
});

describe("securityHeaders", () => {
  const byKey = (headers: { key: string; value: string }[]) => Object.fromEntries(headers.map((h) => [h.key, h.value]));

  it("pose les en-têtes de CDC 18.1 et HSTS une fois déployé", () => {
    const headers = byKey(securityHeaders(deployed));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("n'envoie pas HSTS en local (http)", () => {
    expect(byKey(securityHeaders({ isDev: false, isDeployed: false }))["Strict-Transport-Security"]).toBeUndefined();
  });
});
