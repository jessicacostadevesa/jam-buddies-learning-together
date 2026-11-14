import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function confirmar(session: any, env: StripeEnv) {
  const reservaId = session?.metadata?.reservaId;
  if (!reservaId || session.payment_status === "unpaid") return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("reservas")
    .update({ estado: "confirmada", pagada_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", reservaId).eq("stripe_session_id", session.id).eq("environment", env).eq("estado", "pendiente_pago");
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          const event = await verifyWebhook(request, rawEnv);
          if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
            await confirmar(event.data.object, rawEnv);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
