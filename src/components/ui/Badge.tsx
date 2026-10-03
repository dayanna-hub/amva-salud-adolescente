import { clsx } from "clsx";
import type { ReactNode } from "react";

type Variant = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-200/60",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

type BadgeProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  dot?: boolean;
  className?: string;
};

export function Badge({ children, variant = "neutral", size = "md", dot = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
