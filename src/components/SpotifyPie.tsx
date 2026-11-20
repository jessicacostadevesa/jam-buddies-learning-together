import { Music2, ListMusic } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
type Selection = { spotify_id: string; nombre: string; imagen_url: string | null };
function selections(value: Json): Selection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      typeof item["spotify_id"] !== "string" ||
      typeof item["nombre"] !== "string"
    )
      return [];
    return [
      {
        spotify_id: item["spotify_id"],
        nombre: item["nombre"],
        imagen_url: typeof item["imagen_url"] === "string" ? item["imagen_url"] : null,
      },
    ];
  });
}
export function SpotifyPie({ artistas, playlists }: { artistas: Json; playlists: Json }) {
  const a = selections(artistas),
    p = selections(playlists);
  if (!a.length && !p.length) return null;
  return (
    <div className="mt-6 space-y-3 border-t border-dotted pt-4 text-xs text-muted-foreground">
      {[
        { title: "Le gusta", items: a, kind: "artist", Icon: Music2 },
        { title: "Sus listas", items: p, kind: "playlist", Icon: ListMusic },
      ].map(
        ({ title, items, kind, Icon }) =>
          items.length > 0 && (
            <div key={kind} className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Icon className="h-4 w-4" />
                {title}
              </span>
              {items.slice(0, 4).map((item) => (
                <a
                  key={item.spotify_id}
                  href={`https://open.spotify.com/${kind}/${item.spotify_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  {item.imagen_url && (
                    <img
                      src={item.imagen_url}
                      alt=""
                      loading="lazy"
                      className={
                        kind === "artist"
                          ? "h-6 w-6 rounded-full object-cover"
                          : "h-6 w-6 rounded-md object-cover"
                      }
                    />
                  )}
                  {item.nombre}
                </a>
              ))}
              {items.length > 4 && <span>+{items.length - 4}</span>}
            </div>
          ),
      )}
    </div>
  );
}
