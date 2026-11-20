import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Nivel = Database["public"]["Enums"]["nivel_musical"];
type Formato = Database["public"]["Enums"]["formato_clase"];
type Publico = Database["public"]["Enums"]["publico_edad"];

export const SERVICIOS = [
  "Clases individuales",
  "Clases en grupo",
  "Combos y bandas",
  "Conciertos de alumnos",
  "Grabación",
  "Alquiler de salas",
  "Préstamo de instrumentos",
  "Campamentos de verano",
];
export const FORMATO: Record<Formato, string> = {
  individual: "Individual",
  grupal: "En grupo",
  banda: "En banda",
};
export const PUBLICO: Record<Publico, string> = {
  ninos: "Niños",
  adolescentes: "Adolescentes",
  adultos: "Adultos",
  mayores: "Mayores de 60",
};
const NIVEL: Record<Nivel, string> = {
  inicial: "Desde cero",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const escuelaQuery = (uid: string) =>
  queryOptions({
    queryKey: ["escuela", uid],
    queryFn: async () => {
      const [d, f, p, e] = await Promise.all([
        supabase.from("escuela_detalles").select("*").eq("perfil_id", uid).maybeSingle(),
        supabase.from("escuela_datos_fiscales").select("*").eq("perfil_id", uid).maybeSingle(),
        supabase.from("escuela_programas").select("*").eq("perfil_id", uid).order("created_at"),
        supabase.from("escuela_equipo").select("*").eq("perfil_id", uid).order("created_at"),
      ]);
      return { detalles: d.data, fiscal: f.data, programas: p.data ?? [], equipo: e.data ?? [] };
    },
  });

function Section({
  title,
  hint,
  children,
}: {
  title: React.ReactNode;
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
      className={`min-h-10 rounded-full border-2 border-transparent px-4 py-1 text-sm font-semibold transition-colors ${on ? "bg-school text-foreground border-foreground" : "bg-muted hover:bg-border"}`}
    >
      {children}
    </Button>
  );
}
const selectCls = "h-10 rounded-md border border-input bg-card px-3 text-sm";
const num = (s: string) => (s === "" ? null : Number(s));
const str = (v: number | null | undefined) => (v == null ? "" : String(v));

export function EscuelaSecciones({
  uid,
  instrumentos,
}: {
  uid: string;
  instrumentos: { id: number; nombre: string }[];
}) {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(escuelaQuery(uid));
  const refresh = () => qc.invalidateQueries({ queryKey: ["escuela", uid] });
  const d = data.detalles;

  const [f, setF] = useState({
    direccion: d?.direccion ?? "",
    codigo_postal: d?.codigo_postal ?? "",
    telefono: d?.telefono ?? "",
    email_contacto: d?.email_contacto ?? "",
    web: d?.web ?? "",
    instagram: d?.instagram ?? "",
    anio_fundacion: str(d?.anio_fundacion),
    num_profesores: str(d?.num_profesores),
    num_alumnos: str(d?.num_alumnos),
    num_salas: str(d?.num_salas),
    instalaciones: d?.instalaciones ?? "",
    horario_atencion: d?.horario_atencion ?? "",
    matricula: str(d?.matricula),
    clase_prueba: d?.clase_prueba ?? false,
    servicios: d?.servicios ?? [],
    razon_social: data.fiscal?.razon_social ?? "",
    cif: data.fiscal?.cif ?? "",
    responsable: data.fiscal?.responsable ?? "",
  });
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const [a, b] = await Promise.all([
      supabase.from("escuela_detalles").upsert({
        perfil_id: uid,
        direccion: f.direccion,
        codigo_postal: f.codigo_postal,
        telefono: f.telefono,
        email_contacto: f.email_contacto,
        web: f.web,
        instagram: f.instagram,
        anio_fundacion: num(f.anio_fundacion),
        num_profesores: num(f.num_profesores),
        num_alumnos: num(f.num_alumnos),
        num_salas: num(f.num_salas),
        instalaciones: f.instalaciones,
        horario_atencion: f.horario_atencion,
        matricula: num(f.matricula),
        clase_prueba: f.clase_prueba,
        servicios: f.servicios,
        updated_at: new Date().toISOString(),
      }),
      supabase
        .from("escuela_datos_fiscales")
        .upsert({
          perfil_id: uid,
          razon_social: f.razon_social,
          cif: f.cif,
          responsable: f.responsable,
        }),
    ]);
    if (a.error || b.error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Datos de la escuela guardados");
    refresh();
  }

  const vacioProg = {
    nombre: "",
    descripcion: "",
    instrumento_id: "",
    nivel: "" as Nivel | "",
    formato: "grupal" as Formato,
    publico: "" as Publico | "",
    duracion: "",
    precio: "",
    periodo_precio: "mes",
    plazas: "",
  };
  const [p, setP] = useState(vacioProg);
  async function addPrograma() {
    if (!p.nombre) {
      toast.error("Ponle un nombre al curso");
      return;
    }
    const { error } = await supabase.from("escuela_programas").insert({
      perfil_id: uid,
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      instrumento_id: p.instrumento_id ? Number(p.instrumento_id) : null,
      nivel: p.nivel || null,
      formato: p.formato,
      publico: p.publico || null,
      duracion: p.duracion || null,
      precio: num(p.precio),
      periodo_precio: p.periodo_precio,
      plazas: num(p.plazas),
    });
    if (error) {
      toast.error("No se pudo añadir");
      return;
    }
    setP(vacioProg);
    refresh();
  }
  async function delPrograma(id: string) {
    await supabase.from("escuela_programas").delete().eq("id", id);
    refresh();
  }

  const [m, setM] = useState({ nombre: "", especialidad: "", bio: "" });
  async function addMiembro() {
    if (!m.nombre) {
      toast.error("Pon el nombre del profe");
      return;
    }
    const { error } = await supabase
      .from("escuela_equipo")
      .insert({
        perfil_id: uid,
        nombre: m.nombre,
        especialidad: m.especialidad || null,
        bio: m.bio || null,
      });
    if (error) {
      toast.error("No se pudo añadir");
      return;
    }
    setM({ nombre: "", especialidad: "", bio: "" });
    refresh();
  }
  async function delMiembro(id: string) {
    await supabase.from("escuela_equipo").delete().eq("id", id);
    refresh();
  }
  const instName = (id: number | null) => instrumentos.find((i) => i.id === id)?.nombre;

  return (
    <>
      <form onSubmit={guardar} className="space-y-6">
        <Section title="La escuela" hint="Dónde estáis, cómo contactaros y qué ofrecéis.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="dir">Dirección</Label>
              <Input
                id="dir"
                className="mt-1"
                placeholder="Calle Mayor 12, local 3"
                value={f.direccion}
                onChange={set("direccion")}
              />
            </div>
            <div>
              <Label htmlFor="cp">Código postal</Label>
              <Input
                id="cp"
                className="mt-1"
                value={f.codigo_postal}
                onChange={set("codigo_postal")}
              />
            </div>
            <div>
              <Label htmlFor="tel">Teléfono</Label>
              <Input id="tel" className="mt-1" value={f.telefono} onChange={set("telefono")} />
            </div>
            <div>
              <Label htmlFor="em">Email de contacto</Label>
              <Input
                id="em"
                type="email"
                className="mt-1"
                value={f.email_contacto}
                onChange={set("email_contacto")}
              />
            </div>
            <div>
              <Label htmlFor="web">Web</Label>
              <Input
                id="web"
                className="mt-1"
                placeholder="https://"
                value={f.web}
                onChange={set("web")}
              />
            </div>
            <div>
              <Label htmlFor="ig">Instagram</Label>
              <Input
                id="ig"
                className="mt-1"
                placeholder="@tuescuela"
                value={f.instagram}
                onChange={set("instagram")}
              />
            </div>
            <div>
              <Label htmlFor="ha">Horario de atención</Label>
              <Input
                id="ha"
                className="mt-1"
                placeholder="L-V 10:00–21:00"
                value={f.horario_atencion}
                onChange={set("horario_atencion")}
              />
            </div>
            <div>
              <Label htmlFor="af">Año de fundación</Label>
              <Input
                id="af"
                type="number"
                className="mt-1"
                value={f.anio_fundacion}
                onChange={set("anio_fundacion")}
              />
            </div>
            <div>
              <Label htmlFor="np">Nº de profes</Label>
              <Input
                id="np"
                type="number"
                min={0}
                className="mt-1"
                value={f.num_profesores}
                onChange={set("num_profesores")}
              />
            </div>
            <div>
              <Label htmlFor="na">Nº de alumnos aprox.</Label>
              <Input
                id="na"
                type="number"
                min={0}
                className="mt-1"
                value={f.num_alumnos}
                onChange={set("num_alumnos")}
              />
            </div>
            <div>
              <Label htmlFor="ns">Nº de aulas o salas</Label>
              <Input
                id="ns"
                type="number"
                min={0}
                className="mt-1"
                value={f.num_salas}
                onChange={set("num_salas")}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ins">Instalaciones y equipo</Label>
              <Textarea
                id="ins"
                rows={3}
                className="mt-1"
                placeholder="Aulas, baterías y amplis para todos, escenario para conciertos…"
                value={f.instalaciones}
                onChange={set("instalaciones")}
              />
            </div>
          </div>
          <Label className="mt-5 block">Servicios</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICIOS.map((s) => (
              <Chip
                key={s}
                on={f.servicios.includes(s)}
                onClick={() =>
                  setF({
                    ...f,
                    servicios: f.servicios.includes(s)
                      ? f.servicios.filter((x) => x !== s)
                      : [...f.servicios, s],
                  })
                }
              >
                {s === "Grabación" ? "Producción musical" : s}
              </Chip>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mat">Matrícula (€)</Label>
              <Input
                id="mat"
                type="number"
                min={0}
                className="mt-1"
                placeholder="0 si no hay"
                value={f.matricula}
                onChange={set("matricula")}
              />
            </div>
            <div>
              <Label>Clase de prueba gratis</Label>
              <div className="mt-2 flex gap-2">
                <Chip on={f.clase_prueba} onClick={() => setF({ ...f, clase_prueba: true })}>
                  Sí
                </Chip>
                <Chip on={!f.clase_prueba} onClick={() => setF({ ...f, clase_prueba: false })}>
                  No
                </Chip>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title={
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" /> Datos de la empresa
            </span>
          }
          hint="Privados. Solo los usamos para verificar la escuela; los alumnos no los ven."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="rs">Razón social</Label>
              <Input
                id="rs"
                className="mt-1"
                value={f.razon_social}
                onChange={set("razon_social")}
              />
            </div>
            <div>
              <Label htmlFor="cif">CIF / NIF</Label>
              <Input id="cif" className="mt-1" value={f.cif} onChange={set("cif")} />
            </div>
            <div>
              <Label htmlFor="resp">Persona responsable</Label>
              <Input
                id="resp"
                className="mt-1"
                value={f.responsable}
                onChange={set("responsable")}
              />
            </div>
          </div>
        </Section>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" size="lg">
            Guardar datos de la escuela
          </Button>
        </div>
      </form>

      <Section
        title="Cursos y programas"
        hint="Lo que puede apuntarse a hacer un alumno: con quién, a qué nivel y cuánto cuesta."
      >
        <div className="space-y-2">
          {data.programas.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay cursos.</p>
          )}
          {data.programas.map((x) => (
            <div
              key={x.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <div className="flex-1">
                <div className="font-bold">
                  {x.nombre}
                  {x.precio != null && (
                    <span className="ml-2 text-primary">
                      {Number(x.precio)}€/{x.periodo_precio}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {[
                    instName(x.instrumento_id),
                    FORMATO[x.formato],
                    x.nivel && NIVEL[x.nivel],
                    x.publico && PUBLICO[x.publico],
                    x.duracion,
                    x.plazas && `${x.plazas} plazas`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {x.descripcion && <p className="mt-1">{x.descripcion}</p>}
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => delPrograma(x.id)}
                aria-label="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nombre del curso</Label>
            <Input
              className="mt-1"
              placeholder="Monta tu primera banda"
              value={p.nombre}
              onChange={(e) => setP({ ...p, nombre: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea
              rows={2}
              className="mt-1"
              placeholder="Qué se hace y qué se consigue al terminar"
              value={p.descripcion}
              onChange={(e) => setP({ ...p, descripcion: e.target.value })}
            />
          </div>
          <select
            aria-label="Instrumento del curso"
            className={selectCls}
            value={p.instrumento_id}
            onChange={(e) => setP({ ...p, instrumento_id: e.target.value })}
          >
            <option value="">Cualquier instrumento</option>
            {instrumentos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
          <select
            aria-label="Formato de clase"
            className={selectCls}
            value={p.formato}
            onChange={(e) => setP({ ...p, formato: e.target.value as Formato })}
          >
            {Object.entries(FORMATO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Nivel del curso"
            className={selectCls}
            value={p.nivel}
            onChange={(e) => setP({ ...p, nivel: e.target.value as Nivel | "" })}
          >
            <option value="">Todos los niveles</option>
            {Object.entries(NIVEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Edad del grupo"
            className={selectCls}
            value={p.publico}
            onChange={(e) => setP({ ...p, publico: e.target.value as Publico | "" })}
          >
            <option value="">Todas las edades</option>
            {Object.entries(PUBLICO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Input
            placeholder="Duración (ej.: 1 h/semana, trimestral)"
            value={p.duracion}
            onChange={(e) => setP({ ...p, duracion: e.target.value })}
          />
          <Input
            type="number"
            min={1}
            placeholder="Plazas por grupo"
            value={p.plazas}
            onChange={(e) => setP({ ...p, plazas: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Precio €"
              value={p.precio}
              onChange={(e) => setP({ ...p, precio: e.target.value })}
            />
            <select
              className={selectCls}
              value={p.periodo_precio}
              onChange={(e) => setP({ ...p, periodo_precio: e.target.value })}
            >
              <option value="mes">al mes</option>
              <option value="clase">por clase</option>
              <option value="trimestre">al trimestre</option>
              <option value="curso">el curso</option>
            </select>
          </div>
          <div>
            <Button type="button" variant="ink" onClick={addPrograma}>
              Añadir curso
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Equipo de profes"
        hint="Quién da las clases. A los alumnos les da confianza ver caras y nombres."
      >
        <div className="space-y-2">
          {data.equipo.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no has añadido profes.</p>
          )}
          {data.equipo.map((x) => (
            <div
              key={x.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <div className="flex-1">
                <span className="font-bold">{x.nombre}</span>
                {x.especialidad && (
                  <span className="text-muted-foreground"> · {x.especialidad}</span>
                )}
                {x.bio && <p className="mt-1">{x.bio}</p>}
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => delMiembro(x.id)}
                aria-label="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Nombre"
            value={m.nombre}
            onChange={(e) => setM({ ...m, nombre: e.target.value })}
          />
          <Input
            placeholder="Especialidad (ej.: batería y percusión)"
            value={m.especialidad}
            onChange={(e) => setM({ ...m, especialidad: e.target.value })}
          />
          <Textarea
            className="sm:col-span-2"
            rows={2}
            placeholder="Breve trayectoria"
            value={m.bio}
            onChange={(e) => setM({ ...m, bio: e.target.value })}
          />
          <div>
            <Button type="button" variant="ink" onClick={addMiembro}>
              Añadir profe
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
