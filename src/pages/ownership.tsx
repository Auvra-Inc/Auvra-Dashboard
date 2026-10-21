import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  Flag,
  History,
  Layers3,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useSessionUser } from "../auth/session";
import { Avatar, StatusPill, TrendBadge } from "../components/ui/controls";
import { Card, InfoTip, Skeleton } from "../components/ui/card";
import { DataTable } from "../components/ui/table";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { LoadError } from "../components/business/biParts";
import {
  decideOwnershipDispute,
  getOwnershipDispute,
  getOwnershipDisputes,
  getOwnershipHistory,
  getOwnershipRecords,
  OWNERSHIP_METRICS,
} from "../data/ownership";
import type {
  DisputeDecision,
  OwnershipDispute as Dispute,
  OwnershipEvent,
  OwnershipRecord,
  ProvenanceStatus,
} from "../data/ownership";
import type { BadgeRecord } from "../data/culturalIntelligence";
import { getBadgeRecord } from "../data/culturalIntelligence";
import { downloadCsv } from "../utils/report";
import { usd } from "../utils/format";

const PROVENANCE: Record<ProvenanceStatus, { label: string; tone: "green" | "amber" | "red" | "gray" }> = {
  verified: { label: "Verified", tone: "green" },
  pending: { label: "Pending", tone: "amber" },
  disputed: { label: "Disputed", tone: "red" },
  removed: { label: "Removed", tone: "gray" },
};

const FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "disputed", label: "Disputed" },
  { value: "removed", label: "Removed" },
] as const;

function ProvenancePill({ status }: { status: ProvenanceStatus }) {
  const config = PROVENANCE[status];
  return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="relative inline-flex h-[34px] items-center">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value);
          if (option) onChange(option.value);
        }}
        className="h-full appearance-none rounded-[8px] border border-[#eceef2] bg-white py-0 pl-[11px] pr-8 text-[11px] font-medium text-[#1c1a18] outline-none hover:bg-[#f8f9fb] focus:ring-2 focus:ring-[#3310be]/30"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown aria-hidden size={13} className="pointer-events-none absolute right-[10px] text-[#6b7180]" />
    </label>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex h-[34px] min-w-[190px] flex-1 items-center gap-2 rounded-[8px] border border-[#eceef2] bg-white px-[10px] focus-within:ring-2 focus-within:ring-[#3310be]/30 sm:max-w-[300px]">
      <Search aria-hidden size={14} className="shrink-0 text-[#8a8f9b]" />
      <span className="sr-only">Search ownership records</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search Badge, creator or owner"
        className="min-w-0 flex-1 bg-transparent text-[11px] text-[#1c1a18] outline-none placeholder:text-[#a0a4ad]"
      />
      {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="text-[#8a8f9b] hover:text-[#1c1a18]"><X size={13} /></button>}
    </label>
  );
}

