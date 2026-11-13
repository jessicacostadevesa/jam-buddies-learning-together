CREATE TYPE public.modalidad_clase AS ENUM ('presencial','online','domicilio');
CREATE TYPE public.tipo_evidencia AS ENUM ('video','documento','enlace');

CREATE TABLE public.profesor_detalles (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titular text,
  metodologia text,
  experiencia text,
  formacion text,
  anios_ensenando integer NOT NULL DEFAULT 0,
  niveles_alumnos public.nivel_musical[] NOT NULL DEFAULT '{}',
  modalidades public.modalidad_clase[] NOT NULL DEFAULT '{}',
  precio_hora numeric(8,2),
  estilos_otros text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profesor_detalles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profesor_detalles TO authenticated;
GRANT ALL ON public.profesor_detalles TO service_role;
ALTER TABLE public.profesor_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver detalles profe" ON public.profesor_detalles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mis detalles profe" ON public.profesor_detalles FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'profesor'));

CREATE TABLE public.profesor_evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo public.tipo_evidencia NOT NULL,
  titulo text NOT NULL,
  url text,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.profesor_evidencias TO authenticated;
GRANT ALL ON public.profesor_evidencias TO service_role;
ALTER TABLE public.profesor_evidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis evidencias" ON public.profesor_evidencias FOR SELECT TO authenticated USING (auth.uid() = perfil_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Subir mis evidencias" ON public.profesor_evidencias FOR INSERT TO authenticated WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'profesor'));
CREATE POLICY "Borrar mis evidencias" ON public.profesor_evidencias FOR DELETE TO authenticated USING (auth.uid() = perfil_id);

CREATE TABLE public.profesor_verificacion (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  verificado boolean NOT NULL DEFAULT false,
  verificado_at timestamptz
);
GRANT SELECT ON public.profesor_verificacion TO anon, authenticated;
GRANT ALL ON public.profesor_verificacion TO service_role;
ALTER TABLE public.profesor_verificacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver verificacion" ON public.profesor_verificacion FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.horario_semanal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  dia public.dia_semana NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  CHECK (hora_fin > hora_inicio)
);
GRANT SELECT ON public.horario_semanal TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.horario_semanal TO authenticated;
GRANT ALL ON public.horario_semanal TO service_role;
ALTER TABLE public.horario_semanal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver horario" ON public.horario_semanal FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mi horario" ON public.horario_semanal FOR ALL TO authenticated USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id);

CREATE TABLE public.horario_especifico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  disponible boolean NOT NULL DEFAULT true,
  hora_inicio time,
  hora_fin time,
  horas_max integer,
  nota text,
  CHECK (fecha_fin >= fecha_inicio)
);
GRANT SELECT ON public.horario_especifico TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.horario_especifico TO authenticated;
GRANT ALL ON public.horario_especifico TO service_role;
ALTER TABLE public.horario_especifico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver horario especifico" ON public.horario_especifico FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mi horario especifico" ON public.horario_especifico FOR ALL TO authenticated USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id);

CREATE POLICY "Profe sube evidencias" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidencias' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Profe ve sus evidencias" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidencias' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Profe borra evidencias" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidencias' AND (storage.foldername(name))[1] = auth.uid()::text);