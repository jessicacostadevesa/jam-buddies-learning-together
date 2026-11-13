import { describe, expect, it } from "vitest";
import { distanciaKm } from "@/lib/distancia";
describe("distanciaKm", () => {
  it("Madrid–Barcelona ≈ 505 km", () => {
    expect(distanciaKm({ lat: 40.4168, lng: -3.7038 }, { lat: 41.3874, lng: 2.1686 })).toBeGreaterThan(495);
    expect(distanciaKm({ lat: 40.4168, lng: -3.7038 }, { lat: 41.3874, lng: 2.1686 })).toBeLessThan(515);
  });
});
