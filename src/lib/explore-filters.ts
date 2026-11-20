export function matchesSearch(values: (string | null | undefined)[], query: string) {
  return (
    !query.trim() ||
    values.some((value) =>
      value?.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")),
    )
  );
}
export function matchesVenueFilters(
  venue: { precio: number | null; jams: boolean; conciertos: boolean; tipos: string[] },
  use: string,
  free: boolean,
) {
  if (free && venue.precio !== 0) return false;
  if (use === "jams") return venue.jams;
  if (use === "conciertos") return venue.conciertos;
  if (use === "ensayo")
    return venue.tipos.some((type) => type.toLocaleLowerCase("es").includes("ensayo"));
  return true;
}
