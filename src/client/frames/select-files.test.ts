import { describe, expect, it } from "vitest";

import { classifySelection, isHeicFile } from "./select-files";

const MB = 1024 * 1024;
const file = (name: string, type: string, sizeMb = 1) => ({ name, type, size: sizeMb * MB });

describe("classifySelection", () => {
  it("une vidéo : clip", () => {
    expect(classifySelection([file("clip.mp4", "video/mp4")])).toMatchObject({ ok: true, kind: "clip" });
    expect(classifySelection([file("clip.mkv", "")])).toMatchObject({ ok: true, kind: "clip" });
  });

  it.each([
    [[file("a.jpg", "image/jpeg")]],
    [[file("a.png", "image/png"), file("b.webp", "image/webp")]],
    [[file("IMG_0001.HEIC", "")]],
    [[file("photo.heif", "image/heif")]],
    [Array.from({ length: 5 }, (_, index) => file(`${index}.jpg`, "image/jpeg"))],
  ])("1 à 5 images : mode image", (files) => {
    expect(classifySelection(files)).toEqual({ ok: true, kind: "images", files });
  });

  it.each([
    ["vidéo et image", [file("clip.mp4", "video/mp4"), file("a.jpg", "image/jpeg")], "mixed_files"],
    ["deux vidéos", [file("a.mp4", "video/mp4"), file("b.mov", "video/quicktime")], "several_videos"],
    ["6 images", Array.from({ length: 6 }, (_, index) => file(`${index}.jpg`, "image/jpeg")), "too_many_images"],
    ["image vide", [file("a.jpg", "image/jpeg", 0)], "empty"],
    ["image de plus de 30 Mo", [file("a.jpg", "image/jpeg", 31)], "image_too_large"],
    ["GIF", [file("a.gif", "image/gif")], "unsupported_format"],
    ["document", [file("notes.pdf", "application/pdf")], "unsupported_format"],
    ["rien", [], "empty"],
  ])("%s : refus", (_label, files, problem) => {
    expect(classifySelection(files)).toEqual({ ok: false, problem });
  });
});

describe("isHeicFile", () => {
  it("par type ou par extension", () => {
    expect(isHeicFile(file("IMG.HEIC", ""))).toBe(true);
    expect(isHeicFile(file("x", "image/heif"))).toBe(true);
    expect(isHeicFile(file("a.jpg", "image/jpeg"))).toBe(false);
  });
});
