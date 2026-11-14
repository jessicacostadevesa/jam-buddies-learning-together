import { z } from "zod";

export const artistaSpotifySchema = z.object({
  spotify_id: z.string().regex(/^[A-Za-z0-9]{22}$/),
  nombre: z.string().trim().min(1).max(200),
  imagen_url: z.string().url().startsWith("https://").nullable(),
});
export type ArtistaSpotify = z.infer<typeof artistaSpotifySchema>;
export const playlistSpotifySchema = z.object({
  spotify_id: z.string().regex(/^[A-Za-z0-9]{22}$/),
  nombre: z.string().trim().min(1).max(300),
  imagen_url: z.string().url().startsWith("https://").nullable(),
  total_canciones: z.number().int().nonnegative().nullable(),
});
export type PlaylistSpotify = z.infer<typeof playlistSpotifySchema>;
/** Elige la imagen más pequeña que mida al menos `min` px, o la mayor disponible. */
export function imagenMiniatura(imgs: { url: string; width?: number | null }[] | null | undefined, min = 160) {
  if (!imgs?.length) return null;
  const orden = [...imgs].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (orden.find((i) => (i.width ?? 0) >= min) ?? orden[orden.length - 1])?.url ?? null;
}
export function artistasElegidos(artistas: ArtistaSpotify[], ids: string[]) {
  return artistas.filter((a) => ids.includes(a.spotify_id));
}
export function oauthVigente(expiresAt: string, ahora: number) {
  return Date.parse(expiresAt) > ahora;
}