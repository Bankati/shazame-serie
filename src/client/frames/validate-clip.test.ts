import { describe, expect, it } from "vitest";

import { CLIP_MAX_BYTES } from "@/shared/frames/constants";

import { checkClipDuration, checkClipFile } from "./validate-clip";

const MB = 1024 * 1024;

describe("checkClipFile", () => {
  it.each([
    ["clip.mp4", "video/mp4"],
    ["clip.mov", "video/quicktime"],
    ["clip.webm", "video/webm"],
    ["CLIP.MOV", ""],
    ["clip.mp4", "application/octet-stream"],
    ["clip.m4v", "video/x-m4v"],
    ["clip.3gp", "video/3gpp"],
    ["clip.mkv", "video/x-matroska"],
    ["clip.mkv", ""],
    ["clip.avi", "video/x-msvideo"],
    ["clip.avi", "video/avi"],
    ["clip.avi", "video/vnd.avi"],
  ])("accepte %s (%s)", (name, type) => {
    expect(checkClipFile({ name, type, size: 5 * MB })).toEqual({ ok: true });
  });

  it.each([
    ["photo.jpg", "image/jpeg"],
    ["clip.wmv", "video/x-ms-wmv"],
    ["clip.flv", ""],
    ["clip.mp4.exe", ""],
    ["clip.mp4", "image/png"],
  ])("refuse le format de %s (%s)", (name, type) => {
    expect(checkClipFile({ name, type, size: 5 * MB })).toEqual({ ok: false, problem: "unsupported_format" });
  });

  it("refuse un fichier vide", () => {
    expect(checkClipFile({ name: "clip.mp4", type: "video/mp4", size: 0 })).toEqual({ ok: false, problem: "empty" });
  });

  it("accepte 500 Mo tout juste et refuse au-delà", () => {
    expect(checkClipFile({ name: "clip.mp4", type: "video/mp4", size: CLIP_MAX_BYTES })).toEqual({ ok: true });
    expect(checkClipFile({ name: "clip.mp4", type: "video/mp4", size: CLIP_MAX_BYTES + 1 })).toEqual({
      ok: false,
      problem: "too_large",
    });
  });
});

describe("checkClipDuration", () => {
  it.each([1, 30, 60, 3600])("accepte %s s (au-delà de 60 s, un passage est choisi)", (duration) => {
    expect(checkClipDuration(duration)).toEqual({ ok: true });
  });

  it("refuse un clip de moins d'une seconde", () => {
    expect(checkClipDuration(0.4)).toEqual({ ok: false, problem: "too_short" });
  });

  it.each([0, Number.NaN, Number.POSITIVE_INFINITY])("juge illisible une durée de %s", (duration) => {
    expect(checkClipDuration(duration)).toEqual({ ok: false, problem: "unreadable" });
  });
});
