import { z } from "zod";

export const artistaSpotifySchema = z.object({
  spotify_id: z.string().regex(/^[A-Za-z0-9]{22}$/),
  nombre: z.string().trim().min(1).max(200),
});
export type ArtistaSpotify = z.infer<typeof artistaSpotifySchema>;
export function artistasElegidos(artistas: ArtistaSpotify[], ids: string[]) {
  return artistas.filter((a) => ids.includes(a.spotify_id));
}
export function oauthVigente(expiresAt: string, ahora: number) {
  return Date.parse(expiresAt) > ahora;
}