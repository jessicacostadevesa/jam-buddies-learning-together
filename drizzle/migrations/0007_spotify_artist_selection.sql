CREATE TABLE public.perfil_spotify_artistas (
 perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
 spotify_id text NOT NULL,
 nombre text NOT NULL,
 ejemplo boolean NOT NULL DEFAULT false,
 PRIMARY KEY (perfil_id, spotify_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_spotify_artistas TO authenticated;
GRANT ALL ON public.perfil_spotify_artistas TO service_role;
ALTER TABLE public.perfil_spotify_artistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis artistas Spotify" ON public.perfil_spotify_artistas FOR SELECT TO authenticated USING (auth.uid() = perfil_id);
CREATE POLICY "Gestionar mis artistas Spotify" ON public.perfil_spotify_artistas FOR ALL TO authenticated USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND (public.has_role(auth.uid(), 'alumno') OR public.has_role(auth.uid(), 'profesor')));
CREATE TABLE public.spotify_oauth_sessions (
 state_hash text PRIMARY KEY,
 user_id uuid NOT NULL,
 verifier text NOT NULL,
 redirect_uri text NOT NULL,
 expires_at timestamptz NOT NULL
);
GRANT ALL ON public.spotify_oauth_sessions TO service_role;
ALTER TABLE public.spotify_oauth_sessions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.spotify_oauth_sessions IS 'Server-only, short-lived PKCE state. No provider tokens are persisted.';