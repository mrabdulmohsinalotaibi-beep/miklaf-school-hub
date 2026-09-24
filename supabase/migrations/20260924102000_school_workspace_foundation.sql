CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  education_stage TEXT,
  education_type TEXT,
  city TEXT,
  education_department TEXT,
  district TEXT,
  school_year TEXT,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on DATE,
  ends_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS public.school_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'custom',
  manager_id UUID REFERENCES public.school_members(id) ON DELETE SET NULL,
  acting_manager_id UUID REFERENCES public.school_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id, status)
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.school_members(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL DEFAULT true,
  scope TEXT NOT NULL DEFAULT 'own',
  UNIQUE (member_id, permission_key)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_school_member(target_school UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = target_school AND user_id = auth.uid() AND status = 'active') $$;

CREATE OR REPLACE FUNCTION public.is_school_manager(target_school UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = target_school AND user_id = auth.uid() AND status = 'active' AND role IN ('administrator', 'مدير مدرسة', 'admin')) $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools, public.academic_years, public.school_members, public.membership_requests, public.permissions, public.member_permissions, public.notifications, public.audit_logs TO authenticated;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools member read" ON public.schools FOR SELECT TO authenticated USING (public.is_school_member(id) OR created_by = auth.uid());
CREATE POLICY "schools owner write" ON public.schools FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "academic years member" ON public.academic_years FOR ALL TO authenticated USING (public.is_school_member(school_id)) WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "members same school" ON public.school_members FOR SELECT TO authenticated USING (public.is_school_member(school_id) OR user_id = auth.uid());
CREATE POLICY "members manager write" ON public.school_members FOR UPDATE TO authenticated USING (public.is_school_manager(school_id)) WITH CHECK (public.is_school_manager(school_id));
CREATE POLICY "requests read own or manager" ON public.membership_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_school_manager(school_id));
CREATE POLICY "requests create" ON public.membership_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "requests manager review" ON public.membership_requests FOR UPDATE TO authenticated USING (public.is_school_manager(school_id)) WITH CHECK (public.is_school_manager(school_id));
CREATE POLICY "permissions read" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "member permissions manager" ON public.member_permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.school_members m WHERE m.id = member_id AND public.is_school_manager(m.school_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.school_members m WHERE m.id = member_id AND public.is_school_manager(m.school_id)));
CREATE POLICY "notifications recipient" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "notifications update recipient" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "audit member read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_school_member(school_id));

INSERT INTO public.permissions (key, label, category) VALUES
  ('programs.view', 'مشاهدة البرامج', 'البرامج'), ('programs.create', 'إنشاء البرامج', 'البرامج'), ('programs.approve', 'اعتماد البرامج', 'البرامج'),
  ('records.view', 'مشاهدة السجلات', 'السجلات'), ('records.create', 'إنشاء السجلات', 'السجلات'), ('records.submit', 'إرسال السجلات', 'السجلات'),
  ('reports.view', 'مشاهدة التقارير', 'التقارير'), ('reports.create', 'إنشاء التقارير', 'التقارير'), ('reports.approve', 'اعتماد التقارير', 'التقارير'), ('reports.export', 'تصدير التقارير', 'التقارير'),
  ('tasks.view', 'مشاهدة المهام', 'المهام'), ('tasks.create', 'إنشاء المهام', 'المهام'), ('tasks.assign', 'إسناد المهام', 'المهام')
ON CONFLICT (key) DO NOTHING;
