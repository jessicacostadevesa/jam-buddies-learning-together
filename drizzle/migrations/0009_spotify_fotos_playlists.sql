ALTER TABLE public.perfil_spotify_artistas ADD COLUMN imagen_url text;
CREATE TABLE public.perfil_spotify_playlists (
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  spotify_id text NOT NULL,
  nombre text NOT NULL,
  imagen_url text,
  total_canciones integer,
  ejemplo boolean NOT NULL DEFAULT false,
  PRIMARY KEY (perfil_id, spotify_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_spotify_playlists TO authenticated;
GRANT ALL ON public.perfil_spotify_playlists TO service_role;
ALTER TABLE public.perfil_spotify_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis playlists Spotify" ON public.perfil_spotify_playlists FOR SELECT TO authenticated USING (auth.uid() = perfil_id);
CREATE POLICY "Gestionar mis playlists Spotify" ON public.perfil_spotify_playlists FOR ALL TO authenticated USING (auth.uid() = perfil_id)
  WITH CHECK (auth.uid() = perfil_id AND (public.has_role(auth.uid(),'alumno'::public.app_role) OR public.has_role(auth.uid(),'profesor'::public.app_role)));

DROP FUNCTION public.directorio_profes_publico();
CREATE FUNCTION public.directorio_profes_publico()
 RETURNS TABLE(id uuid, nombre text, ciudad text, zona text, bio text, titular text, anios integer, niveles public.nivel_musical[], modalidades public.modalidad_clase[], precio numeric, instrumentos text[], estilos text[], verificado boolean, "esEscuela" boolean, artistas jsonb, playlists jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
SELECT d.perfil_id, p.nombre, p.ciudad, p.zona, p.bio, d.titular, d.anios_ensenando, d.niveles_alumnos, d.modalidades, d.precio_hora,
ARRAY(SELECT i.nombre FROM public.perfil_instrumentos pi JOIN public.instrumentos i ON i.id=pi.instrumento_id WHERE pi.perfil_id=d.perfil_id ORDER BY i.nombre),
ARRAY(SELECT e.nombre FROM public.perfil_estilos pe JOIN public.estilos e ON e.id=pe.estilo_id WHERE pe.perfil_id=d.perfil_id ORDER BY e.nombre) || CASE WHEN nullif(d.estilos_otros,'') IS NULL THEN ARRAY[]::text[] ELSE regexp_split_to_array(d.estilos_otros, '\s*,\s*') END,
coalesce(v.verificado,false), d.es_escuela,
coalesce((SELECT jsonb_agg(jsonb_build_object('spotify_id',a.spotify_id,'nombre',a.nombre,'imagen_url',a.imagen_url) ORDER BY a.nombre) FROM public.perfil_spotify_artistas a WHERE a.perfil_id=d.perfil_id),'[]'::jsonb),
coalesce((SELECT jsonb_agg(jsonb_build_object('spotify_id',l.spotify_id,'nombre',l.nombre,'imagen_url',l.imagen_url,'total_canciones',l.total_canciones) ORDER BY l.nombre) FROM public.perfil_spotify_playlists l WHERE l.perfil_id=d.perfil_id),'[]'::jsonb)
FROM public.profesor_detalles d JOIN public.perfiles p ON p.id=d.perfil_id LEFT JOIN public.profesor_verificacion v ON v.perfil_id=d.perfil_id
WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=d.perfil_id AND r.role='profesor'::public.app_role);
$function$;
REVOKE ALL ON FUNCTION public.directorio_profes_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.directorio_profes_publico() TO anon, authenticated, service_role;