ALTER TABLE public.school_schedules ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.student_accountability ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.circulars ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.student_pledges ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "school schedules authenticated" ON public.school_schedules;
DROP POLICY IF EXISTS "student accountability authenticated" ON public.student_accountability;
DROP POLICY IF EXISTS "circulars authenticated" ON public.circulars;
DROP POLICY IF EXISTS "student pledges authenticated" ON public.student_pledges;

CREATE POLICY "school schedules isolated" ON public.school_schedules FOR ALL TO authenticated
  USING (public.is_school_member(school_id)) WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "student accountability isolated" ON public.student_accountability FOR ALL TO authenticated
  USING (public.is_school_member(school_id)) WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "circulars isolated" ON public.circulars FOR ALL TO authenticated
  USING (public.is_school_member(school_id)) WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "student pledges isolated" ON public.student_pledges FOR ALL TO authenticated
  USING (public.is_school_member(school_id)) WITH CHECK (public.is_school_member(school_id));

CREATE INDEX IF NOT EXISTS school_schedules_school_id_idx ON public.school_schedules(school_id);
CREATE INDEX IF NOT EXISTS student_accountability_school_id_idx ON public.student_accountability(school_id);
CREATE INDEX IF NOT EXISTS circulars_school_id_idx ON public.circulars(school_id);
CREATE INDEX IF NOT EXISTS student_pledges_school_id_idx ON public.student_pledges(school_id);
