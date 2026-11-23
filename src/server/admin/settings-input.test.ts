import { describe, expect, it } from "vitest";

import { formatSettingInput, parseSettingInput } from "./settings-input";

describe("parseSettingInput", () => {
  it("accepte un quota entier dans les bornes", () => {
    expect(parseSettingInput("free_daily_quota", " 15 ")).toBe(15);
    expect(parseSettingInput("premium_daily_cap", "10000")).toBe(10_000);
  });

  it("refuse un quota nul, décimal, négatif ou trop grand", () => {
    for (const raw of ["0", "1.5", "-3", "10001", "", "abc"]) {
      expect(parseSettingInput("visitor_daily_quota", raw)).toBeNull();
    }
  });

  it("convertit le plafond IA d'euros en micro-euros, virgule ou point", () => {
    expect(parseSettingInput("ai_daily_cap_micro_eur", "10")).toBe(10_000_000);
    expect(parseSettingInput("ai_daily_cap_micro_eur", "2,5")).toBe(2_500_000);
    expect(parseSettingInput("ai_daily_cap_micro_eur", "0.07")).toBe(70_000);
  });

  it("accepte 0 € (IA en pause, RG5) et refuse au-delà de 1 000 € ou plus de deux décimales", () => {
    expect(parseSettingInput("ai_daily_cap_micro_eur", "0")).toBe(0);
    expect(parseSettingInput("ai_daily_cap_micro_eur", "1000,01")).toBeNull();
    expect(parseSettingInput("ai_daily_cap_micro_eur", "1,234")).toBeNull();
    expect(parseSettingInput("ai_daily_cap_micro_eur", "-1")).toBeNull();
  });
});

describe("formatSettingInput", () => {
  it("affiche le plafond IA en euros avec une virgule", () => {
    expect(formatSettingInput("ai_daily_cap_micro_eur", 10_000_000)).toBe("10,00");
    expect(formatSettingInput("ai_daily_cap_micro_eur", 2_500_000)).toBe("2,50");
  });

  it("affiche un quota tel quel", () => {
    expect(formatSettingInput("free_daily_quota", 15)).toBe("15");
  });

  it("relit sans perte ce qu'il affiche", () => {
    expect(parseSettingInput("ai_daily_cap_micro_eur", formatSettingInput("ai_daily_cap_micro_eur", 70_000))).toBe(70_000);
  });
});
