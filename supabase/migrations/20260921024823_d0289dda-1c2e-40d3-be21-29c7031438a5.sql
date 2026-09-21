CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR private.has_role(auth.uid(), 'administrator')) WITH CHECK (auth.uid() = id OR private.has_role(auth.uid(), 'administrator'));

DROP POLICY "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'administrator')) WITH CHECK (private.has_role(auth.uid(), 'administrator'));

DROP POLICY "admins update settings" ON public.school_settings;
CREATE POLICY "admins update settings" ON public.school_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'administrator')) WITH CHECK (private.has_role(auth.uid(), 'administrator'));

DROP POLICY "admins insert settings" ON public.school_settings;
CREATE POLICY "admins insert settings" ON public.school_settings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'administrator'));

DROP POLICY "announcements update own" ON public.announcements;
CREATE POLICY "announcements update own" ON public.announcements FOR UPDATE TO authenticated USING (auth.uid() = author_id OR private.has_role(auth.uid(), 'administrator')) WITH CHECK (true);

DROP POLICY "announcements delete own" ON public.announcements;
CREATE POLICY "announcements delete own" ON public.announcements FOR DELETE TO authenticated USING (auth.uid() = author_id OR private.has_role(auth.uid(), 'administrator'));

DROP FUNCTION public.has_role(uuid, public.app_role);