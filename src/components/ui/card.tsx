import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import infoIcon from "../../assets/dashboard/info.svg";
import sparkleIcon from "../../assets/dashboard/sparkle.svg";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[16px] border border-[#eceef2] bg-white ${className}`}>{children}</section>;
}

export type InfoTipContent = {
  title: string;
  body: string;
  // Optional gold link line, e.g. "Why it matters for our mission"
  footnote?: string;
};

// Info icon that reveals a dark explainer card on hover or keyboard focus.
// align="end" opens the card leftwards, for icons near the right edge of the screen
export function InfoTip({ tip, align = "start" }: { tip: InfoTipContent; align?: "start" | "end" }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-describedby={id} aria-label={`About ${tip.title}`} className="flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#3310be]/40">
        <img src={infoIcon} alt="" width={15} height={15} />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-[300px] max-w-[80vw] -translate-x-1/2 rounded-[12px] bg-[#1c1a18] p-[14px] text-left group-focus-within:block group-hover:block sm:translate-x-0 ${align === "end" ? "sm:left-auto sm:right-[-12px]" : "sm:left-[-80px]"}`}
      >
        <span className="block text-[13px] font-medium text-white">{tip.title}</span>
        <span className="mt-2 block text-[12px] leading-[18px] text-white/80">{tip.body}</span>
        {tip.footnote && (
          <span className="mt-3 flex items-center gap-1.5 text-[11px] text-[#f2c14e]">
            <img src={sparkleIcon} alt="" width={10.9} height={12} />
            {tip.footnote}
          </span>
        )}
      </span>
    </span>
  );
}

type CardHeaderProps = {
  icon: string;
  title: string;
  tip?: InfoTipContent;
  children?: ReactNode;
};

// Icon chip + title + info tip on the left, optional controls on the right
export function CardHeader({ icon, title, tip, children }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#f4f5f8]">
          <img src={icon} alt="" width={14} height={14} />
        </span>
        <h2 className="truncate text-[14px] font-medium text-[#1c1a18]">{title}</h2>
        {tip && <InfoTip tip={tip} />}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden style={style} className={`animate-pulse rounded-[8px] bg-[#f4f5f8] ${className}`} />;
}
