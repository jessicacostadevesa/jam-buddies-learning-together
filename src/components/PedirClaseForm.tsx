import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { solicitarReserva } from "@/lib/reservas.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { precioHora } from "@/lib/directory";

export function PedirClaseForm({
  id,
  precio,
  escuela,
}: {
  id: string;
  precio: number | null;
  escuela: boolean;
}) {
  const pedir = useServerFn(solicitarReserva);
  const { data: account, isPending } = useQuery({
    queryKey: ["booking-account"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      const roles = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      return { alumno: (roles.data ?? []).some((r) => r.role === "alumno") };
    },
  });
  const [fecha, setFecha] = useState(""),
    [hora, setHora] = useState(""),
    [horas, setHoras] = useState(1),
    [mensaje, setMensaje] = useState("");
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await pedir({
        data: { anfitrion: id, inicio: new Date(`${fecha}T${hora}`).toISOString(), horas, mensaje },
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      setSent(true);
    } catch {
      toast.error("No se pudo enviar. Vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <div role="status" className="rounded-[24px] bg-venue-tint p-8">
        <h2 className="text-2xl">¡petición enviada! ♪</h2>
        <p className="mt-4">Te avisaremos cuando acepte. No pagas nada hasta entonces.</p>
        <Button asChild variant="secondary" className="mt-6">
          <Link to="/reservas">Mis reservas</Link>
        </Button>
      </div>
    );
  return (
    <div className="rounded-[24px] border border-border bg-paper p-6">
      <p className="font-display text-3xl">{precioHora(precio)}</p>
      <h2 className="mt-5 text-2xl">{escuela ? "Aprende en esta escuela" : "Tu próxima clase"}</h2>
      {precio == null ? (
        <p className="mt-4 text-muted-foreground">
          Todavía no hay una tarifa para pedir una clase por aquí.
        </p>
      ) : isPending ? (
        <p className="mt-4">Comprobando tu cuenta…</p>
      ) : !account ? (
        <div className="mt-5">
          <p className="text-muted-foreground">Crea tu cuenta de alumno para pedir clase.</p>
          <Button asChild variant="primary" className="mt-5">
            <Link to="/auth" search={{ rol: "alumno" }}>
              Crear mi cuenta
            </Link>
          </Button>
        </div>
      ) : !account.alumno ? (
        <p className="mt-5 text-muted-foreground">
          Las clases se piden desde una cuenta de alumno.
        </p>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="class-day">Qué día te viene bien</Label>
            <Input
              id="class-day"
              type="date"
              required
              value={fecha}
              min={new Date().toLocaleDateString("en-CA")}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="class-time">A qué hora</Label>
            <Input
              id="class-time"
              type="time"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="class-duration">Duración (horas)</Label>
            <Input
              id="class-duration"
              type="number"
              min={0.5}
              max={8}
              step={0.5}
              required
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="class-message">Mensaje (opcional)</Label>
            <Textarea
              id="class-message"
              maxLength={500}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="mt-2"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            El profe confirmará si le encaja esta fecha. No pagas nada hasta que acepte.
          </p>
          <p className="font-semibold">
            Total: {(Number(precio) * horas).toLocaleString("es-ES")}€
          </p>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={busy || !fecha || !hora}
          >
            {busy
              ? "Enviando…"
              : `Pedir clase${fecha && hora ? ` · ${new Date(`${fecha}T12:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}, ${hora}` : ""}`}
          </Button>
        </form>
      )}
    </div>
  );
}
