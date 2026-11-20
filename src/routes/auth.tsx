import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { CassetteStripes, CassetteLogo } from "@/components/Cassette";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { adminAccess } from "@/lib/admin.functions";

const roles = [
  { id: "alumno", label: "A1 · Alumno" },
  { id: "profesor", label: "A2 · Profe o escuela" },
  { id: "local", label: "B2 · Local" },
] as const;
type Rol = (typeof roles)[number]["id"];

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ rol: z.enum(["alumno", "profesor", "local"]).optional() }),
  head: () => ({
    meta: [
      { title: "Entrar — ¿tocamos?" },
      {
        name: "description",
        content: "Entra o crea tu perfil de músico, profe o local en ¿tocamos?.",
      },
      { property: "og:title", content: "Entrar — ¿tocamos?" },
      { property: "og:description", content: "Crea tu perfil de músico, profe o local." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const checkAdmin = useServerFn(adminAccess);
  async function goToAccount() {
    const access = await checkAdmin();
    navigate({ to: access.allowed ? "/admin" : "/perfil" });
  }
  const [mode, setMode] = useState<"login" | "signup">(search.rol ? "signup" : "login");
  const [rol, setRol] = useState<Rol>(search.rol ?? "alumno");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { nombre, rol } },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error("Email o contraseña incorrectos");
        return;
      }
      await goToAccount();
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      toast.error("No se pudo entrar con Google");
      return;
    }
    if (r.redirected) return;
    await goToAccount();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="page-width grid items-center gap-8 py-10 md:grid-cols-2 md:gap-14 md:py-14">
        <aside className="overflow-hidden rounded-[28px] bg-foreground text-background">
          <div className="px-8 py-12">
            <CassetteLogo className="h-12 w-20" />
            <h2 className="mt-8 max-w-md text-4xl leading-tight md:text-5xl">
              Tu primera canción empieza aquí
            </h2>
            <p className="mt-6 text-lg">A tu ritmo. Con tu gente.</p>
          </div>
          <CassetteStripes />
        </aside>
        <div className="rounded-[24px] bg-card p-6 shadow-cassette md:p-8">
          {sent ? (
            <div className="text-center">
              <h1 className="text-3xl font-extrabold">Revisa tu email</h1>
              <p className="mt-3 text-muted-foreground">
                Te hemos enviado un enlace a {email} para confirmar tu cuenta.
              </p>
            </div>
          ) : (
            <>
              <div
                className="mb-6 flex rounded-full bg-muted p-1"
                role="tablist"
                aria-label="Acceso"
              >
                {(["login", "signup"] as const).map((m) => (
                  <Button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    variant="ghost"
                    className={`flex-1 ${mode === m ? "bg-card" : ""}`}
                    onClick={() => setMode(m)}
                  >
                    {m === "login" ? "Entrar" : "Crear cuenta"}
                  </Button>
                ))}
              </div>
              <h1 className="text-3xl">{mode === "signup" ? "Crea tu perfil" : "Hola de nuevo"}</h1>
              <Button
                type="button"
                variant="outline"
                className="mt-6 min-h-[52px] w-full bg-card text-foreground"
                onClick={google}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.930-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.490-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Continuar con Google
              </Button>
              <div className="my-5 text-center text-sm text-muted-foreground">o con tu email</div>
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div>
                      <Label>Soy…</Label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {roles.map((r) => (
                          <Button
                            variant="ghost"
                            type="button"
                            key={r.id}
                            aria-pressed={rol === r.id}
                            onClick={() => setRol(r.id)}
                            className={`min-h-[60px] rounded-[20px] border-2 px-2 py-2 text-sm font-semibold transition-colors ${rol === r.id ? "border-foreground bg-teacher-tint" : "border-transparent bg-muted"}`}
                          >
                            {r.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pw">Contraseña</Label>
                  <Input
                    id="pw"
                    type="password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {mode === "signup" ? "Crear cuenta" : "Entrar"}
                </Button>
              </form>
              <Button
                variant="link"
                type="button"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                className="mt-5 w-full text-sm"
              >
                {mode === "signup" ? "¿Ya tienes cuenta? Entra" : "¿Nuevo? Crea tu perfil"}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
