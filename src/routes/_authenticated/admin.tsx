import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ShieldCheck,
  Users,
  BadgeCheck,
  MapPin,
  History,
  Search,
  Trash2,
  Ban,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { adminOverview, adminChange, adminEvidence } from "@/lib/admin.functions";
import { adminRoles, roleNames, safeEvidenceLink, type AdminRole } from "@/lib/admin";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const overviewQuery = queryOptions({
  queryKey: ["admin", "overview"],
  queryFn: () => adminOverview(),
  staleTime: 0,
});
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración — ¿tocamos?" },
      {
        name: "description",
        content: "Gestión interna de usuarios, locales y verificación de profesores de ¿tocamos?.",
      },
      { property: "og:title", content: "Administración — ¿tocamos?" },
      { property: "og:description", content: "Panel interno de administración de ¿tocamos?." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(overviewQuery),
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <ShieldCheck className="mb-4 h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Administración no disponible</h1>
        <p className="mt-3 text-muted-foreground">
          Esta página está reservada a administradores con una cuenta activa.
        </p>
      </main>
    </div>
  ),
  component: AdminPage,
});

type Change =
  | { action: "role"; target: string; role: AdminRole }
  | { action: "suspend" | "activate" | "delete"; target: string }
  | { action: "verify"; target: string; verified: boolean };
