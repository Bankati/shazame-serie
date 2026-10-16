import { describe, expect, it } from "vitest";

import { hasEnoughFrames, judgeFrame, judgeFrames, type FrameMetrics } from "./selection";

const SHARP = { meanLuminance: 120, sharpness: 500 };

function frame(hash: bigint, overrides: Partial<FrameMetrics> = {}): FrameMetrics {
  return { ...SHARP, hash, ...overrides };
}

describe("judgeFrame", () => {
  it("retient une image nette, claire et nouvelle", () => {
    expect(judgeFrame(frame(0n), [])).toEqual({ kept: true });
  });

  it("écarte une image noire", () => {
    expect(judgeFrame(frame(0n, { meanLuminance: 4, sharpness: 0 }), [])).toEqual({ kept: false, reason: "dark" });
  });

  it("écarte une image floue", () => {
    expect(judgeFrame(frame(0n, { sharpness: 3 }), [])).toEqual({ kept: false, reason: "blurry" });
  });

  it("écarte une image quasi identique à une image retenue (≤ 5 bits d'écart)", () => {
    expect(judgeFrame(frame(0b11111n), [0n])).toEqual({ kept: false, reason: "duplicate" });
  });

  it("retient une image assez différente (6 bits d'écart)", () => {
    expect(judgeFrame(frame(0b111111n), [0n])).toEqual({ kept: true });
  });
});

describe("judgeFrames", () => {
  it("compare chaque image seulement aux images retenues avant elle", () => {
    const verdicts = judgeFrames([
      frame(0n),
      frame(1n),
      frame(0n, { meanLuminance: 2 }),
      frame(0xffffn),
      frame(0xffff_0000_0000n),
    ]);
    expect(verdicts).toEqual([
      { kept: true },
      { kept: false, reason: "duplicate" },
      { kept: false, reason: "dark" },
      { kept: true },
      { kept: true },
    ]);
  });
});

describe("hasEnoughFrames", () => {
  it("exige au moins 2 images retenues", () => {
    expect(hasEnoughFrames([{ kept: true }, { kept: false, reason: "dark" }])).toBe(false);
    expect(hasEnoughFrames([{ kept: true }, { kept: true }])).toBe(true);
  });
});
