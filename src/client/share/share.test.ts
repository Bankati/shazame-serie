import { describe, expect, it, vi } from "vitest";

import { shareLink } from "./share";

const DATA = { title: "Matrix", text: "Matrix : trouvé avec SHAZAM SERIE", url: "https://site.example/titre/film/603-matrix" };

describe("shareLink", () => {
  it("téléphone : partage natif", async () => {
    const share = vi.fn(async () => {});
    const copy = vi.fn(async () => {});
    expect(await shareLink(DATA, { share, copy })).toBe("shared");
    expect(share).toHaveBeenCalledWith(DATA);
    expect(copy).not.toHaveBeenCalled();
  });

  it("feuille de partage fermée : rien à signaler, pas de copie", async () => {
    const share = vi.fn(async () => {
      throw new DOMException("annulé", "AbortError");
    });
    const copy = vi.fn(async () => {});
    expect(await shareLink(DATA, { share, copy })).toBe("cancelled");
    expect(copy).not.toHaveBeenCalled();
  });

  it("ordinateur sans partage natif, ou partage refusé : lien copié", async () => {
    const copy = vi.fn(async () => {});
    expect(await shareLink(DATA, { copy })).toBe("copied");
    expect(copy).toHaveBeenCalledWith(DATA.url);
    const refused = vi.fn(async () => {
      throw new DOMException("refusé", "NotAllowedError");
    });
    expect(await shareLink(DATA, { share: refused, copy })).toBe("copied");
  });

  it("ni partage ni presse-papiers : échec signalé", async () => {
    expect(await shareLink(DATA, {})).toBe("failed");
    expect(await shareLink(DATA, { copy: async () => Promise.reject(new Error("refus")) })).toBe("failed");
  });
});
