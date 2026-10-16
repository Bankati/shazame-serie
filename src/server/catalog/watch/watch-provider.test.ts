import { describe, expect, it } from "vitest";

import { availabilityFor, chooseCountry, type CountryOffers, hasOffers } from "./watch-provider";

// Données inventées au format TMDB (aucune donnée réelle stockée).
const BY_COUNTRY: Record<string, CountryOffers> = {
  FR: {
    link: "https://www.themoviedb.org/movie/1/watch?locale=FR",
    flatrate: [
      { provider_id: 2, provider_name: "Service B", logo_path: "/b.png", display_priority: 5 },
      { provider_id: 1, provider_name: "Service A", logo_path: "/a.png", display_priority: 1 },
      { provider_id: 1, provider_name: "Service A", logo_path: "/a.png", display_priority: 1 },
    ],
    rent: [{ provider_id: 3, provider_name: "Location C", display_priority: 2 }],
  },
  CH: { link: "https://www.themoviedb.org/movie/1/watch?locale=CH", buy: [{ provider_id: 4, provider_name: "Achat D" }] },
  "001": { link: null },
};

describe("availabilityFor", () => {
  it("trie les services par priorité, retire les doublons et liste les pays couverts", () => {
    const availability = availabilityFor(BY_COUNTRY, "FR");
    expect(availability.offers.flatrate.map((service) => service.name)).toEqual(["Service A", "Service B"]);
    expect(availability.offers.rent).toEqual([{ id: 3, name: "Location C", logoPath: null }]);
    expect(availability.offers.buy).toEqual([]);
    expect(availability.countries).toEqual(["CH", "FR"]);
    expect(availability.link).toContain("locale=FR");
    expect(hasOffers(availability)).toBe(true);
  });

  it("pays sans données : aucune offre, aucun lien", () => {
    const availability = availabilityFor(BY_COUNTRY, "TG");
    expect(availability.link).toBeNull();
    expect(hasOffers(availability)).toBe(false);
  });
});

describe("chooseCountry", () => {
  it.each([
    ["be", "FR", "BE"],
    [null, "CH", "CH"],
    [null, null, "FR"],
    ["france", "CH", "CH"],
    ["", "xx1", "FR"],
  ])("demandé %s, en-tête %s → %s", (requested, header, expected) => {
    expect(chooseCountry(requested, header)).toBe(expected);
  });
});
