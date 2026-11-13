import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, MapPin, Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { listarProfes } from "@/lib/profes.functions";

const profesQuery = queryOptions({ queryKey: ["profes"], queryFn: () => listarProfes() });

const NIVEL: Record<string, string> = { inicial: "Desde cero", intermedio: "Ya tocan algo", avanzado: "Avanzados" };
const MOD: Record<string, string> = { presencial: "En aula", domicilio: "A domicilio", online: "Online" };

export const Route = createFileRoute("/profes")({
  head: () => ({
    meta: [
      { title: "Profes y escuelas — Tocamos" },
      { name: "description", content: "Encuentra profes y escuelas que enseñan tocando: instrumento, estilo, zona y precio." },
      { property: "og:title", content: "Profes y escuelas que enseñan tocando — Tocamos" },
      { property: "og:description", content: "Busca profe por instrumento, estilo y zona." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profesQuery),
  component: ProfesPage,
});

function ProfesPage() {
  const { data } = useSuspenseQuery(profesQuery);
  const [q, setQ] = useState("");
  const t = q.trim().toLowerCase();
  const lista = t
    ? data.filter((p) => [p.nombre, p.ciudad, p.zona, p.titular, ...p.instrumentos, ...p.estilos].some((s) => s?.toLowerCase().includes(t)))
    : data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-4xl font-extrabold md:text-5xl">Profes y escuelas</h1>
        <p className="mt-2 text-muted-foreground">Gente que enseña tocando. Busca por instrumento, estilo o zona.</p>
        <div className="relative mt-6 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Guitarra, rock, Madrid…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {lista.length === 0 && <p className="mt-10 text-muted-foreground">No hay profes que coincidan.</p>}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {lista.map((p) => (
            <article key={p.id} className="card-pop flex flex-col p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-secondary text-xl font-extrabold">
                  {p.nombre.charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{p.nombre || "Profe sin nombre"}</h2>
                    <span className="rounded-full border-2 border-ink bg-card px-2 py-0.5 text-xs font-semibold">{p.esEscuela ? "Escuela" : "Profe particular"}</span>
                    {p.verificado && <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-accent px-2 py-0.5 text-xs font-semibold"><BadgeCheck className="h-3.5 w-3.5" /> Verificado</span>}
                  </div>
                  {p.titular && <p className="font-semibold text-primary">{p.titular}</p>}
                  {(p.ciudad || p.zona) && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{[p.zona, p.ciudad].filter(Boolean).join(", ")}</p>}
                </div>
                {p.precio != null && <div className="text-right"><div className="text-2xl font-extrabold">{Number(p.precio)}€</div><div className="text-xs text-muted-foreground">/hora</div></div>}
              </div>
              {p.bio && <p className="mt-4 line-clamp-3 text-sm">{p.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.instrumentos.map((i) => <span key={i} className="rounded-md border-2 border-ink bg-card px-2 py-0.5 text-xs font-bold">{i}</span>)}
                {p.estilos.map((e) => <span key={e} className="rounded-full border border-ink/40 px-2 py-0.5 text-xs">{e}</span>)}
              </div>
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs font-semibold text-muted-foreground">
                {p.anios > 0 && <span>{p.anios} años dando clase</span>}
                {p.niveles.length > 0 && <span>{p.niveles.map((n) => NIVEL[n]).join(" · ")}</span>}
                {p.modalidades.length > 0 && <span>{p.modalidades.map((m) => MOD[m]).join(" · ")}</span>}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}