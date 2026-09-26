-- Scope every school record to one school, enforce permissions in the database,
-- and keep an audit trail plus notifications for the workflow.
--
-- Before this migration the core record tables (students, classes, attendance,
-- counselling, appointments, announcements) were readable and writable by any
-- authenticated account, so hiding a page in the browser was the only thing
-- keeping another school's data out of reach. This migration moves that rule
-- into row level security, where a crafted request cannot bypass it.

-- ---------------------------------------------------------------------------
-- 1. Workspace role helpers (school membership role + global role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_workspace_role(target_school UUID, VARIADIC allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_members member
    WHERE member.school_id = target_school
      AND member.user_id = auth.uid()
      AND member.status = 'active'
      AND member.role = ANY(allowed_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_school(target_school UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Membership in this specific school is the only thing that grants its
  -- records. A global platform role must never open another school's data,
  -- otherwise hiding a page would be the only protection between schools.
  SELECT target_school IS NOT NULL
     AND public.is_school_member(target_school)
     AND (
       public.is_school_manager(target_school)
       OR public.has_workspace_role(target_school, 'administrator', 'educational_deputy', 'school_deputy')
     );
$$;

CREATE OR REPLACE FUNCTION public.can_supervise_school(target_school UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT target_school IS NOT NULL
     AND public.is_school_member(target_school)
     AND (
       public.can_manage_school(target_school)
       OR public.has_workspace_role(target_school, 'student_affairs_deputy')
     );
$$;

-- Counselling details are limited to the counsellor and those the administration
-- grants the role explicitly.
CREATE OR REPLACE FUNCTION public.can_read_counselling(target_school UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT target_school IS NOT NULL
     AND public.is_school_member(target_school)
     AND (
       public.is_school_manager(target_school)
       OR public.has_workspace_role(target_school, 'counselor', 'student_affairs_deputy')
     );
$$;

REVOKE ALL ON FUNCTION public.has_workspace_role(UUID, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_school(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_supervise_school(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_counselling(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_school(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_supervise_school(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_counselling(UUID) TO authenticated;

-- A brand new account explores the platform on the bundled sample data. As
-- soon as it belongs to a school, only that school's records are visible.
CREATE OR REPLACE FUNCTION public.is_any_school_member()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members member
    WHERE member.user_id = auth.uid() AND member.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_any_school_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_any_school_member() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Carry the school on every school record
-- ---------------------------------------------------------------------------
ALTER TABLE public.classes           ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.students          ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.attendance        ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.counseling_cases  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.case_notes        ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.appointments      ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.announcements     ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS classes_school_idx          ON public.classes (school_id);
CREATE INDEX IF NOT EXISTS students_school_idx         ON public.students (school_id);
CREATE INDEX IF NOT EXISTS attendance_school_date_idx  ON public.attendance (school_id, date DESC);
CREATE INDEX IF NOT EXISTS cases_school_status_idx     ON public.counseling_cases (school_id, status);
CREATE INDEX IF NOT EXISTS case_notes_school_idx       ON public.case_notes (school_id);
CREATE INDEX IF NOT EXISTS appointments_school_idx     ON public.appointments (school_id, starts_at);
CREATE INDEX IF NOT EXISTS announcements_school_idx    ON public.announcements (school_id, created_at DESC);

-- Existing rows belong to the sole school that already exists (if any).
DO $$
DECLARE only_school UUID;
BEGIN
  SELECT id INTO only_school FROM public.schools ORDER BY created_at LIMIT 1;
  IF only_school IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.classes           SET school_id = only_school WHERE school_id IS NULL;
  UPDATE public.students          SET school_id = only_school WHERE school_id IS NULL;
  UPDATE public.attendance        SET school_id = only_school WHERE school_id IS NULL;
  UPDATE public.counseling_cases  SET school_id = only_school WHERE school_id IS NULL;
  UPDATE public.appointments      SET school_id = only_school WHERE school_id IS NULL;
  UPDATE public.announcements     SET school_id = only_school WHERE school_id IS NULL;
  UPDATE public.plan_tasks        SET school_id = only_school WHERE school_id IS NULL AND is_demo IS NOT TRUE;
  UPDATE public.case_notes note
     SET school_id = record.school_id
    FROM public.counseling_cases record
   WHERE note.case_id = record.id AND note.school_id IS NULL;
END $$;

-- Keep the school column consistent on child rows so a child record can never
-- be attached to another school's parent.
CREATE OR REPLACE FUNCTION public.stamp_attendance_school()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE parent_school UUID;
BEGIN
  SELECT student.school_id INTO parent_school
  FROM public.students student WHERE student.id = NEW.student_id;
  IF parent_school IS NULL THEN
    RAISE EXCEPTION 'Attendance must reference a student that belongs to a school';
  END IF;
  IF NEW.school_id IS NULL THEN
    NEW.school_id := parent_school;
  ELSIF NEW.school_id <> parent_school THEN
    RAISE EXCEPTION 'Attendance cannot be recorded against another school''s student';
  END IF;
  NEW.recorded_by := COALESCE(auth.uid(), NEW.recorded_by);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.stamp_case_note_school()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE parent_school UUID;
BEGIN
  SELECT record.school_id INTO parent_school
  FROM public.counseling_cases record WHERE record.id = NEW.case_id;
  IF parent_school IS NULL THEN
    RAISE EXCEPTION 'A counselling note must belong to a school case';
  END IF;
  IF NEW.school_id IS NULL THEN
    NEW.school_id := parent_school;
  ELSIF NEW.school_id <> parent_school THEN
    RAISE EXCEPTION 'A counselling note cannot belong to another school''s case';
  END IF;
  NEW.author_id := COALESCE(auth.uid(), NEW.author_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS attendance_stamp_school ON public.attendance;
CREATE TRIGGER attendance_stamp_school BEFORE INSERT OR UPDATE OF student_id ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.stamp_attendance_school();

DROP TRIGGER IF EXISTS case_notes_stamp_school ON public.case_notes;
CREATE TRIGGER case_notes_stamp_school BEFORE INSERT OR UPDATE OF case_id ON public.case_notes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_case_note_school();

-- ---------------------------------------------------------------------------
-- 3. Replace the permissive policies with school-scoped rules
-- ---------------------------------------------------------------------------
ALTER TABLE public.classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_cases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes read" ON public.classes;
DROP POLICY IF EXISTS "classes write" ON public.classes;
DROP POLICY IF EXISTS "classes write by academic staff" ON public.classes;
DROP POLICY IF EXISTS "students read" ON public.students;
DROP POLICY IF EXISTS "students write" ON public.students;
DROP POLICY IF EXISTS "students write by authorized staff" ON public.students;
DROP POLICY IF EXISTS "attendance read" ON public.attendance;
DROP POLICY IF EXISTS "attendance write" ON public.attendance;
DROP POLICY IF EXISTS "attendance write by attendance staff" ON public.attendance;
DROP POLICY IF EXISTS "cases read" ON public.counseling_cases;
DROP POLICY IF EXISTS "cases write" ON public.counseling_cases;
DROP POLICY IF EXISTS "cases write by counseling staff" ON public.counseling_cases;
DROP POLICY IF EXISTS "case notes read" ON public.case_notes;
DROP POLICY IF EXISTS "case notes write" ON public.case_notes;
DROP POLICY IF EXISTS "case notes write by counseling staff" ON public.case_notes;
DROP POLICY IF EXISTS "appointments read" ON public.appointments;
DROP POLICY IF EXISTS "appointments write" ON public.appointments;
DROP POLICY IF EXISTS "appointments write by counseling staff" ON public.appointments;
DROP POLICY IF EXISTS "announcements read" ON public.announcements;
DROP POLICY IF EXISTS "announcements insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements update own" ON public.announcements;
DROP POLICY IF EXISTS "announcements delete own" ON public.announcements;
DROP POLICY IF EXISTS "announcements insert by leadership" ON public.announcements;
DROP POLICY IF EXISTS "announcements update by leadership" ON public.announcements;
DROP POLICY IF EXISTS "announcements delete by leadership" ON public.announcements;
DROP POLICY IF EXISTS "tasks write" ON public.plan_tasks;
DROP POLICY IF EXISTS "tasks write by leadership" ON public.plan_tasks;
DROP POLICY IF EXISTS "school schedules isolated" ON public.school_schedules;
DROP POLICY IF EXISTS "student accountability isolated" ON public.student_accountability;
DROP POLICY IF EXISTS "circulars isolated" ON public.circulars;
DROP POLICY IF EXISTS "student pledges isolated" ON public.student_pledges;

-- Task supervision follows the same leadership set as the rest of the
-- platform: the principal and the three deputies, but not a classroom teacher.
DROP POLICY IF EXISTS "school leadership manage tasks" ON public.plan_tasks;
CREATE POLICY "school leadership manage tasks" ON public.plan_tasks FOR ALL TO authenticated
  USING (public.is_school_member(school_id) AND public.can_supervise_school(school_id))
  WITH CHECK (public.is_school_member(school_id) AND public.can_supervise_school(school_id));

-- A sample dataset (is_demo) without a school stays visible so a brand new
-- account can explore the platform before it creates its school space; real
-- records are only ever reachable by members of their own school.
CREATE POLICY "classes read own school" ON public.classes FOR SELECT TO authenticated
  USING (
    (school_id IS NOT NULL AND public.is_school_member(school_id))
    OR (school_id IS NULL AND is_demo AND NOT public.is_any_school_member())
  );
CREATE POLICY "classes manage by school leadership" ON public.classes FOR ALL TO authenticated
  USING (school_id IS NOT NULL AND public.can_manage_school(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.can_manage_school(school_id));

CREATE POLICY "students read own school" ON public.students FOR SELECT TO authenticated
  USING (
    (school_id IS NOT NULL AND public.is_school_member(school_id))
    OR (school_id IS NULL AND is_demo AND NOT public.is_any_school_member())
  );
CREATE POLICY "students manage by school leadership" ON public.students FOR ALL TO authenticated
  USING (school_id IS NOT NULL AND public.can_supervise_school(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.can_supervise_school(school_id));

CREATE POLICY "attendance read own school" ON public.attendance FOR SELECT TO authenticated
  USING (
    (school_id IS NOT NULL AND public.is_school_member(school_id))
    OR (school_id IS NULL AND is_demo AND NOT public.is_any_school_member())
  );
CREATE POLICY "attendance recorded by school staff" ON public.attendance FOR ALL TO authenticated
  USING (
    school_id IS NOT NULL
    AND public.is_school_member(school_id)
    AND (public.can_supervise_school(school_id) OR public.has_workspace_role(school_id, 'teacher'))
  )
  WITH CHECK (
    school_id IS NOT NULL
    AND public.is_school_member(school_id)
    AND (public.can_supervise_school(school_id) OR public.has_workspace_role(school_id, 'teacher'))
  );

CREATE POLICY "cases read by permitted staff" ON public.counseling_cases FOR SELECT TO authenticated
  USING (public.can_read_counselling(school_id));
CREATE POLICY "cases managed by permitted staff" ON public.counseling_cases FOR ALL TO authenticated
  USING (public.can_read_counselling(school_id))
  WITH CHECK (public.can_read_counselling(school_id));

CREATE POLICY "case notes read by permitted staff" ON public.case_notes FOR SELECT TO authenticated
  USING (public.can_read_counselling(school_id));
CREATE POLICY "case notes written by permitted staff" ON public.case_notes FOR ALL TO authenticated
  USING (public.can_read_counselling(school_id))
  WITH CHECK (public.can_read_counselling(school_id) AND author_id = auth.uid());

CREATE POLICY "appointments read own school" ON public.appointments FOR SELECT TO authenticated
  USING (
    (school_id IS NOT NULL AND public.is_school_member(school_id))
    OR (school_id IS NULL AND is_demo AND NOT public.is_any_school_member())
  );
CREATE POLICY "appointments managed by permitted staff" ON public.appointments FOR ALL TO authenticated
  USING (
    school_id IS NOT NULL
    AND (
      public.can_supervise_school(school_id)
      OR public.has_workspace_role(school_id, 'counselor')
    )
  )
  WITH CHECK (
    school_id IS NOT NULL
    AND (
      public.can_supervise_school(school_id)
      OR public.has_workspace_role(school_id, 'counselor')
    )
  );

CREATE POLICY "announcements read own school" ON public.announcements FOR SELECT TO authenticated
  USING (
    (school_id IS NOT NULL AND public.is_school_member(school_id))
    OR (school_id IS NULL AND is_demo AND NOT public.is_any_school_member())
  );
CREATE POLICY "announcements published by leadership" ON public.announcements FOR ALL TO authenticated
  USING (school_id IS NOT NULL AND public.can_supervise_school(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.can_supervise_school(school_id) AND author_id = auth.uid());

-- Operations records must follow their own school too.
DROP POLICY IF EXISTS "school schedules authenticated" ON public.school_schedules;
DROP POLICY IF EXISTS "student accountability authenticated" ON public.student_accountability;
DROP POLICY IF EXISTS "circulars authenticated" ON public.circulars;
DROP POLICY IF EXISTS "student pledges authenticated" ON public.student_pledges;
CREATE POLICY "schedules follow own school" ON public.school_schedules FOR ALL TO authenticated
  USING (public.is_school_member(school_id) AND public.can_supervise_school(school_id))
  WITH CHECK (public.is_school_member(school_id) AND public.can_supervise_school(school_id));
CREATE POLICY "accountability follows own school" ON public.student_accountability FOR ALL TO authenticated
  USING (public.is_school_member(school_id) AND public.can_supervise_school(school_id))
  WITH CHECK (public.is_school_member(school_id) AND public.can_supervise_school(school_id));
CREATE POLICY "circulars follow own school" ON public.circulars FOR ALL TO authenticated
  USING (public.is_school_member(school_id) AND public.can_supervise_school(school_id))
  WITH CHECK (public.is_school_member(school_id) AND public.can_supervise_school(school_id));
CREATE POLICY "pledges follow own school" ON public.student_pledges FOR ALL TO authenticated
  USING (public.is_school_member(school_id) AND public.can_supervise_school(school_id))
  WITH CHECK (public.is_school_member(school_id) AND public.can_supervise_school(school_id));

-- Accounts may only ever hold one role, and only an administrator changes it.
CREATE OR REPLACE FUNCTION public.guard_role_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
BEGIN
  -- Trusted server-side work (service role, migrations, SQL console) runs
  -- without a request identity; a signed-in account always needs to be an
  -- administrator before it can set anybody's role.
  IF auth.uid() IS NOT NULL
     AND NOT private.has_role(auth.uid(), 'administrator')
     AND NOT EXISTS (
       SELECT 1
       FROM public.school_members member
       WHERE member.user_id = auth.uid()
         AND member.status = 'active'
         AND member.role = 'administrator'
     )
  THEN
    RAISE EXCEPTION 'Only a school administrator may assign roles';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_roles_guard ON public.user_roles;
CREATE TRIGGER user_roles_guard BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_role_assignment();

-- ---------------------------------------------------------------------------
-- 3b. A record created from the interface never needs to name its school: the
--     value is taken from the parent record (student or case) and otherwise
--     from the author's own membership. Row level security then runs against
--     that value, so a client cannot file a record under another school.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_default_school()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  payload JSONB := to_jsonb(NEW);
  parent_school UUID;
BEGIN
  IF payload->>'school_id' IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF payload ? 'student_id' AND payload->>'student_id' IS NOT NULL THEN
    SELECT student.school_id INTO parent_school
    FROM public.students student WHERE student.id = (payload->>'student_id')::uuid;
  END IF;

  IF parent_school IS NULL AND payload ? 'case_id' AND payload->>'case_id' IS NOT NULL THEN
    SELECT record.school_id INTO parent_school
    FROM public.counseling_cases record WHERE record.id = (payload->>'case_id')::uuid;
  END IF;

  IF parent_school IS NULL THEN
    SELECT member.school_id INTO parent_school
    FROM public.school_members member
    WHERE member.user_id = auth.uid() AND member.status = 'active'
    ORDER BY member.joined_at
    LIMIT 1;
  END IF;

  NEW.school_id := parent_school;
  RETURN NEW;
END $$;

DO $$
DECLARE target TEXT;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'students', 'classes', 'counseling_cases', 'appointments', 'announcements',
    'plan_tasks', 'school_schedules', 'student_accountability', 'circulars', 'student_pledges'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', target || '_default_school', target);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.stamp_default_school()',
      target || '_default_school', target
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Workflow history, audit trail and notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.plan_tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS task_events_task_idx ON public.task_events (task_id, created_at DESC);
GRANT SELECT, INSERT ON public.task_events TO authenticated;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task events follow task access" ON public.task_events;
CREATE POLICY "task events follow task access" ON public.task_events FOR SELECT TO authenticated
  USING (public.can_read_workflow_task(task_id));
DROP POLICY IF EXISTS "task events written with the task" ON public.task_events;
CREATE POLICY "task events written with the task" ON public.task_events FOR INSERT TO authenticated
  WITH CHECK (public.can_read_workflow_task(task_id) AND actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_task_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.task_events (school_id, task_id, actor_id, event, to_status)
    VALUES (NEW.school_id, NEW.id, auth.uid(), 'created', NEW.workflow_status);
  ELSIF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
    INSERT INTO public.task_events (school_id, task_id, actor_id, event, from_status, to_status)
    VALUES (NEW.school_id, NEW.id, auth.uid(), 'status_changed', OLD.workflow_status, NEW.workflow_status);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS plan_tasks_history ON public.plan_tasks;
CREATE TRIGGER plan_tasks_history AFTER INSERT OR UPDATE OF workflow_status ON public.plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_event();

CREATE OR REPLACE FUNCTION public.log_signature_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.task_events (school_id, task_id, actor_id, event, to_status, note)
    VALUES (NEW.school_id, NEW.task_id, auth.uid(), 'approval_step_created', NEW.status, NEW.signer_role);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.task_events (school_id, task_id, actor_id, event, to_status, note)
    VALUES (NEW.school_id, NEW.task_id, auth.uid(), 'approval_' || NEW.status, NEW.status, NEW.comment);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS task_signatures_history ON public.task_signatures;
CREATE TRIGGER task_signatures_history AFTER INSERT OR UPDATE OF status ON public.task_signatures
  FOR EACH ROW EXECUTE FUNCTION public.log_signature_event();

-- Generic administrative audit trail for role and membership changes.
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target_school UUID; target_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'school_members' THEN
    target_school := COALESCE(NEW.school_id, OLD.school_id);
    target_id := COALESCE(NEW.id, OLD.id);
  ELSE
    target_school := NULL;
    target_id := COALESCE(NEW.id, OLD.id);
  END IF;
  INSERT INTO public.audit_logs (school_id, user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    target_school,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    target_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS school_members_audit ON public.school_members;
CREATE TRIGGER school_members_audit AFTER INSERT OR UPDATE OR DELETE ON public.school_members
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

DROP TRIGGER IF EXISTS user_roles_audit ON public.user_roles;
CREATE TRIGGER user_roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Notify the assignee when work lands on their desk.
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) THEN
    INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
    VALUES (NEW.school_id, NEW.assigned_to, 'مهمة جديدة مسندة إليك', NEW.title, 'task_assigned');
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.workflow_status = 'returned'
     AND OLD.workflow_status IS DISTINCT FROM 'returned'
     AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
    VALUES (NEW.school_id, NEW.assigned_to, 'أعيدت المهمة للاستكمال', NEW.title, 'task_returned');
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.workflow_status = 'approved'
     AND OLD.workflow_status IS DISTINCT FROM 'approved'
     AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
    VALUES (NEW.school_id, NEW.assigned_to, 'اعتُمدت المهمة', NEW.title, 'task_approved');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS plan_tasks_notify ON public.plan_tasks;
CREATE TRIGGER plan_tasks_notify AFTER INSERT OR UPDATE OF assigned_to, workflow_status ON public.plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignment();

-- Tell the next approver when the chain reaches them, and tell the assignee
-- when a step was returned.
CREATE OR REPLACE FUNCTION public.notify_signature_step()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE task_title TEXT;
BEGIN
  SELECT title INTO task_title FROM public.plan_tasks WHERE id = NEW.task_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.task_signatures prior
      WHERE prior.task_id = NEW.task_id
        AND prior.step_order < NEW.step_order
        AND prior.status <> 'signed'
    ) THEN
      INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
      VALUES (NEW.school_id, NEW.signer_id, 'عمل بانتظار اعتمادك', COALESCE(task_title, 'مهمة'), 'approval_pending');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS task_signatures_notify ON public.task_signatures;
CREATE TRIGGER task_signatures_notify AFTER INSERT ON public.task_signatures
  FOR EACH ROW EXECUTE FUNCTION public.notify_signature_step();

-- The step that opens after a signature is recorded.
CREATE OR REPLACE FUNCTION public.open_next_signature_step()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE task_title TEXT;
BEGIN
  IF NEW.status = 'signed' AND OLD.status IS DISTINCT FROM 'signed' THEN
    SELECT title INTO task_title FROM public.plan_tasks WHERE id = NEW.task_id;
    INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
    SELECT NEW.school_id, next_step.signer_id, 'عمل بانتظار اعتمادك', COALESCE(task_title, 'مهمة'), 'approval_pending'
    FROM public.task_signatures next_step
    WHERE next_step.task_id = NEW.task_id
      AND next_step.step_order > NEW.step_order
      AND next_step.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM public.task_signatures prior
        WHERE prior.task_id = NEW.task_id
          AND prior.step_order < next_step.step_order
          AND prior.status <> 'signed'
      );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS task_signatures_open_next ON public.task_signatures;
CREATE TRIGGER task_signatures_open_next AFTER UPDATE OF status ON public.task_signatures
  FOR EACH ROW EXECUTE FUNCTION public.open_next_signature_step();

CREATE OR REPLACE FUNCTION public.notify_appointment_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
  SELECT NEW.school_id, member.user_id, 'موعد جديد في التقويم', NEW.title, 'appointment_created'
  FROM public.school_members member
  WHERE member.school_id = NEW.school_id
    AND member.status = 'active'
    AND member.role IN ('administrator', 'counselor', 'student_affairs_deputy', 'school_deputy', 'educational_deputy');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS appointments_notify ON public.appointments;
CREATE TRIGGER appointments_notify AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_created();

-- Reminders for upcoming appointments and approaching task due dates. A
-- scheduled job (pg_cron when available) runs this, and the API may call it too.
CREATE OR REPLACE FUNCTION public.queue_due_reminders()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE inserted_count INTEGER := 0;
BEGIN
  WITH inserted AS (
    INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
    SELECT a.school_id, m.user_id, 'تذكير بموعد قريب', a.title, 'appointment_reminder'
    FROM public.appointments a
    JOIN public.school_members m
      ON m.school_id = a.school_id AND m.status = 'active'
     AND m.role IN ('administrator', 'counselor', 'student_affairs_deputy')
    WHERE a.starts_at BETWEEN now() AND now() + interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.school_id = a.school_id
          AND n.recipient_id = m.user_id
          AND n.type = 'appointment_reminder'
          AND n.body = a.title
          AND n.created_at > now() - interval '20 hours'
      )
    RETURNING 1
  )
  SELECT count(*) INTO inserted_count FROM inserted;

  WITH inserted AS (
    INSERT INTO public.notifications (school_id, recipient_id, title, body, type)
    SELECT t.school_id, t.assigned_to, 'موعد استحقاق قريب', t.title, 'task_due_soon'
    FROM public.plan_tasks t
    WHERE t.assigned_to IS NOT NULL
      AND t.due_date IS NOT NULL
      AND t.workflow_status <> 'approved'
      AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 2
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.recipient_id = t.assigned_to
          AND n.type = 'task_due_soon'
          AND n.body = t.title
          AND n.created_at > now() - interval '20 hours'
      )
    RETURNING 1
  )
  SELECT inserted_count + count(*) INTO inserted_count FROM inserted;

  RETURN inserted_count;
END $$;

REVOKE ALL ON FUNCTION public.queue_due_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_due_reminders() TO authenticated;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule('miklaf-due-reminders', '15 * * * *', 'SELECT public.queue_due_reminders();');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable; reminders must be scheduled externally';
END $$;

-- ---------------------------------------------------------------------------
-- 4c. One authoritative way to give somebody a role in a school.
--
-- The interface used to write the platform-wide role table while the school
-- membership kept its own role, so the two could disagree and a deputy would
-- silently lose the access the administrator had just granted. This function
-- is the only supported entry point: it checks the caller, keeps both records
-- in step, and leaves an audit entry.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_member_role(
  target_school UUID,
  target_user UUID,
  new_role TEXT,
  direct_manager UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  resolved_role TEXT := lower(btrim(new_role));
  membership_id UUID;
BEGIN
  -- Assigning a role is the principal's decision; a deputy may edit the
  -- reporting line but not hand out roles.
  IF NOT public.is_school_manager(target_school) THEN
    RAISE EXCEPTION 'Only the school principal may assign roles';
  END IF;

  IF resolved_role NOT IN (
    'administrator', 'educational_deputy', 'school_deputy',
    'student_affairs_deputy', 'counselor', 'teacher'
  ) THEN
    RAISE EXCEPTION 'Unknown role: %', new_role;
  END IF;

  -- Mark the transaction as an approved role change so the guard trigger
  -- below lets this one statement through.
  PERFORM set_config('miklaf.role_change', 'allowed', true);

  UPDATE public.school_members
     SET role = resolved_role,
         manager_id = COALESCE(direct_manager, manager_id)
   WHERE school_id = target_school AND user_id = target_user
  RETURNING id INTO membership_id;

  IF membership_id IS NULL THEN
    RAISE EXCEPTION 'This account is not a member of the school';
  END IF;

  -- Keep the platform role in step so both readings of a role agree.
  DELETE FROM public.user_roles WHERE user_id = target_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user, resolved_role::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN resolved_role;
END $$;

REVOKE ALL ON FUNCTION public.set_member_role(UUID, UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_role(UUID, UUID, TEXT, UUID) TO authenticated;

-- The workspace role is always read from the membership of that one school.
CREATE OR REPLACE FUNCTION public.has_workspace_role(target_school UUID, VARIADIC allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_members member
    WHERE member.school_id = target_school
      AND member.user_id = auth.uid()
      AND member.status = 'active'
      AND member.role = ANY(allowed_roles)
  );
$$;

-- A role may only change through set_member_role above. Without this, a member
-- of staff could promote themselves by editing their own membership row.
CREATE OR REPLACE FUNCTION public.guard_member_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(current_setting('miklaf.role_change', true), '') <> 'allowed' THEN
    RAISE EXCEPTION 'Change a role through set_member_role so it is checked and recorded';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS school_members_guard_role ON public.school_members;
CREATE TRIGGER school_members_guard_role BEFORE UPDATE ON public.school_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_member_role_change();

-- ---------------------------------------------------------------------------
-- 5. Keep the school settings row per school and readable by its members
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4b. Dependencies that still trusted a global role instead of the school
--     membership, which let an administrator outside the school through.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_read_workflow_task(target_task_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.plan_tasks task
    WHERE task.id = target_task_id
      AND (
        (
          task.school_id IS NOT NULL
          AND public.is_school_member(task.school_id)
          AND (
            public.can_supervise_school(task.school_id)
            OR task.assigned_to = auth.uid()
            OR task.supervisor_id = auth.uid()
            OR task.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.task_signatures signature
              WHERE signature.task_id = task.id
                AND signature.signer_id = auth.uid()
            )
          )
        )
        OR (
          task.school_id IS NULL
          AND (task.created_by = auth.uid() OR task.assigned_to = auth.uid())
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_workflow_task(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_workflow_task(UUID) TO authenticated;

DROP POLICY IF EXISTS "school managers create signature chains" ON public.task_signatures;
CREATE POLICY "school managers create signature chains" ON public.task_signatures FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid()
    AND public.is_school_member(school_id)
    AND public.can_supervise_school(school_id)
    AND EXISTS (
      SELECT 1 FROM public.plan_tasks task
      WHERE task.id = task_signatures.task_id
        AND task.school_id = task_signatures.school_id
    )
    AND EXISTS (
      SELECT 1 FROM public.school_members signer
      WHERE signer.school_id = task_signatures.school_id
        AND signer.user_id = task_signatures.signer_id
        AND signer.status = 'active'
    )
  );

DROP POLICY IF EXISTS "workflow templates readable by school members" ON public.workflow_templates;
DROP POLICY IF EXISTS "school managers manage custom templates" ON public.workflow_templates;
CREATE POLICY "workflow templates readable by school members" ON public.workflow_templates FOR SELECT TO authenticated
  USING (is_default OR (school_id IS NOT NULL AND public.is_school_member(school_id)));
CREATE POLICY "school managers manage custom templates" ON public.workflow_templates FOR ALL TO authenticated
  USING (school_id IS NOT NULL AND public.can_supervise_school(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.can_supervise_school(school_id));

-- Membership changes are a school-level administrative action.
DROP POLICY IF EXISTS "members manager write" ON public.school_members;
CREATE POLICY "members manager write" ON public.school_members FOR UPDATE TO authenticated
  USING (public.can_manage_school(school_id))
  WITH CHECK (public.can_manage_school(school_id));
CREATE POLICY "members manager insert" ON public.school_members FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_school(school_id));

DROP POLICY IF EXISTS "requests read own or manager" ON public.membership_requests;
DROP POLICY IF EXISTS "requests manager review" ON public.membership_requests;
CREATE POLICY "requests read own or manager" ON public.membership_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_school(school_id));
CREATE POLICY "requests manager review" ON public.membership_requests FOR UPDATE TO authenticated
  USING (public.can_manage_school(school_id))
  WITH CHECK (public.can_manage_school(school_id));

-- Audit entries stay inside their own school.
DROP POLICY IF EXISTS "audit member read" ON public.audit_logs;
CREATE POLICY "audit member read" ON public.audit_logs FOR SELECT TO authenticated
  USING (school_id IS NULL AND user_id = auth.uid() OR public.can_manage_school(school_id));

-- Notifications persist for the recipient and inside their own school.
DROP POLICY IF EXISTS "notifications recipient" ON public.notifications;
CREATE POLICY "notifications recipient" ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());
CREATE POLICY "notifications visible to school managers" ON public.notifications FOR SELECT TO authenticated
  USING (school_id IS NOT NULL AND public.can_manage_school(school_id) AND recipient_id = auth.uid());

DROP POLICY IF EXISTS "settings readable" ON public.school_settings;
DROP POLICY IF EXISTS "admins update settings" ON public.school_settings;
DROP POLICY IF EXISTS "admins insert settings" ON public.school_settings;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
CREATE POLICY "settings readable by members" ON public.school_settings FOR SELECT TO authenticated
  USING (school_id IS NULL OR public.is_school_member(school_id));
CREATE POLICY "settings written by leadership" ON public.school_settings FOR ALL TO authenticated
  USING (school_id IS NOT NULL AND public.can_manage_school(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.can_manage_school(school_id));
