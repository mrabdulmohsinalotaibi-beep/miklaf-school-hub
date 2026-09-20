// Demo dataset for مِكلاف. Replace with live data when a database is connected.

export type Tone = "rose" | "sea" | "gold" | "leaf";

export const school = {
  name: "الثانوية النموذجية",
  stage: "المرحلة الثانوية",
  city: "الرياض",
  ministryId: "2048817",
  year: "1447 هـ / 2026 م",
  term: "الفصل الدراسي الثاني",
};

export const stats = [
  { label: "إجمالي الطلاب", value: "486", delta: "+12", note: "مقارنة بالفصل الماضي", tone: "sea" as Tone, spark: [40, 52, 46, 61, 58, 72, 80] },
  { label: "نسبة الحضور اليوم", value: "94.2%", delta: "+1.8%", note: "متوسط الأسبوع 92.6%", tone: "leaf" as Tone, spark: [70, 64, 78, 72, 86, 82, 94] },
  { label: "حالات إرشادية نشطة", value: "23", delta: "-4", note: "أُغلقت 9 حالات هذا الشهر", tone: "rose" as Tone, spark: [60, 72, 66, 58, 54, 48, 44] },
  { label: "إنجاز الخطة التشغيلية", value: "68%", delta: "+6%", note: "34 مهمة من أصل 50", tone: "gold" as Tone, spark: [30, 38, 44, 48, 55, 62, 68] },
];

export const attendanceTrend = [
  { day: "الأحد", حضور: 92, غياب: 8 },
  { day: "الإثنين", حضور: 95, غياب: 5 },
  { day: "الثلاثاء", حضور: 91, غياب: 9 },
  { day: "الأربعاء", حضور: 96, غياب: 4 },
  { day: "الخميس", حضور: 94, غياب: 6 },
];

export const gradeDistribution = [
  { grade: "أول ثانوي", طلاب: 168, معدل: 88 },
  { grade: "ثاني ثانوي", طلاب: 162, معدل: 85 },
  { grade: "ثالث ثانوي", طلاب: 156, معدل: 90 },
];

export const activities = [
  { title: "تم تسجيل غياب 12 طالبًا في الحصة الثالثة", who: "نظام الحضور", time: "قبل 10 دقائق", tone: "rose" as Tone },
  { title: "اعتماد خطة الإرشاد الشهرية من قِبل مدير المدرسة", who: "محمد العتيبي", time: "قبل ساعة", tone: "leaf" as Tone },
  { title: "إضافة اختبار الرياضيات النهائي إلى التقويم", who: "سارة القحطاني", time: "قبل 3 ساعات", tone: "gold" as Tone },
  { title: "فتح حالة إرشادية جديدة للطالب فهد الدوسري", who: "عبدالله الشمري", time: "أمس", tone: "sea" as Tone },
  { title: "رفع تقرير الأداء الأكاديمي للفصل الأول", who: "إدارة المدرسة", time: "أمس", tone: "sea" as Tone },
];

export const students = [
  { id: "ST-1042", name: "فهد الدوسري", grade: "ثاني ثانوي", section: "٢/أ", attendance: 88, average: 84, status: "متابعة إرشادية", guardian: "0551234567" },
  { id: "ST-1078", name: "ريان العمري", grade: "أول ثانوي", section: "١/ب", attendance: 97, average: 92, status: "منتظم", guardian: "0533214598" },
  { id: "ST-1103", name: "سلطان الحربي", grade: "ثالث ثانوي", section: "٣/أ", attendance: 74, average: 68, status: "إنذار غياب", guardian: "0566554433" },
  { id: "ST-1119", name: "معاذ الزهراني", grade: "ثاني ثانوي", section: "٢/ج", attendance: 95, average: 89, status: "منتظم", guardian: "0509988776" },
  { id: "ST-1150", name: "بدر القرني", grade: "أول ثانوي", section: "١/أ", attendance: 91, average: 78, status: "متابعة أكاديمية", guardian: "0544455667" },
  { id: "ST-1187", name: "يزيد المطيري", grade: "ثالث ثانوي", section: "٣/ب", attendance: 99, average: 96, status: "متفوق", guardian: "0577788990" },
  { id: "ST-1204", name: "تركي الشهراني", grade: "ثاني ثانوي", section: "٢/ب", attendance: 83, average: 74, status: "متابعة أكاديمية", guardian: "0512233445" },
  { id: "ST-1233", name: "ناصر البقمي", grade: "أول ثانوي", section: "١/ج", attendance: 96, average: 87, status: "منتظم", guardian: "0598877665" },
];

