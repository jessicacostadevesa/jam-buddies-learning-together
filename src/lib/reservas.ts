export type EstadoReserva = "pendiente_aceptacion" | "pendiente_pago" | "confirmada" | "rechazada" | "cancelada";

export const ESTADO_LABEL: Record<EstadoReserva, string> = {
  pendiente_aceptacion: "Esperando respuesta",
  pendiente_pago: "Aceptada · falta pagar",
  confirmada: "Confirmada y pagada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

/** Importe en céntimos que se cobra por una reserva. */
export function importeCentimos(importe: number): number {
  return Math.round(Number(importe) * 100);
}

/** Solo se puede pagar una reserva aceptada, y solo quien la pidió. */
export function puedePagar(r: { estado: EstadoReserva; alumno_id: string }, userId: string): boolean {
  return r.estado === "pendiente_pago" && r.alumno_id === userId;
}
