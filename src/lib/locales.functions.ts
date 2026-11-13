import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarLocales = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) throw new Error("No se pudo conectar con el mapa");
  const sb = createClient<Database>(url, key, {
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
  const { data, error } = await sb.rpc("directorio_locales_publico");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** Geocodes the signed-in local's address and stores its coordinates. */
export const ubicarMiLocal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ direccion: z.string().trim().min(3).max(300) }).parse(i))
  .handler(async ({ data, context }) => {
    const lovable = process.env["LOVABLE_API_KEY"];
    const gmaps = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovable || !gmaps) throw new Error("Falta configurar Google Maps");
    const res = await fetch(
      `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?region=es&language=es&address=${encodeURIComponent(data.direccion)}`,
      { headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": gmaps } },
    );
    if (!res.ok) throw new Error(`Google Maps [${res.status}]: ${await res.text()}`);
    const json = (await res.json()) as { results?: { geometry: { location: { lat: number; lng: number } } }[] };
    const loc = json.results?.[0]?.geometry.location;
    if (!loc) return { ok: false as const };
    const { error } = await context.supabase.from("local_detalles")
      .update({ latitud: loc.lat, longitud: loc.lng }).eq("perfil_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const, ...loc };
  });
