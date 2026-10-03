import { clsx } from "clsx";
import { IconTrendUp, IconTrendDown } from "@/components/ui/icons";

type MetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: "brand" | "rose" | "amber" | "sky" | "violet";
  icon?: React.ReactNode;
  sparkline?: number[];
};

const accentMap = {
  brand: {
    bar: "from-brand-500 to-brand-700",
    icon: "bg-brand-50 text-brand-600 ring-brand-100",
    glow: "shadow-[0_8px_24px_-8px_rgba(13,148,136,0.3)]",
  },
  rose: {
    bar: "from-rose-500 to-rose-700",
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    glow: "shadow-[0_8px_24px_-8px_rgba(225,29,72,0.25)]",
  },
  amber: {
    bar: "from-amber-500 to-amber-700",
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    glow: "shadow-[0_8px_24px_-8px_rgba(217,119,6,0.25)]",
  },
  sky: {
    bar: "from-sky-500 to-sky-700",
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    glow: "shadow-[0_8px_24px_-8px_rgba(2,132,199,0.25)]",
  },
  violet: {
    bar: "from-violet-500 to-violet-700",
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    glow: "shadow-[0_8px_24px_-8px_rgba(124,58,237,0.25)]",
  },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const sparklineColors: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  brand: "#0d9488",
  rose: "#e11d48",
  amber: "#d97706",
  sky: "#0284c7",
  violet: "#7c3aed",
};

export function MetricCard({
  label,
  value,
  detail,
  trend,
  trendValue,
  accent = "brand",
  icon,
  sparkline,
}: MetricCardProps) {
  const colors = accentMap[accent];
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-3xl border border-ink-200/70 bg-white p-5 shadow-card transition-all duration-300 ease-out-expo hover:shadow-elevated hover:-translate-y-0.5",
        colors.glow,
      )}
    >
      {/* Top gradient bar */}
      <div className={clsx("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", colors.bar)} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink-500">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 tabular-nums">
            {value}
          </div>
        </div>
        {icon && (
          <div className={clsx("flex h-9 w-9 items-center justify-center rounded-xl ring-1", colors.icon)}>
            {icon}
          </div>
        )}
      </div>

      {(detail || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0 text-xs text-ink-500">{detail}</div>
          {trend && trendValue && (
            <div
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                trend === "up" && "bg-emerald-50 text-emerald-700",
                trend === "down" && "bg-rose-50 text-rose-700",
                trend === "neutral" && "bg-ink-100 text-ink-600",
              )}
            >
              {trend === "up" && <IconTrendUp className="h-3 w-3" />}
              {trend === "down" && <IconTrendDown className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
      )}

      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 border-t border-ink-100 pt-3">
          <Sparkline data={sparkline} color={sparklineColors[accent]} />
        </div>
      )}
    </div>
  );
}
