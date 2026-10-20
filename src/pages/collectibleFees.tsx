import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, PrimaryAction, SegmentedControl, StatusPill } from "../components/ui/controls";
import { StackedBarChart } from "../components/ui/charts";
import { DataTable } from "../components/ui/table";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { BackToBusiness, ExportReportModal, KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import type { ExportRequest } from "../components/business/biParts";
import { getCollectibleFees } from "../data/businessIntelligence";
import type { CollectibleFeesOverview } from "../data/businessIntelligence";
import { can, useSessionUser } from "../auth/session";
import { niceTicks, usd } from "../utils/format";
import { downloadCsv, printReport } from "../utils/report";
import type { ReportSection } from "../utils/report";
import { backState } from "../utils/navigation";
import barsIcon from "../assets/dashboard/card-bars.svg";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import starIcon from "../assets/dashboard/card-star.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import exportWhiteIcon from "../assets/dashboard/export-white.svg";

const KPI_ICONS: Record<string, string> = { fees: barsIcon, claims: arrowsIcon, avgFee: starIcon, creators: usersIcon };

const EXPORT_OPTIONS = [
  { key: "kpis", label: "Fee revenue, claims and creator payouts", defaultChecked: true },
  { key: "months", label: "Fee revenue by month", defaultChecked: true },
  { key: "badges", label: "Top earning Collectible Badges", defaultChecked: true },
  { key: "claims", label: "Recent claims" },
];

const feeOf = (b: CollectibleFeesOverview["topBadges"][number], ratePct: number) => (b.claims * b.price * ratePct) / 100;

function buildReport(data: CollectibleFeesOverview, include: string[]): ReportSection[] {
  const sections: ReportSection[] = [];
  if (include.includes("kpis")) {
    sections.push({ title: "Key metrics", columns: ["Metric", "Value", "Change vs previous 30 days"], rows: data.kpis.map((k) => [k.label, k.value, `${k.change} ${k.changeUnit}`]) });
  }
  if (include.includes("months")) {
    sections.push({ title: "Fee revenue by month", columns: ["Month", "Fees"], rows: data.months.map((m) => [m.label, m.fees]) });
  }
  if (include.includes("badges")) {
    sections.push({
      title: "Top earning Collectible Badges",
      columns: ["Badge", "Creator", "Price", "Claims", "Sales", "Auvra fee"],
      rows: data.topBadges.map((b) => [b.title, b.creator, b.price, b.claims, b.claims * b.price, feeOf(b, data.feeRatePct)]),
    });
  }
  if (include.includes("claims")) {
    sections.push({ title: "Recent claims", columns: ["Collector", "Badge", "Fee", "Status", "When"], rows: data.recentClaims.map((c) => [c.collector, c.badge, c.fee, c.status, c.when]) });
  }
  return sections;
}

/* ---------- Cards ---------- */

function FeesByMonthCard({ data }: { data: CollectibleFeesOverview["months"] }) {
  const [period, setPeriod] = useState<"6" | "12">("12");
  const months = data.slice(-Number(period));
  const { max, ticks } = niceTicks(Math.max(...months.map((m) => m.fees)), 1_000);
  return (
    <Card className="flex flex-col px-[17px] pb-[17px] pt-[13px]">
      <CardHeader icon={barsIcon} title="Fee revenue by month" tip={{ title: "Fee revenue by month", body: "Auvra's share of Collectible Badge claims each month." }}>
        <SegmentedControl
          label="Chart period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "6", label: "6m" },
            { value: "12", label: "1y" },
          ]}
        />
      </CardHeader>
      <div className="mt-6 min-h-0 flex-1 overflow-x-auto">
        <div className="h-[290px] min-w-[480px] pt-3">
          <StackedBarChart
            series={[{ name: "Fees", color: "#3310be" }]}
            columns={months.map((m) => ({ label: m.label, values: [m.fees] }))}
            max={max}
            ticks={ticks}
            formatTick={(v) => (v ? `$${(v / 1000).toFixed(1).replace(/\.0$/, "")}K` : "$0")}
            formatValue={(v) => usd(v)}
            backdrop="columns"
            ariaLabel="Fee revenue by month"
          />
        </div>
      </div>
    </Card>
  );
}

