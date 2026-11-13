import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Users, MapPin, BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-jam.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tocamos — Aprende tocando, forma tu banda y sube al escenario" },
      { name: "description", content: "Profes y escuelas verificados que enseñan tocando, match para formar banda y mapa de locales para ensayar y tocar." },
      { property: "og:title", content: "Tocamos — Aprende tocando y forma tu banda" },
      { property: "og:description", content: "Profes verificados, compañeros de banda afines y locales para ensayar y tocar en directo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: GraduationCap, color: "bg-primary text-primary-foreground", title: "Profes y escuelas con sello", text: "Perfiles verificados, reseñas solo de alumnos reales, vídeo de una clase y clase de prueba." },
  { icon: Users, color: "bg-secondary text-secondary-foreground", title: "Match para formar banda", text: "Compañeros con tu nivel real, tus gustos y tu zona. O únete a una banda que busca lo que tocas." },
  { icon: MapPin, color: "bg-accent text-accent-foreground", title: "Locales para ensayar y tocar", text: "Salas de ensayo con precio por hora, jams, open mics y conciertos para bandas noveles." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-secondary px-3 py-1 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4" /> Nada de teoría aburrida
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] md:text-7xl">
              Aprende tocando. <span className="text-primary">Súbete al escenario.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Un solo perfil de músico te acompaña desde tu primera clase hasta tu primer concierto con banda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="pop" size="lg"><Link to="/auth">Crear mi perfil</Link></Button>
              <Button asChild variant="ink" size="lg"><Link to="/auth" search={{ rol: "profesor" }}>Soy profe o local</Link></Button>
            </div>
          </div>
          <div className="card-pop overflow-hidden rotate-1">
            <img src={hero} alt="Músicos amateurs tocando juntos en un local de ensayo" width={1536} height={1024} className="h-full w-full object-cover" />
          </div>
        </section>

        <section className="border-y-2 border-ink bg-ink py-16 text-ink-foreground">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-extrabold md:text-5xl">Tres caminos, un perfil</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="card-pop p-6 text-card-foreground">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">Para alumnos, profes y locales</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            El alumno encuentra un sitio divertido y fiable. El profe consigue alumnos sin buscarlos. El local llena horas y fechas.
          </p>
          <Button asChild variant="pop" size="lg" className="mt-8"><Link to="/auth">Empezar gratis</Link></Button>
        </section>
      </main>
    </div>
  );
}
