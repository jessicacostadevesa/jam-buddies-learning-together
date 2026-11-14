CREATE TYPE public.estado_reserva AS ENUM ('pendiente_aceptacion','pendiente_pago','confirmada','rechazada','cancelada');

CREATE TABLE public.reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  anfitrion_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('clase','ensayo')),
  alumno_nombre text NOT NULL,
  anfitrion_nombre text NOT NULL,
  inicio timestamptz NOT NULL,
  horas numeric(4,1) NOT NULL CHECK (horas >= 0.5 AND horas <= 8),
  importe numeric(10,2) NOT NULL CHECK (importe >= 1),
  mensaje text,
  motivo_rechazo text,
  estado public.estado_reserva NOT NULL DEFAULT 'pendiente_aceptacion',
  stripe_session_id text,
  environment text,
  pagada_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservas_alumno_idx ON public.reservas(alumno_id);
CREATE INDEX reservas_anfitrion_idx ON public.reservas(anfitrion_id);

GRANT SELECT ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partes ven su reserva" ON public.reservas FOR SELECT TO authenticated
  USING (auth.uid() = alumno_id OR auth.uid() = anfitrion_id);
CREATE POLICY "Active account required" ON public.reservas AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.current_account_active()) WITH CHECK (public.current_account_active());

CREATE OR REPLACE FUNCTION public.solicitar_reserva(_anfitrion uuid, _inicio timestamptz, _horas numeric, _mensaje text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE me uuid := auth.uid(); t text; precio numeric; nom text; anom text; nid uuid;
BEGIN
  IF me IS NULL OR NOT public.current_account_active() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=me AND role='alumno') THEN RAISE EXCEPTION 'Solo los alumnos pueden reservar'; END IF;
  IF me = _anfitrion THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _inicio < now() + interval '1 hour' THEN RAISE EXCEPTION 'Elige una fecha futura'; END IF;
  IF _horas < 0.5 OR _horas > 8 THEN RAISE EXCEPTION 'Duración no válida'; END IF;
  IF EXISTS(SELECT 1 FROM public.admin_account_status WHERE user_id=_anfitrion AND suspended) THEN RAISE EXCEPTION 'No disponible'; END IF;
  IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_anfitrion AND role='profesor') THEN
    t := 'clase'; SELECT precio_hora, coalesce(nullif(p.nombre,''),'Profe') INTO precio, anom FROM public.profesor_detalles d JOIN public.perfiles p ON p.id=d.perfil_id WHERE d.perfil_id=_anfitrion;
  ELSIF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_anfitrion AND role='local') THEN
    t := 'ensayo'; SELECT precio_hora_ensayo, coalesce(nullif(d.titular,''),nullif(p.nombre,''),'Local') INTO precio, anom FROM public.local_detalles d JOIN public.perfiles p ON p.id=d.perfil_id WHERE d.perfil_id=_anfitrion;
  ELSE RAISE EXCEPTION 'No disponible'; END IF;
  IF precio IS NULL OR precio <= 0 THEN RAISE EXCEPTION 'Este anfitrión aún no tiene precio'; END IF;
  SELECT coalesce(nullif(nombre,''),'Alumno') INTO nom FROM public.perfiles WHERE id=me;
  INSERT INTO public.reservas(alumno_id,anfitrion_id,tipo,alumno_nombre,anfitrion_nombre,inicio,horas,importe,mensaje)
  VALUES(me,_anfitrion,t,nom,anom,_inicio,_horas,round(precio*_horas,2),left(nullif(trim(_mensaje),''),500)) RETURNING id INTO nid;
  RETURN nid;
END $$;

CREATE OR REPLACE FUNCTION public.responder_reserva(_id uuid, _aceptar boolean, _motivo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_account_active() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.reservas SET estado = CASE WHEN _aceptar THEN 'pendiente_pago'::public.estado_reserva ELSE 'rechazada'::public.estado_reserva END,
    motivo_rechazo = CASE WHEN _aceptar THEN NULL ELSE left(nullif(trim(_motivo),''),300) END, updated_at = now()
  WHERE id=_id AND anfitrion_id=auth.uid() AND estado='pendiente_aceptacion';
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva no encontrada'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cancelar_reserva(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_account_active() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.reservas SET estado='cancelada', updated_at=now()
  WHERE id=_id AND (alumno_id=auth.uid() OR anfitrion_id=auth.uid()) AND estado IN ('pendiente_aceptacion','pendiente_pago');
  IF NOT FOUND THEN RAISE EXCEPTION 'No se puede cancelar'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.solicitar_reserva(uuid,timestamptz,numeric,text), public.responder_reserva(uuid,boolean,text), public.cancelar_reserva(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.solicitar_reserva(uuid,timestamptz,numeric,text), public.responder_reserva(uuid,boolean,text), public.cancelar_reserva(uuid) TO authenticated;