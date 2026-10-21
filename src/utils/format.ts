import type { Kpi } from "../data/businessIntelligence";

export const usd = (v: number, digits = 0) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });

// $105.8K, $412K, $612
export const usdShort = (v: number) => (Math.abs(v) < 1000 ? usd(v) : `$${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`);

export const formatKpi = (k: Kpi) => {
  switch (k.format) {
    case "usd":
      return usd(k.value);
    case "usd2":
      return usd(k.value, 2);
    case "usdShort":
      return usdShort(k.value);
    case "pct":
      return `${k.value}%`;
    case "hours":
      return `${k.value} h`;
    case "seconds":
      return `${k.value.toFixed(2)}s`;
    case "compact":
      return k.value < 1000 ? `${k.value}` : `${(k.value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    case "decimal":
      return k.value.toFixed(1);
    default:
      return k.value.toLocaleString("en-US");
  }
};

// Round the axis max up to a multiple of step and return [0, max/2, max]
export function niceTicks(maxValue: number, step: number) {
  const max = Math.max(step, Math.ceil(maxValue / step) * step);
  return { max, ticks: [0, max / 2, max] };
}
