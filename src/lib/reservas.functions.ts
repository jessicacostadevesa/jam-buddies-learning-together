import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { importeCentimos, puedePagar } from "@/lib/reservas";

export const solicitarReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    anfitrion: z.string().uuid(),
    inicio: z.string().datetime({ offset: true }),
    horas: z.number().min(0.5).max(8),
    mensaje: z.string().max(500).default(""),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("solicitar_reserva", {
      _anfitrion: data.anfitrion, _inicio: data.inicio, _horas: data.horas, _mensaje: data.mensaje,
    });
    if (error) return { error: error.message };
    return { id: id as string };
  });

export const responderReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), aceptar: z.boolean(), motivo: z.string().max(300).default("") }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("responder_reserva", { _id: data.id, _aceptar: data.aceptar, _motivo: data.motivo });
    if (error) return { error: error.message };
    return { ok: true };
  });

export const cancelarReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("cancelar_reserva", { _id: data.id });
    if (error) return { error: error.message };
    return { ok: true };
  });

export const pagarReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), returnUrl: z.string().url(), environment: z.enum(["sandbox", "live"]) }).parse(i))
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const { data: r, error } = await context.supabase.from("reservas").select("*").eq("id", data.id).maybeSingle();
    if (error || !r) return { error: "Reserva no encontrada" };
    if (!puedePagar(r, context.userId)) return { error: "Esta reserva no está pendiente de pago" };
    const origin = new URL(data.returnUrl).origin;
    try {
      const stripe = createStripeClient(data.environment);
      const email = (context.claims as { email?: string }).email;
      const found = await stripe.customers.search({ query: `metadata['userId']:'${context.userId}'`, limit: 1 });
      const customer = found.data[0]?.id ?? (await stripe.customers.create({ ...(email && { email }), metadata: { userId: context.userId } })).id;
      const nombre = r.tipo === "clase" ? `Clase con ${r.anfitrion_nombre}` : `Ensayo en ${r.anfitrion_nombre}`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        customer,
        customer_update: { address: "auto" },
        billing_address_collection: "required",
        automatic_tax: { enabled: true },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: importeCentimos(r.importe),
            tax_behavior: "inclusive",
            product_data: { name: nombre, tax_code: "txcd_20030000" },
          },
        }],
        payment_intent_data: { description: nombre, metadata: { reservaId: r.id } },
        metadata: { reservaId: r.id, userId: context.userId, managed_payments: "false" },
        return_url: `${origin}/reservas?pago={CHECKOUT_SESSION_ID}`,
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("reservas").update({ stripe_session_id: session.id, environment: data.environment }).eq("id", r.id);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
