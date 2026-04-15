import type { ElementType, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  primary:
    "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:rgba(13,107,100,0.24)]",
  neutral:
    "bg-[color:rgba(255,255,255,0.96)] text-[color:var(--ink-muted)] border-[color:var(--border)]",
  success:
    "bg-[color:rgba(12,141,103,0.1)] text-[color:var(--success-ink)] border-[color:rgba(12,141,103,0.22)]",
  warning:
    "bg-[color:rgba(184,106,28,0.1)] text-[color:var(--warning-ink)] border-[color:rgba(184,106,28,0.22)]",
  danger:
    "bg-[color:rgba(176,57,38,0.1)] text-[color:var(--danger-ink)] border-[color:rgba(176,57,38,0.22)]",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] active:translate-y-px disabled:pointer-events-none disabled:opacity-60",
    size === "sm" && "min-h-10 px-4 text-sm",
    size === "md" && "min-h-11 px-5 text-sm",
    size === "lg" && "min-h-12 px-6 text-base",
    variant === "primary" &&
      "border border-transparent bg-[color:var(--accent)] text-white shadow-[0_16px_34px_-24px_rgba(13,107,100,0.72)] hover:bg-[color:var(--accent-strong)]",
    variant === "secondary" &&
      "border border-[color:var(--border)] bg-white text-[color:var(--ink)] hover:border-[color:var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.98)]",
    variant === "ghost" &&
      "border border-transparent text-[color:var(--ink-muted)] hover:border-[color:rgba(13,107,100,0.16)] hover:bg-white/80 hover:text-[color:var(--ink)]",
    className
  );
}

export function SurfaceCard({
  as,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType; children: ReactNode }) {
  const Component = as ?? "section";

  return (
    <Component className={cn("vc-surface", className)} {...props}>
      {children}
    </Component>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  action,
  className,
  headingTag,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  headingTag?: ElementType;
}) {
  const Heading = headingTag ?? "h1";

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-4xl space-y-3">
        {eyebrow ? <p className="vc-eyebrow">{eyebrow}</p> : null}
        <div className="space-y-2">
          <Heading className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
            {title}
          </Heading>
          {description ? (
            <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}

export function MetricTile({
  icon: Icon,
  label,
  value,
  description,
  tone = "neutral",
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  description?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("vc-panel flex h-full flex-col gap-3.5", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border",
              toneClasses[tone]
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--ink-muted)]">{label}</p>
          <p className="text-[1.65rem] font-semibold tracking-tight text-[color:var(--ink)]">{value}</p>
        </div>
      </div>
      {description ? <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{description}</p> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={cn("flex flex-col items-start gap-4 p-6 sm:p-8", className)}>
      {Icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--ink-muted)]">{description}</p>
      </div>
      {action}
    </SurfaceCard>
  );
}

export function LinkArrow({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonStyles({ variant: "secondary", size: "md" }), className)}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
