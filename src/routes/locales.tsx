import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { listarLocales } from "@/lib/locales.functions";
import { distanciaKm } from "@/lib/distancia";

const localesQuery = queryOptions({ queryKey: ["locales-mapa"], queryFn: () => listarLocales() });
type Local = Awaited<ReturnType<typeof listarLocales>>[number];

export const Route = createFileRoute("/locales")({
  head: () => ({
    meta: [
      { title: "Mapa de locales para ensayar y tocar — Tocamos" },
      { name: "description", content: "Locales de ensayo, bares y salas con jams y conciertos para bandas que empiezan." },
      { property: "og:title", content: "Mapa de locales para ensayar y tocar — Tocamos" },
      { property: "og:description", content: "Encuentra dónde ensayar y dónde tocar en directo cerca de ti." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(localesQuery),
  component: LocalesPage,
});

declare global {
  interface Window { __initLocalesMap?: () => void; google?: any }
}

function cargarMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.__initLocalesMap = () => resolve();
    if (document.getElementById("gmaps-js")) return;
    const env = import.meta.env as Record<string, string | undefined>;
    const s = document.createElement("script");
    s.id = "gmaps-js";
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&loading=async&callback=__initLocalesMap&language=es&region=ES&channel=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"]}`;
    s.onerror = () => reject(new Error("maps"));
    document.head.appendChild(s);
  });
}

const fmtPrecio = (p: number | null) => (p != null ? `${Number(p).toLocaleString("es-ES")} €/hora` : "Precio a consultar");

function ficha(l: Local) {
  const el = document.createElement("div");
  el.style.cssText = "font-family:Figtree,sans-serif;max-width:240px;color:#1a1a1a";
  const h = document.createElement("strong"); h.textContent = l.nombre || "Local"; h.style.fontSize = "16px";
  const t = document.createElement("div"); t.textContent = l.tipos?.length ? l.tipos.join(" · ") : "Local";
  const p = document.createElement("div"); p.textContent = fmtPrecio(l.precio);
  const e = document.createElement("div");
  e.textContent = [l.jams && "🎸 Organiza jams", l.conciertos && "🎤 Organiza conciertos"].filter(Boolean).join("  ") || "Sin jams ni conciertos";
  [t, p, e].forEach((x) => (x.style.marginTop = "4px"));
  el.append(h, t, p, e);
  return el;
}

function LocalesPage() {
  const { data } = useSuspenseQuery(localesQuery);
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());
  const info = useRef<any>(null);
  const [yo, setYo] = useState<{ lat: number; lng: number } | null>(null);
  const [estado, setEstado] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    cargarMaps().then(() => {
      if (cancel || !mapDiv.current) return;
      const g = window.google.maps;
      const map = new g.Map(mapDiv.current, { center: { lat: 40.2, lng: -3.7 }, zoom: 6, clickableIcons: false, streetViewControl: false, mapTypeControl: false });
      mapRef.current = map;
      info.current = new g.InfoWindow();
      const bounds = new g.LatLngBounds();
      data.forEach((l) => {
        if (l.lat == null || l.lng == null) return;
        const m = new g.Marker({ position: { lat: l.lat, lng: l.lng }, map, title: l.nombre });
        m.addListener("click", () => { info.current.setContent(ficha(l)); info.current.open({ map, anchor: m }); });
        markers.current.set(l.id, m);
        bounds.extend({ lat: l.lat, lng: l.lng });
      });
      if (data.length > 1) map.fitBounds(bounds); else if (data[0]?.lat != null) { map.setCenter({ lat: data[0].lat, lng: data[0].lng! }); map.setZoom(13); }
    }).catch(() => setEstado("No se pudo cargar el mapa."));
    return () => { cancel = true; markers.current.forEach((m) => m.setMap(null)); markers.current.clear(); };
  }, [data]);

  function cercanos() {
    if (!navigator.geolocation) { setEstado("Tu navegador no permite compartir ubicación."); return; }
    setEstado("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setYo(p); setEstado(null);
        const g = window.google?.maps, map = mapRef.current;
        if (!g || !map) return;
        new g.Marker({ position: p, map, title: "Estás aquí", icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: "#14b8a6", fillOpacity: 1, strokeColor: "#1a1a1a", strokeWeight: 2 } });
        map.setCenter(p); map.setZoom(12);
      },
      () => setEstado("No pudimos obtener tu ubicación. Revisa los permisos del navegador."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const lista = yo
    ? [...data].map((l) => ({ l, d: distanciaKm(yo, { lat: l.lat!, lng: l.lng! }) })).sort((a, b) => a.d - b.d)
    : data.map((l) => ({ l, d: null as number | null }));

  function abrir(l: Local) {
    const m = markers.current.get(l.id), map = mapRef.current;
    if (!m || !map) return;
    map.panTo(m.getPosition()); map.setZoom(14);
    window.google.maps.event.trigger(m, "click");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">Dónde ensayar y tocar</h1>
            <p className="mt-2 text-muted-foreground">Locales de ensayo, bares y salas que abren la puerta a bandas que empiezan.</p>
          </div>
          <Button variant="pop" onClick={cercanos}><LocateFixed className="h-4 w-4" /> Locales cerca de mí</Button>
        </div>
        {estado && <p className="mt-4 text-sm text-muted-foreground">{estado}</p>}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div ref={mapDiv} className="card-pop h-[520px] overflow-hidden" aria-label="Mapa de locales" />
          <aside className="space-y-3 lg:max-h-[520px] lg:overflow-y-auto">
            {lista.length === 0 && <p className="text-muted-foreground">Aún no hay locales en el mapa.</p>}
            {lista.map(({ l, d }) => (
              <button key={l.id} type="button" onClick={() => abrir(l)} className="card-pop block w-full p-4 text-left">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold">{l.nombre || "Local"}</h2>
                  {d != null && <span className="shrink-0 rounded-full border-2 border-ink bg-secondary px-2 text-xs font-semibold">{d.toFixed(1)} km</span>}
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{l.ciudad || "—"}</p>
                <p className="mt-1 text-sm">{fmtPrecio(l.precio)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {l.jams && <span className="rounded-full border-2 border-ink bg-accent px-2 text-xs font-semibold">Jams</span>}
                  {l.conciertos && <span className="rounded-full border-2 border-ink bg-primary px-2 text-xs font-semibold text-primary-foreground">Conciertos</span>}
                </div>
              </button>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
