import { describe, expect, it } from "vitest";

import { env } from "@/server/env";
import { fetchThumbnail, fetchYouTubeMetadata } from "@/server/links/link-metadata";

// U36 en direct (clé YouTube de .env.local, D10) : métadonnées publiques et vignette d'une vidéo publique très
// connue. Une unité de quota gratuite par passage ; jamais en CI.
describe("YouTube Data API en direct", () => {
  it("titre, chaîne et vignette d'une vidéo publique ; vignette réencodée", async () => {
    const result = await fetchYouTubeMetadata("dQw4w9WgXcQ", env.YOUTUBE_API_KEY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.metadata.title).toMatch(/Never Gonna Give You Up/);
    expect(result.metadata.author).not.toBe("");
    const thumbnail = await fetchThumbnail(result.metadata.thumbnailUrl, "youtube");
    expect(thumbnail?.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  });

  it("vidéo inexistante : not_found", async () => {
    expect(await fetchYouTubeMetadata("zzzzzzzzzz0", env.YOUTUBE_API_KEY)).toEqual({ ok: false, failure: "not_found" });
  });
});
