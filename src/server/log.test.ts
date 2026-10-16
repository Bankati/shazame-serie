import { afterEach, describe, expect, it, vi } from "vitest";

import { log } from "./log";

describe("log", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("écrit une ligne JSON avec le niveau, l'événement et les champs", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    log.warn("result_cache.write_failed", { step: "store" });

    const line = JSON.parse(String(warn.mock.calls[0]?.[0]));
    expect(line).toMatchObject({ level: "warn", event: "result_cache.write_failed", step: "store" });
    expect(new Date(line.at).toISOString()).toBe(line.at);
  });

  it("utilise console.error pour les erreurs et console.info pour le reste", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    log.error("a");
    log.info("b");
    expect(error).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
