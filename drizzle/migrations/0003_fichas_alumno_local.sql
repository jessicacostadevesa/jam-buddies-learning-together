CREATE TABLE public.alumno_detalles (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  objetivos text[] NOT NULL DEFAULT '{}',
  busca text[] NOT NULL DEFAULT '{}',
  edad public.publico_edad,
  tiene_instrumento boolean NOT NULL DEFAULT false,
  modalidades public.modalidad_clase[] NOT NULL DEFAULT '{}',
  presupuesto_mes numeric(8,2),
  distancia_km integer,
  referentes text,
  estilos_otros text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.alumno_detalles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumno_detalles TO authenticated;
GRANT ALL ON public.alumno_detalles TO service_role;
ALTER TABLE public.alumno_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver alumno" ON public.alumno_detalles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mi ficha alumno" ON public.alumno_detalles FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'alumno'));

CREATE TABLE public.local_detalles (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titular text,
  tipos text[] NOT NULL DEFAULT '{}',
  direccion text,
  codigo_postal text,
  telefono text,
  email_contacto text,
  web text,
  instagram text,
  horario_apertura text,
  aforo integer,
  num_salas integer,
  precio_hora_ensayo numeric(8,2),
  backline text[] NOT NULL DEFAULT '{}',
  equipamiento text,
  servicios text[] NOT NULL DEFAULT '{}',
  condiciones_bandas text,
  accesible boolean NOT NULL DEFAULT false,
  estilos_otros text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.local_detalles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.local_detalles TO authenticated;
GRANT ALL ON public.local_detalles TO service_role;
ALTER TABLE public.local_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver local" ON public.local_detalles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mi local" ON public.local_detalles FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'local'));

CREATE TABLE public.local_datos_fiscales (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  razon_social text,
  cif text,
  responsable text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.local_datos_fiscales TO authenticated;
GRANT ALL ON public.local_datos_fiscales TO service_role;
ALTER TABLE public.local_datos_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis datos fiscales local" ON public.local_datos_fiscales FOR SELECT TO authenticated
  USING (auth.uid() = perfil_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestionar mis datos fiscales local" ON public.local_datos_fiscales FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'local'));