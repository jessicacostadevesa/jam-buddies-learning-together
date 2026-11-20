import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/profes")({
  beforeLoad: () => {
    throw redirect({
      to: "/explorar",
      search: { pista: "profes", instrumento: "", donde: "" },
      replace: true,
    });
  },
});
