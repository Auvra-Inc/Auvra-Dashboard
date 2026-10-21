import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import moreIcon16 from "../../assets/dashboard/more-16.svg";
import moreIcon14 from "../../assets/dashboard/more-14.svg";

type TrendBadgeProps = {
  value: number;
  // "pts" for changes in a rate (churn, conversion) rather than a relative change
  // "s" for latency (−0.18s), "" for plain scores (+0.8 BLEU)
  unit?: "%" | "pts" | "s" | "";
  // Green when true; defaults to "up is good", pass false for metrics where a drop is good (churn, CAC)
  good?: boolean;
  className?: string;
};

export function TrendBadge({ value, unit = "%", good, className = "" }: TrendBadgeProps) {
  const positive = good ?? value >= 0;
  const abs = Math.abs(value);
  const amount =
    unit === "%" ? `${abs.toFixed(1).replace(/\.0$/, "")}%` : unit === "pts" ? `${abs} pts` : unit === "s" ? `${abs.toFixed(2)}s` : abs.toFixed(1);
  return (
    <span
      className={`inline-flex h-[18px] shrink-0 items-center whitespace-nowrap rounded-[5px] px-1.5 text-[10px] font-semibold ${
        positive ? "bg-[#e8f7ee] text-[#16a34a]" : "bg-[#fdedee] text-[#dc2626]"
      } ${className}`}
    >
      {value >= 0 ? "+" : "−"}
      {amount}
    </span>
  );
}

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string; trailingIcon?: string };

// Small outlined control used in card headers (date range, Filter, Export)
export function ToolbarButton({ icon, trailingIcon, children, className = "", ...props }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] bg-white px-[11px] text-[11px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8] ${className}`}
    >
      {icon && <img src={icon} alt="" width={13} height={13} />}
      {children}
      {trailingIcon && <img src={trailingIcon} alt="" width={12} height={12} className="ml-1" />}
    </button>
  );
}

export function IconButton({ icon, label, size = 30, iconSize = 13, className = "flex", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; size?: number; iconSize?: number }) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`shrink-0 items-center justify-center rounded-[7px] border border-[#eceef2] bg-white hover:bg-[#f4f5f8] ${className}`}
    >
      <img src={icon} alt="" width={iconSize} height={iconSize} />
    </button>
  );
}

// "…" control linking to the related section
export function MoreButton({ label, to, compact = false }: { label: string; to: string; compact?: boolean }) {
  if (compact) {
    return (
      <Link to={to} aria-label={label} className="flex rounded-[4px] hover:bg-white">
        <img src={moreIcon14} alt="" width={14} height={14} />
      </Link>
    );
  }
  return (
    <Link to={to} aria-label={label} className="flex size-8 items-center justify-center rounded-[8px] border border-[#eceef2] hover:bg-[#f4f5f8]">
      <img src={moreIcon16} alt="" width={16} height={16} />
    </Link>
  );
}

export function PrimaryAction({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-[42px] items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1c1a18] px-[25px] text-[13px] font-medium text-white hover:bg-[#2f2c29]"
    >
      {children}
    </button>
  );
}

// Initials tile; colour is picked from a fixed set so a person keeps the same colour everywhere
const AVATAR_COLORS = ["#8e2b2b", "#2f4a44", "#5b4a3a", "#3e3a36", "#3d3a5c", "#4a3b2f"];

export function Avatar({ name, size = 44, color, className = "rounded-[10px] text-[14px]" }: { name: string; size?: number; color?: string; className?: string }) {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, background: color ?? AVATAR_COLORS[hash % AVATAR_COLORS.length] }}
      className={`flex shrink-0 items-center justify-center font-semibold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

// Pill toggle, e.g. 3m / 6m / 1y on charts or PDF / CSV in the export dialog
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex shrink-0 rounded-[8px] bg-[#f4f5f8] p-[3px] ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`h-[24px] min-w-[32px] rounded-[6px] px-2 text-[11px] font-medium disabled:opacity-40 ${
            value === o.value ? "bg-white text-[#1c1a18] shadow-[0_1px_2px_rgba(28,26,24,0.08)]" : "text-[#6b7180] hover:text-[#1c1a18]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Toolbar button that opens a single-choice menu (All regions, Last 12 months)
export function ToolbarMenu<T extends string>({
  icon,
  options,
  value,
  onChange,
  label,
  buttonText,
}: {
  icon?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  // Fixed button text, e.g. "Category" while no filter is picked
  buttonText?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <ToolbarButton icon={icon} aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} className="h-[34px] px-3 text-[12px]">
        {buttonText ?? options.find((o) => o.value === value)?.label}
      </ToolbarButton>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute right-0 top-full z-30 mt-1.5 min-w-[170px] rounded-[12px] border border-[#eceef2] bg-white p-1.5 shadow-[0_12px_32px_rgba(28,26,24,0.12)]">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full rounded-[8px] px-2.5 py-2 text-left text-[12px] hover:bg-[#f4f5f8] ${value === o.value ? "font-medium text-[#1c1a18]" : "text-[#6b7180]"}`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PILL_TONES = {
  green: "bg-[#e8f7ee] text-[#16a34a]",
  purple: "bg-[#efebfd] text-[#3310be]",
  amber: "bg-[#fdf3dc] text-[#b7791f]",
  red: "bg-[#fdedee] text-[#dc2626]",
  gray: "bg-[#f4f5f8] text-[#1c1a18]",
} as const;

export type PillTone = keyof typeof PILL_TONES;

// Small status label (Upgrade, Cancelled, churn rate)
export function StatusPill({ tone, children, className = "" }: { tone: PillTone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-[6px] px-2 text-[11px] font-medium ${PILL_TONES[tone]} ${className}`}>{children}</span>;
}
