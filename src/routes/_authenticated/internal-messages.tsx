import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Inbox, Mail, Paperclip, Plus, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Chip, EmptyState, ErrorState, LoadingRows, PageHeader, Panel } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/internal-messages")({
  head: () => ({
    meta: [
      { title: "المراسلات الداخلية — مِكلاف" },
      { name: "description", content: "مراسلات خاصة بين منسوبي المدرسة مع إرفاق ملفات PDF." },
      { property: "og:title", content: "المراسلات الداخلية — مِكلاف" },
      { property: "og:description", content: "أرسل رسالة داخلية أو شارك ملف PDF مع عضو في المدرسة." },
    ],
  }),
  component: InternalMessagesPage,
});

type MessageRecord = {
  id: string;
  school_id: string;
  sender_id: string;
  recipient_id: string;
  title: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  read_at: string | null;
};
type MessagePerson = { id: string; user_id: string; full_name: string; email: string };

function InternalMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [box, setBox] = useState<"inbox" | "sent">("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);

  const schoolQuery = useQuery({
    queryKey: ["internal-messages-school", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id,name")
        .order("created_at")
        .limit(1);
      if (error) throw new Error(error.message);
      return data?.[0] ?? null;
    },
  });
  const school = schoolQuery.data;
  const peopleQuery = useQuery({
    queryKey: ["internal-messages-people", school?.id],
    enabled: Boolean(school?.id),
    queryFn: async () => {
      const { data: members, error: memberError } = await supabase
        .from("school_members")
        .select("id,user_id")
        .eq("school_id", school!.id)
        .eq("status", "active");
      if (memberError) throw new Error(memberError.message);
      const ids = (members ?? []).map((member) => member.user_id);
      if (!ids.length) return [] as MessagePerson[];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", ids);
      if (profileError) throw new Error(profileError.message);
      const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      return (members ?? []).map((member) => ({
        id: member.id,
        user_id: member.user_id,
        full_name: byId.get(member.user_id)?.full_name ?? "",
        email: byId.get(member.user_id)?.email ?? "",
      })) as MessagePerson[];
    },
  });
  const messagesQuery = useQuery({
    queryKey: ["internal-messages", user?.id, school?.id],
    enabled: Boolean(user?.id && school?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MessageRecord[];
    },
  });
  const messages = messagesQuery.data ?? [];
  const people = peopleQuery.data ?? [];
  const peopleById = useMemo(() => new Map(people.map((person) => [person.user_id, person])), [people]);
  const filteredMessages = messages.filter((message) =>
    box === "inbox" ? message.recipient_id === user?.id : message.sender_id === user?.id,
  );
  const unreadCount = messages.filter(
    (message) => message.recipient_id === user?.id && !message.read_at,
  ).length;

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!school?.id || !user?.id) throw new Error("تعذر تحديد المدرسة أو المستخدم.");
      if (!recipientId || recipientId === user.id) throw new Error("اختر مستلمًا آخر من أعضاء المدرسة.");
      if (!title.trim() || !body.trim()) throw new Error("العنوان ونص الرسالة مطلوبان.");
      if (pdf && (pdf.type !== "application/pdf" || !pdf.name.toLowerCase().endsWith(".pdf")))
        throw new Error("يمكن إرفاق ملف PDF فقط.");
      if (pdf && pdf.size > 10 * 1024 * 1024) throw new Error("حجم ملف PDF يجب ألا يتجاوز 10 ميغابايت.");

      let attachmentPath: string | null = null;
      if (pdf) {
        attachmentPath = `${school.id}/${user.id}/${crypto.randomUUID()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("miklaf-school-pdfs")
          .upload(attachmentPath, pdf, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw new Error(uploadError.message);
      }

      const { error } = await supabase.from("internal_messages").insert({
        school_id: school.id,
        sender_id: user.id,
        recipient_id: recipientId,
        title: title.trim(),
        body: body.trim(),
        attachment_path: attachmentPath,
        attachment_name: pdf?.name ?? null,
      });
      if (error) {
        if (attachmentPath) await supabase.storage.from("miklaf-school-pdfs").remove([attachmentPath]);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("تم إرسال الرسالة.");
      setComposeOpen(false);
      setRecipientId("");
      setTitle("");
      setBody("");
      setPdf(null);
      void queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("internal_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["internal-messages"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const sharePdf = async (message: MessageRecord) => {
    if (!message.attachment_path) return;
    const { data, error } = await supabase.storage
      .from("miklaf-school-pdfs")
      .createSignedUrl(message.attachment_path, 120);
    if (error) {
      toast.error(error.message);
      return;
    }

    try {
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error("تعذر تحميل ملف PDF.");
      const file = new File([await response.blob()], message.attachment_name || "مرفق.pdf", {
        type: "application/pdf",
      });
      const shareData = { files: [file], title: message.title, text: message.body };
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return;
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("تم تنزيل الملف لمشاركته.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "تعذر مشاركة ملف PDF.");
    }
  };

  if (schoolQuery.isLoading) return <LoadingRows />;
  if (schoolQuery.isError) return <ErrorState />;
  if (!school) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader title="المراسلات الداخلية" description="رسائل خاصة بين أعضاء المدرسة ومشاركة PDF." />
        <Panel>
          <EmptyState
            icon={<Mail size={20} />}
            title="أنشئ مساحة المدرسة أولًا"
            description="المراسلات خاصة بأعضاء المدرسة المسجلين."
            action={<Button asChild><Link to="/school">إعداد المدرسة</Link></Button>}
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="المراسلات الداخلية"
        description="تواصل مباشر مع أعضاء المدرسة وأرفق ملفات PDF خاصة."
        crumbs={[{ label: "الرئيسية", to: "/dashboard" }, { label: "المراسلات" }]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to="/messages">الإعلانات العامة</Link></Button>
            <Button onClick={() => setComposeOpen(true)} data-testid="button-compose-message">
              <Plus size={16} /> رسالة جديدة
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setBox("inbox")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${box === "inbox" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          data-testid="tab-inbox"
        >
          <Inbox size={15} /> الوارد {unreadCount > 0 && <span className="rounded-full bg-background/20 px-2">{unreadCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setBox("sent")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${box === "sent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          data-testid="tab-sent"
        >
          <Send size={15} /> المرسل
        </button>
      </div>

      {(peopleQuery.isError || messagesQuery.isError) && <ErrorState />}
      {(peopleQuery.isLoading || messagesQuery.isLoading) && <LoadingRows />}
      <div className="space-y-3">
        {filteredMessages.map((message) => {
          const otherId = box === "inbox" ? message.sender_id : message.recipient_id;
          const otherPerson = peopleById.get(otherId);
          const unread = box === "inbox" && !message.read_at;
          return (
            <Panel key={message.id} className={unread ? "border-primary/50" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-sm font-black">{message.title}</h2>
                    {unread && <Chip tone="gold">جديدة</Chip>}
                    {message.attachment_path && <Chip tone="sea"><FileText size={13} /> PDF</Chip>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {box === "inbox" ? "من" : "إلى"}: {otherPerson?.full_name || otherPerson?.email || otherId}
                    {" · "}{formatDateTime(message.created_at)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{message.body}</p>
                  {message.attachment_path && (
                    <button
                      type="button"
                      className="mt-3 flex max-w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
                      onClick={() => void sharePdf(message)}
                      data-testid={`button-share-pdf-${message.id}`}
                    >
                      <Paperclip size={15} />
                      <span className="truncate">{message.attachment_name || "ملف PDF"}</span>
                      <Share2 size={15} className="shrink-0 text-primary" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {unread && (
                    <Button size="sm" variant="outline" onClick={() => markRead.mutate(message.id)} data-testid={`button-mark-read-${message.id}`}>
                      تحديد كمقروءة
                    </Button>
                  )}
                  {message.attachment_path && (
                    <Button size="icon" variant="ghost" aria-label="مشاركة ملف PDF" onClick={() => void sharePdf(message)}>
                      <Download size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
        {filteredMessages.length === 0 && (
          <Panel>
            <EmptyState
              icon={<Mail size={20} />}
              title={box === "inbox" ? "الوارد فارغ" : "لا توجد رسائل مرسلة"}
              description={box === "inbox" ? "ستظهر الرسائل الخاصة هنا عند وصولها." : "ستظهر الرسائل التي ترسلها هنا."}
              action={box === "sent" ? <Button onClick={() => setComposeOpen(true)}><Plus size={15} /> رسالة جديدة</Button> : undefined}
            />
          </Panel>
        )}
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>رسالة داخلية جديدة</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage.mutate();
            }}
          >
            <div>
              <Label htmlFor="message-recipient">إلى</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger id="message-recipient" data-testid="select-message-recipient">
                  <SelectValue placeholder="اختر عضوًا في المدرسة" />
                </SelectTrigger>
                <SelectContent>
                  {people.filter((person) => person.user_id !== user?.id).map((person) => (
                    <SelectItem key={person.user_id} value={person.user_id}>
                      {person.full_name || person.email || person.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message-title">العنوان</Label>
              <Input id="message-title" value={title} onChange={(event) => setTitle(event.target.value)} required data-testid="input-message-title" />
            </div>
            <div>
              <Label htmlFor="message-body">نص الرسالة</Label>
              <Textarea id="message-body" value={body} onChange={(event) => setBody(event.target.value)} rows={5} required data-testid="input-message-body" />
            </div>
            <div>
              <Label htmlFor="message-pdf">إرفاق ملف PDF (اختياري، حتى 10 ميغابايت)</Label>
              <Input
                id="message-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setPdf(event.target.files?.[0] ?? null)}
                data-testid="input-message-pdf"
              />
              {pdf && (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Paperclip size={13} /> {pdf.name}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={sendMessage.isPending || !recipientId} data-testid="button-send-message">
                <Send size={15} /> {sendMessage.isPending ? "جارٍ الإرسال..." : "إرسال"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}