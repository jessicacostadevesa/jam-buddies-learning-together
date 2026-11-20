import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { z } from "zod";
import { BadgeCheck, ChevronDown, ChevronUp, LocateFixed, MapPin, List, Map } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CassetteCard, FilterChip, TrackCode, tracks, type Track } from "@/components/Cassette";
import { SpotifyPie } from "@/components/SpotifyPie";
import { DirectoryMap } from "@/components/DirectoryMap";
import { ReservarDialog } from "@/components/ReservarDialog";
import {
  profesQuery,
  localesQuery,
  precioHora,
  modalidades,
  niveles,
  type ProfePublico,
} from "@/lib/directory";
import { matchesSearch, matchesVenueFilters } from "@/lib/explore-filters";
import { distanciaKm } from "@/lib/distancia";

export const Route = createFileRoute("/explorar")({
  validateSearch: z.object({
    pista: z.enum(["profes", "escuelas", "bandas", "locales"]).catch("profes"),
    instrumento: z.string().catch(""),
    donde: z.string().catch(""),
  }),
  head: () => ({
    meta: [
      { title: "Encuentra profes, bandas y locales — ¿tocamos?" },
      {
        name: "description",
        content:
          "Tu primera clase, tu primera banda y un sitio para tocar. Encuentra profes, escuelas y locales cerca de ti.",
      },
      { property: "og:title", content: "¿Con quién quieres tocar? — ¿tocamos?" },
      {
        property: "og:description",
        content: "Explora profes, escuelas, bandas y locales para empezar a tocar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(profesQuery),
      context.queryClient.ensureQueryData(localesQuery),
    ]),
  component: Explorar,
});

function TeacherCard({ p, open, toggle }: { p: ProfePublico; open: boolean; toggle: () => void }) {
  const track = p.esEscuela ? "escuelas" : "profes";
  return (
    <CassetteCard
      track={track}
      label={
        p.esEscuela
          ? "Escuela de música"
          : `Profe${p.instrumentos[0] ? ` de ${p.instrumentos[0]}` : " particular"}`
      }
      price={precioHora(p.precio)}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center border-[3px] font-display text-3xl ${p.esEscuela ? "rounded-[20px]" : "rounded-full"} ${tracks[track].tint} ${tracks[track].ring}`}
        >
          {p.nombre.charAt(0)}
        </div>
        <div className="min-w-0">
          <h2 className="break-words text-[26px] leading-tight">{p.nombre}</h2>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {[p.zona, p.ciudad].filter(Boolean).join(", ") || "Zona no indicada"}
          </p>
          {p.verificado && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-venue-tint px-2 py-1 text-xs">
              <BadgeCheck className="h-4 w-4" />
              Verificada
            </span>
          )}
        </div>
      </div>
      {(p.titular || p.bio) && (
        <p className="cassette-quote mt-5 flex items-start text-[17px] font-medium leading-relaxed">
          {p.titular || p.bio}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {[...p.instrumentos, ...p.estilos].map((s) => (
          <span key={s} className={`rounded-full px-3 py-1 text-xs ${tracks[track].tint}`}>
            {s}
          </span>
        ))}
      </div>
      <Button variant="link" className="mt-4 px-0" aria-expanded={open} onClick={toggle}>
        {open ? "Ver menos" : "Ver más"}
        {open ? <ChevronUp /> : <ChevronDown />}
      </Button>
      {open && (
        <div className="mt-4 space-y-5 border-t border-dotted pt-4">
          <ol className="space-y-3 text-sm">
            {[
              p.niveles.map((n) => niveles[n]).join(" · "),
              p.modalidades.map((m) => modalidades[m]).join(" · "),
              p.anios > 0 ? `${p.anios} años acompañando a alumnos` : "",
              p.bio,
            ]
              .filter(Boolean)
              .map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
          </ol>
          <Button asChild variant="primary">
            <Link to="/profe/$id" params={{ id: p.id }}>
              {p.esEscuela ? "Pedir información" : "Ver perfil y horarios"}
            </Link>
          </Button>
        </div>
      )}
      <SpotifyPie artistas={p.artistas} playlists={p.playlists} />
    </CassetteCard>
  );
}

function Explorar() {
  const search = Route.useSearch(),
    navigate = Route.useNavigate();
  const { data: profes } = useSuspenseQuery(profesQuery),
    { data: locales } = useSuspenseQuery(localesQuery);
  const [instrumento, setInstrumento] = useState(search.instrumento),
    [donde, setDonde] = useState(search.donde);
  const [nivel, setNivel] = useState(""),
    [modalidad, setModalidad] = useState(""),
    [uso, setUso] = useState(""),
    [gratis, setGratis] = useState(false);
  const [view, setView] = useState("lista"),
    [opened, setOpened] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null),
    [status, setStatus] = useState("");
  const track = search.pista;
  const selectLocal = useCallback((id: string) => setOpened(id), []);
  const choose = (pista: Track) => {
    setNivel("");
    setModalidad("");
    setUso("");
    setGratis(false);
    setOpened(null);
    setView("lista");
    navigate({ search: { ...search, pista } });
  };
  function near() {
    if (!navigator.geolocation) {
      setStatus("Tu navegador no permite compartir ubicación.");
      return;
    }
    setStatus("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStatus(
          track === "locales"
            ? "Locales ordenados por distancia."
            : "Los profes aún no tienen coordenadas públicas. Busca por ciudad o zona.",
        );
      },
      () => setStatus("No pudimos obtener tu ubicación. Revisa los permisos del navegador."),
      { timeout: 10000 },
    );
  }

  const teachers = profes.filter(
    (p) =>
      p.esEscuela === (track === "escuelas") &&
      matchesSearch(p.instrumentos, search.instrumento) &&
      matchesSearch([p.ciudad, p.zona], search.donde) &&
      (!nivel || p.niveles.includes(nivel as "inicial" | "intermedio")) &&
      (!modalidad || p.modalidades.includes(modalidad as "presencial" | "online" | "domicilio")),
  );
  const venues = locales
    .filter(
      (l) =>
        matchesSearch([l.nombre, l.ciudad], search.donde) && matchesVenueFilters(l, uso, gratis),
    )
    .map((l) => ({
      l,
      d:
        position && l.lat != null && l.lng != null
          ? distanciaKm(position, { lat: l.lat, lng: l.lng })
          : null,
    }))
    .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
  const count = track === "bandas" ? 0 : track === "locales" ? venues.length : teachers.length;
  const clear = () => {
    setInstrumento("");
    setDonde("");
    setNivel("");
    setModalidad("");
    setUso("");
    setGratis(false);
    navigate({ search: { pista: track, instrumento: "", donde: "" } });
  };
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-width py-10 md:py-14">
        <p className="handwritten">
          {track === "profes" || track === "escuelas"
            ? "Cara A · empieza por una canción"
            : "Cara B · mejor en compañía"}
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl">¿Con quién quieres tocar?</h1>
        <div
          role="tablist"
          aria-label="Qué buscas"
          className="mt-8 flex flex-col gap-4 md:flex-row"
        >
          {[
            ["profes", "escuelas"],
            ["bandas", "locales"],
          ].map((group, i) => (
            <div
              key={i}
              className="flex flex-1 flex-wrap items-center gap-2 rounded-[24px] bg-muted p-3"
            >
              <span className="w-full px-2 text-xs font-bold">
                CARA {i === 0 ? "A · APRENDER" : "B · TOCAR CON OTROS"}
              </span>
              {group.map((t) => {
                const key = t as Track;
                return (
                  <Button
                    role="tab"
                    aria-selected={track === key}
                    key={key}
                    variant="ghost"
                    onClick={() => choose(key)}
                    className={`flex-1 justify-start ${track === key ? `${tracks[key].tint} border border-foreground` : ""}`}
                  >
                    <TrackCode track={key} />
                    {tracks[key].name}
                    <span className="ml-auto text-xs">
                      {track === key
                        ? count
                        : key === "bandas"
                          ? 0
                          : key === "locales"
                            ? locales.length
                            : profes.filter((p) => p.esEscuela === (key === "escuelas")).length}
                    </span>
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { ...search, instrumento, donde } });
          }}
          className="mt-8 flex flex-col items-end gap-4 md:flex-row"
        >
          {track !== "locales" && (
            <div className="w-full flex-1">
              <Label htmlFor="explore-instrument">
                {track === "escuelas"
                  ? "¿Qué quieres aprender?"
                  : track === "bandas"
                    ? "¿Qué tocas?"
                    : "¿Qué quieres tocar?"}
              </Label>
              <Input
                id="explore-instrument"
                value={instrumento}
                onChange={(e) => setInstrumento(e.target.value)}
                placeholder="Instrumento"
                className="mt-2"
              />
            </div>
          )}
          <div className="w-full flex-1">
            <Label htmlFor="explore-city">Dónde</Label>
            <Input
              id="explore-city"
              value={donde}
              onChange={(e) => setDonde(e.target.value)}
              placeholder="Ciudad o zona"
              className="mt-2"
            />
          </div>
          <Button type="submit" variant="secondary" className="min-h-[52px]">
            Buscar
          </Button>
          <Button type="button" variant="link" onClick={near}>
            <LocateFixed />
            Cerca de mí
          </Button>
        </form>
        {status && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {status}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {(track === "profes" || track === "escuelas") && (
            <>
              {["inicial", "intermedio"].map((n) => (
                <FilterChip
                  key={n}
                  track={track}
                  active={nivel === n}
                  onClick={() => setNivel(nivel === n ? "" : n)}
                >
                  {niveles[n]}
                </FilterChip>
              ))}
              {(track === "profes" ? ["presencial", "domicilio", "online"] : ["online"]).map(
                (m) => (
                  <FilterChip
                    key={m}
                    track={track}
                    active={modalidad === m}
                    onClick={() => setModalidad(modalidad === m ? "" : m)}
                  >
                    {modalidades[m]}
                  </FilterChip>
                ),
              )}
            </>
          )}
          {track === "locales" && (
            <>
              {[
                ["ensayo", "Ensayar"],
                ["jams", "Jams"],
                ["conciertos", "Conciertos"],
              ].map(
                ([id, label]) =>
                  id && (
                    <FilterChip
                      key={id}
                      track={track}
                      active={uso === id}
                      onClick={() => setUso(uso === id ? "" : id)}
                    >
                      {label}
                    </FilterChip>
                  ),
              )}
              <FilterChip track={track} active={gratis} onClick={() => setGratis(!gratis)}>
                Gratis
              </FilterChip>
            </>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-dotted pt-5">
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? "resultado" : "resultados"} · {tracks[track].name}
          </p>
          {track === "locales" && (
            <div className="flex rounded-full bg-muted p-1" aria-label="Vista de resultados">
              <Button
                variant="ghost"
                aria-pressed={view === "lista"}
                onClick={() => setView("lista")}
                className={view === "lista" ? "bg-card" : ""}
              >
                <List />
                Lista
              </Button>
              <Button
                variant="ghost"
                aria-pressed={view === "mapa"}
                onClick={() => setView("mapa")}
                className={view === "mapa" ? "bg-card" : ""}
              >
                <Map />
                Mapa
              </Button>
            </div>
          )}
        </div>
        {count === 0 ? (
          <div className="py-16 text-center">
            <TrackCode track={track} />
            <h2 className="mt-5 text-3xl">
              {track === "bandas" ? "Pronto podrás encontrar banda aquí" : "Silencio en la sala…"}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              {track === "bandas"
                ? "Mientras tanto, empieza a tocar con un profe o encuentra un sitio para ensayar."
                : "Prueba con otra zona o amplía tu búsqueda."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {track !== "bandas" && (
                <Button variant="secondary" onClick={clear}>
                  Borrar filtros
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => choose(track === "profes" ? "locales" : "profes")}
              >
                {track === "profes" ? "Ver locales" : "Ver profes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            {track === "locales" && view === "mapa" && (
              <DirectoryMap
                locales={venues.map((v) => v.l)}
                position={position}
                onSelect={selectLocal}
              />
            )}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {track === "locales"
                ? venues.map(({ l, d }) => (
                    <CassetteCard
                      key={l.id}
                      track="locales"
                      label={l.tipos[0] || "Local"}
                      price={precioHora(l.precio)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border-[3px] border-venue bg-venue-tint font-display text-3xl">
                          {l.nombre.charAt(0)}
                        </div>
                        <div>
                          <h2 className="break-words text-[26px]">{l.nombre}</h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {l.ciudad}
                            {d != null && ` · ${d.toFixed(1)} km`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {[...l.tipos, l.jams && "Jams", l.conciertos && "Conciertos"]
                          .filter(Boolean)
                          .map((t) => (
                            <span
                              key={String(t)}
                              className="rounded-full bg-venue-tint px-3 py-1 text-xs"
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                      <Button
                        variant="link"
                        className="mt-4 px-0"
                        aria-expanded={opened === l.id}
                        onClick={() => setOpened(opened === l.id ? null : l.id)}
                      >
                        {opened === l.id ? "Ver menos" : "Ver más"}
                        <ChevronDown />
                      </Button>
                      {opened === l.id && (
                        <div className="mt-4 border-t border-dotted pt-4">
                          <p className="mb-4 text-sm">
                            {l.jams
                              ? "01 · Organiza jams"
                              : "01 · Consulta la disponibilidad con el local"}
                            {l.conciertos && " · Organiza conciertos"}
                          </p>
                          <ReservarDialog
                            anfitrionId={l.id}
                            nombre={l.nombre}
                            precio={l.precio}
                            tipo="ensayo"
                          />
                        </div>
                      )}
                    </CassetteCard>
                  ))
                : teachers.map((p) => (
                    <TeacherCard
                      key={p.id}
                      p={p}
                      open={opened === p.id}
                      toggle={() => setOpened(opened === p.id ? null : p.id)}
                    />
                  ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
