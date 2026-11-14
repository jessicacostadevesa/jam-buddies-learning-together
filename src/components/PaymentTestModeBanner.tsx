const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return <div className="w-full border-b-2 border-ink bg-destructive/15 px-4 py-2 text-center text-sm">Los pagos reales aún no están activados.</div>;
  }
  if (clientToken.startsWith("pk_test_")) {
    return <div className="w-full border-b-2 border-ink bg-secondary px-4 py-2 text-center text-sm">Modo prueba: los pagos de la vista previa no cobran dinero real (tarjeta 4242 4242 4242 4242).</div>;
  }
  return null;
}
