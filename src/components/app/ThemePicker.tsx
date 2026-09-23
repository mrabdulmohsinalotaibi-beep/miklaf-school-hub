import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, type AppTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SWATCH: Record<AppTheme, string> = {
  thaat: "bg-theme-thaat",
  royal: "bg-theme-royal",
  sage: "bg-theme-sage",
  amber: "bg-theme-amber",
};

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  if (compact) {
    return (
      <div className="flex items-center gap-1" aria-label="اختيار لون المنصة">
        <Palette className="size-4 text-muted-foreground" />
        {THEMES.map((item) => (
          <button key={item.id} type="button" title={item.name} aria-label={item.name} onClick={() => setTheme(item.id)} className={cn("size-5 rounded-full border-2 border-card shadow-sm", SWATCH[item.id], theme === item.id && "ring-2 ring-primary ring-offset-2")}>{theme === item.id && <Check className="mx-auto size-3 text-white" />}</button>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="ألوان المنصة">
      {THEMES.map((item) => (
        <Button key={item.id} type="button" variant="outline" role="radio" aria-checked={theme === item.id} onClick={() => setTheme(item.id)} className={cn("h-auto min-h-20 justify-start whitespace-normal p-3 text-right", theme === item.id && "border-primary ring-2 ring-primary/20")}>
          <span className={cn("size-8 shrink-0 rounded-full border-4 border-card shadow-sm", SWATCH[item.id])} />
          <span className="min-w-0 flex-1 font-bold">{item.name}</span>
          {theme === item.id && <Check className="size-4 shrink-0 text-primary" />}
        </Button>
      ))}
    </div>
  );
}
