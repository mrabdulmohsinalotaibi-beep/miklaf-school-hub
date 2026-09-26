import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Props = {
  phone?: string | null;
  message?: string;
  label?: string;
  compact?: boolean;
  className?: string;
};

/** Opens a WhatsApp conversation with a pre-filled message. */
export function WhatsAppButton({ phone, message, label = "واتساب", compact = false, className }: Props) {
  const href = whatsappUrl(phone, message);
  if (!href) return null;
  return (
    <Button
      asChild
      size={compact ? "icon" : "sm"}
      variant="outline"
      className={cn(
        "border-[#25D366]/40 text-[#168c45] hover:bg-[#25D366]/10 hover:text-[#11733a]",
        className,
      )}
      title={`فتح واتساب على الرقم ${phone}`}
    >
      <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
        <MessageCircle size={compact ? 16 : 15} />
        {!compact && label}
      </a>
    </Button>
  );
}
