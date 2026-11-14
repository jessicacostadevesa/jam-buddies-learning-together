import { describe, expect, it } from "vitest";
import { importeCentimos, puedePagar } from "@/lib/reservas";

describe("reservas", () => {
  it("solo el alumno puede pagar una reserva aceptada", () => {
    expect(puedePagar({ estado: "pendiente_pago", alumno_id: "a" }, "a")).toBe(true);
    expect(puedePagar({ estado: "pendiente_aceptacion", alumno_id: "a" }, "a")).toBe(false);
    expect(puedePagar({ estado: "pendiente_pago", alumno_id: "a" }, "b")).toBe(false);
  });
  it("cobra el importe en céntimos", () => {
    expect(importeCentimos(37.5)).toBe(3750);
  });
});
