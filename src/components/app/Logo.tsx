import { cn } from "@/lib/utils";

/**
 * The single brand mark for the whole platform.
 *
 * Every variant renders the client's supplied logo artwork (`/brand/*`), never a
 * letter stand-in, so the identity stays identical in the sidebar, the header,
 * the avatar, the auth screens, printed reports and social previews.
 */
export type LogoVariant = "full" | "wordmark" | "avatar";
export type LogoTone = "brand" | "light";
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const SOURCES: Record<LogoVariant, Record<LogoTone, string>> = {
  full: {
    brand: "/brand/miklaf-logo.png",
    light: "/brand/miklaf-logo-light.png",
  },
  wordmark: {
    brand: "/brand/miklaf-wordmark.png",
    light: "/brand/miklaf-wordmark-light.png",
  },
  avatar: {
    brand: "/brand/avatar.png",
    light: "/brand/avatar-transparent.png",
  },
};

const HEIGHTS: Record<LogoSize, string> = {
  xs: "h-7",
  sm: "h-9",
  md: "h-12",
  lg: "h-16",
  xl: "h-24",
};

/** Aspect ratios of the source files, kept so nothing ever stretches. */
const RATIOS: Record<LogoVariant, number> = {
  full: 2866 / 2745,
  wordmark: 2866 / 1704,
  avatar: 1,
};

export function Logo({
  variant = "wordmark",
  tone = "brand",
  size = "md",
  alt = "شعار منصة مِكلاف",
  className,
  ...rest
}: {
  variant?: LogoVariant;
  tone?: LogoTone;
  size?: LogoSize;
  alt?: string;
  className?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "className">) {
  const ratio = RATIOS[variant];
  return (
    <img
      src={SOURCES[variant][tone]}
      alt={alt}
      width={Math.round(Number(HEIGHTS[size].replace("h-", "")) * 4 * ratio)}
      height={Number(HEIGHTS[size].replace("h-", "")) * 4}
      className={cn(HEIGHTS[size], "w-auto shrink-0 select-none", className)}
      style={{ aspectRatio: String(ratio) }}
      draggable={false}
      decoding="async"
      {...rest}
    />
  );
}

/**
 * Logo plus the platform name and its descriptor, used in headers and footers.
 */
export function BrandLockup({
  tone = "brand",
  size = "sm",
  showTagline = true,
  subtitle = "منصة إدارة المدرسة",
  className,
}: {
  tone?: LogoTone;
  size?: LogoSize;
  showTagline?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Logo variant="wordmark" tone={tone} size={size} />
      {showTagline && (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-display text-base font-black",
              tone === "light" ? "text-navy-foreground" : "text-foreground",
            )}
          >
            مِكلاف
          </span>
          <span
            className={cn(
              "text-[10px] tracking-[0.16em]",
              tone === "light" ? "text-navy-foreground/60" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </span>
        </span>
      )}
    </span>
  );
}

/** Circular avatar frame that always shows the brand logo, never initials. */
export function BrandAvatar({ className, size = "h-9 w-9" }: { className?: string; size?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-card",
        size,
        className,
      )}
    >
      <Logo variant="avatar" size="xs" className="h-full w-full object-cover" />
    </span>
  );
}