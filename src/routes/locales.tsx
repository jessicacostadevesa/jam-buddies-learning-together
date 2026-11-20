import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/locales")({
  beforeLoad: () => {
    throw redirect({
      to: "/explorar",
      search: { pista: "locales", instrumento: "", donde: "" },
      replace: true,
    });
  },
});
