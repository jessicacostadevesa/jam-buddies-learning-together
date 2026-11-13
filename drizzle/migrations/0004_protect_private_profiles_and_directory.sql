DO $$ DECLARE t text; p record; BEGIN
FOREACH t IN ARRAY ARRAY['perfiles','alumno_detalles','disponibilidad','horario_semanal','horario_especifico','perfil_instrumentos','perfil_estilos','profesor_detalles','escuela_detalles','local_detalles','escuela_equipo','escuela_programas'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname,t);
  END LOOP;
  EXECUTE format('CREATE POLICY "Owner reads private data" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = %I)', t, CASE WHEN t='perfiles' THEN 'id' ELSE 'perfil_id' END);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
END LOOP;
END $$;
ALTER POLICY "Editar propio perfil" ON public.perfiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
REVOKE ALL ON public.escuela_datos_fiscales, public.local_datos_fiscales, public.profesor_evidencias, public.user_roles FROM anon;
CREATE OR REPLACE FUNCTION public.directorio_profes_publico()
RETURNS TABLE (id uuid, nombre text, ciudad text, zona text, bio text, titular text, anios integer, niveles public.nivel_musical[], modalidades public.modalidad_clase[], precio numeric, instrumentos text[], estilos text[], verificado boolean, "esEscuela" boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
SELECT d.perfil_id, p.nombre, p.ciudad, p.zona, p.bio, d.titular, d.anios_ensenando, d.niveles_alumnos, d.modalidades, d.precio_hora,
ARRAY(SELECT i.nombre FROM public.perfil_instrumentos pi JOIN public.instrumentos i ON i.id=pi.instrumento_id WHERE pi.perfil_id=d.perfil_id ORDER BY i.nombre),
ARRAY(SELECT e.nombre FROM public.perfil_estilos pe JOIN public.estilos e ON e.id=pe.estilo_id WHERE pe.perfil_id=d.perfil_id ORDER BY e.nombre) || CASE WHEN nullif(d.estilos_otros,'') IS NULL THEN ARRAY[]::text[] ELSE regexp_split_to_array(d.estilos_otros, '\s*,\s*') END,
coalesce(v.verificado,false), d.es_escuela
FROM public.profesor_detalles d JOIN public.perfiles p ON p.id=d.perfil_id LEFT JOIN public.profesor_verificacion v ON v.perfil_id=d.perfil_id
WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=d.perfil_id AND r.role='profesor'::public.app_role);
$$;
REVOKE ALL ON FUNCTION public.directorio_profes_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.directorio_profes_publico() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.directorio_profes_publico() IS 'Public directory allowlist only: professional card fields; no contact, fiscal, student, evidence, or schedule data. Private base tables remain owner-only.';
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;