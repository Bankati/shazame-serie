import { describe, expect, it } from "vitest";

import { ClipError } from "./clip-error";
import { describeClipFailure, isReportableClipFailure } from "./clip-failure";

const MB = 1024 * 1024;

function video(name: string, type: string, sizeMb: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeMb * MB });
  return file;
}

describe("describeClipFailure", () => {
  it("ne garde ni le nom du fichier ni rien qui en vienne, hors extension reconnue", () => {
    const report = describeClipFailure(video("Vacances chez Marie 2026.MOV", "video/quicktime", 143), "fallback", new ClipError("unreadable"));
    expect(report).toEqual({ problem: "unreadable", stage: "fallback", extension: ".mov", mime_type: "video/quicktime", size_mb: 150 });
    expect(JSON.stringify(report)).not.toContain("Marie");
  });

  it("extension ou type inattendus : valeurs génériques", () => {
    const report = describeClipFailure(video("clip.xyz", "application/x-secret; name=marie", 3), "native", new ClipError("unreadable"));
    expect(report.extension).toBe("other");
    expect(report.mime_type).toBe("other");
    expect(describeClipFailure(video("clip.mkv", "", 3), "native", new ClipError("unreadable")).mime_type).toBe("none");
  });

  it("erreur inattendue : seulement le nom de sa classe, jamais son message", () => {
    const error = new TypeError("échec sur /Users/marie/clip.mov");
    const report = describeClipFailure(video("clip.mp4", "video/mp4", 1), "fallback", error);
    expect(report.unexpected).toBe("TypeError");
    expect(JSON.stringify(report)).not.toContain("marie");
  });
});

describe("isReportableClipFailure", () => {
  it("échecs de lecture et erreurs inattendues : oui ; refus liés au fichier : non", () => {
    expect(isReportableClipFailure(new ClipError("unreadable"))).toBe(true);
    expect(isReportableClipFailure(new Error("inattendue"))).toBe(true);
    expect(isReportableClipFailure(new ClipError("too_short"))).toBe(false);
  });
});
