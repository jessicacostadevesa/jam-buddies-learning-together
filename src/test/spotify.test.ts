import { describe, expect, it } from "vitest";
import { artistasElegidos, imagenMiniatura, oauthVigente } from "@/lib/spotify";

describe("Selección voluntaria de Spotify", () => {
  const artistas = [{ spotify_id: "a", nombre: "Artista A", imagen_url: null }, { spotify_id: "b", nombre: "Artista B", imagen_url: null }];
  it("no incorpora artistas sin elección expresa", () => {
    expect(artistasElegidos(artistas, [])).toEqual([]);
  });
  it("solo incorpora los artistas elegidos, no todos los escuchados", () => {
    expect(artistasElegidos(artistas, ["b"])).toEqual([{ spotify_id: "b", nombre: "Artista B", imagen_url: null }]);
  });
  it("rechaza una autorización caducada", () => {
    expect(oauthVigente("2026-11-14T10:00:00Z", Date.parse("2026-11-14T10:01:00Z"))).toBe(false);
  });
  it("usa la miniatura más pequeña de al menos 160 px para la tarjeta", () => {
    expect(imagenMiniatura([{ url: "g", width: 640 }, { url: "p", width: 64 }, { url: "m", width: 320 }])).toBe("m");
    expect(imagenMiniatura([])).toBeNull();
  });
});
