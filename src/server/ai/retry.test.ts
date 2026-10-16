import { describe, expect, it, vi } from "vitest";

import { withRetries } from "./retry";

const always = () => true;

describe("withRetries", () => {
  it("renvoie le premier succès", async () => {
    const attempt = vi.fn().mockRejectedValueOnce(new Error("a")).mockResolvedValueOnce("ok");
    await expect(withRetries(attempt, { isRetryable: always, sleep: async () => {} })).resolves.toBe("ok");
    expect(attempt.mock.calls.map(([n]) => n)).toEqual([1, 2]);
  });

  it("s'arrête à 3 tentatives et rend la dernière erreur", async () => {
    const attempt = vi.fn().mockRejectedValue(new Error("panne"));
    await expect(withRetries(attempt, { isRetryable: always, sleep: async () => {} })).rejects.toThrow("panne");
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it("ne réessaie pas une erreur définitive", async () => {
    const attempt = vi.fn().mockRejectedValue(new Error("définitive"));
    await expect(withRetries(attempt, { isRetryable: () => false, sleep: async () => {} })).rejects.toThrow();
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("ne réessaie pas après une annulation", async () => {
    const controller = new AbortController();
    controller.abort();
    const attempt = vi.fn().mockRejectedValue(new Error("annulée"));
    await expect(withRetries(attempt, { isRetryable: always, sleep: async () => {}, signal: controller.signal })).rejects.toThrow();
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
