import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, IconButton, MoreButton, PrimaryAction, ToolbarButton, TrendBadge } from "../components/ui/controls";
import { MarkerLine, ProgressRing, Sparkline, StackedBarChart } from "../components/ui/charts";
import type { StackSeries } from "../components/ui/charts";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle } from "../components/layout/headerSlots";
import { getHomeOverview } from "../data/home";
import type { HomeOverview } from "../data/home";
import usersIcon from "../assets/dashboard/card-users.svg";
import chartIcon from "../assets/dashboard/card-chart.svg";
import transactionsIcon from "../assets/dashboard/card-transactions.svg";
import snapshotIcon from "../assets/dashboard/card-snapshot.svg";
import calendarIcon from "../assets/dashboard/calendar.svg";
import filterIcon from "../assets/dashboard/filter.svg";
import exportIcon from "../assets/dashboard/export.svg";
import chevronDownIcon from "../assets/dashboard/chevron-down.svg";
import expandIcon from "../assets/dashboard/expand.svg";
import trustMark from "../assets/dashboard/trust-mark.svg";

const usd = (v: number, digits = 2) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(v));
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const REVENUE_SERIES: (StackSeries & { key: "vault" | "community" | "collectibleFees" })[] = [
  { key: "vault", name: "My Vault", color: "#3310be" },
  { key: "community", name: "Community", color: "#8c78ee" },
  { key: "collectibleFees", name: "Collectible fees", color: "#dcd5fb" },
];

const SNAPSHOT_TILES = {
  ownership: { color: "#3310be", to: "/app/ownership" },
  lens: { color: "#16a34a", to: "/app/lens" },
  notifications: { color: "#e5484d", to: "/app/notifications" },
} as const;

