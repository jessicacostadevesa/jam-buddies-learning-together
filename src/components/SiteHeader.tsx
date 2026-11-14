import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAccess } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const access = useServerFn(adminAccess);
  const { data: session } = useQuery({ queryKey: ["header-session"], queryFn: async () => (await supabase.auth.getSession()).data.session });
  const signedIn = !!session;
  const { data: admin } = useQuery({ queryKey: ["admin-access", session?.user.id], queryFn: () => access(), enabled: signedIn, retry: false });
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b-2 border-ink bg-background">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <span className="inline-block h-6 w-6 rounded-full border-2 border-ink bg-primary" />
          ¿tocamos?
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
        <Button asChild variant="ghost" size="sm"><Link to="/profes">Profes</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link to="/locales">Locales</Link></Button>
        {signedIn ? (
          <div className="flex items-center gap-2">
            {!admin?.allowed && <Button asChild variant="ghost" size="sm"><Link to="/reservas">Reservas</Link></Button>}
            <Button asChild variant="ink" size="sm">{admin?.allowed ? <Link to="/admin">Administración</Link> : <Link to="/perfil">Mi perfil</Link>}</Button>
            <Button variant="ghost" size="sm" onClick={signOut}>Salir</Button>
          </div>
        ) : (
          <Button asChild variant="pop" size="sm"><Link to="/auth">Entrar</Link></Button>
        )}
        </nav>
      </div>
    </header>
  );
}
