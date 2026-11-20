import { useEffect, useRef, useState } from "react";
import type { LocalPublico } from "@/lib/directory";
import { precioHora } from "@/lib/directory";
declare global {
  interface Window {
    __initLocalesMap?: () => void;
    google?: any;
    gm_authFailure?: () => void;
  }
}
let mapsPromise: Promise<void> | undefined;
function loadMaps() {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    window.__initLocalesMap = resolve;
    const env = import.meta.env as Record<string, string | undefined>;
    const script = document.createElement("script");
    script.id = "gmaps-js";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&loading=async&callback=__initLocalesMap&language=es&region=ES&channel=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"]}`;
    script.onerror = () => {
      mapsPromise = undefined;
      script.remove();
      reject(new Error("maps"));
    };
    document.head.appendChild(script);
  });
  return mapsPromise;
}
export function DirectoryMap({
  locales,
  position,
  onSelect,
}: {
  locales: LocalPublico[];
  position: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const markers: any[] = [];
    let map: any;
    let info: any;
    window.gm_authFailure = () => {
      if (!cancelled) setError(true);
    };
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google?.maps) return;
        const g = window.google.maps;
        map = new g.Map(ref.current, {
          center: position ?? { lat: 40.4168, lng: -3.7038 },
          zoom: position ? 12 : 6,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
        });
        const bounds = new g.LatLngBounds();
        const css = getComputedStyle(document.documentElement);
        info = new g.InfoWindow();
        locales.forEach((l) => {
          if (l.lat == null || l.lng == null) return;
          const marker = new g.Marker({
            map,
            title: l.nombre,
            position: { lat: l.lat, lng: l.lng },
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: css.getPropertyValue("--venue").trim(),
              fillOpacity: 1,
              strokeColor: css.getPropertyValue("--foreground").trim(),
              strokeWeight: 2,
            },
          });
          bounds.extend({ lat: l.lat, lng: l.lng });
          markers.push(marker);
          marker.addListener("click", () => {
            const el = document.createElement("div");
            el.className = "space-y-2 p-2 font-sans text-foreground";
            const name = document.createElement("strong");
            name.textContent = l.nombre;
            const type = document.createElement("p");
            type.textContent = l.tipos.join(" · ");
            const price = document.createElement("p");
            price.textContent = precioHora(l.precio);
            const events = document.createElement("p");
            events.textContent = [l.jams && "Organiza jams", l.conciertos && "Organiza conciertos"]
              .filter(Boolean)
              .join(" · ");
            el.append(name, type, price, events);
            info.setContent(el);
            info.open({ map, anchor: marker });
            onSelect(l.id);
          });
        });
        if (!position && markers.length) {
          map.fitBounds(bounds);
          if (markers.length === 1) g.event.addListenerOnce(map, "idle", () => map.setZoom(14));
        }
        if (position) markers.push(new g.Marker({ map, position, title: "Estás aquí" }));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      info?.close();
      markers.forEach((m) => {
        window.google?.maps?.event.clearInstanceListeners(m);
        m.setMap(null);
      });
      if (map) window.google?.maps?.event.clearInstanceListeners(map);
    };
  }, [locales, position, onSelect]);
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-border bg-muted">
      {error && (
        <p role="status" className="absolute inset-0 z-10 grid place-items-center bg-muted p-6 text-center">
          No se pudo cargar el mapa. Puedes consultar los locales en la lista.
        </p>
      )}
      <div ref={ref} className="h-[520px] w-full" aria-label="Mapa de locales" />
    </div>
  );
}
