import { Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Clock, FileText, Link2, Trash2, Video, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EscuelaSecciones, PUBLICO } from "@/components/perfil/EscuelaSecciones";

type Nivel = Database["public"]["Enums"]["nivel_musical"];
type Dia = Database["public"]["Enums"]["dia_semana"];
type Modalidad = Database["public"]["Enums"]["modalidad_clase"];
type Publico = Database["public"]["Enums"]["publico_edad"];

const DIAS: { id: Dia; label: string }[] = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];
const NIVELES: { id: Nivel; label: string }[] = [
  { id: "inicial", label: "Empiezan de cero" },
  { id: "intermedio", label: "Ya tocan algo" },
  { id: "avanzado", label: "Avanzados" },
];
const MODALIDADES: { id: Modalidad; label: string }[] = [
  { id: "presencial", label: "En mi aula / escuela" },
  { id: "domicilio", label: "A domicilio" },
  { id: "online", label: "Online" },
];

export const profeQuery = (uid: string) =>
  queryOptions({
    queryKey: ["profe", uid],
    queryFn: async () => {
      const [det, ver, ev, sem, esp] = await Promise.all([
        supabase.from("profesor_detalles").select("*").eq("perfil_id", uid).maybeSingle(),
        supabase
          .from("profesor_verificacion")
          .select("verificado")
          .eq("perfil_id", uid)
          .maybeSingle(),
        supabase.from("profesor_evidencias").select("*").eq("perfil_id", uid).order("created_at"),
        supabase.from("horario_semanal").select("*").eq("perfil_id", uid).order("hora_inicio"),
        supabase.from("horario_especifico").select("*").eq("perfil_id", uid).order("fecha_inicio"),
      ]);
      return {
        detalles: det.data,
        verificado: ver.data?.verificado ?? false,
        evidencias: ev.data ?? [],
        semanal: sem.data ?? [],
        especifico: esp.data ?? [],
      };
    },
  });

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cassette-surface p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 rounded-full border-2 border-transparent px-4 py-1 text-sm font-semibold transition-colors ${on ? "bg-teacher text-foreground border-foreground" : "bg-muted hover:bg-border"}`}
    >
      {children}
    </Button>
  );
}

const selectCls = "h-10 rounded-md border border-input bg-card px-3 text-sm";
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

type Base = {
  uid: string;
  perfil: { nombre: string; ciudad: string | null; zona: string | null; bio: string | null };
  instrumentos: { id: number; nombre: string }[];
  estilos: { id: number; nombre: string }[];
  misInstrumentos: { id: string; instrumento_id: number }[];
  misEstilos: number[];
  refreshBase: () => void;
};

export function ProfePerfil(b: Base) {
  const { uid } = b;
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(profeQuery(uid));
  const refresh = () => qc.invalidateQueries({ queryKey: ["profe", uid] });
  const d = data.detalles;

  const [form, setForm] = useState({
    nombre: b.perfil.nombre ?? "",
    ciudad: b.perfil.ciudad ?? "",
    zona: b.perfil.zona ?? "",
    bio: b.perfil.bio ?? "",
    titular: d?.titular ?? "",
    metodologia: d?.metodologia ?? "",
    experiencia: d?.experiencia ?? "",
    formacion: d?.formacion ?? "",
    anios_ensenando: String(d?.anios_ensenando ?? ""),
    precio_hora: d?.precio_hora != null ? String(d.precio_hora) : "",
    estilos_otros: d?.estilos_otros ?? "",
    niveles_alumnos: (d?.niveles_alumnos ?? []) as Nivel[],
    modalidades: (d?.modalidades ?? []) as Modalidad[],
    publico: (d?.publico ?? []) as Publico[],
    es_escuela: d?.es_escuela ?? false,
  });
  const esc = form.es_escuela;
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });
  const toggleArr = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  async function guardar(e?: React.FormEvent) {
    e?.preventDefault();
    const now = new Date().toISOString();
    const [p, det] = await Promise.all([
      supabase
        .from("perfiles")
        .update({
          nombre: form.nombre,
          ciudad: form.ciudad,
          zona: form.zona,
          bio: form.bio,
          updated_at: now,
        })
        .eq("id", uid),
      supabase.from("profesor_detalles").upsert({
        perfil_id: uid,
        titular: form.titular,
        metodologia: form.metodologia,
        experiencia: form.experiencia,
        formacion: form.formacion,
        anios_ensenando: Number(form.anios_ensenando) || 0,
        precio_hora: form.precio_hora ? Number(form.precio_hora) : null,
        estilos_otros: form.estilos_otros || null,
        niveles_alumnos: form.niveles_alumnos,
        modalidades: form.modalidades,
        updated_at: now,
        publico: form.publico,
        es_escuela: form.es_escuela,
      }),
    ]);
    if (p.error || det.error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Ficha guardada");
    refresh();
    b.refreshBase();
  }

  // Instrumentos que enseña (nivel experto implícito)
  const [nuevoInst, setNuevoInst] = useState("");
  async function addInst() {
    if (!nuevoInst) return;
    const { error } = await supabase
      .from("perfil_instrumentos")
      .insert({ perfil_id: uid, instrumento_id: Number(nuevoInst), nivel: "avanzado" });
    if (error) {
      toast.error("No se pudo añadir");
      return;
    }
    setNuevoInst("");
    b.refreshBase();
  }
  async function delInst(id: string) {
    await supabase.from("perfil_instrumentos").delete().eq("id", id);
    b.refreshBase();
  }
  async function toggleEstilo(id: number) {
    if (b.misEstilos.includes(id))
      await supabase.from("perfil_estilos").delete().eq("perfil_id", uid).eq("estilo_id", id);
    else await supabase.from("perfil_estilos").insert({ perfil_id: uid, estilo_id: id });
    b.refreshBase();
  }
  const instName = (id: number) => b.instrumentos.find((i) => i.id === id)?.nombre ?? "";
  const disponibles = b.instrumentos.filter(
    (i) => !b.misInstrumentos.some((m) => m.instrumento_id === i.id),
  );

  // Pruebas de profesionalidad
  const [evTitulo, setEvTitulo] = useState("");
  const [evUrl, setEvUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  async function addEnlace() {
    if (!evTitulo || !/^https?:\/\//.test(evUrl)) {
      toast.error("Pon un título y un enlace que empiece por https://");
      return;
    }
    const { error } = await supabase
      .from("profesor_evidencias")
      .insert({ perfil_id: uid, tipo: "enlace", titulo: evTitulo, url: evUrl });
    if (error) {
      toast.error("No se pudo guardar");
      return;
    }
    setEvTitulo("");
    setEvUrl("");
    refresh();
  }
  async function subirArchivo(file: File) {
    setSubiendo(true);
    const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("evidencias").upload(path, file);
    if (up.error) {
      setSubiendo(false);
      toast.error("No se pudo subir (máx. 50 MB)");
      return;
    }
    const tipo = file.type.startsWith("video/") ? "video" : "documento";
    await supabase
      .from("profesor_evidencias")
      .insert({ perfil_id: uid, tipo, titulo: evTitulo || file.name, storage_path: path });
    setSubiendo(false);
    setEvTitulo("");
    refresh();
  }
  async function delEvidencia(id: string, path: string | null) {
    if (path) await supabase.storage.from("evidencias").remove([path]);
    await supabase.from("profesor_evidencias").delete().eq("id", id);
    refresh();
  }
  async function verArchivo(path: string) {
    const { data: s } = await supabase.storage.from("evidencias").createSignedUrl(path, 300);
    if (s?.signedUrl) window.open(s.signedUrl, "_blank");
  }
  const estado = data.verificado
    ? "verificado"
    : data.evidencias.length > 0
      ? "revision"
      : "pendiente";

  // Horario semanal
  const [hs, setHs] = useState<{ dia: Dia; ini: string; fin: string }>({
    dia: "lunes",
    ini: "17:00",
    fin: "20:00",
  });
  async function addSemanal() {
    if (hs.fin <= hs.ini) {
      toast.error("La hora de fin debe ser posterior");
      return;
    }
    const { error } = await supabase
      .from("horario_semanal")
      .insert({ perfil_id: uid, dia: hs.dia, hora_inicio: hs.ini, hora_fin: hs.fin });
    if (error) {
      toast.error("No se pudo añadir");
      return;
    }
    refresh();
  }
  async function delSemanal(id: string) {
    await supabase.from("horario_semanal").delete().eq("id", id);
    refresh();
  }

  // Horario específico
  const [he, setHe] = useState({
    desde: "",
    hasta: "",
    disponible: true,
    ini: "",
    fin: "",
    horas: "",
    nota: "",
  });
  async function addEspecifico() {
    if (!he.desde || !he.hasta || he.hasta < he.desde) {
      toast.error("Revisa las fechas");
      return;
    }
    if (he.ini && he.fin && he.fin <= he.ini) {
      toast.error("La hora de fin debe ser posterior");
      return;
    }
    const { error } = await supabase.from("horario_especifico").insert({
      perfil_id: uid,
      fecha_inicio: he.desde,
      fecha_fin: he.hasta,
      disponible: he.disponible,
      hora_inicio: he.disponible && he.ini ? he.ini : null,
      hora_fin: he.disponible && he.fin ? he.fin : null,
      horas_max: he.disponible && he.horas ? Number(he.horas) : null,
      nota: he.nota || null,
    });
    if (error) {
      toast.error("No se pudo añadir");
      return;
    }
    setHe({ desde: "", hasta: "", disponible: true, ini: "", fin: "", horas: "", nota: "" });
    refresh();
  }
  async function delEspecifico(id: string) {
    await supabase.from("horario_especifico").delete().eq("id", id);
    refresh();
  }
  const fmt = (s: string) =>
    new Date(s + "T00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-sm font-semibold">
            Profe / escuela
          </span>
          {estado === "verificado" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-accent px-3 py-0.5 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4" /> Verificado
            </span>
          )}
          {estado === "revision" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-0.5 text-sm font-semibold">
              <Clock className="h-4 w-4" /> Verificación en revisión
            </span>
          )}
          {estado === "pendiente" && (
            <span className="rounded-full border-2 border-dashed border-border px-3 py-0.5 text-sm font-semibold">
              Sin verificar
            </span>
          )}
        </div>
        <Button asChild variant="link" className="mt-3">
          <Link to="/profe/$id" params={{ id: uid }}>
            Ver cómo te ven
          </Link>
        </Button>
        <h1 className="mt-3 text-4xl font-extrabold">
          {esc ? "La ficha de tu escuela" : "Tu ficha de profe"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Es lo que verán los alumnos que buscan con quién aprender. Cuanto más clara y completa,
          más confianza das.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Doy clases como:</span>
          <Chip on={!esc} onClick={() => setForm({ ...form, es_escuela: false })}>
            Profe particular
          </Chip>
          <Chip on={esc} onClick={() => setForm({ ...form, es_escuela: true })}>
            Escuela o academia
          </Chip>
        </div>
      </div>

      <form onSubmit={guardar} className="profile-sections space-y-6">
        <Section
          title={esc ? "Presentación de la escuela" : "Tu presentación"}
          hint="Lo primero que leerá un alumno."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="n">{esc ? "Nombre de la escuela" : "Tu nombre"}</Label>
              <Input id="n" className="mt-1" value={form.nombre} onChange={set("nombre")} />
            </div>
            <div>
              <Label htmlFor="t">{esc ? "Frase que os define" : "Frase que te define"}</Label>
              <Input
                id="t"
                className="mt-1"
                placeholder={
                  esc
                    ? "Escuela de música moderna donde se aprende en banda"
                    : "Batería para adultos que nunca han tocado"
                }
                value={form.titular}
                onChange={set("titular")}
              />
            </div>
            <div>
              <Label htmlFor="c">Ciudad</Label>
              <Input
                id="c"
                className="mt-1"
                placeholder="Madrid"
                value={form.ciudad}
                onChange={set("ciudad")}
              />
            </div>
            <div>
              <Label htmlFor="z">Zona donde das clase</Label>
              <Input
                id="z"
                className="mt-1"
                placeholder="Madrid sur"
                value={form.zona}
                onChange={set("zona")}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="b">{esc ? "Quiénes sois" : "Cómo eres como profe"}</Label>
              <Textarea
                id="b"
                rows={4}
                className="mt-1"
                placeholder={
                  esc
                    ? "Vuestra historia, el ambiente de la escuela y qué consigue un alumno en su primer curso…"
                    : "Cómo son tus clases, qué ambiente creas, qué consigue un alumno contigo en sus primeros meses…"
                }
                value={form.bio}
                onChange={set("bio")}
              />
            </div>
          </div>
        </Section>

        <Section title="Cómo enseñas">
          <div className="space-y-5">
            <div>
              <Label htmlFor="m">{esc ? "Vuestra metodología" : "Tu metodología"}</Label>
              <Textarea
                id="m"
                rows={4}
                className="mt-1"
                placeholder="Ej.: aprendemos canciones desde el primer día, tocamos en grupo, preparamos un concierto al final del trimestre…"
                value={form.metodologia}
                onChange={set("metodologia")}
              />
            </div>
            <div>
              <Label>A quién enseñas</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {NIVELES.map((n) => (
                  <Chip
                    key={n.id}
                    on={form.niveles_alumnos.includes(n.id)}
                    onClick={() =>
                      setForm({ ...form, niveles_alumnos: toggleArr(form.niveles_alumnos, n.id) })
                    }
                  >
                    {n.label}
                  </Chip>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(PUBLICO) as Publico[]).map((k) => (
                  <Chip
                    key={k}
                    on={form.publico.includes(k)}
                    onClick={() => setForm({ ...form, publico: toggleArr(form.publico, k) })}
                  >
                    {PUBLICO[k]}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <Label>Dónde das las clases</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODALIDADES.map((m) => (
                  <Chip
                    key={m.id}
                    on={form.modalidades.includes(m.id)}
                    onClick={() =>
                      setForm({ ...form, modalidades: toggleArr(form.modalidades, m.id) })
                    }
                  >
                    {m.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="a">Años dando clase</Label>
                <Input
                  id="a"
                  type="number"
                  min={0}
                  className="mt-1"
                  value={form.anios_ensenando}
                  onChange={set("anios_ensenando")}
                />
              </div>
              <div>
                <Label htmlFor="p">
                  {esc ? "Precio desde, por hora (€)" : "Precio orientativo por hora (€)"}
                </Label>
                <Input
                  id="p"
                  type="number"
                  min={0}
                  step="0.5"
                  className="mt-1"
                  placeholder="25"
                  value={form.precio_hora}
                  onChange={set("precio_hora")}
                />
              </div>
            </div>
          </div>
        </Section>

        {!esc && (
          <Section
            title="Trayectoria"
            hint="Ayuda a que los alumnos confíen en ti y a verificar tu ficha."
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="e">Dónde has enseñado o tocado</Label>
                <Textarea
                  id="e"
                  rows={3}
                  className="mt-1"
                  placeholder="Escuelas, academias, bandas y conciertos…"
                  value={form.experiencia}
                  onChange={set("experiencia")}
                />
              </div>
              <div>
                <Label htmlFor="f">Formación</Label>
                <Textarea
                  id="f"
                  rows={2}
                  className="mt-1"
                  placeholder="Conservatorio, escuelas de música moderna, cursos, autodidacta…"
                  value={form.formacion}
                  onChange={set("formacion")}
                />
              </div>
            </div>
          </Section>
        )}

        <Section title="Qué enseñas">
          <Label>Instrumentos</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {b.misInstrumentos.length === 0 && (
              <p className="text-sm text-muted-foreground">Añade los instrumentos que enseñas.</p>
            )}
            {b.misInstrumentos.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold"
              >
                {instName(m.instrumento_id)}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => delInst(m.id)}
                  aria-label="Quitar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              aria-label="Instrumento que enseñas"
              value={nuevoInst}
              onChange={(e) => setNuevoInst(e.target.value)}
              className={selectCls}
            >
              <option value="">Elige instrumento…</option>
              {disponibles.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
            <Button type="button" variant="ink" onClick={addInst}>
              Añadir
            </Button>
          </div>

          <Label className="mt-6 block">Estilos que enseñas</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {b.estilos.map((e) => (
              <Chip key={e.id} on={b.misEstilos.includes(e.id)} onClick={() => toggleEstilo(e.id)}>
                {e.nombre}
              </Chip>
            ))}
          </div>
          <div className="mt-3">
            <Label htmlFor="o">Otros estilos</Label>
            <Input
              id="o"
              className="mt-1"
              placeholder="Ej.: música para videojuegos, bandas sonoras, cantautor…"
              value={form.estilos_otros}
              onChange={set("estilos_otros")}
            />
          </div>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg">
            Guardar ficha
          </Button>
        </div>
      </form>

      {esc && <EscuelaSecciones uid={uid} instrumentos={b.instrumentos} />}

      <Section
        title="Vídeos y documentación para verificarte"
        hint="Sube un vídeo tocando o dando clase, títulos o certificados, o enlaces a tus canales. Lo revisamos para darte el sello de profe verificado. Solo tú y el equipo de revisión veis estos archivos."
      >
        <div className="space-y-2">
          {data.evidencias.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no has añadido ninguna prueba.</p>
          )}
          {data.evidencias.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {ev.tipo === "video" ? (
                <Video className="h-4 w-4" />
              ) : ev.tipo === "documento" ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {ev.url ? (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 font-semibold hover:underline"
                >
                  {ev.titulo}
                </a>
              ) : (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => ev.storage_path && verArchivo(ev.storage_path)}
                  className="flex-1 text-left font-semibold hover:underline"
                >
                  {ev.titulo}
                </Button>
              )}
              <Button
                variant="ghost"
                type="button"
                onClick={() => delEvidencia(ev.id, ev.storage_path)}
                aria-label="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          <Input
            aria-label="Título de la evidencia"
            placeholder="Título (ej.: Clase de prueba con alumna principiante)"
            value={evTitulo}
            onChange={(e) => setEvTitulo(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="Enlace de la evidencia"
              className="min-w-0 flex-1"
              placeholder="https://youtube.com/…"
              value={evUrl}
              onChange={(e) => setEvUrl(e.target.value)}
            />
            <Button type="button" variant="ink" onClick={addEnlace}>
              Añadir enlace
            </Button>
            <Button type="button" variant="outline" asChild disabled={subiendo}>
              <label className="cursor-pointer">
                {subiendo ? "Subiendo…" : "Subir vídeo o documento"}
                <input
                  type="file"
                  accept="video/*,application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) subirArchivo(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Horario habitual" hint="Las horas en las que sueles dar clase cada semana.">
        <div className="space-y-2">
          {data.semanal.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Añade tus franjas, por ejemplo lunes de 17:00 a 20:00.
            </p>
          )}
          {DIAS.filter((dd) => data.semanal.some((s) => s.dia === dd.id)).map((dd) => (
            <div key={dd.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-24 font-bold">{dd.label}</span>
              {data.semanal
                .filter((s) => s.dia === dd.id)
                .map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-accent px-2 py-1 font-semibold"
                  >
                    {hhmm(s.hora_inicio)}–{hhmm(s.hora_fin)}
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => delSemanal(s.id)}
                      aria-label="Quitar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            aria-label="Día de la semana"
            className={selectCls}
            value={hs.dia}
            onChange={(e) => setHs({ ...hs, dia: e.target.value as Dia })}
          >
            {DIAS.map((dd) => (
              <option key={dd.id} value={dd.id}>
                {dd.label}
              </option>
            ))}
          </select>
          <Input
            aria-label="Inicio de la franja"
            type="time"
            className="w-32"
            value={hs.ini}
            onChange={(e) => setHs({ ...hs, ini: e.target.value })}
          />
          <span>a</span>
          <Input
            aria-label="Fin de la franja"
            type="time"
            className="w-32"
            value={hs.fin}
            onChange={(e) => setHs({ ...hs, fin: e.target.value })}
          />
          <Button type="button" variant="ink" onClick={addSemanal}>
            Añadir franja
          </Button>
        </div>
      </Section>

      <Section
        title="Cambios en fechas concretas"
        hint="Vacaciones, un mes con otro horario o un límite de horas. Esto manda sobre tu horario habitual en esas fechas."
      >
        <div className="space-y-2">
          {data.especifico.map((x) => (
            <div
              key={x.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="font-bold">
                {fmt(x.fecha_inicio)} – {fmt(x.fecha_fin)}
              </span>
              <span className="flex-1">
                {x.disponible
                  ? `Disponible${x.hora_inicio ? ` de ${hhmm(x.hora_inicio)} a ${hhmm(x.hora_fin)}` : ""}${x.horas_max ? ` · máx. ${x.horas_max} h/semana` : ""}`
                  : "No disponible"}
                {x.nota ? ` · ${x.nota}` : ""}
              </span>
              <Button
                variant="ghost"
                type="button"
                onClick={() => delEspecifico(x.id)}
                aria-label="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Desde</Label>
            <Input
              type="date"
              className="mt-1"
              value={he.desde}
              onChange={(e) => setHe({ ...he, desde: e.target.value })}
            />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input
              type="date"
              className="mt-1"
              value={he.hasta}
              onChange={(e) => setHe({ ...he, hasta: e.target.value })}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Chip on={he.disponible} onClick={() => setHe({ ...he, disponible: true })}>
              Tengo otro horario
            </Chip>
            <Chip on={!he.disponible} onClick={() => setHe({ ...he, disponible: false })}>
              No doy clase
            </Chip>
          </div>
          {he.disponible && (
            <>
              <div className="flex items-end gap-2">
                <div>
                  <Label>De</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={he.ini}
                    onChange={(e) => setHe({ ...he, ini: e.target.value })}
                  />
                </div>
                <div>
                  <Label>A</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={he.fin}
                    onChange={(e) => setHe({ ...he, fin: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Máximo de horas por semana</Label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1"
                  placeholder="6"
                  value={he.horas}
                  onChange={(e) => setHe({ ...he, horas: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label>Nota (opcional)</Label>
            <Input
              className="mt-1"
              placeholder="Ej.: solo online en agosto"
              value={he.nota}
              onChange={(e) => setHe({ ...he, nota: e.target.value })}
            />
          </div>
          <div>
            <Button type="button" variant="ink" onClick={addEspecifico}>
              Añadir cambio
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
