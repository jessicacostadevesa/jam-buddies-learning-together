import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { CassetteLogo, CassetteStripes, TrackCode } from "@/components/Cassette";
import hero from "@/assets/hero-jam.jpg";
export const Route = createFileRoute("/para-profes")({
  head: () => ({
    meta: [
      { title: "Enseña y abre tu local a músicos — ¿tocamos?" },
      {
        name: "description",
        content:
          "Comparte tu manera de enseñar y recibe peticiones de alumnos y bandas en ¿tocamos?.",
      },
      { property: "og:title", content: "Llena tus clases de gente con ganas — ¿tocamos?" },
      {
        property: "og:description",
        content: "Tu ficha de profe, escuela o local para conectar con músicos que empiezan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParaProfes,
});
function ParaProfes() {
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="page-width grid items-center gap-10 py-14 md:grid-cols-2">
          <div>
            <p className="handwritten">el siguiente paso lo dais juntos</p>
            <h1 className="mt-4 text-4xl md:text-5xl">Llena tus clases de gente con ganas</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Enseña a tocar, acompaña los primeros ensayos o abre tu escenario a quienes empiezan.
            </p>
            <Button asChild variant="primary" size="lg" className="mt-8">
              <Link to="/auth" search={{ rol: "profesor" }}>
                Crear mi ficha gratis
              </Link>
            </Button>
          </div>
          <div className="relative">
            <img
              src={hero}
              width={1536}
              height={1024}
              className="aspect-[3/2] w-full rounded-[32px] object-cover"
              alt="Músicos compartiendo un ensayo"
            />
            <div className="absolute bottom-5 right-5 rounded-[20px] bg-background p-4 shadow-cassette">
              <CassetteLogo />
              <p className="mt-2 font-display text-xl">Tu manera de enseñar</p>
            </div>
          </div>
        </section>
        <section className="bg-muted py-14">
          <div className="page-width">
            <h2 className="text-3xl">Tu sitio en ¿tocamos?</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {(
                [
                  {
                    track: "profes",
                    title: "Profe particular",
                    text: "Acompaña a cada alumno a su ritmo.",
                  },
                  {
                    track: "escuelas",
                    title: "Escuela",
                    text: "Un lugar para aprender y tocar juntos.",
                  },
                  {
                    track: "locales",
                    title: "Local",
                    text: "Haz sitio para los primeros ensayos.",
                  },
                ] as const
              ).map((x) => (
                <article
                  key={x.track}
                  className="overflow-hidden rounded-[24px] bg-card shadow-cassette"
                >
                  <div className="p-6">
                    <TrackCode track={x.track} />
                    <h3 className="mt-4 text-2xl">{x.title}</h3>
                    <p className="mt-3 text-muted-foreground">{x.text}</p>
                    <Button asChild variant="link" className="mt-4 px-0">
                      <Link
                        to="/auth"
                        search={{ rol: x.track === "locales" ? "local" : "profesor" }}
                      >
                        Crear ficha
                      </Link>
                    </Button>
                  </div>
                  <CassetteStripes />
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="page-width py-14">
          <h2 className="text-3xl">Así funciona</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              "Cuenta cómo enseñas o cómo es tu local",
              "Recibe peticiones y acuerda la fecha",
              "Acepta y recibe al músico",
            ].map((s, i) => (
              <li key={s}>
                <span className="font-display text-4xl text-primary">0{i + 1}</span>
                <p className="mt-4 text-lg font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
