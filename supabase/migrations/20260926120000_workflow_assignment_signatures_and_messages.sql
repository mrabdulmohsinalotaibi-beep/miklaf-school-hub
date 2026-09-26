ALTER TABLE public.plan_tasks
  ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'administrative',
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'assigned';
ALTER TABLE public.plan_tasks
  ADD CONSTRAINT plan_tasks_workflow_status_check
  CHECK (workflow_status IN ('assigned', 'in_progress', 'submitted', 'returned', 'approved'));

CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  field_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  signature_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_tasks
  DROP CONSTRAINT IF EXISTS plan_tasks_template_id_fkey;
ALTER TABLE public.plan_tasks
  ADD CONSTRAINT plan_tasks_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.workflow_templates(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.task_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.plan_tasks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order > 0),
  signer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signer_name TEXT,
  signer_role TEXT NOT NULL,
  signature_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed', 'returned')),
  comment TEXT,
  signed_at TIMESTAMPTZ,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, step_order),
  CHECK (
    status <> 'signed'
    OR (length(trim(coalesce(signer_name, ''))) > 0
      AND length(trim(coalesce(signature_text, ''))) > 0
      AND signed_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  CHECK (sender_id <> recipient_id),
  CHECK (
    (attachment_path IS NULL AND attachment_name IS NULL)
    OR (attachment_path IS NOT NULL AND attachment_name IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS workflow_templates_school_topic_idx
  ON public.workflow_templates (school_id, topic);
CREATE INDEX IF NOT EXISTS task_signatures_task_order_idx
  ON public.task_signatures (task_id, step_order);
CREATE INDEX IF NOT EXISTS task_signatures_signer_status_idx
  ON public.task_signatures (signer_id, status);
CREATE INDEX IF NOT EXISTS internal_messages_recipient_created_idx
  ON public.internal_messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS internal_messages_sender_created_idx
  ON public.internal_messages (sender_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_signatures TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.internal_messages TO authenticated;

ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_read_workflow_task(target_task_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, private
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
            public.is_school_manager(task.school_id)
            OR private.has_role(auth.uid(), 'administrator')
            OR private.has_role(auth.uid(), 'educational_deputy')
            OR private.has_role(auth.uid(), 'school_deputy')
            OR private.has_role(auth.uid(), 'student_affairs_deputy')
            OR task.assigned_to = auth.uid()
            OR task.supervisor_id = auth.uid()
            OR task.created_by = auth.uid()
            OR EXISTS (
              SELECT 1
              FROM public.task_signatures signature
              WHERE signature.task_id = task.id
                AND signature.signer_id = auth.uid()
            )
          )
        )
        OR (
          task.school_id IS NULL
          AND (
            task.created_by = auth.uid()
            OR private.has_role(auth.uid(), 'administrator')
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_workflow_task(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_workflow_task(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_school_reporting_line()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_manager_id UUID;
  next_manager_id UUID;
  manager_school_id UUID;
  manager_status TEXT;
  visited_managers UUID[] := ARRAY[]::UUID[];
BEGIN
  IF NEW.manager_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.manager_id = NEW.id THEN
    RAISE EXCEPTION 'A staff member cannot report to themselves';
  END IF;

  PERFORM school.id
  FROM public.schools school
  WHERE school.id = NEW.school_id
  FOR UPDATE;

  SELECT manager.school_id, manager.status
    INTO manager_school_id, manager_status
  FROM public.school_members manager
  WHERE manager.id = NEW.manager_id;

  IF NOT FOUND
     OR manager_school_id IS DISTINCT FROM NEW.school_id
     OR manager_status <> 'active'
  THEN
    RAISE EXCEPTION 'The reporting manager must be an active member of the same school';
  END IF;

  current_manager_id := NEW.manager_id;
  WHILE current_manager_id IS NOT NULL LOOP
    IF current_manager_id = NEW.id THEN
      RAISE EXCEPTION 'A reporting line cannot create a management cycle';
    END IF;
    IF current_manager_id = ANY(visited_managers) THEN
      RAISE EXCEPTION 'The existing reporting line contains a management cycle';
    END IF;

    visited_managers := array_append(visited_managers, current_manager_id);
    SELECT manager.manager_id
      INTO next_manager_id
    FROM public.school_members manager
    WHERE manager.id = current_manager_id
      AND manager.school_id = NEW.school_id;

    IF NOT FOUND THEN
      EXIT;
    END IF;
    current_manager_id := next_manager_id;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_school_reporting_line() FROM PUBLIC;
DROP TRIGGER IF EXISTS school_members_reporting_line_guard ON public.school_members;
CREATE TRIGGER school_members_reporting_line_guard
  BEFORE INSERT OR UPDATE OF manager_id, school_id ON public.school_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_school_reporting_line();

CREATE POLICY "workflow templates readable by school members"
  ON public.workflow_templates FOR SELECT TO authenticated
  USING (is_default OR public.is_school_member(school_id));
CREATE POLICY "school managers manage custom templates"
  ON public.workflow_templates FOR ALL TO authenticated
  USING (school_id IS NOT NULL AND public.is_school_manager(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.is_school_manager(school_id));

CREATE POLICY "school members read signature chains"
  ON public.task_signatures FOR SELECT TO authenticated
  USING (public.can_read_workflow_task(task_id));
CREATE POLICY "school managers create signature chains"
  ON public.task_signatures FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid()
    AND public.is_school_member(school_id)
    AND (
      public.is_school_manager(school_id)
      OR
      private.has_role(auth.uid(), 'administrator')
      OR private.has_role(auth.uid(), 'educational_deputy')
      OR private.has_role(auth.uid(), 'school_deputy')
      OR private.has_role(auth.uid(), 'student_affairs_deputy')
    )
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
CREATE POLICY "assignees sign their current step"
  ON public.task_signatures FOR UPDATE TO authenticated
  USING (
    signer_id = auth.uid()
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.task_signatures prior
      WHERE prior.task_id = task_signatures.task_id
        AND prior.step_order < task_signatures.step_order
        AND prior.status <> 'signed'
    )
  )
  WITH CHECK (
    signer_id = auth.uid()
    AND status IN ('signed', 'returned')
  );

CREATE OR REPLACE FUNCTION public.guard_signature_step_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['status', 'signer_name', 'signature_text', 'signed_at', 'comment'])
     IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['status', 'signer_name', 'signature_text', 'signed_at', 'comment'])
  THEN
    RAISE EXCEPTION 'A reviewer may only update their signature and comment';
  END IF;
  IF NEW.status = 'signed' AND OLD.status = 'pending' THEN
    NEW.signed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_signatures_update_guard ON public.task_signatures;
CREATE TRIGGER task_signatures_update_guard
  BEFORE UPDATE ON public.task_signatures
  FOR EACH ROW EXECUTE FUNCTION public.guard_signature_step_update();

CREATE POLICY "message participants read"
  ON public.internal_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "school members send internal messages"
  ON public.internal_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_school_member(school_id)
    AND EXISTS (
      SELECT 1 FROM public.school_members recipient
      WHERE recipient.school_id = internal_messages.school_id
        AND recipient.user_id = internal_messages.recipient_id
        AND recipient.status = 'active'
    )
    AND (
      internal_messages.attachment_path IS NULL
      OR (
        split_part(internal_messages.attachment_path, '/', 1)::uuid = internal_messages.school_id
        AND split_part(internal_messages.attachment_path, '/', 2) = internal_messages.sender_id::text
        AND lower(internal_messages.attachment_path) LIKE '%.pdf'
      )
    )
  );
CREATE POLICY "recipient marks message read"
  ON public.internal_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "tasks read" ON public.plan_tasks;
DROP POLICY IF EXISTS "tasks write" ON public.plan_tasks;
DROP POLICY IF EXISTS "tasks write by leadership" ON public.plan_tasks;
CREATE POLICY "school members read relevant tasks"
  ON public.plan_tasks FOR SELECT TO authenticated
  USING (public.can_read_workflow_task(id));
CREATE POLICY "school leadership manage tasks"
  ON public.plan_tasks FOR ALL TO authenticated
  USING (
    public.is_school_member(school_id)
    AND (
      public.is_school_manager(school_id)
      OR private.has_role(auth.uid(), 'administrator')
      OR private.has_role(auth.uid(), 'educational_deputy')
      OR private.has_role(auth.uid(), 'school_deputy')
      OR private.has_role(auth.uid(), 'student_affairs_deputy')
    )
  )
  WITH CHECK (
    public.is_school_member(school_id)
    AND (
      public.is_school_manager(school_id)
      OR private.has_role(auth.uid(), 'administrator')
      OR private.has_role(auth.uid(), 'educational_deputy')
      OR private.has_role(auth.uid(), 'school_deputy')
      OR private.has_role(auth.uid(), 'student_affairs_deputy')
    )
  );
CREATE POLICY "assigned members update their tasks"
  ON public.plan_tasks FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() AND public.is_school_member(school_id))
  WITH CHECK (assigned_to = auth.uid() AND public.is_school_member(school_id));

CREATE OR REPLACE FUNCTION public.guard_assigned_task_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NEW.workflow_status = 'submitted'
     AND OLD.workflow_status IS DISTINCT FROM NEW.workflow_status
     AND NOT (
       jsonb_typeof(NEW.form_data) = 'object'
       AND EXISTS (
         SELECT 1
         FROM public.workflow_templates template
         WHERE template.id = NEW.template_id
           AND NOT EXISTS (
             SELECT 1
             FROM jsonb_array_elements(template.field_schema) field
             WHERE field->>'required' = 'true'
               AND length(trim(coalesce(NEW.form_data->>(field->>'key'), ''))) = 0
           )
       )
     )
  THEN
    RAISE EXCEPTION 'Complete every required field in the workflow form before submitting';
  END IF;

  IF OLD.assigned_to = auth.uid()
     AND NOT (
       public.is_school_manager(OLD.school_id)
       OR private.has_role(auth.uid(), 'administrator')
       OR private.has_role(auth.uid(), 'educational_deputy')
       OR private.has_role(auth.uid(), 'school_deputy')
       OR private.has_role(auth.uid(), 'student_affairs_deputy')
     )
     AND (to_jsonb(NEW) - ARRAY['status', 'progress', 'completed_at', 'form_data', 'workflow_status', 'updated_at'])
       IS DISTINCT FROM
         (to_jsonb(OLD) - ARRAY['status', 'progress', 'completed_at', 'form_data', 'workflow_status', 'updated_at'])
  THEN
    RAISE EXCEPTION 'Assigned members may update progress and complete their own work only';
  END IF;
  IF OLD.assigned_to = auth.uid()
     AND NOT (
       public.is_school_manager(OLD.school_id)
       OR private.has_role(auth.uid(), 'administrator')
       OR private.has_role(auth.uid(), 'educational_deputy')
       OR private.has_role(auth.uid(), 'school_deputy')
       OR private.has_role(auth.uid(), 'student_affairs_deputy')
     )
     AND (
       NEW.status = 'done'
       OR NEW.workflow_status = 'approved'
       OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     )
  THEN
    RAISE EXCEPTION 'Tasks with approval steps are completed by their signature chain';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS plan_tasks_assignee_guard ON public.plan_tasks;
CREATE TRIGGER plan_tasks_assignee_guard
  BEFORE UPDATE ON public.plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.guard_assigned_task_updates();

CREATE OR REPLACE FUNCTION public.guard_message_read_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.recipient_id = auth.uid()
     AND (to_jsonb(NEW) - 'read_at')
       IS DISTINCT FROM
         (to_jsonb(OLD) - 'read_at')
  THEN
    RAISE EXCEPTION 'Recipients may only mark a message as read';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS internal_messages_read_guard ON public.internal_messages;
CREATE TRIGGER internal_messages_read_guard
  BEFORE UPDATE ON public.internal_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_read_update();

CREATE OR REPLACE FUNCTION public.apply_signature_to_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'returned' THEN
    UPDATE public.plan_tasks
    SET workflow_status = 'returned'
    WHERE id = NEW.task_id;
  ELSIF NEW.status = 'signed' AND NOT EXISTS (
    SELECT 1 FROM public.task_signatures remaining
    WHERE remaining.task_id = NEW.task_id
      AND remaining.status <> 'signed'
  ) THEN
    UPDATE public.plan_tasks
    SET workflow_status = 'approved',
        status = 'done',
        progress = 100,
        completed_at = now()
    WHERE id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_signatures_update_task ON public.task_signatures;
CREATE TRIGGER task_signatures_update_task
  AFTER UPDATE OF status ON public.task_signatures
  FOR EACH ROW EXECUTE FUNCTION public.apply_signature_to_task();

INSERT INTO public.workflow_templates
  (template_key, title, topic, field_schema, signature_roles, is_default)
VALUES
  (
    'academic-follow-up',
    'متابعة أكاديمية',
    'academic',
    '[{"key":"goal","label":"الهدف التعليمي","type":"text","required":true},{"key":"actions","label":"الإجراءات المنفذة","type":"textarea","required":true},{"key":"evidence","label":"الشواهد والنتائج","type":"textarea","required":true}]'::jsonb,
    '["المعلم","وكيل الشؤون التعليمية","مدير المدرسة"]'::jsonb,
    true
  ),
  (
    'student-guidance',
    'متابعة إرشادية',
    'guidance',
    '[{"key":"caseSummary","label":"ملخص الحالة","type":"textarea","required":true},{"key":"actionTaken","label":"الإجراء المتخذ","type":"textarea","required":true},{"key":"nextStep","label":"التوصية والخطوة التالية","type":"textarea","required":true}]'::jsonb,
    '["الموجه الطلابي","وكيل شؤون الطلاب","مدير المدرسة"]'::jsonb,
    true
  ),
  (
    'student-affairs',
    'إجراء شؤون الطلاب',
    'student-affairs',
    '[{"key":"reason","label":"سبب الإجراء","type":"textarea","required":true},{"key":"details","label":"التفاصيل","type":"textarea","required":true},{"key":"outcome","label":"النتيجة والمتابعة","type":"textarea","required":true}]'::jsonb,
    '["وكيل شؤون الطلاب","الموجه الطلابي","مدير المدرسة"]'::jsonb,
    true
  ),
  (
    'school-operations',
    'إجراء تشغيلي',
    'operations',
    '[{"key":"request","label":"وصف الطلب أو الإجراء","type":"textarea","required":true},{"key":"responsibleUnit","label":"الجهة المسؤولة","type":"text","required":true},{"key":"completionEvidence","label":"الشاهد على الإنجاز","type":"textarea","required":true}]'::jsonb,
    '["وكيل الشؤون المدرسية","الإدارة","مدير المدرسة"]'::jsonb,
    true
  )
ON CONFLICT (template_key) DO UPDATE
SET title = EXCLUDED.title,
    topic = EXCLUDED.topic,
    field_schema = EXCLUDED.field_schema,
    signature_roles = EXCLUDED.signature_roles,
    is_default = true,
    updated_at = now();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'miklaf-school-pdfs',
  'miklaf-school-pdfs',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "school members upload workflow PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'miklaf-school-pdfs'
    AND public.is_school_member(split_part(name, '/', 1)::uuid)
    AND split_part(name, '/', 2) = auth.uid()::text
    AND lower(name) LIKE '%.pdf'
  );
CREATE POLICY "message participants read workflow PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'miklaf-school-pdfs'
    AND public.is_school_member(split_part(name, '/', 1)::uuid)
    AND (
      split_part(name, '/', 2) = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.internal_messages message
        WHERE message.attachment_path = name
          AND message.school_id = split_part(name, '/', 1)::uuid
          AND (message.sender_id = auth.uid() OR message.recipient_id = auth.uid())
      )
    )
  );
CREATE POLICY "file owners delete workflow PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'miklaf-school-pdfs'
    AND split_part(name, '/', 2) = auth.uid()::text
  );