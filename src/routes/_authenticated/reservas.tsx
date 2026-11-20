import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SiteHeader } from "@/components/SiteHeader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cancelarReserva, pagarReserva, responderReserva } from "@/lib/reservas.functions";
import { ESTADO_LABEL, puedePagar, type EstadoReserva } from "@/lib/reservas";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

const reservasQuery = queryOptions({
  queryKey: ["reservas"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .order("inicio", { ascending: true });
    if (error) throw error;
    return { userId: u.user?.id ?? "", reservas: data ?? [] };
  },
});

export const Route = createFileRoute("/_authenticated/reservas")({
  head: () => ({
    meta: [
      { title: "Mis reservas — ¿tocamos?" },
      { name: "description", content: "Tus clases y ensayos: solicitudes, aceptación y pago." },
      { property: "og:title", content: "Mis reservas — ¿tocamos?" },
      { property: "og:description", content: "Gestiona tus clases y ensayos reservados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { pago?: string | undefined } => ({
    pago: typeof s["pago"] === "string" ? s["pago"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reservasQuery),
  component: ReservasPage,
});

type Reserva = Database["public"]["Tables"]["reservas"]["Row"];
const fmt = (d: string) =>
  new Date(d).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function Pago({ id, onClose }: { id: string; onClose: () => void }) {
  const pagar = useServerFn(pagarReserva);
  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        const r = await pagar({
          data: { id, returnUrl: window.location.href, environment: getStripeEnvironment() },
        });
        if ("error" in r) throw new Error(r.error);
        return r.clientSecret;
      },
    }),
    [id, pagar],
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagar reserva</DialogTitle>
        </DialogHeader>
        <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </DialogContent>
    </Dialog>
  );
}

function ReservasPage() {
  const { data } = useSuspenseQuery(reservasQuery);
  const { pago } = Route.useSearch();
  const qc = useQueryClient();
  const responder = useServerFn(responderReserva);
  const cancelar = useServerFn(cancelarReserva);
  const [pagando, setPagando] = useState<string | null>(null);
  const mias = data.reservas.filter((r) => r.alumno_id === data.userId);
  const recibidas = data.reservas.filter((r) => r.anfitrion_id === data.userId);

  async function accion(p: Promise<{ error?: string } | { ok: boolean }>, ok: string) {
    const r = await p;
    if ("error" in r && r.error) {
      toast.error(r.error);
      return;
    }
    toast.success(ok);
    qc.invalidateQueries({ queryKey: ["reservas"] });
  }

  function Tarjeta({ r, comoAnfitrion }: { r: Reserva; comoAnfitrion: boolean }) {
    const estado = r.estado as EstadoReserva;
    return (
      <article className="cassette-surface flex flex-col overflow-hidden sm:flex-row">
        <div
          className={`flex items-center justify-center gap-3 px-5 py-6 text-foreground sm:w-32 sm:shrink-0 sm:flex-col ${r.tipo === "clase" ? "bg-teacher" : "bg-venue"}`}
        >
          <span className="text-xs font-bold">
            {r.tipo === "clase" ? "A1 · CLASE" : "B2 · ENSAYO"}
          </span>
          <span className="font-display text-4xl">{new Date(r.inicio).getDate()}</span>
          <span className="text-sm font-semibold">
            {new Date(r.inicio).toLocaleDateString("es-ES", { month: "short" })}
          </span>
        </div>
        <div className="min-w-0 flex-1 border-dashed border-dotted p-5 sm:border-l">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">
                {r.tipo === "clase" ? "Clase" : "Ensayo"} ·{" "}
                {comoAnfitrion ? r.alumno_nombre : r.anfitrion_nombre}
              </h3>
              <p className="text-sm text-muted-foreground">
                {fmt(r.inicio)} · {Number(r.horas)} h
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold">
                {Number(r.importe).toLocaleString("es-ES")}€
              </div>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-foreground ${estado === "pendiente_aceptacion" ? "bg-teacher-tint" : estado === "pendiente_pago" ? "bg-band-tint" : estado === "confirmada" ? "bg-venue-tint" : "bg-muted"}`}
              >
                {estado === "pendiente_aceptacion"
                  ? "Esperando a que acepte"
                  : estado === "pendiente_pago"
                    ? "Aceptada · falta pagar"
                    : ESTADO_LABEL[estado]}
              </span>
            </div>
          </div>
          {r.mensaje && <p className="mt-3 text-sm">“{r.mensaje}”</p>}
          {r.motivo_rechazo && (
            <p className="mt-2 text-sm text-muted-foreground">Motivo: {r.motivo_rechazo}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {comoAnfitrion && estado === "pendiente_aceptacion" && (
              <>
                <Button
                  size="sm"
                  variant="ink"
                  onClick={() =>
                    accion(
                      responder({ data: { id: r.id, aceptar: true, motivo: "" } }),
                      "Aceptada. El alumno ya puede pagar.",
                    )
                  }
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const m = window.prompt("Motivo (opcional)") ?? "";
                    accion(
                      responder({ data: { id: r.id, aceptar: false, motivo: m } }),
                      "Petición rechazada",
                    );
                  }}
                >
                  Rechazar
                </Button>
              </>
            )}
            {puedePagar({ estado, alumno_id: r.alumno_id }, data.userId) && (
              <Button size="sm" variant="pop" onClick={() => setPagando(r.id)}>
                Pagar ahora
              </Button>
            )}
            {(estado === "pendiente_aceptacion" || estado === "pendiente_pago") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => accion(cancelar({ data: { id: r.id } }), "Reserva cancelada")}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-4xl font-extrabold">Mis reservas</h1>
        {pago && (
          <p className="mt-4 rounded-md border border-border bg-accent p-3 text-sm font-semibold">
            ¡Pago recibido! Tu reserva se confirma en unos segundos.
          </p>
        )}
        <Tabs className="mt-8" defaultValue={recibidas.length ? "recibidas" : "mias"}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="mias">Lo que has reservado</TabsTrigger>
            <TabsTrigger value="recibidas">
              Solicitudes recibidas ·{" "}
              {recibidas.filter((r) => r.estado === "pendiente_aceptacion").length}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recibidas">
            <div className="mt-6 space-y-4">
              {recibidas.length ? (
                recibidas.map((r) => <Tarjeta key={r.id} r={r} comoAnfitrion />)
              ) : (
                <p className="py-8 text-muted-foreground">Todavía no hay peticiones recibidas.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="mias">
            <section className="mt-6">
              {mias.length === 0 ? (
                <p className="mt-3 text-muted-foreground">
                  Aún no has pedido ninguna clase ni sala. Búscalas en Profes o Locales.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {mias.map((r) => (
                    <Tarjeta key={r.id} r={r} comoAnfitrion={false} />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
      {pagando && (
        <Pago
          id={pagando}
          onClose={() => {
            setPagando(null);
            qc.invalidateQueries({ queryKey: ["reservas"] });
          }}
        />
      )}
    </div>
  );
}
