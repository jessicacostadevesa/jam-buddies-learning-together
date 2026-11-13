import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listarProfes = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [det, ver] = await Promise.all([
    sb.from("profesor_detalles").select(
      "perfil_id, es_escuela, titular, anios_ensenando, niveles_alumnos, modalidades, precio_hora, estilos_otros, perfiles(nombre, ciudad, zona, bio, foto_url, perfil_instrumentos(instrumentos(nombre)), perfil_estilos(estilos(nombre)))",
    ),
    sb.from("profesor_verificacion").select("perfil_id, verificado"),
  ]);
  if (det.error) throw new Error(det.error.message);
  const verificados = new Set((ver.data ?? []).filter((v) => v.verificado).map((v) => v.perfil_id));
  return (det.data ?? []).map((d) => ({
    id: d.perfil_id,
    nombre: d.perfiles?.nombre ?? "",
    ciudad: d.perfiles?.ciudad ?? null,
    zona: d.perfiles?.zona ?? null,
    bio: d.perfiles?.bio ?? null,
    titular: d.titular,
    anios: d.anios_ensenando,
    niveles: d.niveles_alumnos,
    modalidades: d.modalidades,
    precio: d.precio_hora,
    instrumentos: (d.perfiles?.perfil_instrumentos ?? []).map((x) => x.instrumentos?.nombre ?? "").filter(Boolean),
    estilos: [
      ...(d.perfiles?.perfil_estilos ?? []).map((x) => x.estilos?.nombre ?? "").filter(Boolean),
      ...(d.estilos_otros ? d.estilos_otros.split(",").map((s) => s.trim()).filter(Boolean) : []),
    ],
    verificado: verificados.has(d.perfil_id),
    esEscuela: d.es_escuela,
  }));
});