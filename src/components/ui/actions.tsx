import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Avatar } from "./controls";

// Big radio rows used for every decision (reports, KYC)
export function ChoiceList<T extends string>({ name, legend, options, value, onChange }: { name: string; legend: string; options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-[13px] font-medium text-[#1c1a18]">{legend}</legend>
      <div className="mt-2.5 space-y-2">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[46px] cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-2 text-[13px] text-[#1c1a18] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#3310be]/40 ${
                checked ? "border-[1.5px] border-[#1c1a18]" : "border border-[#eceef2] hover:bg-[#f8f9fb]"
              }`}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              <span aria-hidden className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${checked ? "border-[#1c1a18]" : "border-[#c8ccd4]"}`}>
                {checked && <span className="size-2 rounded-full bg-[#1c1a18]" />}
              </span>
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export const textareaClass =
  "mt-2 block min-h-[52px] w-full resize-y rounded-[12px] border border-[#eceef2] bg-white px-3 py-[13px] text-[13px] text-[#1c1a18] outline-none placeholder:text-[#a0a5b1] focus:border-[#1c1a18]";

export function DarkButton({ children, busy, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-[40px] items-center gap-1.5 rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-40"
      aria-busy={busy}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-[40px] items-center gap-1.5 rounded-[10px] border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// Green confirmation line after a decision
export function DoneBanner({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div role="status" className="flex items-start justify-between gap-3 rounded-[14px] border border-[#cdebd8] bg-[#e8f7ee] px-[17px] py-3 text-[13px] text-[#1c1a18]">
      <span>{children}</span>
      <button type="button" onClick={onClose} className="shrink-0 text-[12px] text-[#6b7180] hover:text-[#1c1a18]">
        Dismiss
      </button>
    </div>
  );
}

export function PersonCell({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size={36} color="#3e3a36" className="rounded-[8px] text-[12px]" />
      <div className="min-w-0">
        <div className="truncate text-[14px] text-[#1c1a18]">{name}</div>
        <div className="truncate text-[11px] text-[#6b7180]">{sub}</div>
      </div>
    </div>
  );
}
