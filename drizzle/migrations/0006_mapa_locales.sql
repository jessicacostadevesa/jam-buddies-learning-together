ALTER TABLE public.local_detalles
  ADD COLUMN IF NOT EXISTS latitud double precision,
  ADD COLUMN IF NOT EXISTS longitud double precision,
  ADD COLUMN IF NOT EXISTS organiza_jams boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organiza_conciertos boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.directorio_locales_publico()
RETURNS TABLE (id uuid, nombre text, ciudad text, tipos text[], precio numeric, lat double precision, lng double precision, jams boolean, conciertos boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
SELECT d.perfil_id, coalesce(nullif(d.titular,''), p.nombre), p.ciudad, d.tipos, d.precio_hora_ensayo, d.latitud, d.longitud, d.organiza_jams, d.organiza_conciertos
FROM public.local_detalles d JOIN public.perfiles p ON p.id = d.perfil_id
WHERE d.latitud IS NOT NULL AND d.longitud IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = d.perfil_id AND r.role = 'local'::public.app_role);
$$;
REVOKE ALL ON FUNCTION public.directorio_locales_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.directorio_locales_publico() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.directorio_locales_publico() IS 'Public map allowlist: name, city, types, price, coordinates, jams/concerts. No contact or fiscal data.';