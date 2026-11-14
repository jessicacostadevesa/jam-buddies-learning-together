import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/spotify-callback")({
  head: () => ({ meta: [
    { title: "Conexión de Spotify — ¿tocamos?" },
    { name: "description", content: "Confirmación de tu conexión voluntaria con Spotify." },
    { property: "og:title", content: "Conexión de Spotify — ¿tocamos?" },
    { property: "og:description", content: "Selecciona los artistas que quieres añadir a tu perfil." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Callback,
});
function Callback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState(null, "", window.location.pathname);
    if (window.opener) {
      const message = { type: "spotify-complete", code: params.get("code"), state: params.get("state") };
      for (const origin of ["https://jam-buddies-learning-together.lovable.app", "https://id-preview--e74998d4-3e02-4ef4-b041-3e4df088f7c1.lovable.app"]) window.opener.postMessage(message, origin);
      window.close();
    }
  }, []);
  return <main className="mx-auto max-w-lg px-5 py-16"><h1 className="text-2xl font-bold">Conexión de Spotify</h1><p className="mt-3 text-muted-foreground">Puedes volver a la ventana de tu perfil.</p></main>;
}