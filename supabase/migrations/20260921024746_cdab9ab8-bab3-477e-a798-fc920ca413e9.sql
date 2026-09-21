-- enum types
CREATE TYPE public.app_role AS ENUM ('administrator', 'counselor', 'teacher');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE public.case_status AS ENUM ('new', 'in_progress', 'closed');
CREATE TYPE public.case_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'done');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'administrator')) WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "roles readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrator')) WITH CHECK (public.has_role(auth.uid(), 'administrator'));

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'teacher');
  EXCEPTION WHEN others THEN _role := 'teacher';
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- school settings
CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'الثانوية النموذجية',
  stage TEXT NOT NULL DEFAULT 'المرحلة الثانوية',
  city TEXT NOT NULL DEFAULT 'الرياض',
  ministry_id TEXT NOT NULL DEFAULT '2048817',
  academic_year TEXT NOT NULL DEFAULT '1447 هـ / 2026 م',
  term TEXT NOT NULL DEFAULT 'الفصل الدراسي الثاني',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.school_settings TO authenticated;
GRANT ALL ON public.school_settings TO service_role;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.school_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins update settings" ON public.school_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrator')) WITH CHECK (public.has_role(auth.uid(), 'administrator'));
CREATE POLICY "admins insert settings" ON public.school_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrator'));
CREATE TRIGGER school_settings_updated BEFORE UPDATE ON public.school_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_name TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes read" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes write" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  guardian_name TEXT,
  guardian_phone TEXT,
  status TEXT NOT NULL DEFAULT 'منتظم',
  average NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "students write" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  note TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance write" ON public.attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- counseling cases
CREATE TABLE public.counseling_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'سلوكي',
  priority public.case_priority NOT NULL DEFAULT 'medium',
  status public.case_status NOT NULL DEFAULT 'new',
  progress INTEGER NOT NULL DEFAULT 0,
  follow_up_date DATE,
  counselor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counseling_cases TO authenticated;
GRANT ALL ON public.counseling_cases TO service_role;
ALTER TABLE public.counseling_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cases read" ON public.counseling_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "cases write" ON public.counseling_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER cases_updated BEFORE UPDATE ON public.counseling_cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.counseling_cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_notes TO authenticated;
GRANT ALL ON public.case_notes TO service_role;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case notes read" ON public.case_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "case notes write" ON public.case_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  with_person TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT,
  type TEXT NOT NULL DEFAULT 'إرشادي',
  status TEXT NOT NULL DEFAULT 'مجدول',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments read" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointments write" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'الجميع',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements read" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "announcements insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "announcements update own" ON public.announcements FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'administrator')) WITH CHECK (true);
CREATE POLICY "announcements delete own" ON public.announcements FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'administrator'));

-- plan tasks
CREATE TABLE public.plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  status public.task_status NOT NULL DEFAULT 'not_started',
  progress INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_tasks TO authenticated;
GRANT ALL ON public.plan_tasks TO service_role;
ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks read" ON public.plan_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks write" ON public.plan_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tasks_updated BEFORE UPDATE ON public.plan_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed
INSERT INTO public.school_settings (name) VALUES ('الثانوية النموذجية');

INSERT INTO public.classes (id, name, grade, teacher_name, is_demo) VALUES
  ('11111111-1111-4111-8111-000000000001', '١/أ', 'أول ثانوي', 'خالد السبيعي', true),
  ('11111111-1111-4111-8111-000000000002', '١/ب', 'أول ثانوي', 'فيصل الغامدي', true),
  ('11111111-1111-4111-8111-000000000003', '٢/أ', 'ثاني ثانوي', 'سعد المالكي', true),
  ('11111111-1111-4111-8111-000000000004', '٢/ب', 'ثاني ثانوي', 'عمر الرشيد', true),
  ('11111111-1111-4111-8111-000000000005', '٣/أ', 'ثالث ثانوي', 'ماجد العنزي', true),
  ('11111111-1111-4111-8111-000000000006', '٣/ب', 'ثالث ثانوي', 'وليد الجهني', true);

INSERT INTO public.students (id, student_no, full_name, grade, class_id, guardian_name, guardian_phone, status, average, is_demo) VALUES
  ('22222222-2222-4222-8222-000000000001', 'ST-1042', 'فهد الدوسري', 'ثاني ثانوي', '11111111-1111-4111-8111-000000000003', 'سعد الدوسري', '0551234567', 'متابعة إرشادية', 84, true),
  ('22222222-2222-4222-8222-000000000002', 'ST-1078', 'ريان العمري', 'أول ثانوي', '11111111-1111-4111-8111-000000000002', 'ماجد العمري', '0533214598', 'منتظم', 92, true),
  ('22222222-2222-4222-8222-000000000003', 'ST-1103', 'سلطان الحربي', 'ثالث ثانوي', '11111111-1111-4111-8111-000000000005', 'نايف الحربي', '0566554433', 'إنذار غياب', 68, true),
  ('22222222-2222-4222-8222-000000000004', 'ST-1119', 'معاذ الزهراني', 'ثاني ثانوي', '11111111-1111-4111-8111-000000000004', 'علي الزهراني', '0509988776', 'منتظم', 89, true),
  ('22222222-2222-4222-8222-000000000005', 'ST-1150', 'بدر القرني', 'أول ثانوي', '11111111-1111-4111-8111-000000000001', 'سالم القرني', '0544455667', 'متابعة أكاديمية', 78, true),
  ('22222222-2222-4222-8222-000000000006', 'ST-1187', 'يزيد المطيري', 'ثالث ثانوي', '11111111-1111-4111-8111-000000000006', 'فهد المطيري', '0577788990', 'متفوق', 96, true),
  ('22222222-2222-4222-8222-000000000007', 'ST-1204', 'تركي الشهراني', 'ثاني ثانوي', '11111111-1111-4111-8111-000000000004', 'عبدالله الشهراني', '0512233445', 'متابعة أكاديمية', 74, true),
  ('22222222-2222-4222-8222-000000000008', 'ST-1233', 'ناصر البقمي', 'أول ثانوي', '11111111-1111-4111-8111-000000000001', 'مشعل البقمي', '0598877665', 'منتظم', 87, true);

