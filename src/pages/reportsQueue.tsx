import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/card";
import { SegmentedControl, StatusPill } from "../components/ui/controls";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { LoadError } from "../components/business/biParts";
import { CancelButton } from "../components/users/userParts";
import { ChoiceList, DarkButton, DoneBanner, OutlineButton, textareaClass } from "../components/ui/actions";
import { BackToSafety, CardListSkeleton, MaybeLink } from "../components/safety/tsParts";
import { REASON_SHORT, REPORT_DECISIONS, decideReport, decisionLabel, getReports, reportCount, topReason } from "../data/trustAndSafety";
import type { Report, ReportDecision, ReportView } from "../data/trustAndSafety";
import { useSessionUser } from "../auth/session";
import { backState } from "../utils/navigation";
import flagIcon from "../assets/dashboard/card-flag.svg";
import checkIcon from "../assets/dashboard/check-20.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import checkWhiteIcon from "../assets/dashboard/check-13-white.svg";

const VIEW_OPTIONS: { value: ReportView; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

// Brown tile standing in for the Badge cover until the API sends image URLs
function Thumb({ size }: { size: "sm" | "lg" }) {
  return <span aria-hidden className={`block shrink-0 bg-[#5b4a3a] ${size === "sm" ? "size-12 rounded-[8px]" : "h-[140px] w-[120px] rounded-[10px]"}`} />;
}

function CountPill({ count }: { count: number }) {
  return (
    <span className={`inline-flex h-[22px] shrink-0 items-center rounded-[6px] px-2 text-[11px] font-medium ${count >= 3 ? "bg-[#fdedee] text-[#dc2626]" : "bg-[#fdf3dc] text-[#b7791f]"}`}>
      {count} {count === 1 ? "report" : "reports"}
    </span>
  );
}

function QueueItem({ report, selected, onSelect }: { report: Report; selected: boolean; onSelect: () => void }) {
  const reason = topReason(report);
  const sub = [REASON_SHORT[reason] ?? reason, report.autoHidden && !report.resolution ? "auto-hidden" : null].filter(Boolean).join(" · ");
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className={`flex w-full items-center gap-3 rounded-[12px] p-[7px] pr-3.5 text-left ${
          selected ? "border border-[#3310be] bg-[#efebfd]" : "border border-[#eceef2] hover:bg-[#f8f9fb]"
        }`}
      >
        <Thumb size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[#1c1a18]">{report.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[#6b7180]">{sub}</span>
        </span>
        {report.resolution ? <StatusPill tone="gray">{decisionLabel(report.resolution.decision)}</StatusPill> : <CountPill count={reportCount(report)} />}
      </button>
    </li>
  );
}

function ReportDetail({ report, onDecided }: { report: Report; onDecided: (message: string) => void }) {
  const user = useSessionUser();
  const [decision, setDecision] = useState<ReportDecision | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const total = reportCount(report);
  const back = backState("/app/safety/reports", "Reports queue");
  const canConfirm = !!decision && !!reason.trim() && !busy;

  const confirm = async () => {
    if (!decision || !canConfirm) return;
    setBusy(true);
    setFailed(false);
    try {
      await decideReport(report.id, decision, reason.trim(), user?.name ?? "Admin");
      onDecided(`${report.title}: ${decisionLabel(decision).toLowerCase()}. The reporters and the creator have been told.`);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  const reset = () => {
    setDecision(null);
    setReason("");
    setFailed(false);
  };

  return (
    <Card className="px-[17px] pb-[17px] pt-[13px]">
      <CardHeader icon={flagIcon} title="Report detail" tip={{ title: "Report detail", body: "What was reported and why. Reporter names stay private; the creator only sees the decision." }} />

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <Thumb size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <StatusPill tone="purple">{report.badgeKind === "contribution" ? "Contribution Badge" : "Collectible Badge"}</StatusPill>
            {report.autoHidden && !report.resolution && <StatusPill tone="red">Auto-hidden</StatusPill>}
          </div>
          <h2 className="mt-3 text-[20px] font-medium tracking-[-0.2px] text-[#1c1a18]">
            <MaybeLink to={`/app/culture/badges/${report.badgeId}`} permission="culture" state={back}>
              {report.title}
            </MaybeLink>
          </h2>
          <p className="mt-1.5 text-[12px] text-[#6b7180]">
            By{" "}
            <MaybeLink
              to={report.communityId ? `/app/culture/communities/${report.communityId}` : `/app/users/${report.creatorId}`}
              permission={report.communityId ? "culture" : "users"}
              state={back}
              className="text-[#1c1a18]"
            >
              {report.creator}
            </MaybeLink>{" "}
            · {report.category} · Preserved {report.preservedOn}
          </p>
          <p className="mt-3 text-[13px] leading-[20px] text-[#1c1a18]">{report.description}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[13px] font-medium text-[#1c1a18]">
          Reasons from {total} {total === 1 ? "reporter" : "reporters"}
        </div>
        <ul className="mt-1.5">
          {report.reasons.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-4 border-b border-[#eceef2] py-2.5 text-[13px]">
              <span className="text-[#6b7180]">{r.label}</span>
              <span className="tabular-nums text-[#1c1a18]">{r.count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[11px] text-[#6b7180]">Reporter names are never shown to the creator.</p>
      </div>

      {report.resolution ? (
        <div className="mt-6 rounded-[12px] bg-[#f8f9fb] px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#6b7180]">
            <StatusPill tone="gray">{decisionLabel(report.resolution.decision)}</StatusPill>
            by {report.resolution.by} · {report.resolution.when}
          </div>
          <p className="mt-2 text-[13px] leading-[20px] text-[#1c1a18]">{report.resolution.reason}</p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <ChoiceList name="report-decision" legend="Decision" options={REPORT_DECISIONS} value={decision} onChange={setDecision} />
          </div>
          {decision === "remove" && (
            <p className="mt-2.5 text-[12px] text-[#dc2626]">
              This Badge will be removed, and {report.creator} suspended and signed out until someone reactivates them in Users.
            </p>
          )}
          {decision === "escalate" && <p className="mt-2.5 text-[12px] text-[#6b7180]">The Badge goes back to its community's Keepers and shows in Cultural Intelligence · Waiting for review.</p>}
          <label className="mt-5 block">
            <span className="text-[13px] font-medium text-[#1c1a18]">Reason (shown in the audit log)</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Rite is closed to outsiders; Keepers confirmed." className={textareaClass} />
          </label>
          {failed && <p className="mt-3 text-[12px] text-[#dc2626]">We couldn't save this decision. Try again.</p>}
          <div className="mt-2.5 flex flex-wrap justify-end gap-2">
            <CancelButton onClick={reset} />
            <DarkButton onClick={confirm} disabled={!canConfirm} busy={busy}>
              <img src={checkWhiteIcon} alt="" width={13} height={13} />
              {busy ? "Saving…" : "Confirm decision"}
            </DarkButton>
          </div>
        </>
      )}
    </Card>
  );
}

function EmptyQueue({ view, onSwitch }: { view: ReportView; onSwitch: (v: ReportView) => void }) {
  return (
    <Card className="px-[17px] pt-[13px]">
      <CardHeader icon={flagIcon} title="Reports queue" tip={{ title: "Reports queue", body: "Badges people have reported, newest first." }}>
        <SegmentedControl label="Show" options={VIEW_OPTIONS} value={view} onChange={onSwitch} />
      </CardHeader>
      <div className="flex flex-col items-center px-5 pb-[72px] pt-[56px] text-center">
        <span className="flex size-14 items-center justify-center rounded-[14px] bg-[#f4f5f8]">
          <img src={checkIcon} alt="" width={20} height={20} />
        </span>
        <div className="mt-6 text-[17px] font-semibold text-[#1c1a18]">{view === "open" ? "All caught up" : "Nothing resolved yet"}</div>
        <div className="mt-2 max-w-[400px] text-[13px] leading-[20px] text-[#6b7180]">
          {view === "open" ? "No reports are waiting. New reports show up here and on Home as soon as someone sends one." : "Decisions you make on open reports are kept here."}
        </div>
        {view === "open" && (
          <div className="mt-6">
            <OutlineButton onClick={() => onSwitch("resolved")}>
              <img src={clockIcon} alt="" width={14} height={14} />
              View resolved reports
            </OutlineButton>
          </div>
        )}
      </div>
    </Card>
  );
}

type LoadResult = { key: string; open?: number; items?: Report[]; failed?: boolean };

export function ReportsQueue() {
  const [params, setParams] = useSearchParams();
  const view: ReportView = params.get("view") === "resolved" ? "resolved" : "open";
  const selectedId = params.get("report");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const key = `${view}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getReports(view)
      .then((r) => !cancelled && setResult({ key, ...r }))
      .catch(() => !cancelled && setResult({ key, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [view, key]);

  const loading = result?.key !== key;
  const items = result?.items;
  usePageTitle("Reports queue");
  usePageSubtitle(
    result?.open === undefined ? "Loading…" : view === "open" ? (result.open ? `${result.open} open · newest first` : "0 open") : `${items?.length ?? 0} resolved · ${result.open} still open`,
  );

  const switchView = (v: ReportView) => setParams(v === "open" ? {} : { view: v }, { replace: true });
  const select = (id: string) => {
    setParams(view === "open" ? { report: id } : { view, report: id }, { replace: true });
    // On narrow screens the detail sits below the list
    if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  if (result?.failed && !loading) return <LoadError title="We couldn't load the reports queue" onRetry={() => setAttempt((a) => a + 1)} />;

  const body = () => {
    if (!items)
      return (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <CardListSkeleton />
          <CardListSkeleton rows={7} />
        </div>
      );
    if (items.length === 0) return <EmptyQueue view={view} onSwitch={switchView} />;

    const selected = items.find((r) => r.id === selectedId) ?? items[0];
    return (
      <div className={`grid grid-cols-1 items-start gap-3 transition-opacity lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] ${loading ? "pointer-events-none opacity-60" : ""}`}>
        <Card className="px-[17px] pb-[17px] pt-[13px]">
          <CardHeader
            icon={flagIcon}
            title={view === "open" ? `Reports queue · ${items.length} open` : `Resolved · ${items.length}`}
            tip={{ title: "Reports queue", body: "Badges people have reported, newest first. Three or more reports on sacred content hide the Badge automatically until you decide." }}
          >
            <SegmentedControl label="Show" options={VIEW_OPTIONS} value={view} onChange={switchView} />
          </CardHeader>
          <ul className="mt-4 space-y-2">
            {items.map((r) => (
              <QueueItem key={r.id} report={r} selected={r.id === selected.id} onSelect={() => select(r.id)} />
            ))}
          </ul>
        </Card>
        <div ref={detailRef} className="scroll-mt-4">
          {/* key resets the decision form when another report is picked */}
          <ReportDetail
            key={selected.id}
            report={selected}
            onDecided={(message) => {
              setDone(message);
              // Next report in line, if any
              const next = items[items.indexOf(selected) + 1] ?? items[items.indexOf(selected) - 1];
              setParams(next ? { report: next.id } : {}, { replace: true });
              setAttempt((a) => a + 1);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <BackToSafety />
      {done && <DoneBanner onClose={() => setDone(null)}>{done}</DoneBanner>}
      {body()}
    </div>
  );
}
