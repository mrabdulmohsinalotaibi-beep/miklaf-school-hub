CREATE TABLE IF NOT EXISTS public.school_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'مدرسي',
  schedule_date DATE,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'مسودة',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_accountability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'سلوكية',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'مفتوحة',
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  audience TEXT NOT NULL DEFAULT 'الجميع',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'نشط',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  pledge_type TEXT NOT NULL DEFAULT 'تعهد سلوكي',
  pledge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ساري',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_schedules, public.student_accountability, public.circulars, public.student_pledges TO authenticated;
ALTER TABLE public.school_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_accountability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school schedules authenticated" ON public.school_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "student accountability authenticated" ON public.student_accountability FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "circulars authenticated" ON public.circulars FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "student pledges authenticated" ON public.student_pledges FOR ALL TO authenticated USING (true) WITH CHECK (true);
