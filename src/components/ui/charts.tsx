import { useState } from "react";

/* ---------- Sparkline (Users card) ---------- */

// Small trend line over a light grid, last point marked; values are plotted evenly left to right
export function Sparkline({ values, color = "#16a34a", label }: { values: number[]; color?: string; label: string }) {
  const w = 120;
  const h = 80;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 14;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * (w - 10),
    h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2),
  ]);
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label} className="block overflow-visible">
      {[20, 50, 80, 110].map((x) => (
        <line key={x} x1={x} x2={x} y1={0} y2={h} stroke="#eceef2" />
      ))}
      {[20, 50].map((y) => (
        <line key={y} x1={0} x2={w} y1={y} y2={y} stroke="#eceef2" />
      ))}
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={1.4} />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  );
}

/* ---------- Marker line (Cultural Intelligence card) ---------- */

type MarkerPoint = { x: number; value: number; label: string; marked?: boolean };

// Line with drop lines on marked points; x is 0–1 across the width
export function MarkerLine({ points, color = "#16a34a", label }: { points: MarkerPoint[]; color?: string; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const w = 292;
  const h = 94;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const xy = points.map((p) => [p.x * w, h - 2 - ((p.value - min) / (max - min || 1)) * (h - 30)]);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full overflow-visible" role="img" aria-label={label}>
        <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={1.67} />
        {points.map((p, i) =>
          p.marked ? (
            <g key={p.label}>
              <line x1={xy[i][0]} x2={xy[i][0]} y1={xy[i][1]} y2={h} stroke={color} strokeWidth={1.25} />
              <circle cx={xy[i][0]} cy={xy[i][1]} r={i === points.length - 1 ? 4.2 : 3.1} fill={color} stroke="white" strokeWidth={i === points.length - 1 ? 2 : 0} />
              {/* Hit target larger than the mark */}
              <rect
                x={xy[i][0] - 14}
                y={0}
                width={28}
                height={h}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            </g>
          ) : null,
        )}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[8px] bg-[#1c1a18] px-2 py-1 text-[11px] text-white"
          style={{ left: `${points[active].x * 100}%`, top: `${(xy[active][1] / h) * 100}%`, marginTop: -8 }}
        >
          {points[active].label}: {points[active].value}%
        </div>
      )}
    </div>
  );
}

/* ---------- Stacked bar chart (Annual Revenue Growth) ---------- */

export type StackSeries = { name: string; color: string };
export type StackColumn = { label: string; values: number[]; growth?: string };

type StackedBarChartProps = {
  series: StackSeries[];
  columns: StackColumn[];
  max: number;
  ticks: number[];
  formatTick: (v: number) => string;
  formatValue: (v: number) => string;
  // "steps": shaded area under the totals (Home); "columns": pale column behind each bar (MRR by plan); "none"
  backdrop?: "steps" | "columns" | "none";
  // "sm" shrinks axis labels and bar width for small cards (Payouts to creators)
  size?: "md" | "sm";
  ariaLabel?: string;
};

