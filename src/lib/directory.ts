import { queryOptions } from "@tanstack/react-query";
import { listarProfes } from "@/lib/profes.functions";
import { listarLocales } from "@/lib/locales.functions";
export const profesQuery = queryOptions({ queryKey: ["profes"], queryFn: () => listarProfes() });
export const localesQuery = queryOptions({
  queryKey: ["locales-mapa"],
  queryFn: () => listarLocales(),
});
export type ProfePublico = Awaited<ReturnType<typeof listarProfes>>[number];
export type LocalPublico = Awaited<ReturnType<typeof listarLocales>>[number];
export const niveles: Record<string, string> = {
  inicial: "Empiezo de cero",
  intermedio: "Ya toco algo",
  avanzado: "Avanzado",
};
export const modalidades: Record<string, string> = {
  presencial: "En su aula",
  domicilio: "A domicilio",
  online: "Online",
};
export const precioHora = (n: number | null | undefined) =>
  n == null ? "Precio a consultar" : `${Number(n).toLocaleString("es-ES")}€/hora`;
