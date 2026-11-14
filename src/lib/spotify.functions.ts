import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { artistaSpotifySchema, playlistSpotifySchema, imagenMiniatura, oauthVigente } from "@/lib/spotify";

async function hash(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
export const spotifyConfigurado = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(() => ({ configurado: Boolean(process.env["SPOTIFY_CLIENT_ID"]) }));

export const iniciarSpotify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error } = await context.supabase.from("user_roles").select("role");
    if (error || !roles?.some((r) => r.role === "alumno" || r.role === "profesor")) throw new Error("Solo disponible para alumnos y profes");
    const clientId = process.env["SPOTIFY_CLIENT_ID"];
    if (!clientId) throw new Error("La conexión con Spotify aún no está configurada");
    const redirectUri = "https://jam-buddies-learning-together.lovable.app/spotify-callback";
    const state = crypto.randomUUID();
    const verifier = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insertError } = await supabaseAdmin.from("spotify_oauth_sessions").insert({ state_hash: await hash(state), user_id: context.userId, verifier, redirect_uri: redirectUri, expires_at: new Date(Date.now() + 600000).toISOString() });
    if (insertError) throw new Error("No se pudo iniciar Spotify");
    const params = new URLSearchParams({ client_id: clientId, response_type: "code", redirect_uri: redirectUri, scope: "user-top-read playlist-read-private", state, code_challenge_method: "S256", code_challenge: await hash(verifier) });
    return { url: `https://accounts.spotify.com/authorize?${params}` };
  });

export const consultarArtistasSpotify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ code: z.string().min(1).max(2000), state: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role");
    if (roleError || !roles?.some(r => r.role === "alumno" || r.role === "profesor")) throw new Error("Solo disponible para alumnos y profes con cuenta activa");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session, error } = await supabaseAdmin.from("spotify_oauth_sessions").delete().eq("state_hash", await hash(data.state)).eq("user_id", context.userId).select("verifier, redirect_uri, expires_at").maybeSingle();
    if (error || !session || !oauthVigente(session.expires_at, Date.now())) throw new Error("La conexión ha caducado. Vuelve a conectar Spotify");
    const clientId = process.env["SPOTIFY_CLIENT_ID"];
    if (!clientId) throw new Error("Falta configurar Spotify");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, code: data.code, redirect_uri: session.redirect_uri, code_verifier: session.verifier }) });
    if (!tokenResponse.ok) throw new Error(`Spotify no pudo autorizar el acceso (${tokenResponse.status}). Vuelve a conectar tu cuenta.`);
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) throw new Error("Spotify no devolvió autorización");
    const response = await fetch("https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term", { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!response.ok) {
      const detail = await response.text();
      console.error(`Spotify artists [${response.status}]: ${detail}`);
      throw new Error(`Spotify no pudo consultar tus artistas (${response.status}). Comprueba que tu cuenta esté autorizada para usar la aplicación.`);
    }
    const json = await response.json() as { items?: { id: string; name: string; images?: { url: string; width?: number }[] }[] };
    const artistas = (json.items ?? []).map((a) => artistaSpotifySchema.parse({ spotify_id: a.id, nombre: a.name, imagen_url: imagenMiniatura(a.images) }));
    let playlists: ReturnType<typeof playlistSpotifySchema.parse>[] = [];
    const pr = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (pr.ok) {
      const pj = await pr.json() as { items?: ({ id: string; name: string; images?: { url: string; width?: number }[] | null; tracks?: { total?: number } } | null)[] };
      playlists = (pj.items ?? []).filter((p): p is NonNullable<typeof p> => !!p && /^[A-Za-z0-9]{22}$/.test(p.id) && !!p.name?.trim())
        .map((p) => playlistSpotifySchema.parse({ spotify_id: p.id, nombre: p.name, imagen_url: imagenMiniatura(p.images), total_canciones: p.tracks?.total ?? null }));
    } else console.error(`Spotify playlists [${pr.status}]: ${await pr.text()}`);
    return { artistas, playlists };
  });
