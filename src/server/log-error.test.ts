import { describe, expect, it } from "vitest";

import { errorCode } from "./log-error";

describe("errorCode", () => {
  it("garde le code technique, jamais le message", () => {
    const pg = Object.assign(new Error('password authentication failed for user "postgres"'), { code: "28P01" });
    expect(errorCode(pg)).toBe("28P01");
    expect(errorCode(new TypeError("adresse ana@example.com"))).toBe("TypeError");
    expect(errorCode({ code: "<script>ENOTFOUND</script>" })).toBe("scriptENOTFOUNDscript");
    expect(errorCode("texte")).toBe("unknown");
  });
});
