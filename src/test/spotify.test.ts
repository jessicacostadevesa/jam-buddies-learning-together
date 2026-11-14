import { describe, expect, it } from "vitest";
import { artistasElegidos, oauthVigente } from "@/lib/spotify";

describe("Selección voluntaria de Spotify", () => {
  const artistas = [{ spotify_id: "a", nombre: "Artista A" }, { spotify_id: "b", nombre: "Artista B" }];
  it("no incorpora artistas sin elección expresa", () => {
    expect(artistasElegidos(artistas, [])).toEqual([]);
  });
  it("solo incorpora los artistas elegidos, no todos los escuchados", () => {
    expect(artistasElegidos(artistas, ["b"])).toEqual([{ spotify_id: "b", nombre: "Artista B" }]);
  });
  it("rechaza una autorización caducada", () => {
    expect(oauthVigente("2026-11-14T10:00:00Z", Date.parse("2026-11-14T10:01:00Z"))).toBe(false);
  });
});