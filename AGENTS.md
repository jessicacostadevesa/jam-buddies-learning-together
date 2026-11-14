<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Musician profile data lives in `perfiles` + join tables (perfil_instrumentos, perfil_estilos, disponibilidad); roles in `user_roles` set by signup trigger from metadata `rol`. Why: one profile feeds all features and roles must not be user-editable.
- Role-specific profile data lives in owner-only 1:1 tables keyed by perfil_id; fiscal data and verification evidence allow owner/admin reads. Public teacher cards use only the column-allowlisted directorio_profes_publico RPC. Why: directory discovery must not grant direct access to private profile records.
- Spotify uses optional PKCE consent and one-time server-bound state; persist only explicitly selected artists and playlists under owner RLS (shown publicly only via the directory RPC allowlist), never Spotify tokens or listening history. Why: users control their selection without exposing account access.
- Administration uses authenticated server functions that re-check the active admin role before loading privileged clients; account suspension applies restrictive RLS and hides public directory entries, role changes are serialized and audited, and self-modification is denied. Why: UI gates alone cannot secure privileged actions or revoke existing sessions.