export function StackedBarChart({
  series,
  columns,
  max,
  ticks,
  formatTick,
  formatValue,
  backdrop = "steps",
  size = "md",
  ariaLabel = "Revenue by month",
}: StackedBarChartProps) {
  const sm = size === "sm";
  const [active, setActive] = useState<number | null>(null);
  const n = columns.length;
  const totals = columns.map((c) => c.values.reduce((a, b) => a + b, 0));

  // Stepped backdrop: flat across each bar, sloping between neighbours
  const area = (() => {
    const pts: string[] = [];
    totals.forEach((t, i) => {
      const y = 100 - (t / max) * 100;
      const x0 = ((i + 0.22) / n) * 100;
      const x1 = ((i + 0.78) / n) * 100;
      if (i === 0) pts.push(`0,${y}`);
      pts.push(`${x0},${y}`, `${x1},${y}`);
      if (i === n - 1) pts.push(`100,${y}`);
    });
    return `M${pts.join(" L")} L100,100 L0,100 Z`;
  })();

  return (
    <div className={`flex h-full gap-3 ${sm ? "min-h-[110px]" : "min-h-[260px]"}`}>
      {/* Y axis */}
      <div className={`relative shrink-0 text-[#1c1a18] ${sm ? "w-6 pb-5 text-[8.5px]" : "w-8 pb-7 text-[13px]"}`}>
        <div className="relative h-full">
          {ticks.map((t) => (
            <span key={t} className="absolute left-0 -translate-y-1/2" style={{ top: `${100 - (t / max) * 100}%` }}>
              {formatTick(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <div className={`absolute inset-x-0 top-0 ${sm ? "bottom-5" : "bottom-7"}`}>
          {backdrop === "steps" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
              <path d={area} fill="#f3f0fe" />
            </svg>
          )}

          <div className="absolute inset-0 flex" role="list" aria-label={ariaLabel}>
            {columns.map((col, i) => (
              <div
                key={col.label}
                role="listitem"
                tabIndex={0}
                aria-label={`${col.label}: ${series.map((s, k) => `${s.name} ${formatValue(col.values[k])}`).join(", ")}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="relative flex h-full flex-1 flex-col justify-end outline-none"
              >
                {backdrop === "columns" && (
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-1/2 w-[64%] max-w-[46px] -translate-x-1/2 rounded-[6px] bg-[#f3f0fe]"
                    style={{ height: `calc(${(totals[i] / max) * 100}% + 6px)` }}
                  />
                )}
                <div
                  className={`relative mx-auto flex flex-col-reverse ${sm ? "w-[52%] max-w-[18px]" : `w-[56%] gap-1 ${backdrop === "columns" ? "max-w-[40px]" : "max-w-[52px]"}`}`}
                  style={{ height: `${(totals[i] / max) * 100}%` }}
                >
                  {col.values.map((v, k) => (
                    <div
                      key={series[k].name}
                      className={`w-full transition-opacity ${sm ? "rounded-[3px]" : "rounded-[5.5px]"}`}
                      style={{ height: `${(v / totals[i]) * 100}%`, background: series[k].color, opacity: active === null || active === i ? 1 : 0.55 }}
                    />
                  ))}
                  {col.growth && (
                    <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-[#eceef2] bg-white px-1.5 py-px text-[9.5px] text-[#1c1a18]">
                      {col.growth}
                    </span>
                  )}
                </div>

                {active === i && (
                  <div
                    className={`pointer-events-none absolute z-20 w-[170px] rounded-[10px] bg-[#1c1a18] p-2.5 text-[11px] text-white shadow-lg ${i > n / 2 ? "right-[60%]" : "left-[60%]"}`}
                    style={{ bottom: `${(totals[i] / max) * 100 * 0.6}%` }}
                  >
                    <div className="mb-1.5 font-medium">{col.label}</div>
                    {series.map((s, k) => (
                      <div key={s.name} className="flex items-center justify-between gap-2 py-0.5">
                        <span className="flex items-center gap-1.5 text-white/80">
                          <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                          {s.name}
                        </span>
                        <span>{formatValue(col.values[k])}</span>
                      </div>
                    ))}
                    <div className="mt-1 flex justify-between border-t border-white/15 pt-1 font-medium">
                      <span>Total</span>
                      <span>{formatValue(totals[i])}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* X axis */}
        <div className={`absolute inset-x-0 bottom-0 flex text-[#1c1a18] ${sm ? "h-3 text-[8.5px]" : "h-5 text-[13px]"}`}>
          {columns.map((c) => (
            <span key={c.label} className="flex-1 text-center">
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Progress ring (Platform Snapshot tiles) ---------- */

export function ProgressRing({
  value,
  color,
  size = 40,
  stroke = 4,
  track = "#e4e6ec",
  textClassName = "text-[9.5px]",
  label,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  track?: string;
  textClassName?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-medium text-[#1c1a18] ${textClassName}`}>{value}%</span>
    </div>
  );
}

/* ---------- Area line (Revenue · actual vs projected) ---------- */

type AreaLinePoint = { label: string; actual: number; projected: number };

// Solid actual line over a filled area, dashed projected line, dashed horizontal grid
export function AreaLineChart({
  points,
  max,
  ticks,
  formatTick,
  formatValue,
  color = "#3310be",
  projectedColor = "#8c78ee",
}: {
  points: AreaLinePoint[];
  max: number;
  ticks: number[];
  formatTick: (v: number) => string;
  formatValue: (v: number) => string;
  color?: string;
  projectedColor?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  // Inset the first and last points so the end labels sit under them
  const x = (i: number) => (n === 1 ? 50 : 4 + (i / (n - 1)) * 92);
  const y = (v: number) => 100 - (v / max) * 100;
  const line = (key: "actual" | "projected") => points.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const area = `M${x(0)},100 L${points.map((p, i) => `${x(i)},${y(p.actual)}`).join(" L")} L${x(n - 1)},100 Z`;

  return (
    <div className="flex h-full min-h-[220px] gap-3">
      <div className="relative w-9 shrink-0 pb-6 text-[10px] text-[#6b7180]">
        <div className="relative h-full">
          {ticks.map((t) => (
            <span key={t} className="absolute left-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
              {formatTick(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 bottom-6 top-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {ticks.map((t) => (
              <line key={t} x1={0} x2={100} y1={y(t)} y2={y(t)} stroke="#e4e6ec" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill="#ebe7fb" />
            <polyline points={line("projected")} fill="none" stroke={projectedColor} strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <polyline points={line("actual")} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            {active !== null && <line x1={x(active)} x2={x(active)} y1={0} y2={100} stroke="#c8ccd4" vectorEffect="non-scaling-stroke" />}
          </svg>

          {/* Hover and focus targets, one per month */}
          <div className="absolute inset-0 flex" role="list" aria-label="Revenue by month, actual and projected">
            {points.map((p, i) => (
              <div
                key={p.label}
                role="listitem"
                tabIndex={0}
                aria-label={`${p.label}: actual ${formatValue(p.actual)}, projected ${formatValue(p.projected)}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="h-full flex-1 outline-none"
              />
            ))}
          </div>

          {active !== null && (
            <>
              <span
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                style={{ left: `${x(active)}%`, top: `${y(points[active].actual)}%`, background: color }}
              />
              <div
                className={`pointer-events-none absolute z-20 w-[160px] rounded-[10px] bg-[#1c1a18] p-2.5 text-[11px] text-white shadow-lg ${
                  active > n / 2 ? "-translate-x-[calc(100%+10px)]" : "translate-x-[10px]"
                }`}
                style={{ left: `${x(active)}%`, top: `${Math.min(y(points[active].actual), 55)}%` }}
              >
                <div className="mb-1.5 font-medium">{points[active].label}</div>
                {(["actual", "projected"] as const).map((key) => (
                  <div key={key} className="flex justify-between py-0.5">
                    <span className="flex items-center gap-1.5 capitalize text-white/80">
                      <span className="size-1.5 rounded-full" style={{ background: key === "actual" ? color : projectedColor }} />
                      {key}
                    </span>
                    <span>{formatValue(points[active][key])}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-4 text-[10px] text-[#6b7180]">
          {points.map((p, i) => (
            <span key={p.label} className="absolute -translate-x-1/2" style={{ left: `${x(i)}%` }}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Donut (Revenue by source) ---------- */

export function DonutChart({
  slices,
  size = 140,
  thickness = 22,
  label,
  activeIndex = null,
  onActiveChange,
  onSelect,
}: {
  slices: { name: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  label: string;
  activeIndex?: number | null;
  onActiveChange?: (index: number | null) => void;
  // Click a slice to open it; the legend carries the keyboard-accessible links
  onSelect?: (index: number) => void;
}) {
  // Leave room for the highlighted slice to grow
  const r = (size - thickness - 6) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const gap = 2;
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((a, s) => a + (s.value / total) * c, 0));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0 -rotate-90">
      {slices.map((s, i) => (
        <circle
          key={s.name}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={activeIndex === i ? thickness + 5 : thickness}
          strokeDasharray={`${Math.max(0, (s.value / total) * c - gap)} ${c}`}
          strokeDashoffset={-starts[i]}
          opacity={activeIndex === null || activeIndex === i ? 1 : 0.45}
          onMouseEnter={() => onActiveChange?.(i)}
          onMouseLeave={() => onActiveChange?.(null)}
          onClick={onSelect ? () => onSelect(i) : undefined}
          className={`transition-[opacity,stroke-width] ${onSelect ? "cursor-pointer" : ""}`}
        />
      ))}
    </svg>
  );
}


/* ---------- Bar list (Badges by category, Top translation pairs) ---------- */

// Labelled horizontal bars scaled to the largest value
export function BarList({
  items,
  label,
  color = "#3310be",
  formatValue = (v) => v.toLocaleString("en-US"),
}: {
  items: { name: string; count: number }[];
  label: string;
  color?: string;
  formatValue?: (v: number, i: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-[11px]" aria-label={label}>
      {items.map((item, i) => (
        <li key={item.name}>
          <div className="flex items-center justify-between gap-3 text-[13px] text-[#1c1a18]">
            <span className="truncate">{item.name}</span>
            <span className="font-semibold">{formatValue(item.count, i)}</span>
          </div>
          <div className="mt-[7px] h-[7px] rounded-full bg-[#f4f5f8]" role="meter" aria-label={item.name} aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={max}>
            <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Line chart (Inference latency, Word error rate) ---------- */

export type LineSeries = { name: string; color: string; values: number[]; area?: boolean };

// One or more lines over a dashed grid; hovering a column shows every series' value
export function LineChart({
  series,
  labels,
  max,
  ticks,
  formatTick,
  formatValue,
  ariaLabel,
}: {
  series: LineSeries[];
  labels: string[];
  max: number;
  ticks: number[];
  formatTick: (v: number) => string;
  formatValue: (v: number) => string;
  ariaLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = labels.length;
  // Inset the ends so the first and last labels sit under their points
  const x = (i: number) => (n === 1 ? 50 : 1 + (i / (n - 1)) * 98);
  const y = (v: number) => 100 - (Math.min(v, max) / max) * 100;
  // Long series (30 days, 24 hours) only label every few points
  const labelEvery = Math.ceil(n / 10);

  return (
    <div className="flex h-full min-h-[200px] gap-3">
      <div className="relative w-8 shrink-0 pb-6 text-[10px] text-[#6b7180]">
        <div className="relative h-full">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
              {formatTick(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 bottom-6 top-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {ticks.map((t) => (
              <line key={t} x1={0} x2={100} y1={y(t)} y2={y(t)} stroke="#e4e6ec" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            ))}
            {series.map((s) =>
              s.area ? <path key={`${s.name}-area`} d={`M${x(0)},100 L${s.values.map((v, i) => `${x(i)},${y(v)}`).join(" L")} L${x(n - 1)},100 Z`} fill="#ebe7fb" /> : null,
            )}
            {series.map((s) => (
              <polyline key={s.name} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
            ))}
            {active !== null && <line x1={x(active)} x2={x(active)} y1={0} y2={100} stroke="#c8ccd4" vectorEffect="non-scaling-stroke" />}
          </svg>

          <div className="absolute inset-0 flex" role="list" aria-label={ariaLabel}>
            {labels.map((label, i) => (
              <div
                key={`${label}-${i}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${label}: ${series.map((s) => `${s.name} ${formatValue(s.values[i])}`).join(", ")}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="h-full flex-1 outline-none"
              />
            ))}
          </div>

          {active !== null && (
            <>
              {series.map((s) => (
                <span
                  key={s.name}
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                  style={{ left: `${x(active)}%`, top: `${y(s.values[active])}%`, background: s.color }}
                />
              ))}
              <div
                className={`pointer-events-none absolute top-2 z-20 w-[150px] rounded-[10px] bg-[#1c1a18] p-2.5 text-[11px] text-white shadow-lg ${
                  active > n / 2 ? "-translate-x-[calc(100%+10px)]" : "translate-x-[10px]"
                }`}
                style={{ left: `${x(active)}%` }}
              >
                <div className="mb-1.5 font-medium">{labels[active]}</div>
                {series.map((s) => (
                  <div key={s.name} className="flex justify-between py-0.5">
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span>{formatValue(s.values[active])}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-4 text-[10px] text-[#6b7180]">
          {labels.map((label, i) =>
            i % labelEvery === 0 ? (
              <span key={`${label}-${i}`} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(i)}%` }}>
                {label}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
