import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CassetteCard, tracks } from "@/components/Cassette";
import { PedirClaseForm } from "@/components/PedirClaseForm";
import { SpotifyPie } from "@/components/SpotifyPie";
import { profesQuery, precioHora, niveles, modalidades } from "@/lib/directory";
export const Route = createFileRoute("/profe/$id")({
  loader: async ({ context, params }) => {
    const rows = await context.queryClient.ensureQueryData(profesQuery);
    const p = rows.find((p) => p.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.nombre ?? "Profe"} · Clases de música — ¿tocamos?` },
      {
        name: "description",
        content: loaderData?.titular || "Conoce a tu próximo profe y pide tu primera clase.",
      },
      { property: "og:title", content: `${loaderData?.nombre ?? "Tu próximo profe"} — ¿tocamos?` },
      {
        property: "og:description",
        content:
          loaderData?.titular || "Aprende tocando y pide clase sin pagar hasta que la acepte.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfePage,
});
function ProfePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(profesQuery);
  const p = data.find((x) => x.id === id);
  if (!p) return null;
  const track = p.esEscuela ? "escuelas" : "profes";
  const details = [
    { title: "Para quién", text: p.niveles.map((n) => niveles[n]).join(" · ") },
    { title: "Dónde", text: p.modalidades.map((m) => modalidades[m]).join(" · ") },
    { title: "Sobre sus clases", text: p.bio },
    { title: "Experiencia", text: p.anios > 0 ? `${p.anios} años enseñando música` : "" },
  ].filter((d) => d.text);
  return (
    <div>
      <SiteHeader />
      <main className="page-width py-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <CassetteCard
              track={track}
              label={p.esEscuela ? "Escuela de música" : "Profe particular"}
              price={precioHora(p.precio)}
            >
              <div className="flex flex-wrap items-center gap-5">
                <div
                  className={`flex h-24 w-24 items-center justify-center border-[3px] font-display text-5xl ${tracks[track].tint} ${tracks[track].ring} ${p.esEscuela ? "rounded-[20px]" : "rounded-full"}`}
                >
                  {p.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h1 className="break-words text-4xl">{p.nombre}</h1>
                  <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {[p.zona, p.ciudad].filter(Boolean).join(", ")}
                  </p>
                  {p.verificado && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-venue-tint px-3 py-1 text-sm">
                      <BadgeCheck className="h-4 w-4" />
                      Verificada
                    </span>
                  )}
                </div>
              </div>
              {p.titular && (
                <p className="cassette-quote mt-6 flex text-[17px] font-medium">{p.titular}</p>
              )}
            </CassetteCard>
            <section className="py-10">
              <h2 className="text-3xl">Cómo son sus clases</h2>
              <ol className="mt-6 divide-y divide-dotted">
                {details.map((d, i) => (
                  <li key={d.title} className="flex gap-4 py-5">
                    <span className="font-display text-3xl text-primary">0{i + 1}</span>
                    <div>
                      <h3 className="font-sans text-base font-semibold">{d.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="border-t border-dotted py-8">
              <h2 className="text-3xl">Qué enseña y qué escucha</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {[...p.instrumentos, ...p.estilos].map((s) => (
                  <span key={s} className={`rounded-full px-4 py-2 text-sm ${tracks[track].tint}`}>
                    {s}
                  </span>
                ))}
              </div>
              <SpotifyPie artistas={p.artistas} playlists={p.playlists} />
            </section>
          </div>
          <aside className="lg:sticky lg:top-6">
            <PedirClaseForm id={p.id} precio={p.precio} escuela={p.esEscuela} />
          </aside>
        </div>
      </main>
    </div>
  );
}
