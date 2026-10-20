import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { PrimaryAction, SegmentedControl, ToolbarMenu } from "../components/ui/controls";
import { AreaLineChart, DonutChart, StackedBarChart } from "../components/ui/charts";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle } from "../components/layout/headerSlots";
import { ExportReportModal, KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { niceTicks, usd, usdShort } from "../utils/format";
import type { ExportRequest } from "../components/business/biParts";
import { REGIONS, getBusinessIntelligence } from "../data/businessIntelligence";
import type { BiFilters, BiOverview, RangeMonths, RegionFilter } from "../data/businessIntelligence";
import { downloadCsv, printReport } from "../utils/report";
import type { ReportSection } from "../utils/report";
import barsIcon from "../assets/dashboard/card-bars.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import starIcon from "../assets/dashboard/card-star.svg";
import arrowDownIcon from "../assets/dashboard/card-arrow-down.svg";
import arrowUpIcon from "../assets/dashboard/card-arrow-up.svg";
import globeIcon from "../assets/dashboard/card-globe.svg";
import globeSmallIcon from "../assets/dashboard/globe-13.svg";
import calendarIcon from "../assets/dashboard/calendar.svg";
import exportWhiteIcon from "../assets/dashboard/export-white.svg";
import chevronRightIcon from "../assets/dashboard/chevron-right-13.svg";

const KPI_ICONS: Record<string, string> = {
  mrr: barsIcon,
  arpu: usersIcon,
  cac: arrowsIcon,
  ltv: starIcon,
  churn: arrowDownIcon,
  freeToPaid: arrowUpIcon,
};

const SOURCE_COLORS = { vault: "#3310be", community: "#8c78ee", collectibleFees: "#f2c14e" } as const;
const ACTUAL_COLOR = "#3310be";
const PROJECTED_COLOR = "#8c78ee";

const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [{ value: "all", label: "All regions" }, ...REGIONS.map((r) => ({ value: r, label: r }))];
const RANGE_OPTIONS: { value: `${RangeMonths}`; label: string }[] = [
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
];

const EXPORT_OPTIONS = [
  { key: "revenue", label: "Revenue and MRR", defaultChecked: true },
  { key: "sources", label: "Revenue by source and region", defaultChecked: true },
  { key: "payouts", label: "Payouts to creators", defaultChecked: true },
  { key: "providers", label: "Transaction volume by provider" },
];

function buildReport(data: BiOverview, include: string[]): ReportSection[] {
  const sections: ReportSection[] = [];
  if (include.includes("revenue")) {
    sections.push({ title: "Key metrics", columns: ["Metric", "Value", "Change vs previous 30 days"], rows: data.kpis.map((k) => [k.label, k.value, `${k.change} ${k.changeUnit}`]) });
    sections.push({ title: "Revenue · actual vs projected", columns: ["Month", "Actual", "Projected"], rows: data.revenue.months.map((m) => [m.label, m.actual, m.projected]) });
  }
  if (include.includes("sources")) {
    sections.push({ title: "Revenue by source", columns: ["Source", "Revenue"], rows: data.sources.map((s) => [s.name, s.amount]) });
    sections.push({ title: "Revenue by region", columns: ["Region", "Revenue", "Users", "ARPU"], rows: data.regions.map((r) => [r.region, r.revenue, r.users, r.arpu]) });
  }
  if (include.includes("payouts")) {
    sections.push({
      title: "Payouts to creators",
      columns: ["Month", "Paid out"],
      rows: [...data.payouts.months.map((m) => [m.label, m.amount]), ["Pending now", data.payouts.pending], ["Failed now", data.payouts.failed]],
    });
  }
  if (include.includes("providers")) {
    sections.push({ title: "Transaction volume by provider", columns: ["Provider", "Coverage", "Volume"], rows: data.providers.map((p) => [p.name, p.coverage, p.volume]) });
  }
  return sections;
}

/* ---------- Cards ---------- */

function RevenueCard({ data, rangeMonths }: { data: BiOverview["revenue"]; rangeMonths: RangeMonths }) {
  const [zoom, setZoom] = useState<RangeMonths>(12);
  // The chart can zoom in on the page range, never past it
  const view = Math.min(zoom, rangeMonths) as RangeMonths;
  const months = data.months.slice(-view);
  const { max, ticks } = niceTicks(Math.max(...months.map((m) => Math.max(m.actual, m.projected))), 10_000);
  const pct = data.projectedTotal ? Math.round((data.total / data.projectedTotal) * 100) : 0;

  return (
    <Card className="flex flex-col px-[17px] pb-[17px] pt-[13px]">
      <CardHeader
        icon={barsIcon}
        title="Revenue · actual vs projected"
        tip={{ title: "Revenue · actual vs projected", body: "Money earned each month against the forecast set at the start of the period." }}
      >
        <SegmentedControl
          label="Chart period"
          value={`${view}`}
          onChange={(v) => setZoom(Number(v) as RangeMonths)}
          options={(["3", "6", "12"] as const).map((v) => ({ value: v, label: v === "12" ? "1y" : `${v}m`, disabled: Number(v) > rangeMonths }))}
        />
      </CardHeader>

      <div className="mt-[30px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[30px] font-medium leading-[36px] tracking-[-0.6px] text-[#1c1a18]">{usd(data.total)}</div>
          <div className="mt-1 text-[12px] text-[#6b7180]">
            {pct}% of the {usd(data.projectedTotal)} projected for this period
          </div>
        </div>
        <ul className="flex items-center gap-4" aria-label="Legend">
          {[
            { name: "Actual", color: ACTUAL_COLOR },
            { name: "Projected", color: PROJECTED_COLOR },
          ].map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 text-[12px] text-[#6b7180]">
              <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 h-[230px] min-h-0 flex-1">
        <AreaLineChart
          points={months}
          max={max}
          ticks={ticks}
          formatTick={(v) => (v ? `$${v / 1000}K` : "$0")}
          formatValue={(v) => usd(v)}
          color={ACTUAL_COLOR}
          projectedColor={PROJECTED_COLOR}
        />
      </div>
    </Card>
  );
}

// Each source opens its own breakdown page under /app/business
const SOURCE_PAGES: Record<BiOverview["sources"][number]["key"], string> = { vault: "vault", community: "community", collectibleFees: "collectibles" };

function SourcesCard({ data }: { data: BiOverview["sources"] }) {
  const navigate = useNavigate();
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((a, s) => a + s.amount, 0) || 1;
  const slices = data.map((s) => ({ name: s.name, value: s.amount, color: SOURCE_COLORS[s.key] }));

  return (
    <Card className="flex flex-col px-[17px] pb-[17px] pt-[13px]">
      <CardHeader
        icon={arrowsIcon}
        title="Revenue by source"
        tip={{ title: "Revenue by source", body: "Where revenue comes from: My Vault and Community subscriptions, plus Collectible Badge marketplace fees. Open a source to see its breakdown." }}
      />

      <div className="flex flex-1 flex-col items-center gap-6 py-6 min-[480px]:flex-row min-[480px]:gap-5">
        <DonutChart
          slices={slices}
          size={150}
          thickness={24}
          label={`Revenue by source: ${data.map((s) => `${s.name} ${Math.round((s.amount / total) * 100)}%`).join(", ")}`}
          activeIndex={active}
          onActiveChange={setActive}
          onSelect={(i) => navigate(SOURCE_PAGES[data[i].key])}
        />
        <ul className="w-full min-w-0 flex-1 space-y-1">
          {data.map((s, i) => (
            <li key={s.key} className={`transition-opacity ${active !== null && active !== i ? "opacity-50" : ""}`}>
              <Link
                to={SOURCE_PAGES[s.key]}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="-mx-2 grid grid-cols-[10px_minmax(0,1fr)_auto_36px_13px] items-center gap-x-2.5 rounded-[8px] px-2 py-1.5 outline-none hover:bg-[#f4f5f8] focus-visible:ring-2 focus-visible:ring-[#3310be]/30"
              >
                <span className="size-2.5 rounded-[3px]" style={{ background: SOURCE_COLORS[s.key] }} />
                <span className="text-[13px] leading-[19px] text-[#1c1a18]">{s.name}</span>
                <span className="text-[13px] font-semibold text-[#1c1a18]">{usdShort(s.amount)}</span>
                <span className="text-right text-[12px] text-[#6b7180]">{Math.round((s.amount / total) * 100)}%</span>
                <img src={chevronRightIcon} alt="" width={13} height={13} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function ProvidersCard({ data }: { data: BiOverview["providers"] }) {
  const max = Math.max(1, ...data.map((p) => p.volume));
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader
        icon={arrowsIcon}
        title="Transaction volume by provider"
        tip={{ title: "Transaction volume by provider", body: "Money moved through each payment partner in the selected period." }}
      />
      {data.length === 0 ? (
        <p className="mt-6 text-[13px] text-[#6b7180]">No payment partner covers this region yet.</p>
      ) : (
        <ul className="mt-6 space-y-[18px]">
          {data.map((p) => (
            <li key={p.name}>
              <div className="flex items-center justify-between gap-3 text-[13px] text-[#1c1a18]">
                <span className="truncate">
                  {p.name} · {p.coverage}
                </span>
                <span className="font-semibold">{usdShort(p.volume)}</span>
              </div>
              <div
                className="mt-2 h-[7px] rounded-full bg-[#f4f5f8]"
                role="meter"
                aria-label={`${p.name} volume`}
                aria-valuenow={p.volume}
                aria-valuemin={0}
                aria-valuemax={max}
              >
                <div className="h-full rounded-full bg-[#3310be]" style={{ width: `${(p.volume / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RegionsCard({ data }: { data: BiOverview["regions"] }) {
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader
          icon={globeIcon}
          title="Revenue by region"
          tip={{ title: "Revenue by region", body: "Revenue, paying users and average revenue per user for each country." }}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[360px] text-[13px] text-[#1c1a18]">
          <thead>
            <tr className="bg-[#f8f9fb] text-[12px] text-[#6b7180]">
              <th scope="col" className="h-[38px] px-[17px] text-left font-normal">Region</th>
              <th scope="col" className="px-2 text-right font-normal">Revenue</th>
              <th scope="col" className="px-2 text-right font-normal">Users</th>
              <th scope="col" className="pl-2 pr-[17px] text-right font-normal">ARPU</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.region} className="border-t border-[#eceef2] first:border-t-0">
                <th scope="row" className="h-[41px] px-[17px] text-left font-normal">{r.region}</th>
                <td className="px-2 text-right">{usdShort(r.revenue)}</td>
                <td className="px-2 text-right">{r.users.toLocaleString("en-US")}</td>
                <td className="pl-2 pr-[17px] text-right">{usd(r.arpu, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PayoutsCard({ data }: { data: BiOverview["payouts"] }) {
  const { max, ticks } = niceTicks(Math.max(...data.months.map((m) => m.amount)), 2_000);
  const stats = [
    { label: "Paid out", value: data.paidOut, className: "text-[#1c1a18]" },
    { label: "Pending", value: data.pending, className: "text-[#1c1a18]" },
    { label: "Failed", value: data.failed, className: "text-[#dc2626]" },
  ];
  return (
    <Card className="flex flex-col px-[17px] pb-5 pt-[13px]">
      <CardHeader
        icon={starIcon}
        title="Payouts to creators"
        tip={{ title: "Payouts to creators", body: "Money sent to creators in the selected period, plus payouts waiting or failed right now." }}
      />
      <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-[#6b7180]">{s.label}</dt>
            <dd className={`mt-1 text-[24px] font-medium leading-[28px] tracking-[-0.4px] ${s.className}`}>{usd(s.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 h-[110px]">
        <StackedBarChart
          series={[{ name: "Paid out", color: "#3310be" }]}
          columns={data.months.map((m) => ({ label: m.label, values: [m.amount] }))}
          max={max}
          ticks={ticks}
          formatTick={(v) => (v ? `$${v / 1000}K` : "$0")}
          formatValue={(v) => usd(v)}
          backdrop="none"
          size="sm"
          ariaLabel="Payouts by month"
        />
      </div>
    </Card>
  );
}

/* ---------- Loading ---------- */

function BiSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <Card className="p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-6 h-8 w-1/4" />
          <Skeleton className="mt-6 h-[220px] w-full" />
        </Card>
        <Card className="flex items-center gap-6 p-[17px]">
          <Skeleton className="size-[150px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </Card>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="space-y-4 p-[17px]">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { key: string; data?: BiOverview; failed?: boolean };

export function BusinessIntelligence() {
  const [filters, setFilters] = useState<BiFilters>({ region: "all", months: 12 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const key = `${filters.region}|${filters.months}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getBusinessIntelligence(filters)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch(() => !cancelled && setResult({ key, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [filters, key]);

  // Keep showing the last numbers (dimmed) while a filter change loads
  const loading = result?.key !== key;
  const data = result?.data;
  const regionLabel = filters.region === "all" ? "" : `${filters.region} · `;
  usePageSubtitle(!data && loading ? "Loading the latest numbers…" : `Financial health of Auvra · ${regionLabel}Last ${filters.months} months`);

  const handleExport = ({ from, to, include, format }: ExportRequest) => {
    if (!data) return;
    // return api.business.export({ from, to, include, format, region: filters.region });
    const sections = buildReport(data, include);
    const subtitle = `${from} to ${to}${filters.region === "all" ? "" : ` · ${filters.region}`}`;
    if (format === "csv") downloadCsv(`auvra-business-intelligence-${from}-to-${to}.csv`, sections);
    else printReport("Business Intelligence", subtitle, sections);
  };

  if (result?.failed && !loading) {
    return <LoadError title="We couldn't load Business Intelligence" onRetry={() => setAttempt((a) => a + 1)} />;
  }
  if (!data) return <BiSkeleton />;

  return (
    <>
      <PageActions>
        <PrimaryAction onClick={() => setExportOpen(true)}>
          <img src={exportWhiteIcon} alt="" width={13} height={13} />
          Export
        </PrimaryAction>
      </PageActions>
      {exportOpen && <ExportReportModal options={EXPORT_OPTIONS} onExport={handleExport} onClose={() => setExportOpen(false)} />}

      <div className="-mt-3 mb-3 flex flex-wrap justify-end gap-2.5 sm:-mt-4">
        <ToolbarMenu icon={globeSmallIcon} label="Region" options={REGION_OPTIONS} value={filters.region} onChange={(region) => setFilters((f) => ({ ...f, region }))} />
        <ToolbarMenu
          icon={calendarIcon}
          label="Period"
          options={RANGE_OPTIONS}
          value={`${filters.months}`}
          onChange={(v) => setFilters((f) => ({ ...f, months: Number(v) as RangeMonths }))}
        />
      </div>

      <div aria-busy={loading} className={`space-y-3 transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {data.kpis.map((k) => (
            <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <RevenueCard data={data.revenue} rangeMonths={filters.months} />
          <SourcesCard data={data.sources} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ProvidersCard data={data.providers} />
          <RegionsCard data={data.regions} />
          <div className="md:col-span-2 xl:col-span-1">
            <PayoutsCard data={data.payouts} />
          </div>
        </div>
      </div>
    </>
  );
}
