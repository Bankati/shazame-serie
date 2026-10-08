import { describe, expect, it } from "vitest";

import { findDesignViolations } from "./design-rules.mjs";

const rulesOf = (content) => findDesignViolations(content).map((v) => v.rule);

describe("findDesignViolations", () => {
  it.each([
    ['className="bg-[#0052cc]"', "valeur arbitraire interdite"],
    ['className="rounded-[3px]"', "valeur arbitraire interdite"],
    ['className="text-[13px]"', "valeur arbitraire interdite"],
    ['className="md:p-[18px]"', "valeur arbitraire interdite"],
    ['className="gap-x-[5px]"', "valeur arbitraire interdite"],
    ['const color = "#fff";', "couleur hexadécimale"],
    ['const color = "#1F2937";', "couleur hexadécimale"],
    ['style={{ color: "oklch(0.5 0 0)" }}', "fonction de couleur"],
    ['style={{ color: "rgba(0,0,0,.5)" }}', "fonction de couleur"],
  ])("signale %s", (content, rule) => {
    expect(rulesOf(content)).toContain(rule);
  });

  it.each([
    'className="aspect-[2/3] w-28 rounded-poster"',
    'className="bg-primary/40 text-inverse-muted hover:bg-brand/85"',
    'href="/#faq"',
    'href="#identifier"',
    'href="/#confidentialite"',
    'className="font-display text-display-lg md:text-display-xl"',
  ])("laisse passer %s", (content) => {
    expect(findDesignViolations(content)).toEqual([]);
  });

  it("indique le numéro de ligne", () => {
    expect(findDesignViolations('ok\nclassName="bg-[#fff]"')[0]).toMatchObject({ line: 2 });
  });
});