function RecentClaimsCard({ data }: { data: CollectibleFeesOverview["recentClaims"] }) {
  const user = useSessionUser();
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader
        icon={clockIcon}
        title="Recent claims"
        tip={{ title: "Recent claims", body: "The latest editions claimed. Fees are held until the collector confirms delivery, then released." }}
      >
        {can(user, "transactions") && (
          <Link to="/app/transactions" className="text-[12px] font-medium text-[#3310be] hover:underline">
            All transactions
          </Link>
        )}
      </CardHeader>
      {data.length === 0 ? (
        <p className="mt-6 text-[13px] text-[#6b7180]">No claims yet.</p>
      ) : (
        <ul className="mt-5 space-y-[22px]">
          {data.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <Avatar name={c.collector} size={36} color="#3e3a36" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-[#1c1a18]">{c.collector}</div>
                <div className="truncate text-[11px] text-[#6b7180]">
                  {c.badge} · {usd(c.fee, 2)} fee · {c.when}
                </div>
              </div>
              {c.status === "held" ? <StatusPill tone="purple">Held</StatusPill> : <StatusPill tone="green">Released</StatusPill>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TopBadgesCard({ data, ratePct }: { data: CollectibleFeesOverview["topBadges"]; ratePct: number }) {
  const user = useSessionUser();
  const rows = [...data].sort((a, b) => feeOf(b, ratePct) - feeOf(a, ratePct));
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader
          icon={starIcon}
          title="Top earning Collectible Badges"
          tip={{ title: "Top earning Collectible Badges", body: `Badges that brought in the most fees. Auvra keeps ${ratePct}% of each claim; the creator gets the rest.` }}
        />
      </div>
      <div className="mt-4">
        <DataTable
          minWidth={620}
          head={
            <>
              <th scope="col" className="text-left">Badge</th>
              <th scope="col" className="px-2 text-right">Price</th>
              <th scope="col" className="px-2 text-right">Claims</th>
              <th scope="col" className="px-2 text-right">Sales</th>
              <th scope="col" className="text-right">Auvra fee</th>
            </>
          }
        >
          {rows.map((b) => (
            <tr key={b.id}>
              <th scope="row" className="h-[52px] text-left font-normal">
                {/* Links to the badge record for admins who can see Cultural Intelligence */}
                {b.badgeId && can(user, "culture") ? (
                  <Link to={`/app/culture/badges/${b.badgeId}`} state={backState("/app/business/collectibles", "Collectible Badge fees")} className="block hover:underline">
                    {b.title}
                  </Link>
                ) : (
                  <span className="block">{b.title}</span>
                )}
                <span className="text-[11px] text-[#6b7180]">{b.creator}</span>
              </th>
              <td className="px-2 text-right">{usd(b.price)}</td>
              <td className="px-2 text-right">{b.claims}</td>
              <td className="px-2 text-right">{usd(b.claims * b.price)}</td>
              <td className="text-right font-medium">{usd(feeOf(b, ratePct), 2)}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </Card>
  );
}

function FeesSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-6 h-[240px] w-full" />
        </Card>
        <Card className="space-y-5 p-[17px]">
          <Skeleton className="h-3 w-1/2" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export function CollectibleFees() {
  const [data, setData] = useState<CollectibleFeesOverview | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCollectibleFees()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  usePageTitle("Collectible Badge fees");
  usePageSubtitle(data ? `${data.shareOfRevenuePct}% of revenue · ${data.feeRatePct}% fee on every claim` : failed ? null : "Loading the latest numbers…");

  const handleExport = ({ from, to, include, format }: ExportRequest) => {
    if (!data) return;
    // return api.business.exportCollectibleFees({ from, to, include, format });
    const sections = buildReport(data, include);
    if (format === "csv") downloadCsv(`auvra-collectible-fees-${from}-to-${to}.csv`, sections);
    else printReport("Collectible Badge fees", `${from} to ${to}`, sections);
  };

  if (failed) {
    return (
      <>
        <BackToBusiness />
        <LoadError
          title="We couldn't load Collectible Badge fees"
          onRetry={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }}
        />
      </>
    );
  }

  return (
    <>
      <BackToBusiness />
      {!data ? (
        <FeesSkeleton />
      ) : (
        <>
          <PageActions>
            <PrimaryAction onClick={() => setExportOpen(true)}>
              <img src={exportWhiteIcon} alt="" width={13} height={13} />
              Export
            </PrimaryAction>
          </PageActions>
          {exportOpen && <ExportReportModal options={EXPORT_OPTIONS} onExport={handleExport} onClose={() => setExportOpen(false)} />}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
              {data.kpis.map((k) => (
                <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <FeesByMonthCard data={data.months} />
              <RecentClaimsCard data={data.recentClaims} />
            </div>
            <TopBadgesCard data={data.topBadges} ratePct={data.feeRatePct} />
          </div>
        </>
      )}
    </>
  );
}
