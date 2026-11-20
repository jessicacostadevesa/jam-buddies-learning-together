import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Music2, ListMusic, ExternalLink, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  spotifyConfigurado,
  iniciarSpotify,
  consultarArtistasSpotify,
} from "@/lib/spotify.functions";
import { artistasElegidos, type ArtistaSpotify, type PlaylistSpotify } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const spotifyQuery = (uid: string) =>
  queryOptions({
    queryKey: ["spotify-gustos", uid],
    queryFn: async () => {
      const [a, l, config] = await Promise.all([
        supabase
          .from("perfil_spotify_artistas")
          .select("spotify_id,nombre,imagen_url,ejemplo")
          .eq("perfil_id", uid)
          .order("nombre"),
        supabase
          .from("perfil_spotify_playlists")
          .select("spotify_id,nombre,imagen_url,total_canciones,ejemplo")
          .eq("perfil_id", uid)
          .order("nombre"),
        spotifyConfigurado(),
      ]);
      if (a.error) throw a.error;
      if (l.error) throw l.error;
      return { artistas: a.data ?? [], playlists: l.data ?? [], ...config };
    },
  });

function Miniatura({
  src,
  cuadrada,
  size = "h-8 w-8",
}: {
  src: string | null;
  cuadrada?: boolean;
  size?: string;
}) {
  const forma = cuadrada ? "rounded-md" : "rounded-full";
  return src ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`${size} ${forma} shrink-0 border border-border object-cover`}
    />
  ) : (
    <span
      className={`${size} ${forma} flex shrink-0 items-center justify-center border border-border bg-secondary`}
    >
      {cuadrada ? <ListMusic className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
    </span>
  );
}

