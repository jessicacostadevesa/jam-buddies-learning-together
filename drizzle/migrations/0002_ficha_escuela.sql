CREATE TYPE public.publico_edad AS ENUM ('ninos','adolescentes','adultos','mayores');
CREATE TYPE public.formato_clase AS ENUM ('individual','grupal','banda');

ALTER TABLE public.profesor_detalles ADD COLUMN es_escuela boolean NOT NULL DEFAULT false;
ALTER TABLE public.profesor_detalles ADD COLUMN publico public.publico_edad[] NOT NULL DEFAULT '{}';

CREATE TABLE public.escuela_detalles (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  direccion text,
  codigo_postal text,
  telefono text,
  email_contacto text,
  web text,
  instagram text,
  anio_fundacion integer,
  num_profesores integer,
  num_alumnos integer,
  num_salas integer,
  instalaciones text,
  servicios text[] NOT NULL DEFAULT '{}',
  clase_prueba boolean NOT NULL DEFAULT false,
  matricula numeric(8,2),
  horario_atencion text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.escuela_detalles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escuela_detalles TO authenticated;
GRANT ALL ON public.escuela_detalles TO service_role;
ALTER TABLE public.escuela_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver escuela" ON public.escuela_detalles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mi escuela" ON public.escuela_detalles FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'profesor'));

CREATE TABLE public.escuela_datos_fiscales (
  perfil_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  razon_social text,
  cif text,
  responsable text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escuela_datos_fiscales TO authenticated;
GRANT ALL ON public.escuela_datos_fiscales TO service_role;
ALTER TABLE public.escuela_datos_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis datos fiscales" ON public.escuela_datos_fiscales FOR SELECT TO authenticated
  USING (auth.uid() = perfil_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestionar mis datos fiscales" ON public.escuela_datos_fiscales FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'profesor'));

CREATE TABLE public.escuela_programas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  instrumento_id integer REFERENCES public.instrumentos(id),
  nivel public.nivel_musical,
  formato public.formato_clase NOT NULL DEFAULT 'grupal',
  publico public.publico_edad,
  duracion text,
  precio numeric(8,2),
  periodo_precio text NOT NULL DEFAULT 'mes',
  plazas integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.escuela_programas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escuela_programas TO authenticated;
GRANT ALL ON public.escuela_programas TO service_role;
ALTER TABLE public.escuela_programas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver programas" ON public.escuela_programas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mis programas" ON public.escuela_programas FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'profesor'));

CREATE TABLE public.escuela_equipo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  especialidad text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.escuela_equipo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escuela_equipo TO authenticated;
GRANT ALL ON public.escuela_equipo TO service_role;
ALTER TABLE public.escuela_equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver equipo" ON public.escuela_equipo FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Gestionar mi equipo" ON public.escuela_equipo FOR ALL TO authenticated
  USING (auth.uid() = perfil_id) WITH CHECK (auth.uid() = perfil_id AND public.has_role(auth.uid(), 'profesor'));