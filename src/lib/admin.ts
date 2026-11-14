export const adminRoles = ["alumno", "profesor", "local", "admin"] as const;
export type AdminRole = (typeof adminRoles)[number];
export const roleNames: Record<AdminRole, string> = { alumno: "Alumno", profesor: "Profe / escuela", local: "Local", admin: "Administrador" };

export function assertAdminAccess(isAdmin: boolean, active: boolean) {
  if (!isAdmin || !active) throw new Error("Acceso reservado a administradores");
}
export function assertOtherAccount(actor: string, target: string) {
  if (actor === target) throw new Error("No puedes modificar tu propia cuenta desde este panel");
}
export function safeEvidenceLink(url: string) {
  try { return new URL(url).protocol === "https:"; } catch { return false; }
}