export const classes = [
  { name: "١/أ", teacher: "خالد السبيعي", students: 28, attendance: 95 },
  { name: "١/ب", teacher: "فيصل الغامدي", students: 27, attendance: 92 },
  { name: "٢/أ", teacher: "سعد المالكي", students: 30, attendance: 89 },
  { name: "٢/ب", teacher: "عمر الرشيد", students: 29, attendance: 93 },
  { name: "٣/أ", teacher: "ماجد العنزي", students: 26, attendance: 90 },
  { name: "٣/ب", teacher: "وليد الجهني", students: 25, attendance: 97 },
];

export const counselingCases = [
  { id: "CS-204", student: "فهد الدوسري", type: "سلوكي", priority: "عالية", counselor: "عبدالله الشمري", opened: "12 فبراير", sessions: 4, progress: 60, status: "قيد المتابعة" },
  { id: "CS-207", student: "سلطان الحربي", type: "غياب متكرر", priority: "عالية", counselor: "عبدالله الشمري", opened: "18 فبراير", sessions: 3, progress: 35, status: "قيد المتابعة" },
  { id: "CS-211", student: "تركي الشهراني", type: "أكاديمي", priority: "متوسطة", counselor: "سارة القحطاني", opened: "24 فبراير", sessions: 2, progress: 45, status: "قيد المتابعة" },
  { id: "CS-198", student: "بدر القرني", type: "أكاديمي", priority: "منخفضة", counselor: "سارة القحطاني", opened: "3 فبراير", sessions: 6, progress: 100, status: "مغلقة" },
  { id: "CS-215", student: "ناصر البقمي", type: "اجتماعي", priority: "متوسطة", counselor: "عبدالله الشمري", opened: "1 مارس", sessions: 1, progress: 15, status: "جديدة" },
];

export const sessions = [
  { time: "٠٨:٣٠", student: "فهد الدوسري", topic: "جلسة متابعة سلوكية", place: "غرفة الإرشاد" },
  { time: "١٠:٠٠", student: "سلطان الحربي", topic: "مقابلة ولي الأمر", place: "مكتب الوكيل" },
  { time: "١١:١٥", student: "تركي الشهراني", topic: "خطة تحسين أكاديمي", place: "غرفة الإرشاد" },
  { time: "١٢:٤٠", student: "ناصر البقمي", topic: "جلسة تعارف أولية", place: "غرفة الإرشاد" },
];

export const calendarEvents = [
  { day: 3, title: "اجتماع مجلس المعلمين", type: "إداري", tone: "sea" as Tone },
  { day: 7, title: "بداية اختبارات المنتصف", type: "اختبار", tone: "rose" as Tone },
  { day: 11, title: "اليوم العالمي للغة العربية", type: "فعالية", tone: "gold" as Tone },
  { day: 14, title: "لقاء أولياء الأمور", type: "إرشادي", tone: "leaf" as Tone },
  { day: 18, title: "تسليم درجات أعمال السنة", type: "أكاديمي", tone: "sea" as Tone },
  { day: 22, title: "ورشة المهارات الدراسية", type: "إرشادي", tone: "leaf" as Tone },
  { day: 26, title: "بداية الاختبارات النهائية", type: "اختبار", tone: "rose" as Tone },
];

export const conversations = [
  { id: "c1", name: "عبدالله الشمري", role: "الموجه الطلابي", last: "أرسلت لك ملخص الحالات النشطة.", time: "٠٩:٤٠", unread: 2 },
  { id: "c2", name: "سارة القحطاني", role: "وكيلة الشؤون التعليمية", last: "هل نعتمد جدول الاختبارات؟", time: "أمس", unread: 0 },
  { id: "c3", name: "مجموعة المعلمين", role: "١٨ عضوًا", last: "تم رفع خطة الدروس الأسبوعية.", time: "أمس", unread: 5 },
  { id: "c4", name: "خالد السبيعي", role: "معلم رياضيات", last: "أحتاج تقرير غياب صف ١/أ.", time: "الأحد", unread: 0 },
];

export const messageThread = [
  { from: "them", text: "صباح الخير، أرسلت لك ملخص الحالات الإرشادية النشطة لهذا الأسبوع.", time: "٠٩:٣١" },
  { from: "me", text: "صباح النور، وصلني الملخص. كم عدد الحالات ذات الأولوية العالية؟", time: "٠٩:٣٤" },
  { from: "them", text: "حالتان: فهد الدوسري وسلطان الحربي، وكلاهما يحتاج مقابلة ولي أمر.", time: "٠٩:٣٦" },
  { from: "me", text: "ممتاز. نسّق المقابلات يوم الأربعاء بعد الحصة الرابعة.", time: "٠٩:٤٠" },
];

