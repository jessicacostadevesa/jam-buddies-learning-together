import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b-2 border-ink bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <span className="inline-block h-6 w-6 rounded-full border-2 border-ink bg-primary" />
          tocamos
        </Link>
        <nav className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/profes">Profes</Link></Button>
        {signedIn ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="ink" size="sm"><Link to="/perfil">Mi perfil</Link></Button>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Salir</Button>
          </div>
        ) : (
          <Button asChild variant="pop" size="sm"><Link to="/auth">Entrar</Link></Button>
        )}
        </nav>
      </div>
    </header>
  );
}
