CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT (auth.role()='service_role' OR _user_id=auth.uid()) AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role); $$;
REVOKE ALL ON public.admin_account_status, public.admin_audit, public.perfil_spotify_playlists FROM anon;
REVOKE ALL ON public.admin_account_status, public.admin_audit FROM authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.perfil_spotify_playlists TO authenticated;
GRANT ALL ON public.admin_account_status, public.admin_audit, public.perfil_spotify_playlists TO service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;