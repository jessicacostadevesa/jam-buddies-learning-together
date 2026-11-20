import { describe, expect, it } from "vitest";
import { matchesSearch, matchesVenueFilters } from "@/lib/explore-filters";
const venue = { precio: 0, jams: false, conciertos: false, tipos: ["Sala de ensayo"] };
describe("Explore real venue filters", () => {
  it("Gratis includes only a known zero price", () => {
    expect(matchesVenueFilters(venue, "", true)).toBe(true);
    expect(matchesVenueFilters({ ...venue, precio: null }, "", true)).toBe(false);
    expect(matchesVenueFilters({ ...venue, precio: 22 }, "", true)).toBe(false);
  });
  it("Jams requires the real jams flag", () => {
    expect(matchesVenueFilters(venue, "jams", false)).toBe(false);
    expect(matchesVenueFilters({ ...venue, jams: true }, "jams", false)).toBe(true);
  });
  it("Conciertos requires the real concerts flag", () => {
    expect(matchesVenueFilters(venue, "conciertos", false)).toBe(false);
    expect(matchesVenueFilters({ ...venue, conciertos: true }, "conciertos", false)).toBe(true);
  });
  it("Ensayar requires a rehearsal venue", () => {
    expect(matchesVenueFilters(venue, "ensayo", false)).toBe(true);
    expect(matchesVenueFilters({ ...venue, tipos: ["Bar"] }, "ensayo", false)).toBe(false);
  });
  it("searches real city and instrument values without case sensitivity", () => {
    expect(matchesSearch(["Madrid"], " MADRID ")).toBe(true);
    expect(matchesSearch(["Guitarra"], "bajo")).toBe(false);
  });
});
