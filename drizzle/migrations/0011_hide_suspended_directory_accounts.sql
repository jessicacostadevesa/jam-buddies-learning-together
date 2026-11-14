CREATE OR REPLACE FUNCTION public.directorio_profes_publico()
 RETURNS TABLE(id uuid, nombre text, ciudad text, zona text, bio text, titular text, anios integer, niveles nivel_musical[], modalidades modalidad_clase[], precio numeric, instrumentos text[], estilos text[], verificado boolean, "esEscuela" boolean, artistas jsonb, playlists jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
SELECT d.perfil_id,p.nombre,p.ciudad,p.zona,p.bio,d.titular,d.anios_ensenando,d.niveles_alumnos,d.modalidades,d.precio_hora,
ARRAY(SELECT i.nombre FROM public.perfil_instrumentos pi JOIN public.instrumentos i ON i.id=pi.instrumento_id WHERE pi.perfil_id=d.perfil_id ORDER BY i.nombre),
ARRAY(SELECT e.nombre FROM public.perfil_estilos pe JOIN public.estilos e ON e.id=pe.estilo_id WHERE pe.perfil_id=d.perfil_id ORDER BY e.nombre) || CASE WHEN nullif(d.estilos_otros,'') IS NULL THEN ARRAY[]::text[] ELSE regexp_split_to_array(d.estilos_otros,'\s*,\s*') END,
coalesce(v.verificado,false),d.es_escuela,
coalesce((SELECT jsonb_agg(jsonb_build_object('spotify_id',a.spotify_id,'nombre',a.nombre,'imagen_url',a.imagen_url) ORDER BY a.nombre) FROM public.perfil_spotify_artistas a WHERE a.perfil_id=d.perfil_id),'[]'::jsonb),
coalesce((SELECT jsonb_agg(jsonb_build_object('spotify_id',l.spotify_id,'nombre',l.nombre,'imagen_url',l.imagen_url,'total_canciones',l.total_canciones) ORDER BY l.nombre) FROM public.perfil_spotify_playlists l WHERE l.perfil_id=d.perfil_id),'[]'::jsonb)
FROM public.profesor_detalles d JOIN public.perfiles p ON p.id=d.perfil_id LEFT JOIN public.profesor_verificacion v ON v.perfil_id=d.perfil_id
WHERE NOT EXISTS(SELECT 1 FROM public.admin_account_status s WHERE s.user_id=d.perfil_id AND s.suspended) AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=d.perfil_id AND r.role='profesor'::public.app_role);
$function$;
CREATE OR REPLACE FUNCTION public.directorio_locales_publico() RETURNS TABLE(id uuid,nombre text,ciudad text,tipos text[],precio numeric,lat double precision,lng double precision,jams boolean,conciertos boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
SELECT d.perfil_id,coalesce(nullif(d.titular,''),p.nombre),p.ciudad,d.tipos,d.precio_hora_ensayo,d.latitud,d.longitud,d.organiza_jams,d.organiza_conciertos
FROM public.local_detalles d JOIN public.perfiles p ON p.id=d.perfil_id
WHERE NOT EXISTS(SELECT 1 FROM public.admin_account_status s WHERE s.user_id=d.perfil_id AND s.suspended) AND d.latitud IS NOT NULL AND d.longitud IS NOT NULL AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=d.perfil_id AND r.role='local'::public.app_role);
$function$;