export function SpotifyGustos({ uid }: { uid: string }) {
  const { data } = useSuspenseQuery(spotifyQuery(uid));
  const qc = useQueryClient();
  const [candidatos, setCandidatos] = useState<ArtistaSpotify[]>([]);
  const [listas, setListas] = useState<PlaylistSpotify[]>([]);
  const [selA, setSelA] = useState<string[]>([]);
  const [selL, setSelL] = useState<string[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["spotify-gustos", uid] });

  async function conectar() {
    const popup = window.open("", "tocamos-spotify", "width=600,height=720");
    if (!popup) {
      toast.error("Permite ventanas emergentes para conectar Spotify");
      return;
    }
    setOcupado(true);
    try {
      const { url } = await iniciarSpotify();
      const result = new Promise<{ code: string; state: string }>((resolve, reject) => {
        const clean = () => {
          window.removeEventListener("message", recibir);
          clearInterval(poll);
          clearTimeout(timeout);
        };
        const recibir = (event: MessageEvent) => {
          if (
            event.origin !== "https://jam-buddies-learning-together.lovable.app" ||
            event.source !== popup ||
            event.data?.type !== "spotify-complete"
          )
            return;
          clean();
          if (typeof event.data.code === "string" && typeof event.data.state === "string")
            resolve({ code: event.data.code, state: event.data.state });
          else reject(new Error("No has autorizado la conexión con Spotify"));
        };
        window.addEventListener("message", recibir);
        const poll = window.setInterval(() => {
          if (popup.closed) {
            clean();
            reject(new Error("Conexión cancelada"));
          }
        }, 500);
        const timeout = window.setTimeout(() => {
          clean();
          reject(new Error("La conexión ha caducado"));
        }, 600000);
      });
      popup.location.href = url;
      const payload = await result;
      const res = await consultarArtistasSpotify({ data: payload });
      setCandidatos(res.artistas);
      setListas(res.playlists);
      setSelA([]);
      setSelL([]);
      setAbierto(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conectar Spotify");
    } finally {
      popup.close();
      setOcupado(false);
    }
  }
  async function guardar() {
    const a = artistasElegidos(candidatos, selA);
    const l = listas.filter((p) => selL.includes(p.spotify_id));
    if (!a.length && !l.length) return;
    setOcupado(true);
    const [ra, rl] = await Promise.all([
      a.length
        ? supabase
            .from("perfil_spotify_artistas")
            .upsert(a.map((x) => ({ ...x, perfil_id: uid, ejemplo: false })))
        : { error: null },
      l.length
        ? supabase
            .from("perfil_spotify_playlists")
            .upsert(l.map((x) => ({ ...x, perfil_id: uid, ejemplo: false })))
        : { error: null },
    ]);
    setOcupado(false);
    if (ra.error || rl.error) {
      toast.error("No se pudo guardar tu selección");
      return;
    }
    setAbierto(false);
    await refresh();
    toast.success("Selección guardada");
  }
  async function quitar(tabla: "perfil_spotify_artistas" | "perfil_spotify_playlists", id: string) {
    const { error } = await supabase.from(tabla).delete().eq("perfil_id", uid).eq("spotify_id", id);
    if (error) toast.error("No se pudo quitar");
    else await refresh();
  }
  const total = selA.length + selL.length;
  return (
    <section className="border-y border-dotted py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Music2 className="h-5 w-5 text-foreground" /> Tu música de Spotify
        </h2>
        <span className="text-sm text-muted-foreground">
          Opcional · Se verá al pie de tu tarjeta
        </span>
      </div>
      {(data.artistas.some((a) => a.ejemplo) || data.playlists.some((p) => p.ejemplo)) && (
        <p className="mt-2 text-sm text-muted-foreground">
          Selección de ejemplo, no importada de una cuenta real.
        </p>
      )}

      <h3 className="mt-4 text-sm font-bold">Artistas que te gustan</h3>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {data.artistas.map((a) => (
          <li
            key={a.spotify_id}
            className="flex min-w-0 items-center gap-2 border-b border-border py-2"
          >
            <Miniatura src={a.imagen_url} />
            <a
              className="min-w-0 flex-1 break-words font-semibold hover:underline"
              href={`https://open.spotify.com/artist/${a.spotify_id}`}
              target="_blank"
              rel="noreferrer"
            >
              {a.nombre} <ExternalLink className="inline h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Quitar ${a.nombre}`}
              onClick={() => quitar("perfil_spotify_artistas", a.spotify_id)}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
      {data.artistas.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Sin artistas seleccionados.</p>
      )}

      <h3 className="mt-5 text-sm font-bold">Tus listas</h3>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {data.playlists.map((p) => (
          <li
            key={p.spotify_id}
            className="flex min-w-0 items-center gap-2 border-b border-border py-2"
          >
            <Miniatura src={p.imagen_url} cuadrada size="h-10 w-10" />
            <a
              className="min-w-0 flex-1 break-words font-semibold hover:underline"
              href={`https://open.spotify.com/playlist/${p.spotify_id}`}
              target="_blank"
              rel="noreferrer"
            >
              {p.nombre} <ExternalLink className="inline h-3 w-3" />
              {p.total_canciones != null && (
                <span className="block text-xs font-normal text-muted-foreground">
                  {p.total_canciones} canciones
                </span>
              )}
            </a>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Quitar ${p.nombre}`}
              onClick={() => quitar("perfil_spotify_playlists", p.spotify_id)}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
      {data.playlists.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Sin listas seleccionadas.</p>
      )}

      <Button
        className="mt-4"
        variant="ink"
        disabled={!data.configurado || ocupado}
        onClick={conectar}
      >
        {ocupado ? <Loader2 className="animate-spin" /> : <Music2 />} Conectar Spotify
      </Button>
      {!data.configurado && (
        <p className="mt-3 text-sm text-muted-foreground">Conexión pendiente de configurar.</p>
      )}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Elige qué mostrar</DialogTitle>
            <DialogDescription>
              Solo guardaremos lo que marques. Tus escuchas no se guardan.
            </DialogDescription>
          </DialogHeader>
          <h3 className="font-bold">Artistas</h3>
          {candidatos.length === 0 && (
            <p className="text-sm">Spotify aún no tiene artistas escuchados para mostrar.</p>
          )}
          {candidatos.map((a) => (
            <label
              key={a.spotify_id}
              className="flex items-center gap-3 border-b border-border py-2"
            >
              <Checkbox
                checked={selA.includes(a.spotify_id)}
                onCheckedChange={(on) =>
                  setSelA((ids) =>
                    on ? [...ids, a.spotify_id] : ids.filter((id) => id !== a.spotify_id),
                  )
                }
              />
              <Miniatura src={a.imagen_url} />
              {a.nombre}
            </label>
          ))}
          <h3 className="mt-3 font-bold">Listas</h3>
          {listas.length === 0 && (
            <p className="text-sm">No hemos encontrado listas en tu Spotify.</p>
          )}
          {listas.map((p) => (
            <label
              key={p.spotify_id}
              className="flex items-center gap-3 border-b border-border py-2"
            >
              <Checkbox
                checked={selL.includes(p.spotify_id)}
                onCheckedChange={(on) =>
                  setSelL((ids) =>
                    on ? [...ids, p.spotify_id] : ids.filter((id) => id !== p.spotify_id),
                  )
                }
              />
              <Miniatura src={p.imagen_url} cuadrada size="h-10 w-10" />
              {p.nombre}
            </label>
          ))}
          <Button variant="secondary" onClick={guardar} disabled={!total || ocupado}>
            Guardar selección ({total})
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
