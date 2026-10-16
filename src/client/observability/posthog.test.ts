import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.fn();
const captureException = vi.fn();

vi.mock("posthog-js", () => ({ default: { init, captureException } }));

async function load() {
  vi.resetModules();
  return import("./posthog");
}

describe("PostHog navigateur", () => {
  beforeEach(() => {
    init.mockReset();
    captureException.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ne charge ni n'initialise rien sans clé de projet", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    const { loadPostHog } = await load();

    await expect(loadPostHog()).resolves.toBeNull();
    expect(init).not.toHaveBeenCalled();
  });

  it("initialise une seule fois, en UE, sans cookie et sans profil", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    const { loadPostHog } = await load();

    await Promise.all([loadPostHog(), loadPostHog()]);

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://eu.i.posthog.com",
        cookieless_mode: "always",
        person_profiles: "never",
        autocapture: false,
        disable_session_recording: true,
      }),
    );
  });

  it("envoie une erreur née dans le navigateur, pas une erreur serveur (digest)", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    const { loadPostHog, reportBoundaryError } = await load();
    const clientError = new Error("navigateur");

    reportBoundaryError(clientError);
    reportBoundaryError(Object.assign(new Error("serveur"), { digest: "123" }));
    await loadPostHog();
    await Promise.resolve();

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(clientError);
  });
});
