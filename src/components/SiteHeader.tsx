import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAccess } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CassetteLogo } from "@/components/Cassette";

export function SiteHeader() {
  const qc = useQueryClient(),
    navigate = useNavigate(),
    access = useServerFn(adminAccess);
  const { data: session } = useQuery({
    queryKey: ["header-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const signedIn = !!session;
  const { data: admin } = useQuery({
    queryKey: ["admin-access", session?.user.id],
    queryFn: () => access(),
    enabled: signedIn,
    retry: false,
  });
  const { data: account } = useQuery({
    queryKey: ["header-account", session?.user.id],
    enabled: signedIn,
    queryFn: async () => {
      if (!session) return null;
      const [roles, profile, requests] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase.from("perfiles").select("nombre,foto_url").eq("id", session.user.id).maybeSingle(),
        supabase
          .from("reservas")
          .select("id", { count: "exact", head: true })
          .eq("anfitrion_id", session.user.id)
          .eq("estado", "pendiente_aceptacion"),
      ]);
      return {
        professional: (roles.data ?? []).some((r) => r.role === "profesor" || r.role === "local"),
        name: profile.data?.nombre ?? "",
        avatar: profile.data?.foto_url,
        pending: requests.count ?? 0,
      };
    },
  });
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="border-b border-dotted bg-background">
      <div className="page-width flex min-h-24 flex-wrap items-center justify-between gap-x-8 gap-y-4 py-5">
        <Link
          to="/"
          aria-label="¿tocamos? Inicio"
          className="flex items-center gap-3 font-display text-[28px]"
        >
          <CassetteLogo />
          ¿tocamos?
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 sm:gap-3">
          <Button asChild variant="ghost">
            <Link to="/explorar" search={{ pista: "profes", instrumento: "", donde: "" }}>
              Profes
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/explorar" search={{ pista: "bandas", instrumento: "", donde: "" }}>
              Bandas
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/explorar" search={{ pista: "locales", instrumento: "", donde: "" }}>
              Locales
            </Link>
          </Button>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          {signedIn ? (
            <>
              {admin?.allowed ? (
                <Button asChild variant="secondary">
                  <Link to="/admin">Administración</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="link">
                    <Link to="/reservas">
                      {account?.professional
                        ? `Solicitudes${account.pending ? ` · ${account.pending}` : ""}`
                        : "Mis reservas"}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/perfil">
                      {account?.avatar ? (
                        <img
                          src={account.avatar}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teacher-tint text-xs">
                          {account?.name.charAt(0) || "♪"}
                        </span>
                      )}
                      {account?.professional ? "Mi ficha" : "Mi perfil"}
                    </Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="link" className="text-sm">
                <Link to="/para-profes">Para profes y locales</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/auth">Entrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
