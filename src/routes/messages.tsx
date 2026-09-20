import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/miklaf/AppShell";
import { Panel } from "@/components/miklaf/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { conversations, messageThread } from "@/lib/miklaf-data";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "التواصل والرسائل — مِكلاف" },
      { name: "description", content: "تواصل داخلي بين المعلمين والإدارة والموجهين الطلابيين." },
      { property: "og:title", content: "التواصل والرسائل — مِكلاف" },
      {
        property: "og:description",
        content: "تواصل داخلي بين المعلمين والإدارة والموجهين الطلابيين.",
      },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]!.id);
  const [thread, setThread] = useState(messageThread);
  const [draft, setDraft] = useState("");

  const active = conversations.find((item) => item.id === activeId) ?? conversations[0]!;

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setThread((prev) => [
      ...prev,
      { from: "me", text: draft.trim(), time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setDraft("");
    toast.success("تم إرسال الرسالة");
  };

  return (
    <AppShell title="التواصل والرسائل">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Panel title="المحادثات" className="h-fit">
          <div className="space-y-2">
            {conversations.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-right transition ${
                  activeId === item.id ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy font-display text-sm font-black text-gold">
                  {item.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{item.name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{item.time}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{item.last}</div>
                </div>
                {item.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Panel>

        <section className="panel flex min-h-[560px] flex-col">
          <header className="flex items-center gap-3 border-b border-border p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy font-display text-sm font-black text-gold">
              {active.name.slice(0, 1)}
            </div>
            <div>
              <div className="text-sm font-bold">{active.name}</div>
              <div className="text-[11px] text-muted-foreground">{active.role}</div>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {thread.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.from === "me" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.from === "me"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-muted"
                  }`}
                >
                  {message.text}
                  <div
                    className={`mt-1 text-[10px] ${message.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-4">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="اكتب رسالتك..."
            />
            <Button type="submit" size="icon" aria-label="إرسال">
              <Send size={16} />
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
