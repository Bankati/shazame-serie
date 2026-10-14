import { beforeEach, describe, expect, it, vi } from "vitest";

const captureExceptionImmediate = vi.fn();
const constructorOptions = vi.fn();
const envMock: { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?: string; NEXT_PUBLIC_POSTHOG_HOST: string; VERCEL_ENV?: string } = {
  NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
};

vi.mock("@/server/env", () => ({ env: envMock }));
vi.mock("posthog-node", () => ({
  PostHog: class {
    constructor(token: string, options: unknown) {
      constructorOptions(token, options);
    }
    captureExceptionImmediate = captureExceptionImmediate;
  },
}));

const CONTEXT = { path: "/titre/film/603?token=secret#frag", method: "GET", routeType: "render" };

// Le client est mis en cache au niveau du module : chaque test recharge le module.
async function loadCapture() {
  vi.resetModules();
  return (await import("./posthog-server")).captureServerError;
}

describe("captureServerError", () => {
  beforeEach(() => {
    captureExceptionImmediate.mockReset();
    constructorOptions.mockReset();
    delete envMock.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  });

  it("n'envoie rien sans clé de projet", async () => {
    const capture = await loadCapture();
    await capture(new Error("boom"), CONTEXT);
    expect(constructorOptions).not.toHaveBeenCalled();
    expect(captureExceptionImmediate).not.toHaveBeenCalled();
  });

  it("envoie l'erreur sans identité ni paramètre d'URL, vers la région UE", async () => {
    envMock.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test";
    const capture = await loadCapture();
    const error = new Error("boom");

    await capture(error, CONTEXT);

    expect(constructorOptions).toHaveBeenCalledWith("phc_test", expect.objectContaining({ host: "https://eu.i.posthog.com" }));
    expect(captureExceptionImmediate).toHaveBeenCalledWith(error, undefined, {
      path: "/titre/film/603",
      method: "GET",
      route_type: "render",
    });
  });

  it("ne lève jamais quand l'envoi échoue", async () => {
    envMock.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test";
    captureExceptionImmediate.mockRejectedValueOnce(new Error("réseau"));
    const capture = await loadCapture();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(capture(new Error("boom"), CONTEXT)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith("[observability] Envoi de l'erreur à PostHog impossible.");
    warn.mockRestore();
  });
});
