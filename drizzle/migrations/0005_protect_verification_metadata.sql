DROP POLICY "Ver verificacion" ON public.profesor_verificacion;
CREATE POLICY "Owner reads verification" ON public.profesor_verificacion FOR SELECT TO authenticated USING (auth.uid() = perfil_id);
REVOKE ALL ON public.profesor_verificacion FROM anon;
GRANT SELECT ON public.profesor_verificacion TO authenticated;