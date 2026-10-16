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
  ])("accepte %s (%s)", (name, type) => {
    expect(checkClipFile({ name, type, size: 5 * MB })).toEqual({ ok: true });
  });

  it.each([
    ["clip.avi", "video/x-msvideo"],
    ["photo.jpg", "image/jpeg"],
    ["clip.mkv", ""],
    ["clip.mp4.exe", ""],
  ])("refuse le format de %s (%s)", (name, type) => {
    expect(checkClipFile({ name, type, size: 5 * MB })).toEqual({ ok: false, problem: "unsupported_format" });
  });

  it("refuse un fichier vide", () => {
    expect(checkClipFile({ name: "clip.mp4", type: "video/mp4", size: 0 })).toEqual({ ok: false, problem: "empty" });
  });

  it("accepte 50 Mo tout juste et refuse au-delà", () => {
    expect(checkClipFile({ name: "clip.mp4", type: "video/mp4", size: CLIP_MAX_BYTES })).toEqual({ ok: true });
    expect(checkClipFile({ name: "clip.mp4", type: "video/mp4", size: CLIP_MAX_BYTES + 1 })).toEqual({
      ok: false,
      problem: "too_large",
    });
  });
});

describe("checkClipDuration", () => {
  it.each([1, 30, 60])("accepte %s s", (duration) => {
    expect(checkClipDuration(duration)).toEqual({ ok: true });
  });

  it("refuse au-delà de 60 s", () => {
    expect(checkClipDuration(60.5)).toEqual({ ok: false, problem: "too_long" });
  });

  it("refuse un clip de moins d'une seconde", () => {
    expect(checkClipDuration(0.4)).toEqual({ ok: false, problem: "too_short" });
  });

  it.each([0, Number.NaN, Number.POSITIVE_INFINITY])("juge illisible une durée de %s", (duration) => {
    expect(checkClipDuration(duration)).toEqual({ ok: false, problem: "unreadable" });
  });
});
