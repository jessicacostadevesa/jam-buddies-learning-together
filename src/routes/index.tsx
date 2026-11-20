import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, MapPin, Music2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CassetteLogo, CassetteStripes, TrackCode } from "@/components/Cassette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import hero from "@/assets/hero-jam.jpg";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aprende tocando. Súbete al escenario. — ¿tocamos?" },
      {
        name: "description",
        content: "Profes, bandas y locales cerca de ti para gente que empieza. Tú pones las ganas.",
      },
      { property: "og:title", content: "¿tocamos? · Tu primera canción empieza aquí" },
      {
        property: "og:description",
        content:
          "Encuentra profes y escuelas que enseñan tocando, y locales para tus primeros ensayos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
function Index() {
  const [instrumento, setInstrumento] = useState(""),
    [donde, setDonde] = useState("");
  const navigate = Route.useNavigate();
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="page-width pt-6 md:pt-14">
          <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="handwritten">¿llevas años diciendo que vas a aprender?</p>
              <h1 className="mt-3 md:mt-5 text-[36px] leading-[1.12] md:text-[42px] lg:text-[56px]">
                Aprende tocando.
                <br />
                <span className="text-primary">Súbete al escenario.</span>
              </h1>
              <p className="mt-4 md:mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Profes, bandas y locales cerca de ti para gente que empieza. Tú pones las ganas.
              </p>
            </div>
            <div className="relative mb-3">
              <img
                src={hero}
                alt="Músicos amateurs tocando juntos en un local de ensayo"
                width={1536}
                height={1024}
                className="aspect-[16/9] md:aspect-[4/3] w-full rounded-[32px] object-cover"
              />
              <div className="absolute -bottom-4 right-4 w-48 rotate-6 overflow-hidden rounded-[16px] bg-background shadow-cassette md:right-6">
                <div className="flex items-center justify-between px-4 py-2">
                  <CassetteLogo className="h-7 w-10" />
                  <span className="text-xs font-semibold">VOL. 01</span>
                </div>
                <CassetteStripes />
                <p className="px-4 py-3 font-display text-base">para empezar a tocar ♪</p>
              </div>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/explorar", search: { pista: "profes", instrumento, donde } });
            }}
            className="mt-8 md:mt-10 flex flex-col gap-5 rounded-[28px] bg-card p-5 shadow-cassette md:flex-row md:items-center md:rounded-full md:px-8"
          >
            <div className="flex-1">
              <Label
                htmlFor="home-instrument"
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <Music2 className="h-4 w-4" />
                Qué quieres tocar
              </Label>
              <Input
                id="home-instrument"
                placeholder="Elige tu instrumento"
                value={instrumento}
                onChange={(e) => setInstrumento(e.target.value)}
                className="mt-1 h-10 rounded-none border-0 bg-transparent px-0 shadow-none"
              />
            </div>
            <div className="flex-1 md:border-l md:border-dotted md:pl-8">
              <Label htmlFor="home-city" className="flex items-center gap-2 text-xs font-semibold">
                <MapPin className="h-4 w-4" />
                Dónde
              </Label>
              <Input
                id="home-city"
                placeholder="Tu ciudad o barrio"
                value={donde}
                onChange={(e) => setDonde(e.target.value)}
                className="mt-1 h-10 rounded-none border-0 bg-transparent px-0 shadow-none"
              />
            </div>
            <Button variant="primary" type="submit" size="lg">
              Buscar
            </Button>
          </form>
        </section>
        <section className="page-width py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl md:text-4xl">Dos caras, un mismo camino</h2>
            <span className="text-xs font-semibold text-muted-foreground">
              DALE AL PLAY A LO QUE TE APETECE
            </span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {(
              [
                {
                  side: "A",
                  title: "aprender",
                  color: "bg-teacher-tint",
                  items: [
                    { track: "profes", label: "Profes particulares" },
                    { track: "escuelas", label: "Escuelas" },
                  ],
                },
                {
                  side: "B",
                  title: "tocar con otros",
                  color: "bg-band-tint",
                  items: [
                    { track: "bandas", label: "Bandas" },
                    { track: "locales", label: "Locales" },
                  ],
                },
              ] as const
            ).map((c) => (
              <div
                key={c.side}
                className={`overflow-hidden rounded-[24px] shadow-cassette ${c.color}`}
              >
                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <span className="text-xs font-bold">CARA {c.side}</span>
                    <h3 className="mt-1 text-3xl">{c.title}</h3>
                  </div>
                  <CassetteLogo className="h-12 w-20" />
                </div>
                <CassetteStripes />
                <div className="space-y-1 p-4">
                  {c.items.map((x) => (
                    <Button
                      key={x.track}
                      asChild
                      variant="ghost"
                      className="flex min-h-16 w-full justify-start rounded-[16px] px-3 text-base"
                    >
                      <Link to="/explorar" search={{ pista: x.track, instrumento: "", donde: "" }}>
                        <TrackCode track={x.track} />
                        {x.label}
                        <ArrowUpRight className="ml-auto" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="page-width border-t border-dotted py-14">
          <h2 className="text-3xl">Así suena el camino</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {["Tu primera clase", "Tu primera banda", "Tu primer escenario"].map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <span className="font-display text-4xl text-primary">0{i + 1}</span>
                <span className="text-lg font-medium">{s}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="bg-muted py-10">
          <div className="page-width flex flex-wrap items-center justify-between gap-6">
            <h2 className="max-w-xl text-3xl">¿Enseñas música o tienes un local?</h2>
            <Button asChild variant="secondary" size="lg">
              <Link to="/para-profes">
                Este también es tu sitio
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