function downloadRevenueCsv(data: HomeOverview) {
  const rows = [["Month", ...REVENUE_SERIES.map((s) => s.name), "Total"]];
  data.revenue.months.forEach((m) => {
    const values = REVENUE_SERIES.map((s) => m[s.key]);
    rows.push([m.label, ...values.map(String), String(values.reduce((a, b) => a + b, 0))]);
  });
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `auvra-revenue-${data.revenue.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Cards ---------- */

function UsersCard({ data }: { data: HomeOverview["users"] }) {
  return (
    <Card className="relative overflow-hidden px-[17px] pb-5 pt-[13px]">
      <CardHeader
        icon={usersIcon}
        title="Users"
        tip={{ title: "Users", body: "Everyone with an Auvra account: creators, collectors, communities and families." }}
      />
      <div className="pointer-events-none absolute right-0 top-[54px] hidden min-[380px]:block">
        <Sparkline values={data.trend} label={`Users trending up ${data.growthPct}%`} />
      </div>
      <div className="mt-[36px] flex items-center gap-2">
        <span className="text-[44px] font-light leading-[48px] tracking-[-1.5px] text-[#1c1a18]">{compact(data.total)}</span>
        <TrendBadge value={data.growthPct} />
      </div>
      <div className="mt-4 text-[13px] text-[#1c1a18]">{data.growthPct >= 0 ? "Growth stays strong" : "Growth is slowing"}</div>
      <div className="mt-1.5 max-w-[259px] text-[11px] text-[#6b7180]">
        {data.signupsToday} new sign-ups today, most from {data.topCountries.join(" and ")}.
      </div>
    </Card>
  );
}

function CultureCard({ data }: { data: HomeOverview["culture"] }) {
  return (
    <Card className="flex flex-col px-[17px] pb-1.5 pt-[13px]">
      <CardHeader
        icon={chartIcon}
        title="Cultural Intelligence"
        tip={{
          title: "Cultural Intelligence",
          body: "How much shared knowledge communities have checked. Verified culture is accurate, credited and respected.",
          footnote: "Why it matters for our mission",
        }}
      />
      <div className="mt-[30px] flex items-start justify-between gap-3 px-0.5">
        <div className="max-w-[200px] text-[13px] leading-[17px] text-[#6b7180]">
          Your verification rate is {data.verificationRatePct}%, which means communities are actively reviewing.
        </div>
        <TrendBadge value={data.growthPct} className="mt-0.5" />
      </div>
      <div className="mt-auto px-0.5 pt-3">
        <MarkerLine points={data.trend} label={`Verification rate trend, now ${data.verificationRatePct}%`} />
      </div>
    </Card>
  );
}

function TrustCard({ openReports }: { openReports: number }) {
  return (
    <section className="relative isolate flex min-h-[380px] flex-col overflow-hidden rounded-[16px] bg-[#07080c] lg:h-[422px]">
      {/* Decorative backdrop from the design */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(80,90,130,0.35)_0%,rgba(44,49,71,0.175)_30%,rgba(7,8,12,0)_60%)]" />
        <div className="absolute left-1/2 top-0 h-[76px] w-px bg-white/12" />
        <div className="absolute left-1/2 top-[40px] size-[302px] -translate-x-1/2 rounded-full border border-white/7" />
        <div className="absolute left-[calc(50%-225px)] top-[86px] size-[92px] rounded-full bg-[radial-gradient(circle,#2a2e3a_0%,#1c1a18_70%)] shadow-[0_8px_24px_rgba(0,0,0,0.2)]" />
        <div className="absolute left-[calc(50%+87px)] top-[86px] size-[92px] rounded-full bg-[radial-gradient(circle,#2a2e3a_0%,#1c1a18_70%)] shadow-[0_8px_24px_rgba(0,0,0,0.2)]" />
        <div className="absolute left-1/2 top-[76px] size-[100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#333849_0%,#222532_35%,#10121a_70%)] shadow-[0_8px_24px_rgba(0,0,0,0.2)]" />
        <img src={trustMark} alt="" width={34.6} height={38} className="absolute left-1/2 top-[107px] -translate-x-1/2" />
        <span className="absolute left-1/2 top-[168px] flex size-4 -translate-x-1/2 items-center justify-center rounded-full bg-white text-[12px] font-semibold leading-none text-[#1c1a18]">
          !
        </span>
      </div>
      <div className="mt-[232px] px-6 text-center text-[25px] leading-[32px] tracking-[-0.4px] text-white">
        Trust and Safety:
        <br />
        {openReports} reports to review.
      </div>
      <Link
        to="/app/safety/reports"
        className="mx-[11px] mb-[11px] mt-auto flex h-[52px] items-center justify-center rounded-[10px] border border-white/8 bg-[#1b1f2a] text-[14px] text-white hover:bg-[#232838]"
      >
        Review now
      </Link>
    </section>
  );
}

function RevenueCard({ data, onExport }: { data: HomeOverview["revenue"]; onExport: () => void }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen && !expanded) return;
    const onDown = (e: MouseEvent) => {
      if (filterOpen && !filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFilterOpen(false);
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [filterOpen, expanded]);

  const visible = REVENUE_SERIES.filter((s) => !hidden.includes(s.key));
  const columns = data.months.map((m) => ({ label: m.label, growth: m.growth, values: visible.map((s) => m[s.key]) }));
  const max = 36_000;

  return (
    <>
      {expanded && <div className="fixed inset-0 z-40 bg-[rgba(28,26,24,0.45)]" onClick={() => setExpanded(false)} />}
      <Card className={`flex flex-col px-[17px] pb-5 pt-2.5 ${expanded ? "fixed inset-4 z-50 overflow-auto sm:inset-10" : "min-h-[460px] lg:h-[529px]"}`}>
        <CardHeader
          icon={chartIcon}
          title="Annual Revenue Growth"
          tip={{ title: "Annual Revenue Growth", body: "Revenue this year from My Vault and Community subscriptions plus Collectible Badge marketplace fees." }}
        >
          <ToolbarButton icon={calendarIcon} className="hidden sm:flex">
            {shortDate(data.from)} – {shortDate(data.to)}
          </ToolbarButton>
          <div ref={filterRef} className="relative">
            <ToolbarButton icon={filterIcon} aria-expanded={filterOpen} onClick={() => setFilterOpen((o) => !o)}>
              Filter
            </ToolbarButton>
            {filterOpen && (
              <div className="absolute right-0 top-full z-30 mt-1.5 w-[190px] rounded-[12px] border border-[#eceef2] bg-white p-1.5 shadow-[0_12px_32px_rgba(28,26,24,0.12)]">
                {REVENUE_SERIES.map((s) => (
                  <label key={s.key} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] text-[#1c1a18] hover:bg-[#f4f5f8]">
                    <input
                      type="checkbox"
                      checked={!hidden.includes(s.key)}
                      // Keep at least one series visible
                      disabled={!hidden.includes(s.key) && visible.length === 1}
                      onChange={() => setHidden((h) => (h.includes(s.key) ? h.filter((k) => k !== s.key) : [...h, s.key]))}
                      className="accent-[#3310be]"
                    />
                    <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <ToolbarButton icon={exportIcon} trailingIcon={chevronDownIcon} onClick={onExport}>
            Export
          </ToolbarButton>
        </CardHeader>

        <div className="mt-[22px] flex items-start justify-between gap-3">
          <div className="text-[30px] font-medium tracking-[-0.6px] text-[#1c1a18]">{usd(data.total)}</div>
          <IconButton icon={expandIcon} label={expanded ? "Close full view" : "Open full view"} onClick={() => setExpanded((e) => !e)} className="hidden sm:flex" />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex items-center gap-2.5">
            <TrendBadge value={data.growthPct} />
            <span className="text-[13px] font-medium text-[#1c1a18]">+{usd(data.gainedThisYear)} this year</span>
          </div>
          <ul className="flex flex-wrap items-center gap-x-[18px] gap-y-1" aria-label="Legend">
            {REVENUE_SERIES.map((s) => (
              <li key={s.key} className={`flex items-center gap-1.5 text-[13px] text-[#1c1a18] ${hidden.includes(s.key) ? "opacity-40" : ""}`}>
                <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-x-auto">
          <div className="h-full min-w-[560px] pt-3">
            <StackedBarChart
              series={visible}
              columns={columns}
              max={max}
              ticks={[0, 12_000, 24_000, 36_000]}
              formatTick={(v) => `${v / 1000}k`}
              formatValue={(v) => usd(v, 0)}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

function TransactionsCard({ data }: { data: HomeOverview["transactions"] }) {
  return (
    <Card className="px-[17px] pb-4 pt-2.5">
      <CardHeader
        icon={transactionsIcon}
        title="Latest Transactions"
        tip={{ title: "Latest Transactions", body: "The most recent payments, subscriptions, payouts and deposits across all providers." }}
      >
        <MoreButton label="Open Transactions" to="/app/transactions" />
      </CardHeader>
      <ul className="mt-[23px] space-y-[25px]">
        {data.map((t) => (
          <li key={t.id} className="flex items-center gap-3.5">
            <Avatar name={t.name} color={t.avatarColor} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-medium text-[#1c1a18]">{t.name}</div>
              <div className="truncate text-[12px] text-[#6b7180]">{t.description}</div>
            </div>
            <div className="text-[14px] font-medium text-[#1c1a18]">
              {t.amount < 0 ? "−" : "+"}
              {usd(Math.abs(t.amount))}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SnapshotCard({ data }: { data: HomeOverview["snapshot"] }) {
  const pct = Math.min(100, (data.payoutsSent / data.payoutBudget) * 100);
  return (
    <Card className="px-[17px] pb-[17px] pt-2.5">
      <CardHeader
        icon={snapshotIcon}
        title="Platform Snapshot"
        tip={{ title: "Platform Snapshot", body: "Creator payouts against this month's budget, plus quick health checks for other areas." }}
      >
        <MoreButton label="Open Transactions" to="/app/transactions" />
      </CardHeader>

      <div className="relative mt-[60px]">
        <span
          className="absolute bottom-full mb-[14px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1c1a18] px-3 py-1 text-[13px] font-medium text-white"
          style={{ left: `clamp(36px, ${pct}%, calc(100% - 36px))` }}
        >
          {usd(data.payoutsSent / 1000, 1).replace(/\.0$/, "")}K
        </span>
        <div
          className="relative h-3 rounded-full border border-[#eceef2]"
          role="progressbar"
          aria-label="Payouts against budget"
          aria-valuenow={data.payoutsSent}
          aria-valuemin={0}
          aria-valuemax={data.payoutBudget}
        >
          <div className="absolute inset-y-[-1px] left-[-1px] rounded-full bg-[#1c1a18]" style={{ width: `calc(${pct}% + 1px)` }}>
            <span className="absolute right-[2px] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white" />
          </div>
          {[70, 78, 86, 94].filter((p) => p > pct + 3).map((p) => (
            <span key={p} className="absolute top-1/2 size-1 -translate-y-1/2 rounded-full bg-[#c8ccd4]" style={{ left: `${p}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-[22px] flex justify-between text-[13px] text-[#1c1a18]">
        <span>Payouts $0</span>
        <span>{usd(data.payoutBudget / 1000, 0)}K budget</span>
      </div>

      <div className="mt-[18px] grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3">
        {data.tiles.map((tile) => (
          <div key={tile.key} className="flex flex-col rounded-[12px] bg-[#f4f5f8] p-3 min-[420px]:h-[144px]">
            <div className="flex items-start justify-between">
              <ProgressRing value={tile.valuePct} color={SNAPSHOT_TILES[tile.key].color} />
              <MoreButton compact label={`Open ${tile.title}`} to={SNAPSHOT_TILES[tile.key].to} />
            </div>
            <div className="mt-auto pt-3 text-[14px] leading-[18px]">
              <div className="text-[#1c1a18]">{tile.title}</div>
              <div className="text-[#6b7180]">{tile.caption}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Loading and error ---------- */

function HomeSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="space-y-3 p-[17px]">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-2.5 w-2/5" />
          </Card>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-3 h-7 w-1/4" />
          <div className="mt-6 flex h-[240px] items-end gap-[3%]">
            {[40, 60, 68, 87, 80, 76, 72, 85, 91, 100].map((h, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
            ))}
          </div>
        </Card>
        <Card className="space-y-5 p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="size-6 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-3/5" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function HomeError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center px-5 py-14 text-center">
      <div className="text-[17px] font-semibold text-[#1c1a18]">We couldn't load the overview</div>
      <div className="mt-2 max-w-[358px] text-[13px] leading-[20px] text-[#6b7180]">Check your connection and try again. Nothing has been lost.</div>
      <button type="button" onClick={onRetry} className="mt-4 h-10 rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
        Try again
      </button>
    </Card>
  );
}

/* ---------- Page ---------- */

export function Home() {
  const [data, setData] = useState<HomeOverview | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getHomeOverview()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  usePageSubtitle(data || failed ? null : "Loading the latest numbers…");

  if (failed) {
    return (
      <HomeError
        onRetry={() => {
          setFailed(false);
          setData(null);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }
  if (!data) return <HomeSkeleton />;

  return (
    <>
      <PageActions>
        <PrimaryAction onClick={() => downloadRevenueCsv(data)}>Export report</PrimaryAction>
      </PageActions>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[330px_minmax(0,1fr)]">
        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <UsersCard data={data.users} />
          <CultureCard data={data.culture} />
          <div className="sm:col-span-2 lg:col-span-1">
            <TrustCard openReports={data.safety.openReports} />
          </div>
        </div>

        <div className="grid grid-cols-1 content-start gap-3">
          <RevenueCard data={data.revenue} onExport={() => downloadRevenueCsv(data)} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TransactionsCard data={data.transactions} />
            <SnapshotCard data={data.snapshot} />
          </div>
        </div>
      </div>
    </>
  );
}
