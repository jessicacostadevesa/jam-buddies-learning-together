import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Music2, ExternalLink, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { spotifyConfigurado, iniciarSpotify, consultarArtistasSpotify } from "@/lib/spotify.functions";
import { artistasElegidos, type ArtistaSpotify } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const spotifyQuery = (uid: string) => queryOptions({ queryKey: ["spotify-gustos", uid], queryFn: async () => {
  const [{ data, error }, config] = await Promise.all([supabase.from("perfil_spotify_artistas").select("spotify_id,nombre,ejemplo").eq("perfil_id", uid), spotifyConfigurado()]);
  if (error) throw error;
  return { artistas: data ?? [], ...config };
} });

export function SpotifyGustos({ uid }: { uid: string }) {
  const { data } = useSuspenseQuery(spotifyQuery(uid));
  const qc = useQueryClient();
  const [candidatos, setCandidatos] = useState<ArtistaSpotify[]>([]);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["spotify-gustos", uid] });

  async function conectar() {
    const popup = window.open("", "tocamos-spotify", "width=600,height=720");
    if (!popup) { toast.error("Permite ventanas emergentes para conectar Spotify"); return; }
    setOcupado(true);
    try {
      const { url } = await iniciarSpotify();
      const result = new Promise<{ code: string; state: string }>((resolve, reject) => {
        const clean = () => { window.removeEventListener("message", recibir); clearInterval(poll); clearTimeout(timeout); };
        const recibir = (event: MessageEvent) => {
          if (event.origin !== "https://jam-buddies-learning-together.lovable.app" || event.source !== popup || event.data?.type !== "spotify-complete") return;
          clean();
          if (typeof event.data.code === "string" && typeof event.data.state === "string") resolve({ code: event.data.code, state: event.data.state });
          else reject(new Error("No has autorizado la conexión con Spotify"));
        };
        window.addEventListener("message", recibir);
        const poll = window.setInterval(() => { if (popup.closed) { clean(); reject(new Error("Conexión cancelada")); } }, 500);
        const timeout = window.setTimeout(() => { clean(); reject(new Error("La conexión ha caducado")); }, 600000);
      });
      popup.location.href = url;
      const payload = await result;
      const artistas = await consultarArtistasSpotify({ data: payload });
      setCandidatos(artistas); setSeleccion([]); setAbierto(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo conectar Spotify"); }
    finally { popup.close(); setOcupado(false); }
  }
  async function guardar() {
    const elegidos = artistasElegidos(candidatos, seleccion);
    if (!elegidos.length) return;
    setOcupado(true);
    const { error } = await supabase.from("perfil_spotify_artistas").upsert(elegidos.map((a) => ({ ...a, perfil_id: uid, ejemplo: false })));
    setOcupado(false);
    if (error) { toast.error("No se pudieron guardar tus artistas"); return; }
    setAbierto(false); await refresh(); toast.success("Artistas elegidos guardados");
  }
  async function quitar(id: string) {
    const { error } = await supabase.from("perfil_spotify_artistas").delete().eq("perfil_id", uid).eq("spotify_id", id);
    if (error) toast.error("No se pudo quitar el artista"); else await refresh();
  }
  return <section className="border-y-2 border-ink py-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Music2 className="h-5 w-5 text-accent" /> Tu música de Spotify</h2>
      <span className="text-sm text-muted-foreground">Opcional · Solo tú</span>
    </div>
    {data.artistas.some((a) => a.ejemplo) && <p className="mt-2 text-sm text-muted-foreground">Selección de ejemplo, no importada de una cuenta real.</p>}
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {data.artistas.map((a) => <li key={a.spotify_id} className="flex min-w-0 items-center gap-2 border-b border-border py-2">
        <Music2 className="h-4 w-4 shrink-0 text-accent" />
        <a className="min-w-0 flex-1 break-words font-semibold hover:underline" href={`https://open.spotify.com/artist/${a.spotify_id}`} target="_blank" rel="noreferrer">{a.nombre} <ExternalLink className="inline h-3 w-3" /></a>
        <Button variant="ghost" size="icon" title={`Quitar ${a.nombre}`} aria-label={`Quitar ${a.nombre}`} onClick={() => quitar(a.spotify_id)}><X /></Button>
      </li>)}
    </ul>
    {data.artistas.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Sin artistas seleccionados.</p>}
    <Button className="mt-4" variant="ink" disabled={!data.configurado || ocupado} onClick={conectar}>{ocupado ? <Loader2 className="animate-spin" /> : <Music2 />} Conectar Spotify</Button>
    {!data.configurado && <p className="mt-3 text-sm text-muted-foreground">Conexión pendiente de configurar.</p>}
    <Dialog open={abierto} onOpenChange={setAbierto}><DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>Elige tus artistas</DialogTitle><DialogDescription>Solo guardaremos los que marques. Tus escuchas no se guardan.</DialogDescription></DialogHeader>
      {candidatos.length === 0 && <p>Spotify aún no tiene artistas escuchados para mostrar.</p>}
      {candidatos.map((a) => <label key={a.spotify_id} className="flex items-center gap-3 border-b border-border py-2"><Checkbox checked={seleccion.includes(a.spotify_id)} onCheckedChange={(on) => setSeleccion((ids) => on ? [...ids, a.spotify_id] : ids.filter((id) => id !== a.spotify_id))} />{a.nombre}</label>)}
      <Button variant="pop" onClick={guardar} disabled={!seleccion.length || ocupado}>Guardar selección ({seleccion.length})</Button>
    </DialogContent></Dialog>
  </section>;
}