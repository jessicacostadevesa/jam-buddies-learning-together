import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { solicitarReserva } from "@/lib/reservas.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReservarDialog({
  anfitrionId,
  nombre,
  precio,
  tipo,
}: {
  anfitrionId: string;
  nombre: string;
  precio: number | null;
  tipo: "clase" | "ensayo";
}) {
  const solicitar = useServerFn(solicitarReserva);
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("18:00");
  const [horas, setHoras] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { data: session } = useQuery({
    queryKey: ["header-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  if (precio == null) return null;
  const titulo = tipo === "clase" ? "Pedir clase" : "Reservar ensayo";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha) {
      toast.error("Elige un día");
      return;
    }
    setEnviando(true);
    const res = await solicitar({
      data: {
        anfitrion: anfitrionId,
        inicio: new Date(`${fecha}T${hora}`).toISOString(),
        horas,
        mensaje,
      },
    });
    setEnviando(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Petición enviada. Pagarás cuando te la acepten.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <CalendarPlus className="h-4 w-4" /> {titulo}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {titulo} · {nombre}
          </DialogTitle>
          <DialogDescription>
            No pagas nada ahora. Solo cuando {tipo === "clase" ? "el profe" : "el local"} acepte la
            fecha.
          </DialogDescription>
        </DialogHeader>
        {!session ? (
          <p className="text-sm">
            Para reservar necesitas una cuenta de alumno.{" "}
            <Link to="/auth" className="font-semibold underline">
              Entrar
            </Link>
          </p>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="r-fecha">Día</Label>
                <Input
                  id="r-fecha"
                  type="date"
                  value={fecha}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="r-hora">Hora</Label>
                <Input
                  id="r-hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="r-horas">Horas</Label>
              <Input
                id="r-horas"
                type="number"
                min={0.5}
                max={8}
                step={0.5}
                value={horas}
                onChange={(e) => setHoras(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="r-msg">Mensaje (opcional)</Label>
              <Textarea
                id="r-msg"
                maxLength={500}
                placeholder="Cuéntale qué quieres trabajar o con quién vas"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">
                Total: {(Number(precio) * horas).toLocaleString("es-ES")}€
              </span>
              <Button type="submit" variant="ink" disabled={enviando}>
                {enviando ? "Enviando…" : "Pedir reserva"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
