import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PUBLICO } from "@/components/perfil/EscuelaSecciones";

type Publico = Database["public"]["Enums"]["publico_edad"];
type Modalidad = Database["public"]["Enums"]["modalidad_clase"];

export const OBJETIVOS = ["Aprender desde cero", "Mejorar lo que ya toco", "Tocar en una banda", "Tocar en directo", "Componer mis canciones", "Pasarlo bien sin presión"];
export const BUSCA = ["Profe particular", "Escuela", "Compañeros de banda", "Unirme a una banda", "Jams y open mics", "Sala de ensayo"];
const MOD: Record<Modalidad, string> = { presencial: "En aula / escuela", domicilio: "En casa", online: "Online" };

export const alumnoQuery = (uid: string) =>
  queryOptions({
    queryKey: ["alumno", uid],
    queryFn: async () => (await supabase.from("alumno_detalles").select("*").eq("perfil_id", uid).maybeSingle()).data,
  });

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
      {children}
    </button>
  );
}
const tog = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

export function AlumnoExtra({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { data: d } = useSuspenseQuery(alumnoQuery(uid));
  const [f, setF] = useState({
    objetivos: d?.objetivos ?? [], busca: d?.busca ?? [], edad: (d?.edad ?? "") as Publico | "",
    tiene_instrumento: d?.tiene_instrumento ?? false, modalidades: (d?.modalidades ?? []) as Modalidad[],
    presupuesto_mes: d?.presupuesto_mes != null ? String(d.presupuesto_mes) : "", distancia_km: d?.distancia_km != null ? String(d.distancia_km) : "",
    referentes: d?.referentes ?? "", estilos_otros: d?.estilos_otros ?? "",
  });

  async function guardar() {
    const { error } = await supabase.from("alumno_detalles").upsert({
      perfil_id: uid, objetivos: f.objetivos, busca: f.busca, edad: f.edad || null, tiene_instrumento: f.tiene_instrumento,
      modalidades: f.modalidades, presupuesto_mes: f.presupuesto_mes ? Number(f.presupuesto_mes) : null,
      distancia_km: f.distancia_km ? Number(f.distancia_km) : null, referentes: f.referentes || null, estilos_otros: f.estilos_otros || null,
      updated_at: new Date().toISOString(),
    });
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Guardado"); qc.invalidateQueries({ queryKey: ["alumno", uid] });
  }

  return (
    <section className="card-pop p-6">
      <h2 className="text-xl font-bold">Qué buscas</h2>
      <p className="mt-1 text-sm text-muted-foreground">Con esto te recomendamos profes, compañeros de banda y locales que encajan contigo.</p>
      <div className="mt-4 space-y-5">
        <div><Label>Qué quieres conseguir</Label>
          <div className="mt-2 flex flex-wrap gap-2">{OBJETIVOS.map((o) => <Chip key={o} on={f.objetivos.includes(o)} onClick={() => setF({ ...f, objetivos: tog(f.objetivos, o) })}>{o}</Chip>)}</div></div>
        <div><Label>Qué estás buscando ahora</Label>
          <div className="mt-2 flex flex-wrap gap-2">{BUSCA.map((o) => <Chip key={o} on={f.busca.includes(o)} onClick={() => setF({ ...f, busca: tog(f.busca, o) })}>{o}</Chip>)}</div></div>
        <div><Label>Cómo prefieres las clases</Label>
          <div className="mt-2 flex flex-wrap gap-2">{(Object.keys(MOD) as Modalidad[]).map((m) => <Chip key={m} on={f.modalidades.includes(m)} onClick={() => setF({ ...f, modalidades: tog(f.modalidades, m) })}>{MOD[m]}</Chip>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Edad</Label>
            <select className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={f.edad} onChange={(e) => setF({ ...f, edad: e.target.value as Publico | "" })}>
              <option value="">Prefiero no decirlo</option>{(Object.keys(PUBLICO) as Publico[]).map((k) => <option key={k} value={k}>{PUBLICO[k]}</option>)}
            </select></div>
          <div><Label>¿Tienes instrumento propio?</Label><div className="mt-2 flex gap-2">
            <Chip on={f.tiene_instrumento} onClick={() => setF({ ...f, tiene_instrumento: true })}>Sí</Chip>
            <Chip on={!f.tiene_instrumento} onClick={() => setF({ ...f, tiene_instrumento: false })}>Todavía no</Chip></div></div>
          <div><Label htmlFor="pm">Presupuesto al mes (€)</Label><Input id="pm" type="number" min={0} className="mt-1" placeholder="60" value={f.presupuesto_mes} onChange={(e) => setF({ ...f, presupuesto_mes: e.target.value })} /></div>
          <div><Label htmlFor="km">Hasta cuántos km te mueves</Label><Input id="km" type="number" min={0} className="mt-1" placeholder="10" value={f.distancia_km} onChange={(e) => setF({ ...f, distancia_km: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label htmlFor="ref">Artistas o grupos que te inspiran</Label><Input id="ref" className="mt-1" placeholder="Los que te gustaría saber tocar" value={f.referentes} onChange={(e) => setF({ ...f, referentes: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label htmlFor="eo">Otros estilos que te gustan</Label><Input id="eo" className="mt-1" placeholder="Si no aparecen en la lista de gustos" value={f.estilos_otros} onChange={(e) => setF({ ...f, estilos_otros: e.target.value })} /></div>
        </div>
        <Button type="button" variant="pop" onClick={guardar}>Guardar</Button>
      </div>
    </section>
  );
}