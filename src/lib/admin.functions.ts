import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminRoles, assertAdminAccess, assertOtherAccount } from "@/lib/admin";

export const adminAccess = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const active = await context.supabase.rpc("current_account_active");
    return { allowed: !error && data === true && active.data === true };
  });

export const adminOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const active = await context.supabase.rpc("current_account_active");
    assertAdminAccess(!role.error && role.data === true, !active.error && active.data === true);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const allUsers = [];
    for (let page = 1; ; page++) {
      const result = await sb.auth.admin.listUsers({ page, perPage: 1000 });
      if (result.error) throw new Error("No se pudieron consultar las cuentas");
      allUsers.push(...result.data.users);
      if (result.data.users.length < 1000) break;
    }
    const [profiles, roles, status, teachers, evidence, verification, venues, audit] = await Promise.all([
      sb.from("perfiles").select("id,nombre,ciudad"), sb.from("user_roles").select("user_id,role"),
      sb.from("admin_account_status").select("user_id,suspended"),
      sb.from("profesor_detalles").select("perfil_id,titular,metodologia,experiencia,formacion,es_escuela"),
      sb.from("profesor_evidencias").select("id,perfil_id,tipo,titulo,url,storage_path"),
      sb.from("profesor_verificacion").select("perfil_id,verificado"),
      sb.from("local_detalles").select("perfil_id,tipos,direccion,precio_hora_ensayo,organiza_jams,organiza_conciertos"),
      sb.from("admin_audit").select("id,actor_id,target_id,action,detail,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if ([profiles,roles,status,teachers,evidence,verification,venues,audit].some(r => r.error)) throw new Error("No se pudo cargar la administración");
    return {
      users: allUsers.map(u => ({ id: u.id, email: u.email ?? "", name: profiles.data?.find(p => p.id === u.id)?.nombre ?? "Sin nombre", city: profiles.data?.find(p => p.id === u.id)?.ciudad ?? "", roles: roles.data?.filter(r => r.user_id === u.id).map(r => r.role).sort((a, b) => Number(b === "admin") - Number(a === "admin")) ?? [], providers: [...new Set((u.identities ?? []).map(i => i.provider))], confirmed: !!u.email_confirmed_at, suspended: status.data?.some(s => s.user_id === u.id && s.suspended) || (!!u.banned_until && new Date(u.banned_until).getTime() > Date.now()), created: u.created_at })),
      teachers: (teachers.data ?? []).filter(t => roles.data?.some(r => r.user_id === t.perfil_id && r.role === "profesor")).map(t => ({ ...t, name: profiles.data?.find(p => p.id === t.perfil_id)?.nombre ?? "Profe", verified: verification.data?.some(v => v.perfil_id === t.perfil_id && v.verificado) ?? false, evidence: evidence.data?.filter(e => e.perfil_id === t.perfil_id) ?? [] })),
      venues: (venues.data ?? []).filter(v => roles.data?.some(r => r.user_id === v.perfil_id && r.role === "local")).map(v => ({ ...v, name: profiles.data?.find(p => p.id === v.perfil_id)?.nombre ?? "Local" })),
      audit: audit.data ?? [],
    };
  });

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), target: z.string().uuid(), role: z.enum(adminRoles) }),
  z.object({ action: z.literal("suspend"), target: z.string().uuid() }),
  z.object({ action: z.literal("activate"), target: z.string().uuid() }),
  z.object({ action: z.literal("delete"), target: z.string().uuid() }),
  z.object({ action: z.literal("verify"), target: z.string().uuid(), verified: z.boolean() }),
]);
export const adminChange = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(i => actionSchema.parse(i)).handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const active = await context.supabase.rpc("current_account_active");
    assertAdminAccess(!role.error && role.data === true, !active.error && active.data === true);
    assertOtherAccount(context.userId, data.target);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const target = await sb.auth.admin.getUserById(data.target);
    if (target.error || !target.data.user) throw new Error("La cuenta ya no existe");
    const targetRoles = await sb.from("user_roles").select("role").eq("user_id", data.target);
    if (targetRoles.error) throw new Error("No se pudo comprobar la cuenta");
    // Administrator peers are protected from suspension/deletion; revoke the role first.
    if (["suspend","delete"].includes(data.action) && targetRoles.data.some(r => r.role === "admin")) throw new Error("Cambia primero el rol de esa cuenta administradora");
    if (data.action === "role") {
      const result = await sb.rpc("admin_set_role", { actor: context.userId, target: data.target, new_role: data.role });
      if (result.error) throw new Error("No se pudo cambiar el rol");
      return { ok: true };
    }
    if (data.action === "suspend" || data.action === "activate") {
      const suspended = data.action === "suspend";
      // Lock RLS first on suspension; on activation unlock only after Auth succeeds.
      if (suspended) {
        const lock = await sb.from("admin_account_status").upsert({ user_id: data.target, suspended: true, updated_at: new Date().toISOString() });
        if (lock.error) throw new Error("No se pudo bloquear la cuenta");
      }
      const change = await sb.auth.admin.updateUserById(data.target, { ban_duration: suspended ? "876000h" : "none" });
      if (change.error) throw new Error("No se pudo actualizar el acceso; revisa el estado de la cuenta");
      if (!suspended) {
        const unlock = await sb.from("admin_account_status").upsert({ user_id: data.target, suspended: false, updated_at: new Date().toISOString() });
        if (unlock.error) throw new Error("No se pudo reactivar la cuenta");
      }
    } else if (data.action === "verify") {
      if (!targetRoles.data.some(r => r.role === "profesor")) throw new Error("Solo se pueden verificar profesores");
      const result = await sb.from("profesor_verificacion").upsert({ perfil_id: data.target, verificado: data.verified, verificado_at: data.verified ? new Date().toISOString() : null });
      if (result.error) throw new Error("No se pudo actualizar la verificación");
    } else {
      const files = await sb.from("profesor_evidencias").select("storage_path").eq("perfil_id", data.target);
      if (files.error) throw new Error("No se pudieron consultar los documentos");
      const paths = (files.data ?? []).flatMap(e => e.storage_path ? [e.storage_path] : []);
      if (paths.length) { const removed = await sb.storage.from("evidencias").remove(paths); if (removed.error) throw new Error("No se pudieron eliminar los documentos"); }
      const sessions = await sb.from("spotify_oauth_sessions").delete().eq("user_id", data.target);
      if (sessions.error) throw new Error("No se pudo cancelar la conexión de Spotify");
      const result = await sb.auth.admin.deleteUser(data.target);
      if (result.error) throw new Error("No se pudo eliminar la cuenta");
    }
    const log = await sb.from("admin_audit").insert({ actor_id: context.userId, target_id: data.target, action: data.action, detail: data.action === "verify" ? String(data.verified) : null });
    if (log.error) throw new Error("Acción aplicada, pero no se pudo registrar. Revisa la cuenta antes de repetirla");
    return { ok: true };
  });

export const adminEvidence = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(i => z.object({ id: z.string().uuid() }).parse(i)).handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const active = await context.supabase.rpc("current_account_active");
    assertAdminAccess(!role.error && role.data === true, !active.error && active.data === true);
    const { data: evidence, error } = await context.supabase.from("profesor_evidencias").select("storage_path").eq("id", data.id).single();
    if (error || !evidence.storage_path) throw new Error("Documento no disponible");
    const signed = await context.supabase.storage.from("evidencias").createSignedUrl(evidence.storage_path, 60);
    if (signed.error) throw new Error("No se pudo abrir el documento");
    return { url: signed.data.signedUrl };
  });