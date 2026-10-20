import { useEffect, useState } from "react";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, PrimaryAction, SegmentedControl, StatusPill } from "../components/ui/controls";
import type { PillTone } from "../components/ui/controls";
import { StackedBarChart } from "../components/ui/charts";
import { DataTable } from "../components/ui/table";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { BackToBusiness, ExportReportModal, KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { niceTicks, usd } from "../utils/format";
import type { ExportRequest } from "../components/business/biParts";
import { getCommunitySubscriptions, getVaultOverview } from "../data/businessIntelligence";
import type { PlanChangeKind, SubscriptionKind, SubscriptionOverview } from "../data/businessIntelligence";
import { downloadCsv, printReport } from "../utils/report";
import type { ReportSection } from "../utils/report";
import barsIcon from "../assets/dashboard/card-bars.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import arrowDownIcon from "../assets/dashboard/card-arrow-down.svg";
import arrowUpIcon from "../assets/dashboard/card-arrow-up.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import starIcon from "../assets/dashboard/card-star.svg";
import exportWhiteIcon from "../assets/dashboard/export-white.svg";

const KPI_ICONS: Record<string, string> = { subscribers: usersIcon, mrr: barsIcon, churn: arrowDownIcon, trial: arrowUpIcon };

// Plan colours in price order, cheapest first
const PLAN_COLORS = ["#3310be", "#8c78ee", "#dcd5fb"];

const CHANGE_LABELS: Record<PlanChangeKind, { label: string; tone: PillTone }> = {
  upgrade: { label: "Upgrade", tone: "green" },
  new: { label: "New", tone: "purple" },
  downgrade: { label: "Downgrade", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "red" },
};

// Churn under 2% is called out in green
const HEALTHY_CHURN_PCT = 2;

type PageConfig = {
  title: string;
  // "My Vault" / "Community", used in copy
  product: string;
  // Who subscribes: people for My Vault, communities for Community plans
  subscriberLabel: string;
  changesTip: string;
  fileSlug: string;
  load: () => Promise<SubscriptionOverview>;
};

const CONFIGS: Record<SubscriptionKind, PageConfig> = {
  vault: {
    title: "My Vault subscriptions",
    product: "My Vault",
    subscriberLabel: "Subscribers",
    changesTip: "The latest people to start, change or cancel a My Vault plan.",
    fileSlug: "my-vault",
    load: getVaultOverview,
  },
  community: {
    title: "Community subscriptions",
    product: "Community",
    subscriberLabel: "Communities",
    changesTip: "The latest communities to start, change or cancel a Community plan.",
    fileSlug: "community-subscriptions",
    load: getCommunitySubscriptions,
  },
};

const EXPORT_OPTIONS = [
  { key: "kpis", label: "Subscribers, MRR and churn", defaultChecked: true },
  { key: "mrrByPlan", label: "MRR by plan", defaultChecked: true },
  { key: "plans", label: "Plans", defaultChecked: true },
  { key: "changes", label: "Recent plan changes" },
];

function buildReport(data: SubscriptionOverview, config: PageConfig, include: string[]): ReportSection[] {
  const sections: ReportSection[] = [];
  if (include.includes("kpis")) {
    sections.push({ title: "Key metrics", columns: ["Metric", "Value", "Change vs previous 30 days"], rows: data.kpis.map((k) => [k.label, k.value, `${k.change} ${k.changeUnit}`]) });
  }
  if (include.includes("mrrByPlan")) {
    sections.push({ title: "MRR by plan", columns: ["Month", ...data.plans.map((p) => p.name)], rows: data.mrrByPlan.map((m) => [m.label, ...data.plans.map((p) => m.values[p.key])]) });
  }
  if (include.includes("plans")) {
    sections.push({
      title: "Plans",
      columns: ["Plan", "Price per month", config.subscriberLabel, "MRR", "Churn"],
      rows: data.plans.map((p) => [p.name, p.price, p.subscribers, Math.round(p.price * p.subscribers), `${p.churnPct}%`]),
    });
  }
  if (include.includes("changes")) {
    sections.push({ title: "Recent plan changes", columns: ["Name", "Change", "Type"], rows: data.changes.map((c) => [c.name, c.detail, CHANGE_LABELS[c.kind].label]) });
  }
  return sections;
}

/* ---------- Cards ---------- */

function MrrByPlanCard({ data, plans, product }: { data: SubscriptionOverview["mrrByPlan"]; plans: SubscriptionOverview["plans"]; product: string }) {
  const [period, setPeriod] = useState<"6" | "12">("12");
  const series = plans.map((p, i) => ({ key: p.key, name: p.name, color: PLAN_COLORS[i % PLAN_COLORS.length] }));
  const months = data.slice(-Number(period));
  const columns = months.map((m) => ({ label: m.label, values: series.map((s) => m.values[s.key]) }));
  const { max, ticks } = niceTicks(Math.max(...columns.map((c) => c.values.reduce((a, b) => a + b, 0))), 2_000);

  return (
    <Card className="flex flex-col px-[17px] pb-[17px] pt-[13px]">
      <CardHeader icon={barsIcon} title="MRR by plan" tip={{ title: "MRR by plan", body: `Monthly recurring revenue from each ${product} plan.` }}>
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
      <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Legend">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[12px] text-[#6b7180]">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
      <div className="mt-4 min-h-0 flex-1 overflow-x-auto">
        <div className="h-[272px] min-w-[480px] pt-3">
          <StackedBarChart
            series={series.map((s) => ({ name: s.name, color: s.color }))}
            columns={columns}
            max={max}
            ticks={ticks}
            formatTick={(v) => (v ? `$${Math.round(v / 1000)}K` : "$0")}
            formatValue={(v) => usd(v)}
            backdrop="columns"
            ariaLabel="MRR by plan per month"
          />
        </div>
      </div>
    </Card>
  );
}

function PlanChangesCard({ data, tip }: { data: SubscriptionOverview["changes"]; tip: string }) {
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={clockIcon} title="Recent plan changes" tip={{ title: "Recent plan changes", body: tip }} />
      {data.length === 0 ? (
        <p className="mt-6 text-[13px] text-[#6b7180]">No plan changes yet.</p>
      ) : (
        <ul className="mt-5 space-y-[22px]">
          {data.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <Avatar name={c.name} size={36} color="#3e3a36" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-[#1c1a18]">{c.name}</div>
                <div className="truncate text-[11px] text-[#6b7180]">{c.detail}</div>
              </div>
              <StatusPill tone={CHANGE_LABELS[c.kind].tone}>{CHANGE_LABELS[c.kind].label}</StatusPill>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PlansCard({ data, config }: { data: SubscriptionOverview["plans"]; config: PageConfig }) {
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader
          icon={starIcon}
          title="Plans"
          tip={{ title: "Plans", body: `Each ${config.product} plan with its price, ${config.subscriberLabel.toLowerCase()}, monthly revenue and churn.` }}
        />
      </div>
      <div className="mt-4">
        <DataTable
          minWidth={560}
          head={
            <>
              <th scope="col" className="text-left">Plan</th>
              <th scope="col" className="px-2 text-right">Price</th>
              <th scope="col" className="px-2 text-right">{config.subscriberLabel}</th>
              <th scope="col" className="px-2 text-right">MRR</th>
              <th scope="col" className="text-right">Churn</th>
            </>
          }
        >
          {data.map((p) => (
            <tr key={p.key}>
              <th scope="row" className="h-[47px] text-left font-normal">{p.name}</th>
              <td className="px-2 text-right">{usd(p.price, 2)}/mo</td>
              <td className="px-2 text-right">{p.subscribers.toLocaleString("en-US")}</td>
              <td className="px-2 text-right">{usd(Math.round(p.price * p.subscribers))}</td>
              <td className="text-right">
                <StatusPill tone={p.churnPct < HEALTHY_CHURN_PCT ? "green" : "gray"}>{p.churnPct}%</StatusPill>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </Card>
  );
}

function SubscriptionsSkeleton() {
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
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0" />
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

/* ---------- Page ---------- */

type LoadResult = { kind: SubscriptionKind; data?: SubscriptionOverview; failed?: boolean };

export function Subscriptions({ kind }: { kind: SubscriptionKind }) {
  const config = CONFIGS[kind];
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    config
      .load()
      .then((data) => !cancelled && setResult({ kind, data }))
      .catch(() => !cancelled && setResult({ kind, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [config, kind, attempt]);

  // Ignore a result left over from the other subscription page
  const current = result?.kind === kind ? result : null;
  const data = current?.data;
  usePageTitle(config.title);
  usePageSubtitle(data ? `${data.shareOfRevenuePct}% of revenue · Last 12 months` : current?.failed ? null : "Loading the latest numbers…");

  const handleExport = ({ from, to, include, format }: ExportRequest) => {
    if (!data) return;
    // return api.business.exportSubscriptions(kind, { from, to, include, format });
    const sections = buildReport(data, config, include);
    if (format === "csv") downloadCsv(`auvra-${config.fileSlug}-${from}-to-${to}.csv`, sections);
    else printReport(config.title, `${from} to ${to}`, sections);
  };

  if (current?.failed) {
    return (
      <>
        <BackToBusiness />
        <LoadError
          title={`We couldn't load ${config.title}`}
          onRetry={() => {
            setResult(null);
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
        <SubscriptionsSkeleton />
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
              <MrrByPlanCard data={data.mrrByPlan} plans={data.plans} product={config.product} />
              <PlanChangesCard data={data.changes} tip={config.changesTip} />
            </div>
            <PlansCard data={data.plans} config={config} />
          </div>
        </>
      )}
    </>
  );
}
