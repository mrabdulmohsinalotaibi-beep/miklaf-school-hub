import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  Bell,
  CheckCircle2,
  Clock3,
  Inbox as InboxIcon,
  Send,
  ShieldCheck,
} from "lucide-react";

import { PageHeader, Panel, Chip, EmptyState, LoadingCards } from "@/components/app/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/inbox")({ component: InboxPage });

function InboxPage() {
  const { user } = useAuth();
  const notifications = useQuery({
    queryKey: ["inbox-notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  if (notifications.isLoading) return <LoadingCards count={4} />;
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="الوارد والصادر"
        description="مكان واحد للأعمال المرسلة إليك، والتنبيهات، وحالات المراجعة والاعتماد."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "الوارد والصادر" }]}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["الوارد", notifications.data?.length ?? 0, InboxIcon, "sea"],
          ["للمراجعة", "—", ShieldCheck, "gold"],
          ["المعتمد", "—", CheckCircle2, "leaf"],
          ["المتأخر", "—", Clock3, "rose"],
        ].map(([label, value, Icon, tone]) => (
          <div key={String(label)} className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Chip tone={tone as "sea" | "gold" | "leaf" | "rose"}>
                <Icon size={14} />
              </Chip>
            </div>
            <div className="mt-3 text-3xl font-black">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="الوارد" description="الإشعارات والأعمال التي تحتاج اطلاعك">
          <ul className="space-y-3">
            {(notifications.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Bell size={20} />}
                title="لا يوجد وارد جديد"
                description="ستظهر هنا المهام والتقارير التي تُرسل إليك."
              />
            ) : (
              notifications.data?.map((item) => (
                <li key={item.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">{item.title}</div>
                    <Chip tone={item.read_at ? "muted" : "sea"}>
                      {item.read_at ? "مقروء" : "جديد"}
                    </Chip>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body ?? "بدون تفاصيل"}</p>
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="الصادر" description="ما أرسلته للرئيس المباشر أو للمراجعة">
          <EmptyState
            icon={<Send size={20} />}
            title="لا يوجد صادر بعد"
            description="من صفحات المهام والتقارير استخدم إجراء إرسال للرئيس المباشر."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4">
              <Archive size={17} className="mb-2 text-primary" />
              <div className="font-bold">مصدر واحد للبيانات</div>
              <div className="mt-1 text-xs text-muted-foreground">
                المشاركة لا تنسخ السجل، بل تنشئ صلاحية قراءة أو مراجعة عليه.
              </div>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <ShieldCheck size={17} className="mb-2 text-primary" />
              <div className="font-bold">سلسلة اعتماد</div>
              <div className="mt-1 text-xs text-muted-foreground">
                إرسال، مراجعة، إعادة، اعتماد، أو أرشفة.
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