INSERT INTO public.attendance (student_id, date, status, is_demo)
SELECT s.id, d::date,
  CASE WHEN random() < 0.86 THEN 'present'::public.attendance_status
       WHEN random() < 0.6 THEN 'absent'::public.attendance_status
       ELSE 'late'::public.attendance_status END,
  true
FROM public.students s
CROSS JOIN generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day') d
WHERE s.is_demo;

INSERT INTO public.counseling_cases (id, student_id, title, category, priority, status, progress, follow_up_date, is_demo) VALUES
  ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000001', 'متابعة سلوكية داخل الفصل', 'سلوكي', 'high', 'in_progress', 60, CURRENT_DATE + 3, true),
  ('33333333-3333-4333-8333-000000000002', '22222222-2222-4222-8222-000000000003', 'غياب متكرر بدون عذر', 'غياب متكرر', 'high', 'in_progress', 35, CURRENT_DATE + 1, true),
  ('33333333-3333-4333-8333-000000000003', '22222222-2222-4222-8222-000000000007', 'خطة تحسين أكاديمي', 'أكاديمي', 'medium', 'in_progress', 45, CURRENT_DATE + 6, true),
  ('33333333-3333-4333-8333-000000000004', '22222222-2222-4222-8222-000000000005', 'دعم دراسي في الرياضيات', 'أكاديمي', 'low', 'closed', 100, NULL, true),
  ('33333333-3333-4333-8333-000000000005', '22222222-2222-4222-8222-000000000008', 'جلسة تعارف أولية', 'اجتماعي', 'medium', 'new', 15, CURRENT_DATE + 8, true);

INSERT INTO public.case_notes (case_id, body, is_demo) VALUES
  ('33333333-3333-4333-8333-000000000001', 'تم عقد جلسة أولى مع الطالب ومناقشة أسباب السلوك.', true),
  ('33333333-3333-4333-8333-000000000002', 'تم التواصل مع ولي الأمر وتحديد موعد مقابلة.', true);

INSERT INTO public.appointments (title, student_id, with_person, starts_at, location, type, is_demo) VALUES
  ('جلسة متابعة سلوكية', '22222222-2222-4222-8222-000000000001', 'ولي الأمر', CURRENT_DATE + interval '1 day' + interval '8 hours', 'غرفة الإرشاد', 'إرشادي', true),
  ('مقابلة ولي أمر', '22222222-2222-4222-8222-000000000003', 'نايف الحربي', CURRENT_DATE + interval '2 day' + interval '10 hours', 'مكتب الوكيل', 'إداري', true),
  ('خطة تحسين أكاديمي', '22222222-2222-4222-8222-000000000007', 'المعلم المختص', CURRENT_DATE + interval '3 day' + interval '11 hours', 'غرفة الإرشاد', 'أكاديمي', true),
  ('اجتماع مجلس المعلمين', NULL, 'هيئة التدريس', CURRENT_DATE + interval '5 day' + interval '12 hours', 'قاعة الاجتماعات', 'إداري', true);

INSERT INTO public.announcements (title, body, audience, is_demo) VALUES
  ('جدول الاختبارات النهائية', 'تم اعتماد جدول الاختبارات النهائية، يرجى الاطلاع وإبلاغ الطلاب.', 'الجميع', true),
  ('اجتماع الموجهين', 'اجتماع الموجهين الطلابيين يوم الأربعاء بعد الحصة الرابعة.', 'الموجهون', true);

INSERT INTO public.plan_tasks (title, description, owner, status, progress, due_date, is_demo) VALUES
  ('رفع نسبة الحضور إلى 96%', 'تفعيل التواصل اليومي مع أولياء الأمور وبرنامج تحفيزي للفصول المنتظمة.', 'وكيل شؤون الطلاب', 'in_progress', 78, CURRENT_DATE + 30, true),
  ('تحسين المعدل الأكاديمي العام', 'حصص تقوية للمواد الأساسية واختبارات تشخيصية شهرية.', 'وكيلة الشؤون التعليمية', 'in_progress', 54, CURRENT_DATE + 45, true),
  ('تطوير برامج الإرشاد الوقائي', 'ورش المهارات الحياتية ومسح احتياجات الطلاب.', 'الموجه الطلابي', 'not_started', 20, CURRENT_DATE + 60, true);