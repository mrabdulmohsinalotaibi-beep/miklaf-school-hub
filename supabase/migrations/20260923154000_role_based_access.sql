-- Add operational school roles.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'educational_deputy';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_deputy';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student_affairs_deputy';

-- Keep read access broad for authenticated staff, but restrict writes by responsibility.
DROP POLICY IF EXISTS "classes write" ON public.classes;
CREATE POLICY "classes write by academic staff" ON public.classes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'educational_deputy') OR private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'educational_deputy') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "students write" ON public.students;
CREATE POLICY "students write by authorized staff" ON public.students FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'educational_deputy') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy') OR private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'educational_deputy') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "attendance write" ON public.attendance;
CREATE POLICY "attendance write by attendance staff" ON public.attendance FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy') OR private.has_role(auth.uid(), 'teacher'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "cases write" ON public.counseling_cases;
CREATE POLICY "cases write by counseling staff" ON public.counseling_cases FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'counselor') OR private.has_role(auth.uid(), 'student_affairs_deputy'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'counselor') OR private.has_role(auth.uid(), 'student_affairs_deputy'));

DROP POLICY IF EXISTS "case notes write" ON public.case_notes;
CREATE POLICY "case notes write by counseling staff" ON public.case_notes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'counselor') OR private.has_role(auth.uid(), 'student_affairs_deputy'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'counselor') OR private.has_role(auth.uid(), 'student_affairs_deputy'));

DROP POLICY IF EXISTS "appointments write" ON public.appointments;
CREATE POLICY "appointments write by counseling staff" ON public.appointments FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'counselor') OR private.has_role(auth.uid(), 'student_affairs_deputy'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'counselor') OR private.has_role(auth.uid(), 'student_affairs_deputy'));

DROP POLICY IF EXISTS "tasks write" ON public.plan_tasks;
CREATE POLICY "tasks write by leadership" ON public.plan_tasks FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'educational_deputy') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy'))
  WITH CHECK (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'educational_deputy') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy'));

DROP POLICY IF EXISTS "announcements insert" ON public.announcements;
CREATE POLICY "announcements insert by leadership" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = author_id) AND (private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy')));

DROP POLICY IF EXISTS "announcements update own" ON public.announcements;
CREATE POLICY "announcements update by leadership" ON public.announcements FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy'))
  WITH CHECK (auth.uid() = author_id OR private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy'));

DROP POLICY IF EXISTS "announcements delete own" ON public.announcements;
CREATE POLICY "announcements delete by leadership" ON public.announcements FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR private.has_role(auth.uid(), 'administrator') OR private.has_role(auth.uid(), 'school_deputy') OR private.has_role(auth.uid(), 'student_affairs_deputy'));
