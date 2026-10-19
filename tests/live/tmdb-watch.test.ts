import { describe, expect, it } from "vitest";

import { getWatchProvider } from "@/server/catalog/watch/tmdb-watch-providers";
import { availabilityFor, hasOffers } from "@/server/catalog/watch/watch-provider";

// Critère de fin de U16 : affichage correct pour FR, BE, CH ; pays sans service → aucune offre.
describe("où regarder en direct (Matrix)", () => {
  it.each(["FR", "BE", "CH"])("%s : au moins un service et un lien récapitulatif", async (country) => {
    const availability = availabilityFor(await getWatchProvider().getOffersByCountry(603, "movie"), country);
    console.info(country, JSON.stringify(Object.fromEntries(Object.entries(availability.offers).map(([type, list]) => [type, list.map((service) => service.name)]))));
    expect(hasOffers(availability)).toBe(true);
    expect(availability.link).toContain(`locale=${country}`);
  });

  it("TG (Togo) : aucun service, message explicite côté interface", async () => {
    const availability = availabilityFor(await getWatchProvider().getOffersByCountry(603, "movie"), "TG");
    expect(hasOffers(availability)).toBe(false);
    expect(availability.countries).toContain("FR");
  });
});
