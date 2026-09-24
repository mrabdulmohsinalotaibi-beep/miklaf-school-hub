ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS recurrence TEXT;
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS evidence_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES public.plan_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.task_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES public.plan_tasks(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access TEXT NOT NULL DEFAULT 'read', status TEXT NOT NULL DEFAULT 'submitted', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL, report_type TEXT NOT NULL DEFAULT 'monthly', period_start DATE, period_end DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'draft', submitted_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.report_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID, title TEXT, summary TEXT, sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'submitted', comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, file_url TEXT NOT NULL, file_type TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_tasks, public.task_comments, public.task_shares, public.reports, public.report_items, public.approvals, public.attachments TO authenticated;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task comments participants" ON public.task_comments FOR ALL TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.plan_tasks t WHERE t.id = task_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid()))) WITH CHECK (user_id = auth.uid());
CREATE POLICY "task shares participants" ON public.task_shares FOR ALL TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "reports members" ON public.reports FOR ALL TO authenticated USING (public.is_school_member(school_id) OR created_by = auth.uid()) WITH CHECK (public.is_school_member(school_id) OR created_by = auth.uid());
CREATE POLICY "report items members" ON public.report_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND (r.created_by = auth.uid() OR public.is_school_member(r.school_id)))) WITH CHECK (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND (r.created_by = auth.uid() OR public.is_school_member(r.school_id))));
CREATE POLICY "approvals participants" ON public.approvals FOR ALL TO authenticated USING (sender_id = auth.uid() OR reviewer_id = auth.uid() OR public.is_school_member(school_id)) WITH CHECK (sender_id = auth.uid() OR public.is_school_member(school_id));
CREATE POLICY "attachments members" ON public.attachments FOR ALL TO authenticated USING (uploaded_by = auth.uid() OR public.is_school_member(school_id)) WITH CHECK (uploaded_by = auth.uid() OR public.is_school_member(school_id));
