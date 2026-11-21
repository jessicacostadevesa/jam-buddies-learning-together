import { execFileSync } from "node:child_process";

function lovableCliAvailable() {
  try {
    execFileSync("lovable", ["--help"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
import { describe, expect, it } from "vitest";

function query(sql: string) {
  return JSON.parse(execFileSync("lovable", ["supabase", "query", "--json", sql], { encoding: "utf8" })).rows as Record<string, unknown>[];
}

// Needs the Lovable CLI to query the live database; skipped where it is absent (e.g. GitHub Actions).
describe.skipIf(!lovableCliAvailable())("Live database privacy protections", () => {
  it("keeps Spotify authorization state inaccessible to app users", () => {
    const rows = query("SELECT has_table_privilege('anon','public.spotify_oauth_sessions','SELECT') AS anon_read, has_table_privilege('authenticated','public.spotify_oauth_sessions','SELECT') AS user_read");
    expect(rows).toEqual([{ anon_read: false, user_read: false }]);
  }, 60000);
  it("scopes every private read policy to the owner (or authorized fiscal/evidence reviewer)", () => {
    const rows = query(`SELECT tablename, cmd, qual, roles::text FROM pg_policies WHERE schemaname='public' AND permissive='PERMISSIVE' AND tablename NOT IN ('estilos','instrumentos') AND cmd IN ('SELECT','ALL')`);
    expect(rows.length).toBeGreaterThanOrEqual(16);
    for (const row of rows) {
      expect(row["roles"]).toBe("{authenticated}");
      expect(String(row["qual"])).toContain("auth.uid() =");
      expect(row["qual"]).not.toBe("true");
    }
  }, 60000);

  it("denies anonymous table access to private records", () => {
    const rows = query(`SELECT c.relname, c.relrowsecurity, has_table_privilege('anon',c.oid,'SELECT') AS anonymous_read FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN ('estilos','instrumentos')`);
    expect(rows.length).toBeGreaterThanOrEqual(16);
    for (const row of rows) {
      expect(row["relrowsecurity"]).toBe(true);
      expect(row["anonymous_read"]).toBe(false);
    }
  }, 60000);

  it("exposes only the professional card allowlist through the directory", () => {
    const rows = query("SELECT proargnames FROM pg_proc WHERE oid='public.directorio_profes_publico()'::regprocedure");
    expect(rows.length).toBe(1);
    for (const row of rows) {
      expect((row["proargnames"] as string[]).sort()).toEqual(["id","nombre","ciudad","zona","bio","titular","anios","niveles","modalidades","precio","instrumentos","estilos","verificado","esEscuela","artistas","playlists"].sort());
    }
  }, 60000);
  it("restricts role checks to the caller or privileged service", () => {
    const rows = query("SELECT pg_get_functiondef('public.has_role(uuid,public.app_role)'::regprocedure) AS body");
    expect(String(rows[0]?.["body"])).toContain("_user_id=auth.uid()");
  }, 60000);
  it("requires active accounts even with existing sessions", () => {
    const rows = query("SELECT count(*)::int AS protected FROM pg_policies WHERE schemaname='public' AND policyname='Active account required' AND permissive='RESTRICTIVE'");
    expect(Number(rows[0]?.["protected"])).toBe(20);
  }, 60000);
});