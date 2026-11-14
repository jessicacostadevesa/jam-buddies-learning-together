REVOKE ALL ON public.perfil_spotify_artistas FROM PUBLIC, anon;
REVOKE ALL ON public.spotify_oauth_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_spotify_artistas TO authenticated;
GRANT ALL ON public.perfil_spotify_artistas TO service_role;
GRANT ALL ON public.spotify_oauth_sessions TO service_role;