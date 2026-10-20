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

  it("descend dans la cause : erreur de PostgreSQL enveloppée par Drizzle", () => {
    const pg = Object.assign(new Error("permission denied for table app_settings"), { code: "42501" });
    const wrapped = Object.assign(new Error("Failed query: select … params: …"), { cause: pg });
    expect(errorCode(wrapped)).toBe("42501");
    expect(errorCode(Object.assign(new Error("x"), { cause: new TypeError("y") }))).toBe("TypeError");
    expect(errorCode(new Error("DATABASE_URL manquante"))).toBe("Error");
  });
});