export const planGoals = [
  {
    title: "رفع نسبة الحضور إلى 96%",
    owner: "وكيل شؤون الطلاب",
    due: "نهاية الفصل الثاني",
    progress: 78,
    tasks: [
      { name: "تفعيل التواصل اليومي مع أولياء الأمور", status: "مكتملة" },
      { name: "برنامج تحفيزي للفصول المنتظمة", status: "قيد التنفيذ" },
      { name: "تقرير أسبوعي للغياب المتكرر", status: "قيد التنفيذ" },
    ],
  },
  {
    title: "تحسين المعدل الأكاديمي العام",
    owner: "وكيلة الشؤون التعليمية",
    due: "١٥ أبريل",
    progress: 54,
    tasks: [
      { name: "حصص تقوية للمواد الأساسية", status: "قيد التنفيذ" },
      { name: "اختبارات تشخيصية شهرية", status: "مكتملة" },
      { name: "تدريب المعلمين على التقويم البنائي", status: "لم تبدأ" },
    ],
  },
  {
    title: "تطوير برامج الإرشاد الوقائي",
    owner: "الموجه الطلابي",
    due: "٣٠ مايو",
    progress: 41,
    tasks: [
      { name: "ورش المهارات الحياتية", status: "قيد التنفيذ" },
      { name: "مسح احتياجات الطلاب", status: "مكتملة" },
      { name: "شراكة مع مركز التنمية الأسرية", status: "لم تبدأ" },
    ],
  },
];

export const reportCards = [
  { title: "تقرير الحضور الشهري", desc: "تفصيل الحضور والغياب لكل فصل ومرحلة.", rows: 486, updated: "اليوم" },
  { title: "تقرير الأداء الأكاديمي", desc: "المعدلات والدرجات حسب المادة والصف.", rows: 312, updated: "أمس" },
  { title: "تقرير الحالات الإرشادية", desc: "الحالات المفتوحة والمغلقة ونتائج الجلسات.", rows: 47, updated: "قبل يومين" },
  { title: "تقرير الخطة التشغيلية", desc: "نسب الإنجاز لكل هدف ومهمة مسندة.", rows: 50, updated: "قبل 3 أيام" },
];

export const subjectPerformance = [
  { subject: "رياضيات", معدل: 82 },
  { subject: "لغة عربية", معدل: 90 },
  { subject: "علوم", معدل: 86 },
  { subject: "إنجليزي", معدل: 79 },
  { subject: "دراسات", معدل: 92 },
];

export const roles = [
  { name: "مدير المدرسة", key: "principal", members: 1, desc: "صلاحية كاملة على جميع الوحدات والتقارير." },
  { name: "الموجه الطلابي", key: "counselor", members: 2, desc: "إدارة الحالات الإرشادية والجلسات والتقارير المرتبطة." },
  { name: "المعلم", key: "teacher", members: 18, desc: "تسجيل الحضور والدرجات لفصوله والاطلاع على التقويم." },
  { name: "الإداري", key: "admin", members: 4, desc: "سجل الطلاب، الرسائل، والخطة التشغيلية." },
];

export const permissionMatrix = [
  { module: "لوحة المتابعة", principal: "كامل", counselor: "قراءة", teacher: "قراءة", admin: "قراءة" },
  { module: "سجل الطلاب", principal: "كامل", counselor: "قراءة", teacher: "جزئي", admin: "كامل" },
  { module: "الإرشاد الطلابي", principal: "كامل", counselor: "كامل", teacher: "محظور", admin: "قراءة" },
  { module: "التقويم المدرسي", principal: "كامل", counselor: "جزئي", teacher: "قراءة", admin: "كامل" },
  { module: "الرسائل", principal: "كامل", counselor: "كامل", teacher: "كامل", admin: "كامل" },
  { module: "الخطة التشغيلية", principal: "كامل", counselor: "جزئي", teacher: "قراءة", admin: "جزئي" },
  { module: "التقارير", principal: "كامل", counselor: "جزئي", teacher: "محظور", admin: "قراءة" },
  { module: "الصلاحيات والأدوار", principal: "كامل", counselor: "محظور", teacher: "محظور", admin: "محظور" },
];

export const toneClasses: Record<Tone, { bg: string; text: string; bar: string }> = {
  rose: { bg: "bg-rose-soft", text: "text-rose", bar: "bg-rose" },
  sea: { bg: "bg-sea-soft", text: "text-sea", bar: "bg-sea" },
  gold: { bg: "bg-gold-soft", text: "text-accent-foreground", bar: "bg-gold" },
  leaf: { bg: "bg-leaf-soft", text: "text-leaf", bar: "bg-leaf" },
};
