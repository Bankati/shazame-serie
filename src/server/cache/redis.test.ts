import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const store = new Map<string, unknown>();
const redisGet = vi.fn(async (key: string) => store.get(key) ?? null);
const redisSet = vi.fn(async (key: string, value: unknown) => {
  store.set(key, value);
  return "OK";
});

vi.mock("@/server/env", () => ({
  env: { UPSTASH_REDIS_REST_URL: "https://exemple.upstash.io", UPSTASH_REDIS_REST_TOKEN: "jeton-de-test-assez-long" },
}));
vi.mock("@upstash/redis", () => ({
  Redis: class {
    get = redisGet;
    set = redisSet;
  },
}));

const { cachedJson } = await import("./redis");
const schema = z.object({ id: z.number() });

describe("cachedJson", () => {
  beforeEach(() => {
    store.clear();
    redisGet.mockClear();
    redisSet.mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("charge puis écrit avec la durée demandée, et relit ensuite sans recharger", async () => {
    const load = vi.fn(async () => ({ id: 1 }));
    expect(await cachedJson("tmdb:search:x", 60, schema, load)).toEqual({ id: 1 });
    expect(redisSet).toHaveBeenCalledWith("tmdb:search:x", { id: 1 }, { ex: 60 });
    expect(await cachedJson("tmdb:search:x", 60, schema, load)).toEqual({ id: 1 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("ignore une valeur en cache qui ne respecte plus le schéma", async () => {
    store.set("tmdb:search:y", { id: "ancien-format" });
    const load = vi.fn(async () => ({ id: 2 }));
    expect(await cachedJson("tmdb:search:y", 60, schema, load)).toEqual({ id: 2 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("continue sans cache si Redis est en panne, sans journaliser la clé complète", async () => {
    redisGet.mockRejectedValueOnce(new Error("panne"));
    redisSet.mockRejectedValueOnce(new Error("panne"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await cachedJson("tmdb:search:requete-privee", 60, schema, async () => ({ id: 3 }))).toEqual({ id: 3 });
    const lines = warn.mock.calls.map(([line]) => String(line));
    expect(lines).toHaveLength(2);
    expect(lines.join(" ")).not.toContain("requete-privee");
  });
});
