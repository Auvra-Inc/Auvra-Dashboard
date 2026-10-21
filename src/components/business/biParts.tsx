import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, InfoTip, Skeleton } from "../ui/card";
import { SegmentedControl, TrendBadge } from "../ui/controls";
import { Modal } from "../ui/modal";
import type { Kpi } from "../../data/businessIntelligence";
import { formatKpi } from "../../utils/format";
import checkIcon from "../../assets/auth/checkbox-check.svg";
import chevronLeftIcon from "../../assets/dashboard/chevron-left-13.svg";

/* ---------- KPI card ---------- */

export function KpiCard({ kpi, icon }: { kpi: Kpi; icon: string }) {
  return (
    <Card className="relative px-[15px] pb-[15px] pt-[13px]">
      <div className="pr-6">
        <CardHeader icon={icon} title={kpi.label} />
      </div>
      {/* Pinned top right so it never wraps under a long label */}
      <div className="absolute right-[15px] top-[19px] flex">
        <InfoTip tip={{ title: kpi.label, body: kpi.tip }} align="end" />
      </div>
      <div className="mt-[22px] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[30px] font-light leading-[36px] tracking-[-0.8px] text-[#1c1a18]">{formatKpi(kpi)}</span>
        {kpi.change !== undefined && <TrendBadge value={kpi.change} unit={kpi.changeUnit} good={kpi.upIsGood ? kpi.change >= 0 : kpi.change <= 0} />}
      </div>
      <div className="mt-2 text-[11px] text-[#6b7180]">{kpi.note ?? "vs previous 30 days"}</div>
    </Card>
  );
}

// KPI card where the whole card is clickable; is clickable: the title carries a stretched link, the info tip stays above it
export function KpiLinkCard({ kpi, icon, to, onClick, active = false }: { kpi: Kpi; icon: string; to?: string; onClick?: () => void; active?: boolean }) {
  const stretch = "outline-none after:absolute after:inset-0 after:rounded-[16px] focus-visible:after:ring-2 focus-visible:after:ring-[#3310be]/40";
  const title = to ? (
    <Link to={to} className={stretch}>
      {kpi.label}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-pressed={active} className={`text-left ${stretch}`}>
      {kpi.label}
    </button>
  );
  return (
    <Card className={`relative px-[15px] pb-[15px] pt-[13px] transition-colors hover:border-[#d9dce3] hover:bg-[#fcfcfd] ${active ? "border-[#1c1a18]!" : ""}`}>
      <div className="flex min-w-0 items-center gap-2.5 pr-6">
        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#f4f5f8]">
          <img src={icon} alt="" width={14} height={14} />
        </span>
        <h2 className="truncate text-[14px] font-medium text-[#1c1a18]">{title}</h2>
      </div>
      <div className="absolute right-[15px] top-[19px] z-10 flex">
        <InfoTip tip={{ title: kpi.label, body: kpi.tip }} align="end" />
      </div>
      <div className="mt-[22px] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[30px] font-light leading-[36px] tracking-[-0.8px] text-[#1c1a18]">{formatKpi(kpi)}</span>
        {kpi.change !== undefined && <TrendBadge value={kpi.change} unit={kpi.changeUnit} good={kpi.upIsGood ? kpi.change >= 0 : kpi.change <= 0} />}
      </div>
      <div className="mt-2 text-[11px] text-[#6b7180]">{kpi.note ?? "vs previous 30 days"}</div>
    </Card>
  );
}

export function KpiSkeleton() {
  return (
    <Card className="space-y-4 p-[15px]">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-2.5 w-3/5" />
    </Card>
  );
}

/* ---------- Error ---------- */

export function LoadError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center px-5 py-14 text-center">
      <div className="text-[17px] font-semibold text-[#1c1a18]">{title}</div>
      <div className="mt-2 max-w-[358px] text-[13px] leading-[20px] text-[#6b7180]">Check your connection and try again. Nothing has been lost.</div>
      <button type="button" onClick={onRetry} className="mt-4 h-10 rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
        Try again
      </button>
    </Card>
  );
}

/* ---------- Export dialog ---------- */

export type ExportFormat = "pdf" | "csv";
export type ExportRequest = { from: string; to: string; include: string[]; format: ExportFormat };

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function ExportReportModal({
  options,
  onExport,
  onClose,
}: {
  options: { key: string; label: string; defaultChecked?: boolean }[];
  onExport: (request: ExportRequest) => Promise<void> | void;
  onClose: () => void;
}) {
  const today = new Date();
  const [from, setFrom] = useState(isoDate(new Date(today.getFullYear(), 0, 1)));
  const [to, setTo] = useState(isoDate(today));
  const [include, setInclude] = useState(options.filter((o) => o.defaultChecked).map((o) => o.key));
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [busy, setBusy] = useState(false);

  const badRange = !from || !to || from > to;
  const canSubmit = !badRange && include.length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      // The backend records every export in the audit log
      await onExport({ from, to, include, format });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const dateField = (label: string, value: string, onChange: (v: string) => void, extra: { min?: string; max?: string }) => (
    <label className="block">
      <span className="text-[13px] font-medium text-[#1c1a18]">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...extra}
        className="mt-2 h-[50px] w-full rounded-[12px] bg-[#f4f5f8] px-4 text-[14px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30"
      />
    </label>
  );

  return (
    <Modal
      title="Export report"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-[42px] rounded-[10px] border border-[#eceef2] px-5 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="h-[42px] min-w-[104px] rounded-[10px] bg-[#1c1a18] px-5 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-40"
          >
            {busy ? "Preparing…" : "Download"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dateField("From", from, setFrom, { max: to })}
        {dateField("To", to, setTo, { min: from, max: isoDate(today) })}
      </div>
      {badRange && <div className="mt-2 text-[12px] text-[#dc2626]">Pick a start date on or before the end date.</div>}

      <fieldset className="mt-6">
        <legend className="text-[13px] font-medium text-[#1c1a18]">Include</legend>
        <div className="mt-2.5 space-y-2.5">
          {options.map((o) => {
            const checked = include.includes(o.key);
            return (
              <label key={o.key} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#1c1a18]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setInclude((cur) => (checked ? cur.filter((k) => k !== o.key) : [...cur, o.key]))}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={`flex size-[18px] items-center justify-center rounded-[4px] border peer-focus-visible:ring-2 peer-focus-visible:ring-[#3310be]/40 ${
                    checked ? "border-[#1c1a18] bg-[#1c1a18]" : "border-[#c8ccd4] bg-white"
                  }`}
                >
                  {checked && <img src={checkIcon} alt="" width={12} height={12} />}
                </span>
                {o.label}
              </label>
            );
          })}
        </div>
        {include.length === 0 && <div className="mt-2 text-[12px] text-[#dc2626]">Choose at least one section.</div>}
      </fieldset>

      <SegmentedControl
        label="File format"
        className="mt-6"
        value={format}
        onChange={setFormat}
        options={[
          { value: "pdf", label: "PDF" },
          { value: "csv", label: "CSV" },
        ]}
      />
      <p className="mt-5 text-[12px] text-[#6b7180]">The export is recorded in the audit log.</p>
    </Modal>
  );
}

/* ---------- Back link ---------- */

export function BackToBusiness() {
  return (
    <Link to="/app/business" className="-mt-3 mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#6b7180] hover:text-[#1c1a18] sm:-mt-4">
      <img src={chevronLeftIcon} alt="" width={13} height={13} />
      Back to Business Intelligence
    </Link>
  );
}