function AdminPage() {
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(overviewQuery);
  const qc = useQueryClient();
  const change = useServerFn(adminChange);
  const evidence = useServerFn(adminEvidence);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<{ change: Change; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const users = data.users.filter(
    (u) =>
      (!filter || u.roles.includes(filter as AdminRole)) &&
      `${u.name} ${u.email} ${u.city}`.toLowerCase().includes(search.toLowerCase()),
  );
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const request = (c: Change, name: string) => {
    setDeleteText("");
    setPending({ change: c, name });
  };
  async function apply() {
    if (!pending) return;
    setBusy(true);
    try {
      await change({ data: pending.change });
      toast.success("Cambio guardado");
      setPending(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function openEvidence(id: string) {
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    try {
      const result = await evidence({ data: { id } });
      if (win) win.location.href = result.url;
    } catch {
      win?.close();
      toast.error("No se pudo abrir el documento");
    }
  }
  const actionNames: Record<string, string> = {
    role: "Cambio de rol",
    suspend: "Cuenta suspendida",
    activate: "Cuenta reactivada",
    delete: "Cuenta eliminada",
    verify: "Verificación actualizada",
  };
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-5 w-5" />
              Acceso interno
            </div>
            <h1 className="text-4xl font-extrabold">Administración</h1>
          </div>
          <Button variant="outline" onClick={refresh} aria-label="Actualizar datos">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
        <div className="my-8 grid grid-cols-2 gap-4 border-y border-dotted py-6 md:grid-cols-4">
          {[
            { label: "Usuarios", number: data.users.length, Icon: Users },
            {
              label: "Profes pendientes",
              number: data.teachers.filter((t) => !t.verified).length,
              Icon: BadgeCheck,
            },
            { label: "Locales", number: data.venues.length, Icon: MapPin },
            {
              label: "Suspendidos",
              number: data.users.filter((u) => u.suspended).length,
              Icon: Ban,
            },
          ].map(({ label, number, Icon }) => (
            <div key={label}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{number}</div>
            </div>
          ))}
        </div>
        <Tabs defaultValue="users">
          <TabsList className="mb-6 flex h-auto w-fit max-w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="teachers">
              <BadgeCheck className="mr-2 h-4 w-4" />
              Verificación
            </TabsTrigger>
            <TabsTrigger value="venues">
              <MapPin className="mr-2 h-4 w-4" />
              Locales
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="mr-2 h-4 w-4" />
              Actividad
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <div className="mb-5 flex flex-wrap gap-3">
              <div className="relative min-w-0 flex-1 basis-60">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Buscar usuarios"
                  placeholder="Buscar por nombre o email"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                aria-label="Filtrar por rol"
                className="rounded-md border border-input bg-card px-3 py-2 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {adminRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleNames[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto border-y border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Usuario", "Rol", "Inicio de sesión", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="p-4 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="max-w-64 p-4">
                        <div className="break-words font-semibold">
                          {u.name}
                          {u.id === user.id && (
                            <span className="ml-2 text-xs text-foreground">Tú</span>
                          )}
                        </div>
                        <div className="mt-1 break-all text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          aria-label={`Rol de ${u.email}`}
                          disabled={busy || u.id === user.id}
                          value={u.roles[0] ?? "alumno"}
                          onChange={(e) =>
                            request(
                              { action: "role", target: u.id, role: e.target.value as AdminRole },
                              u.name,
                            )
                          }
                          className="max-w-40 rounded-md border border-input bg-card px-2 py-2"
                        >
                          {adminRoles.map((r) => (
                            <option key={r} value={r}>
                              {roleNames[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 capitalize">{u.providers.join(", ") || "Email"}</td>
                      <td className="p-4">
                        <span className={u.suspended ? "text-destructive" : "text-foreground"}>
                          {u.suspended ? "Suspendido" : u.confirmed ? "Activo" : "Email pendiente"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={u.suspended ? "Reactivar cuenta" : "Suspender cuenta"}
                            aria-label={`${u.suspended ? "Reactivar" : "Suspender"} ${u.email}`}
                            disabled={u.id === user.id || u.roles.includes("admin") || busy}
                            onClick={() =>
                              request(
                                { action: u.suspended ? "activate" : "suspend", target: u.id },
                                u.name,
                              )
                            }
                          >
                            {u.suspended ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            title="Eliminar cuenta"
                            aria-label={`Eliminar ${u.email}`}
                            disabled={u.id === user.id || u.roles.includes("admin") || busy}
                            onClick={() => request({ action: "delete", target: u.id }, u.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!users.length && (
                <p className="py-10 text-center text-muted-foreground">
                  No hay usuarios con estos filtros.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="teachers">
            <div className="divide-y divide-border">
              {data.teachers.map((t) => (
                <section key={t.perfil_id} className="py-6 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{t.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{t.titular}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {t.verified ? "Verificado" : "Sin verificar"}
                      </p>
                    </div>
                    <Button
                      variant={t.verified ? "outline" : "ink"}
                      disabled={busy || t.perfil_id === user.id}
                      onClick={() =>
                        request(
                          { action: "verify", target: t.perfil_id, verified: !t.verified },
                          t.name,
                        )
                      }
                    >
                      <BadgeCheck className="h-4 w-4" />
                      {t.verified ? "Retirar sello" : "Verificar"}
                    </Button>
                  </div>
                  <dl className="mt-5 grid gap-4 text-sm md:grid-cols-3">
                    {[
                      ["Metodología", t.metodologia],
                      ["Experiencia", t.experiencia],
                      ["Formación", t.formacion],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-semibold">{label}</dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                          {value || "No indicada"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.evidence.map((e) =>
                      e.storage_path ? (
                        <Button key={e.id} variant="outline" onClick={() => openEvidence(e.id)}>
                          <ExternalLink className="h-4 w-4" />
                          {e.titulo}
                        </Button>
                      ) : e.url && safeEvidenceLink(e.url) ? (
                        <Button key={e.id} asChild variant="outline">
                          <a href={e.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {e.titulo}
                          </a>
                        </Button>
                      ) : null,
                    )}
                    {!t.evidence.length && (
                      <span className="text-sm text-muted-foreground">
                        Sin documentación enviada
                      </span>
                    )}
                  </div>
                </section>
              ))}
              {!data.teachers.length && (
                <p className="py-10 text-muted-foreground">No hay profesores pendientes.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="venues">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.venues.map((v) => (
                <article key={v.perfil_id} className="rounded-lg border border-border bg-card p-5">
                  <h2 className="text-xl font-bold">{v.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {v.direccion || "Sin dirección"}
                  </p>
                  <p className="mt-3 text-sm">{v.tipos.join(" · ")}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                    <span>
                      {v.precio_hora_ensayo != null
                        ? `${v.precio_hora_ensayo}€/h`
                        : "Precio no indicado"}
                    </span>
                    {v.organiza_jams && <span className="text-foreground">Jams</span>}
                    {v.organiza_conciertos && <span className="text-primary">Conciertos</span>}
                  </div>
                </article>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="audit">
            <div className="divide-y divide-border">
              {data.audit.map((a) => (
                <div key={a.id} className="flex flex-wrap justify-between gap-2 py-4 text-sm">
                  <div>
                    <span className="font-semibold">{actionNames[a.action] ?? a.action}</span>
                    <span className="ml-2 text-muted-foreground">
                      {data.users.find((u) => u.id === a.target_id)?.name ?? "Cuenta eliminada"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Por {data.users.find((u) => u.id === a.actor_id)?.name ?? "Administrador"}
                      {a.detail ? ` · ${a.detail}` : ""}
                    </p>
                  </div>
                  <time className="text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("es-ES")}
                  </time>
                </div>
              ))}
              {!data.audit.length && (
                <p className="py-10 text-muted-foreground">Todavía no hay acciones registradas.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Dialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogTitle>
            {pending?.change.action === "delete" ? "Eliminar cuenta" : "Confirmar cambio"}
          </DialogTitle>
          <DialogDescription>
            {pending?.name}:{" "}
            {pending?.change.action === "role"
              ? `su nuevo rol será ${roleNames[pending.change.role]}.`
              : pending?.change.action === "delete"
                ? "se eliminarán su acceso, perfil y documentación. Esta acción no se puede deshacer."
                : pending?.change.action === "suspend"
                  ? "no podrá acceder ni aparecerá en los directorios públicos."
                  : pending?.change.action === "activate"
                    ? "recuperará el acceso a su cuenta."
                    : pending?.change.action === "verify" && pending.change.verified
                      ? "recibirá el sello de profesor verificado."
                      : "se retirará su sello de verificación."}
          </DialogDescription>
          {pending?.change.action === "delete" && (
            <Input
              aria-label="Confirmación de eliminación"
              placeholder="Escribe ELIMINAR"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button
              variant={pending?.change.action === "delete" ? "destructive" : "ink"}
              disabled={busy || (pending?.change.action === "delete" && deleteText !== "ELIMINAR")}
              onClick={apply}
            >
              {busy ? "Guardando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
