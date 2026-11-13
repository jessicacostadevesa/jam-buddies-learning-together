import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfePerfil, profeQuery } from "@/components/perfil/ProfePerfil";
import { escuelaQuery } from "@/components/perfil/EscuelaSecciones";
import { AlumnoExtra, alumnoQuery } from "@/components/perfil/AlumnoExtra";
import { LocalPerfil, localQuery } from "@/components/perfil/LocalPerfil";

type Nivel = Database["public"]["Enums"]["nivel_musical"];
type Dia = Database["public"]["Enums"]["dia_semana"];
type Franja = Database["public"]["Enums"]["franja_horaria"];

const DIAS: Dia[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIA_LABEL: Record<Dia, string> = { lunes: "L", martes: "M", miercoles: "X", jueves: "J", viernes: "V", sabado: "S", domingo: "D" };
const FRANJAS: { id: Franja; label: string }[] = [{ id: "manana", label: "Mañana" }, { id: "tarde", label: "Tarde" }, { id: "noche", label: "Noche" }];
const NIVELES: { id: Nivel; label: string }[] = [{ id: "inicial", label: "Inicial" }, { id: "intermedio", label: "Intermedio" }, { id: "avanzado", label: "Avanzado" }];

const perfilQuery = (uid: string) =>
  queryOptions({
    queryKey: ["perfil", uid],
    queryFn: async () => {
      const [p, roles, inst, est, pi, pe, disp] = await Promise.all([
        supabase.from("perfiles").select("*").eq("id", uid).single(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("instrumentos").select("*").order("nombre"),
        supabase.from("estilos").select("*").order("nombre"),
        supabase.from("perfil_instrumentos").select("*").eq("perfil_id", uid),
        supabase.from("perfil_estilos").select("estilo_id").eq("perfil_id", uid),
        supabase.from("disponibilidad").select("dia, franja").eq("perfil_id", uid),
      ]);
      if (p.error) throw p.error;
      return {
        perfil: p.data,
        roles: (roles.data ?? []).map((r) => r.role),
        instrumentos: inst.data ?? [],
        estilos: est.data ?? [],
        misInstrumentos: pi.data ?? [],
        misEstilos: (pe.data ?? []).map((e) => e.estilo_id),
        disponibilidad: disp.data ?? [],
      };
    },
  });

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil de músico — Tocamos" },
      { name: "description", content: "Tu instrumento, nivel, gustos, zona y disponibilidad." },
      { property: "og:title", content: "Mi perfil — Tocamos" },
      { property: "og:description", content: "Tu perfil único de músico." },
    ],
  }),
  loader: async ({ context }) => {
    const d = await context.queryClient.ensureQueryData(perfilQuery(context.user.id));
    if (d.roles.includes("profesor")) await Promise.all([
      context.queryClient.ensureQueryData(profeQuery(context.user.id)),
      context.queryClient.ensureQueryData(escuelaQuery(context.user.id)),
    ]);
    else if (d.roles.includes("local")) await context.queryClient.ensureQueryData(localQuery(context.user.id));
    else await context.queryClient.ensureQueryData(alumnoQuery(context.user.id));
  },
  component: PerfilPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-pop p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PerfilPage() {
  const { user } = Route.useRouteContext();
  const uid = user.id;
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(perfilQuery(uid));
  const refresh = () => qc.invalidateQueries({ queryKey: ["perfil", uid] });

  const [form, setForm] = useState({
    nombre: data.perfil.nombre ?? "",
    ciudad: data.perfil.ciudad ?? "",
    zona: data.perfil.zona ?? "",
    bio: data.perfil.bio ?? "",
  });
  const [nuevoInst, setNuevoInst] = useState<string>("");
  const [nuevoNivel, setNuevoNivel] = useState<Nivel>("inicial");

  async function guardarDatos(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("perfiles").update({ ...form, updated_at: new Date().toISOString() }).eq("id", uid);
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Perfil guardado");
    refresh();
  }

  async function addInstrumento() {
    if (!nuevoInst) return;
    const { error } = await supabase.from("perfil_instrumentos").insert({ perfil_id: uid, instrumento_id: Number(nuevoInst), nivel: nuevoNivel });
    if (error) { toast.error("Ese instrumento ya está en tu perfil"); return; }
    setNuevoInst("");
    refresh();
  }
  async function delInstrumento(id: string) {
    await supabase.from("perfil_instrumentos").delete().eq("id", id);
    refresh();
  }
  async function toggleEstilo(id: number) {
    if (data.misEstilos.includes(id)) await supabase.from("perfil_estilos").delete().eq("perfil_id", uid).eq("estilo_id", id);
    else await supabase.from("perfil_estilos").insert({ perfil_id: uid, estilo_id: id });
    refresh();
  }
  async function toggleSlot(dia: Dia, franja: Franja) {
    const on = data.disponibilidad.some((d) => d.dia === dia && d.franja === franja);
    if (on) await supabase.from("disponibilidad").delete().eq("perfil_id", uid).eq("dia", dia).eq("franja", franja);
    else await supabase.from("disponibilidad").insert({ perfil_id: uid, dia, franja });
    refresh();
  }

  const instName = (id: number) => data.instrumentos.find((i) => i.id === id)?.nombre ?? "";
  const disponibles = data.instrumentos.filter((i) => !data.misInstrumentos.some((m) => m.instrumento_id === i.id));

  if (data.roles.includes("profesor")) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
          <ProfePerfil uid={uid} perfil={data.perfil} instrumentos={data.instrumentos} estilos={data.estilos}
            misInstrumentos={data.misInstrumentos} misEstilos={data.misEstilos} refreshBase={refresh} />
        </main>
      </div>
    );
  }

  if (data.roles.includes("local")) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
          <LocalPerfil uid={uid} perfil={data.perfil} estilos={data.estilos} misEstilos={data.misEstilos} refreshBase={refresh} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        <div>
          <div className="flex gap-2">
            {data.roles.map((r) => (
              <span key={r} className="rounded-full border-2 border-ink bg-secondary px-3 py-0.5 text-sm font-semibold capitalize">{r}</span>
            ))}
          </div>
          <h1 className="mt-3 text-4xl font-extrabold">Tu perfil de músico</h1>
          <p className="mt-1 text-muted-foreground">Cuéntanos qué tocas y qué buscas: así te recomendamos profes, compañeros de banda y locales que encajan contigo.</p>
        </div>

        <Section title="Sobre ti">
          <form onSubmit={guardarDatos} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="n">Nombre</Label><Input id="n" className="mt-1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label htmlFor="c">Ciudad</Label><Input id="c" className="mt-1" placeholder="Madrid" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
            <div><Label htmlFor="z">Zona</Label><Input id="z" className="mt-1" placeholder="Madrid sur" value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="b">Bio</Label><Textarea id="b" className="mt-1" placeholder="Qué te gusta tocar, tus grupos favoritos…" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button type="submit" variant="pop">Guardar</Button></div>
          </form>
        </Section>

        <Section title="Instrumentos que tocas o quieres aprender">
          <div className="flex flex-wrap gap-2">
            {data.misInstrumentos.length === 0 && <p className="text-sm text-muted-foreground">Añade el instrumento que tocas o quieres aprender.</p>}
            {data.misInstrumentos.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-card px-3 py-1.5 text-sm font-semibold">
                {instName(m.instrumento_id)} · <span className="capitalize text-primary">{m.nivel}</span>
                <button onClick={() => delInstrumento(m.id)} aria-label="Quitar"><X className="h-4 w-4" /></button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <select value={nuevoInst} onChange={(e) => setNuevoInst(e.target.value)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">Elige instrumento…</option>
              {disponibles.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
            <select value={nuevoNivel} onChange={(e) => setNuevoNivel(e.target.value as Nivel)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              {NIVELES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <Button variant="ink" onClick={addInstrumento}>Añadir</Button>
          </div>
        </Section>

        <AlumnoExtra uid={uid} />

        <Section title="Gustos musicales">
          <div className="flex flex-wrap gap-2">
            {data.estilos.map((e) => {
              const on = data.misEstilos.includes(e.id);
              return (
                <button key={e.id} onClick={() => toggleEstilo(e.id)}
                  className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                  {e.nombre}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Cuándo puedes tocar">
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead><tr><th />{DIAS.map((d) => <th key={d} className="px-1 pb-2 font-bold">{DIA_LABEL[d]}</th>)}</tr></thead>
              <tbody>
                {FRANJAS.map((f) => (
                  <tr key={f.id}>
                    <td className="pr-3 font-semibold">{f.label}</td>
                    {DIAS.map((d) => {
                      const on = data.disponibilidad.some((x) => x.dia === d && x.franja === f.id);
                      return (
                        <td key={d} className="p-1">
                          <button onClick={() => toggleSlot(d, f.id)} aria-label={`${d} ${f.label}`}
                            className={`h-9 w-9 rounded-md border-2 border-ink transition-colors ${on ? "bg-accent" : "bg-card hover:bg-muted"}`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  );
}