function MetricCard({
  label,
  value,
  note,
  tip,
  icon: Icon,
  active,
  onClick,
  trend,
}: {
  label: string;
  value: string;
  note: string;
  tip: string;
  icon: typeof ShieldCheck;
  active?: boolean;
  onClick?: () => void;
  trend?: number;
}) {
  return (
    <Card className={`relative px-[14px] pb-[13px] pt-[12px] ${active ? "border-[#1c1a18]" : ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[#f4f5f8]"><Icon size={12} /></span>
        {onClick ? (
          <button type="button" aria-pressed={active} onClick={onClick} className="truncate text-left text-[11px] font-medium text-[#6b7180] hover:text-[#1c1a18]">{label}</button>
        ) : <span className="truncate text-[11px] font-medium text-[#6b7180]">{label}</span>}
        <InfoTip tip={{ title: label, body: tip }} align="end" />
      </div>
      <div className="mt-[17px] flex flex-wrap items-center gap-2">
        <span className="text-[24px] font-medium leading-[29px] tracking-[-0.4px] text-[#1c1a18]">{value}</span>
        {trend !== undefined && <TrendBadge value={trend} unit="%" good={trend >= 0} />}
      </div>
      <div className="mt-1.5 text-[10px] text-[#8a8f9b]">{note}</div>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="space-y-4 p-[17px]" aria-busy="true" aria-label="Loading ownership records">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-9 w-full" />
      {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-10 w-full" />)}
    </Card>
  );
}

function EmptyState({ clear }: { clear: () => void }) {
  return (
    <div className="flex min-h-[170px] flex-col items-center justify-center px-4 text-center">
      <Search size={18} className="text-[#a0a4ad]" />
      <p className="mt-3 text-[12px] font-medium text-[#1c1a18]">No records match these filters.</p>
      <button type="button" onClick={clear} className="mt-2 text-[11px] font-medium text-[#3310be] hover:underline">Clear filters</button>
    </div>
  );
}

function OwnershipHistory({ record }: { record: OwnershipRecord | null }) {
  const [events, setEvents] = useState<OwnershipEvent[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const badgeId = record?.badgeId ?? null;
  useEffect(() => {
    let active = true;
    if (badgeId) {
      void getOwnershipHistory(badgeId).then((result) => {
        if (active) {
          setEvents(result);
          setFailed(false);
        }
      }).catch(() => {
        if (active) setFailed(true);
      });
    }
    return () => { active = false; };
  }, [badgeId, attempt]);

  const eventIcon = (kind: OwnershipEvent["kind"]) => {
    if (kind === "dispute") return <Flag size={12} className="text-[#dc2626]" />;
    if (kind === "verified") return <ShieldCheck size={12} className="text-[#16a34a]" />;
    if (kind === "mint") return <Layers3 size={12} className="text-[#3310be]" />;
    if (kind === "transfer") return <ArrowUpRight size={12} className="text-[#3310be]" />;
    return <Check size={12} className="text-[#16a34a]" />;
  };

  return (
    <Card className="min-w-0 px-[15px] pb-4 pt-[13px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-[25px] shrink-0 items-center justify-center rounded-[7px] bg-[#f4f5f8]"><History size={13} /></span>
          <h2 className="truncate text-[12px] font-medium text-[#1c1a18]">History{record ? ` · ${record.title}` : ""}</h2>
          <InfoTip tip={{ title: "Ownership history", body: "Provenance checks, collectible claims and ownership events associated with this record." }} align="end" />
        </div>
        {record && <Link to={`/app/culture/badges/${record.badgeId}`} aria-label="Open badge record" className="rounded p-1 text-[#737986] hover:bg-[#f4f5f8]"><ArrowUpRight size={14} /></Link>}
      </div>
      {!record ? (
        <p className="mt-5 text-[11px] text-[#737986]">Select an ownership record to view its history.</p>
      ) : failed ? (
        <div className="mt-5">
          <p role="alert" className="text-[11px] text-[#b91c1c]">Could not load the ownership history.</p>
          <button type="button" onClick={() => setAttempt((current) => current + 1)} className="mt-2 text-[11px] font-medium text-[#3310be]">Try again</button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-0">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-2.5 pb-4 last:pb-0">
                {index < events.length - 1 && <span className="absolute bottom-0 left-[6px] top-[17px] w-px bg-[#eceef2]" />}
                <span className="relative z-[1] mt-0.5 flex size-[13px] shrink-0 items-center justify-center rounded-full bg-white">{eventIcon(event.kind)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium leading-[15px] text-[#1c1a18]">{event.text}</p>
                  <p className="mt-0.5 text-[9px] text-[#8a8f9b]">{event.when} · {event.by}</p>
                  <p className="mt-1 truncate font-mono text-[9px] text-[#8a8f9b]">{event.record}</p>
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-[11px] text-[#737986]">No ownership events have been recorded.</p>}
          </div>
          <div className="mt-4 rounded-[8px] bg-[#f8f9fb] px-2.5 py-2 text-[9px] leading-[14px] text-[#737986]">
            Demo ledger references are placeholders. On-chain events must be verified by the ownership API.
          </div>
        </>
      )}
    </Card>
  );
}

function currentOwner(record: OwnershipRecord) {
  if (record.owners === "Available" || record.owners === "4 collectors" || /collectors$/.test(record.owners)) {
    return record.kind === "contribution" ? "Community" : record.owners;
  }
  return record.owners;
}

function OwnershipTable({
  rows,
  selectedId,
  onSelect,
  disputes,
  onClearFilters,
}: {
  rows: OwnershipRecord[];
  selectedId: string | null;
  onSelect: (record: OwnershipRecord | null) => void;
  disputes: Dispute[];
  onClearFilters: () => void;
}) {
  const disputeFor = (badgeId: string) => disputes.find((dispute) => dispute.badgeId === badgeId && dispute.status !== "resolved" && dispute.status !== "removed");
  return (
    <DataTable
      minWidth={590}
      head={
        <>
          <th scope="col" className="text-left">Badge</th>
          <th scope="col" className="text-left">Creator</th>
          <th scope="col" className="text-left">Current owners</th>
          <th scope="col" className="text-left">Provenance</th>
          <th scope="col" className="text-left">Record</th>
        </>
      }
    >
      {rows.map((record) => {
        const dispute = disputeFor(record.badgeId);
        return (
          <tr
            key={record.badgeId}
            onClick={() => onSelect(record)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(record);
              }
            }}
            tabIndex={0}
            aria-selected={selectedId === record.badgeId}
            className={`cursor-pointer outline-none hover:bg-[#fbfbfc] focus-visible:bg-[#f8f9fb] ${selectedId === record.badgeId ? "bg-[#fbfbfc]" : ""}`}
          >
            <th scope="row" className="h-[53px] text-left font-normal">
              <div className="flex min-w-[150px] items-center gap-2">
                <Avatar name={record.title} size={27} className="rounded-[7px] text-[9px]" />
                <span className="min-w-0">
                  <Link to={`/app/culture/badges/${record.badgeId}`} onClick={(event) => event.stopPropagation()} className="block truncate text-[10px] font-medium text-[#1c1a18] hover:underline">{record.title}</Link>
                  <span className="block truncate text-[9px] text-[#8a8f9b]">{record.kind === "collectible" ? "Collectible" : "Contribution"} · {record.category}</span>
                </span>
              </div>
            </th>
            <td className="max-w-[120px] truncate text-[10px] text-[#1c1a18]">{record.creator}</td>
            <td className="max-w-[100px] truncate text-[10px] text-[#1c1a18]">{currentOwner(record)}</td>
            <td><ProvenancePill status={record.provenance} /></td>
            <td className="whitespace-nowrap">
              {dispute ? (
                <Link to={`/app/ownership/disputes/${dispute.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 font-mono text-[9px] text-[#3310be] hover:underline">
                  Review dispute <ChevronRight size={11} />
                </Link>
              ) : (
                <span className="font-mono text-[9px] text-[#6b7180]">{record.record}</span>
              )}
            </td>
          </tr>
        );
      })}
      {rows.length === 0 && <tr><td colSpan={5} className="p-0"><EmptyState clear={onClearFilters} /></td></tr>}
    </DataTable>
  );
}

function OwnersAndSales({ record }: { record: OwnershipRecord }) {
  const checkRows = record.checks;
  return (
    <div className="space-y-3">
      <Card className="p-[15px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#6b7180]" />
            <h3 className="text-[12px] font-medium text-[#1c1a18]">Creator attribution & provenance</h3>
          </div>
          <ProvenancePill status={record.provenance} />
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div><dt className="text-[9px] text-[#8a8f9b]">Original creator</dt><dd className="mt-0.5 text-[10px] font-medium text-[#1c1a18]">{record.creator}</dd></div>
          <div><dt className="text-[9px] text-[#8a8f9b]">Cultural community</dt><dd className="mt-0.5 text-[10px] font-medium text-[#1c1a18]">{record.community}</dd></div>
          <div><dt className="text-[9px] text-[#8a8f9b]">Record network</dt><dd className="mt-0.5 text-[10px] font-medium text-[#1c1a18]">{record.chain} · demo ledger</dd></div>
          <div><dt className="text-[9px] text-[#8a8f9b]">Provenance reference</dt><dd className="mt-0.5 break-all font-mono text-[9px] text-[#1c1a18]">{record.record}</dd></div>
        </dl>
      </Card>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-[15px] pb-3 pt-[13px]">
          <Layers3 size={14} className="text-[#6b7180]" />
          <h3 className="text-[12px] font-medium text-[#1c1a18]">Sales & ownership claims</h3>
          <InfoTip tip={{ title: "Sales and ownership claims", body: "Collectible badge editions, the collectors who claimed them and whether delivery is complete." }} />
        </div>
        {record.claims.length ? (
          <DataTable
            minWidth={460}
            head={<><th scope="col" className="text-left">Edition</th><th scope="col" className="text-left">Current owner</th><th scope="col" className="text-right">Paid</th><th scope="col" className="text-left">Status</th><th scope="col" className="text-right">Record</th></>}
          >
            {record.claims.map((claim) => (
              <tr key={claim.edition}>
                <th scope="row" className="h-[42px] text-left text-[10px] font-normal text-[#1c1a18]">{claim.edition}</th>
                <td className="text-[10px] text-[#1c1a18]">{claim.collector}</td>
                <td className="whitespace-nowrap text-right text-[10px] text-[#1c1a18]">{usd(claim.paid, 2)}</td>
                <td>{claim.status === "delivered" ? <StatusPill tone="green">Delivered</StatusPill> : <StatusPill tone="amber">Held until delivery</StatusPill>}</td>
                <td className="text-right">
                  {claim.txId ? <Link to={`/app/transactions/${claim.txId}`} className="font-mono text-[9px] text-[#3310be] hover:underline">{claim.txId}</Link> : <span className="text-[9px] text-[#8a8f9b]">{claim.date}</span>}
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className="px-[15px] pb-4 text-[10px] text-[#737986]">No collectible sales. This cultural record remains attributed to its creator and community.</p>
        )}
      </Card>
      <Card className="px-[15px] pb-4 pt-[13px]">
        <div className="flex items-center gap-2">
          <FileCheck2 size={14} className="text-[#6b7180]" />
          <h3 className="text-[12px] font-medium text-[#1c1a18]">Community provenance checks</h3>
        </div>
        {checkRows.length ? (
          <div className="mt-3 space-y-2">
            {checkRows.map((check) => (
              <div key={check.keeper} className="flex items-center justify-between gap-3 rounded-[8px] bg-[#f8f9fb] px-2.5 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-medium text-[#1c1a18]">{check.keeper}</span>
                  <span className="text-[9px] text-[#8a8f9b]">{check.role} · {check.when}</span>
                </span>
                <StatusPill tone={check.decision === "verified" ? "green" : check.decision === "disputed" ? "red" : "amber"}>{check.decision}</StatusPill>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[10px] leading-[16px] text-[#737986]">No Keeper checks are attached to this record yet. Contribution records awaiting community review remain marked pending.</p>
        )}
      </Card>
    </div>
  );
}

function OwnershipDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<OwnershipRecord[] | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [kind, setKind] = useState<"all" | "collectible" | "contribution">("all");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("badge") ?? "golden-hour-sisters");

  usePageTitle("Ownership");
  usePageSubtitle("Who created and owns each cultural asset");

  useEffect(() => {
    let active = true;
    void Promise.all([getOwnershipRecords(), getOwnershipDisputes()])
      .then(([result, cases]) => {
        if (active) {
          setRecords(result);
          setDisputes(cases);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [attempt]);

  const rows = useMemo(() => {
    if (!records) return [];
    const normalized = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery = !normalized || [record.title, record.creator, record.owners, record.category, record.record]
        .some((value) => value.toLowerCase().includes(normalized));
      return matchesQuery && (status === "all" || record.provenance === status) && (kind === "all" || record.kind === kind);
    });
  }, [records, query, status, kind]);
  const selectedRecord = rows.find((record) => record.badgeId === selectedId) ?? records?.find((record) => record.badgeId === selectedId) ?? null;
  const openDisputes = disputes.filter((dispute) => dispute.status === "open" || dispute.status === "evidence_requested").length;
  const verifiedPct = ((OWNERSHIP_METRICS.verified / OWNERSHIP_METRICS.records) * 100).toFixed(1);

  const exportRows = () => {
    if (!records) return;
    downloadCsv("auvra-ownership-records.csv", [{
      title: "Ownership records",
      columns: ["Badge", "Type", "Category", "Creator", "Current owners", "Provenance", "Editions", "Ledger", "Record"],
      rows: rows.map((record) => [
        record.title,
        record.kind === "collectible" ? "Collectible" : "Contribution",
        record.category,
        record.creator,
        currentOwner(record),
        PROVENANCE[record.provenance].label,
        record.editions,
        record.chain,
        record.record,
      ]),
    }]);
  };
  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setKind("all");
  };
  const selectRecord = (record: OwnershipRecord | null) => {
    setSelectedId(record?.badgeId ?? null);
    const next = new URLSearchParams(searchParams);
    if (record) next.set("badge", record.badgeId);
    else next.delete("badge");
    setSearchParams(next, { replace: true });
  };

  if (loadError) {
    return <LoadError title="We couldn't load ownership records" onRetry={() => { setLoadError(false); setAttempt((value) => value + 1); }} />;
  }
  if (!records) return <TableSkeleton />;

  return (
    <div className="space-y-5 pb-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.45px] text-[#1c1a18]">Ownership</h1>
          <p className="mt-1 text-[11px] text-[#737986]">Who created and owns each cultural asset.</p>
        </div>
        <button type="button" onClick={exportRows} className="inline-flex h-[34px] items-center gap-2 rounded-[8px] bg-[#1c1a18] px-3 text-[11px] font-medium text-white hover:bg-[#2f2c29]">
          <Download size={13} /> Export
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Badges on record"
          value={OWNERSHIP_METRICS.records.toLocaleString("en-US")}
          note="All time"
          icon={Layers3}
          tip="Contribution and Collectible Badges represented in Auvra's ownership ledger."
        />
        <MetricCard
          label="Provenance verified"
          value={`${verifiedPct}%`}
          note={`${OWNERSHIP_METRICS.verified.toLocaleString("en-US")} badges`}
          icon={ShieldCheck}
          tip="Share of badge records with verified creator attribution and provenance."
          active={status === "verified"}
          onClick={() => setStatus(status === "verified" ? "all" : "verified")}
        />
        <MetricCard
          label="Disputes open"
          value={Math.max(OWNERSHIP_METRICS.openDisputes - 1 + openDisputes, openDisputes).toLocaleString("en-US")}
          note={openDisputes > 0 ? "Oldest 5 days" : "No open disputes"}
          icon={Flag}
          tip="Ownership or attribution challenges awaiting a decision. Sales stay paused while a dispute is open."
          active={status === "disputed"}
          onClick={() => setStatus(status === "disputed" ? "all" : "disputed")}
        />
        <MetricCard
          label="Ownership transfers"
          value={OWNERSHIP_METRICS.transfers.toLocaleString("en-US")}
          note="Last 30 days"
          icon={ArrowUpRight}
          tip="Recorded edition claims, transfers and ownership changes in the last 30 days."
          trend={4.8}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceef2] px-[15px] py-[13px]">
            <div className="flex items-center gap-2">
              <span className="flex size-[25px] items-center justify-center rounded-[7px] bg-[#f4f5f8]"><Fingerprint size={13} /></span>
              <h2 className="text-[12px] font-medium text-[#1c1a18]">Ownership records</h2>
              <span className="text-[10px] text-[#8a8f9b]">{rows.length} shown</span>
              <InfoTip tip={{ title: "Ownership records", body: "Creator attribution, current owners, provenance status and ledger reference for cultural and collectible badges." }} />
            </div>
            {disputes.some((dispute) => dispute.status === "open" || dispute.status === "evidence_requested") && (
              <Link to={`/app/ownership/disputes/${disputes.find((dispute) => dispute.status === "open" || dispute.status === "evidence_requested")?.id}`} className="text-[10px] font-medium text-[#3310be] hover:underline">
                Review dispute
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-[#eceef2] px-[15px] py-[10px]">
            <SearchField value={query} onChange={setQuery} />
            <Select<(typeof FILTERS)[number]["value"]> label="Filter by provenance status" value={status} options={[...FILTERS]} onChange={setStatus} />
            <Select<"all" | "collectible" | "contribution">
              label="Filter by badge type"
              value={kind}
              options={[{ value: "all", label: "All Badge types" }, { value: "collectible", label: "Collectible" }, { value: "contribution", label: "Contribution" }]}
              onChange={setKind}
            />
            {(query || status !== "all" || kind !== "all") && (
              <button type="button" onClick={clearFilters} className="text-[10px] font-medium text-[#6b7180] hover:text-[#1c1a18]">Clear</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <OwnershipTable rows={rows} selectedId={selectedId} onSelect={selectRecord} disputes={disputes} onClearFilters={clearFilters} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eceef2] px-[15px] py-[9px] text-[9px] text-[#8a8f9b]">
            <span>Showing {rows.length ? 1 : 0}–{rows.length} of {rows.length} loaded demo records</span>
            <span>Production records are supplied by the ownership API.</span>
          </div>
        </Card>

        <div className="space-y-3">
          <OwnershipHistory record={selectedRecord} />
          {selectedRecord && <OwnersAndSales record={selectedRecord} />}
          <Card className="px-[15px] pb-3 pt-[13px]">
            <div className="flex items-center gap-2">
              <CircleAlert size={14} className="text-[#6b7180]" />
              <h2 className="text-[12px] font-medium text-[#1c1a18]">Ledger note</h2>
            </div>
            <p className="mt-2 text-[10px] leading-[16px] text-[#737986]">
              This rebuild uses mock record hashes and chain events for demonstration. Do not treat them as live blockchain proofs.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EvidenceCard({ title, name, role, statement, evidence }: {
  title: string;
  name: string;
  role: string;
  statement: string;
  evidence: string[];
}) {
  return (
    <Card className="min-w-0 p-[13px]">
      <div className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#8a8f9b]">{title}</div>
      <div className="mt-2 flex items-center gap-2">
        <Avatar name={name} size={26} className="rounded-[7px] text-[9px]" />
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-[#1c1a18]">{name}</div>
          <div className="truncate text-[9px] text-[#8a8f9b]">{role}</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-[16px] text-[#1c1a18]">{statement}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {evidence.map((file) => (
          <span key={file} className="inline-flex max-w-full items-center gap-1 rounded-[6px] bg-[#f4f5f8] px-2 py-1 text-[9px] text-[#535966]">
            <FileCheck2 size={11} className="shrink-0" /><span className="truncate">{file}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

function DisputeDecisionForm({ dispute, onResolved }: { dispute: Dispute; onResolved: () => void }) {
  const user = useSessionUser();
  const [decision, setDecision] = useState<DisputeDecision>("evidence");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDecide = dispute.status === "open" || dispute.status === "evidence_requested";

  const submit = async () => {
    if (!note.trim()) {
      setError("Add a short explanation for the audit log.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await decideOwnershipDispute(dispute.id, decision, note, user?.name ?? "Auvra Admin");
      onResolved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The dispute decision could not be saved.");
      setBusy(false);
    }
  };

  const options: { value: DisputeDecision; title: string; description: string }[] = [
    { value: "creator", title: `Keep the Badge with ${dispute.creator} as creator`, description: "Resolve the dispute in favour of the listed creator and resume sales." },
    { value: "evidence", title: "Ask both for more evidence", description: "Keep the dispute open and continue pausing collectible sales." },
    { value: "remove", title: "Remove the Badge and refund collectors", description: "Remove the disputed asset and mark its existing claims for refund." },
  ];

  return (
    <>
      {dispute.status === "resolved" || dispute.status === "removed" ? (
        <div className="rounded-[9px] border border-[#d9efdf] bg-[#f0faf3] px-3 py-2 text-[10px] text-[#176b37]">
          {dispute.status === "removed" ? "This Badge was removed and its existing collectors are marked for refund." : "This dispute is resolved. The creator attribution is confirmed and sales may resume."}
        </div>
      ) : dispute.status === "evidence_requested" ? (
        <div className="rounded-[9px] border border-[#f2dfb4] bg-[#fff9ed] px-3 py-2 text-[10px] text-[#8c5d08]">
          More evidence has been requested from both parties. Sales remain paused while the dispute is open.
        </div>
      ) : null}
      <fieldset disabled={!canDecide || busy} className="mt-1">
        <legend className="text-[11px] font-semibold text-[#1c1a18]">Decision</legend>
        <div className="mt-2 space-y-2">
          {options.map((option) => (
            <label key={option.value} className={`flex cursor-pointer items-start gap-2.5 rounded-[9px] border px-3 py-2.5 transition-colors ${decision === option.value ? "border-[#1c1a18] bg-[#fbfbfc]" : "border-[#eceef2] hover:bg-[#f8f9fb]"} ${!canDecide ? "cursor-default opacity-60" : ""}`}>
              <input type="radio" name="ownership-decision" value={option.value} checked={decision === option.value} onChange={() => setDecision(option.value)} className="mt-[2px] accent-[#1c1a18]" />
              <span>
                <span className="block text-[10px] font-medium text-[#1c1a18]">{option.title}</span>
                <span className="mt-0.5 block text-[9px] leading-[14px] text-[#737986]">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span id="ownership-audit-note-label" className="text-[10px] font-semibold text-[#1c1a18]">Note for the audit log</span>
        <textarea
          id="ownership-audit-note"
          aria-labelledby="ownership-audit-note-label"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={!canDecide || busy}
          rows={3}
          placeholder="Summarise the evidence reviewed and why this decision is appropriate."
          className="mt-2 w-full resize-y rounded-[9px] border border-[#eceef2] bg-white px-3 py-2.5 text-[10px] leading-[16px] text-[#1c1a18] outline-none placeholder:text-[#a0a4ad] focus:ring-2 focus:ring-[#3310be]/30 disabled:bg-[#f8f9fb]"
        />
      </label>
      {error && <p role="alert" className="mt-2 text-[10px] text-[#b91c1c]">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Link to="/app/ownership" className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb]">
          <X size={12} /> Back to Ownership
        </Link>
        <button type="button" onClick={() => void submit()} disabled={!canDecide || busy} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-50">
          {busy ? <Clock3 size={12} className="animate-pulse" /> : <Check size={12} />}
          {busy ? "Saving…" : "Confirm decision"}
        </button>
      </div>
      {decision === "remove" && canDecide && (
        <p className="mt-3 text-[9px] leading-[14px] text-[#8a8f9b]">
          Refunds are recorded in this demo workflow only; the production refund and asset-removal APIs must complete the real actions.
        </p>
      )}
    </>
  );
}

export function OwnershipDispute() {
  const { disputeId = "" } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [badge, setBadge] = useState<BadgeRecord | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  usePageTitle("Ownership dispute");
  usePageSubtitle(dispute?.badge ?? "Review the ownership claim and evidence");

  useEffect(() => {
    let active = true;
    void getOwnershipDispute(disputeId).then(async (result) => {
      if (!active) return;
      if (!result) {
        setDispute(null);
        setBadge(null);
        return;
      }
      setDispute(result);
      try {
        const badgeRecord = await getBadgeRecord(result.badgeId);
        if (active) setBadge(badgeRecord);
      } catch {
        if (active) setFailed(true);
      }
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [disputeId, attempt]);

  if (failed) {
    return <LoadError title="We couldn't load this ownership dispute" onRetry={() => { setFailed(false); setAttempt((value) => value + 1); }} />;
  }
  if (!dispute) return <TableSkeleton />;

  const onResolved = () => navigate("/app/ownership", { replace: true });

  return (
    <div className="space-y-3 pb-5">
      <Link to="/app/ownership" className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#737986] hover:text-[#1c1a18]">
        <ArrowLeft size={13} /> Back to Ownership
      </Link>
      <Card className="p-[15px]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex size-[25px] shrink-0 items-center justify-center rounded-[7px] bg-[#f4f5f8]"><Flag size={13} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[14px] font-medium text-[#1c1a18]">Dispute · {dispute.badge}</h1>
                <InfoTip tip={{ title: "Ownership dispute", body: "Review creator attribution evidence. Collectible sales remain paused until the dispute has been resolved." }} />
              </div>
              <p className="mt-1 text-[9px] text-[#8a8f9b]">{dispute.id} · opened {dispute.opened}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <StatusPill tone="purple">{dispute.edition}</StatusPill>
            <StatusPill tone={dispute.status === "resolved" ? "green" : dispute.status === "removed" ? "gray" : "amber"}>{dispute.status === "evidence_requested" ? "Evidence requested" : dispute.status === "resolved" ? "Resolved" : dispute.status === "removed" ? "Removed" : "Open 5 days"}</StatusPill>
            <StatusPill tone={dispute.salesPaused ? "red" : "green"}>{dispute.salesPaused ? "Sales paused" : "Sales active"}</StatusPill>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <EvidenceCard title="Claim" name={dispute.claimant} role={dispute.claimantRole} statement={dispute.statement} evidence={dispute.claimantEvidence} />
          <EvidenceCard title="Creator" name={dispute.creator} role={dispute.creatorRole} statement={dispute.response} evidence={dispute.creatorEvidence} />
        </div>

        <section className="mt-5">
          <DisputeDecisionForm dispute={dispute} onResolved={onResolved} />
        </section>
      </Card>

      <Card className="px-[15px] pb-3 pt-[13px]">
        <div className="flex items-center gap-2">
          <History size={14} className="text-[#6b7180]" />
          <h2 className="text-[12px] font-medium text-[#1c1a18]">Dispute audit trail</h2>
        </div>
        <div className="mt-3 space-y-2">
          {dispute.audit.map((entry, index) => (
            <div key={`${entry.when}-${entry.by}-${index}`} className="flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-[8px] bg-[#f8f9fb] px-2.5 py-2">
              <span className="text-[10px] leading-[15px] text-[#1c1a18]">{entry.text}</span>
              <span className="shrink-0 text-[9px] text-[#8a8f9b]">{entry.by} · {entry.when}</span>
            </div>
          ))}
        </div>
        {badge?.claims?.length ? <p className="mt-3 text-[9px] text-[#8a8f9b]">{badge.claims.length} collectible claim record(s) linked to the disputed Badge.</p> : null}
        <a href={`/app/culture/badges/${dispute.badgeId}`} className="mt-3 inline-flex items-center gap-1 text-[9px] font-medium text-[#3310be] hover:underline">
          Open Badge record <ExternalLink size={10} />
        </a>
      </Card>
    </div>
  );
}

export function Ownership() {
  return <OwnershipDashboard />;
}
