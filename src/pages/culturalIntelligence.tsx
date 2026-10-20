import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, PrimaryAction, SegmentedControl, StatusPill, ToolbarMenu } from "../components/ui/controls";
import { BarList, ProgressRing } from "../components/ui/charts";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle } from "../components/layout/headerSlots";
import { ExportReportModal, KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import type { ExportRequest } from "../components/business/biParts";
import { DataTable } from "../components/ui/table";
import { CI_TABS, REGIONS, getCulturalIntelligence } from "../data/culturalIntelligence";
import type { CategoryArea, CiFilters, CiOverview, CiTab } from "../data/culturalIntelligence";
import type { RangeMonths, RegionFilter } from "../data/businessIntelligence";
import { usd } from "../utils/format";
import { downloadCsv, printReport } from "../utils/report";
import type { ReportSection } from "../utils/report";
import type { PillTone } from "../components/ui/controls";
import globeIcon from "../assets/dashboard/card-globe.svg";
import checkIcon from "../assets/dashboard/card-check.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import flagIcon from "../assets/dashboard/card-flag.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import barsIcon from "../assets/dashboard/card-bars.svg";
import starIcon from "../assets/dashboard/card-star.svg";
import globeSmallIcon from "../assets/dashboard/globe-13.svg";
import calendarIcon from "../assets/dashboard/calendar.svg";
import exportWhiteIcon from "../assets/dashboard/export-white.svg";

const KPI_ICONS: Record<string, string> = { total: globeIcon, verified: checkIcon, pending: clockIcon, disputed: flagIcon, people: usersIcon };

const STATUS_RINGS = [
  { key: "verified", label: "Verified", color: "#15803d" },
  { key: "pending", label: "Pending", color: "#f2c14e" },
  { key: "disputed", label: "Disputed", color: "#dc2626" },
] as const;

// Above 80% is healthy, 70–80% needs watching, below that needs a nudge
const rateTone = (pct: number): PillTone => (pct >= 80 ? "green" : pct >= 70 ? "amber" : "red");

// Communities card shows this many until "See all"
const COMMUNITIES_PREVIEW = 4;

const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [{ value: "all", label: "All regions" }, ...REGIONS.map((r) => ({ value: r, label: r }))];
const RANGE_OPTIONS: { value: `${RangeMonths}`; label: string }[] = [
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
];
const AREA_OPTIONS: { value: CategoryArea; label: string }[] = [
  { value: "all", label: "All regions" },
  { value: "west", label: "West Africa" },
  { value: "east", label: "East Africa" },
];

const EXPORT_OPTIONS = [
  { key: "kpis", label: "Key metrics and verification status", defaultChecked: true },
  { key: "categories", label: "By category", defaultChecked: true },
  { key: "languages", label: "Most preserved languages", defaultChecked: true },
  { key: "communities", label: "Most active communities" },
];

function buildReport(data: CiOverview, include: string[]): ReportSection[] {
  const sections: ReportSection[] = [];
  if (include.includes("kpis")) {
    sections.push({ title: "Key metrics", columns: ["Metric", "Value", "Note"], rows: data.kpis.map((k) => [k.label, k.value, k.note ?? `${k.change}${k.changeUnit} vs previous 30 days`]) });
    sections.push({ title: "Verification status", columns: ["Status", "Count"], rows: STATUS_RINGS.map((s) => [s.label, data.verification[s.key]]) });
  }
  if (include.includes("categories")) {
    sections.push({ title: data.categoryTitle, columns: ["Category", "Count"], rows: data.categories.all.map((c) => [c.name, c.count]) });
  }
  if (include.includes("languages")) {
    sections.push({ title: "Most preserved languages", columns: ["Language", "Badges", "Speakers sharing", "Trend"], rows: data.languages.map((l) => [l.name, l.badges, l.speakers, `+${l.trendPct}%`]) });
  }
  if (include.includes("communities")) {
    sections.push({
      title: "Most active communities",
      columns: ["Community", "Place", "Badges", "Verifiers", "Verification rate"],
      rows: data.communities.map((c) => [c.name, c.place, c.badges, c.verifiers, `${c.ratePct}%`]),
    });
  }
  return sections;
}

/* ---------- Cards ---------- */

function CategoryCard({ title, data, showAreas }: { title: string; data: CiOverview["categories"]; showAreas: boolean }) {
  const [area, setArea] = useState<CategoryArea>("all");
  const view = showAreas ? area : "all";
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={barsIcon} title={title} tip={{ title, body: "What people are preserving, grouped by the kind of culture shared." }}>
        {/* A country filter on the page already narrows this down */}
        {showAreas && <SegmentedControl label="Area" value={area} onChange={setArea} options={AREA_OPTIONS} />}
      </CardHeader>
      <div className="mt-6">
        <BarList items={data[view]} label={title} />
      </div>
    </Card>
  );
}

function VerificationCard({ data, showQueueLink }: { data: CiOverview["verification"]; showQueueLink: boolean }) {
  const total = data.verified + data.pending + data.disputed || 1;
  return (
    <Card className="flex flex-col px-[17px] pb-5 pt-[13px]">
      <CardHeader
        icon={checkIcon}
        title="Verification status"
        tip={{ title: "Verification status", body: "Every badge is checked by the Keepers of the community it belongs to before it is marked as verified." }}
      >
        {showQueueLink && (
          <Link to="review" className="text-[12px] font-medium text-[#3310be] hover:underline">
            Review queue
          </Link>
        )}
      </CardHeader>
      <ul className="grid flex-1 grid-cols-3 content-center gap-3 py-6">
        {STATUS_RINGS.map((s) => {
          const value = Math.round((data[s.key] / total) * 100);
          return (
            <li key={s.key} className="flex flex-col items-center text-center">
              <ProgressRing value={value} color={s.color} size={86} stroke={6} track="#f4f5f8" textClassName="text-[12px]" label={`${s.label}: ${value}%`} />
              <span className="mt-3 text-[13px] font-medium text-[#1c1a18]">{s.label}</span>
              <span className="mt-1 text-[11px] text-[#6b7180]">{data[s.key].toLocaleString("en-US")}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function LanguagesCard({ data }: { data: CiOverview["languages"] }) {
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={globeIcon} title="Most preserved languages" tip={{ title: "Most preserved languages", body: "Languages with the most badges, and how many people are sharing in each." }} />
      </div>
      <div className="mt-4">
        {data.length === 0 ? (
          <p className="px-[17px] pb-5 text-[13px] text-[#6b7180]">No languages recorded for this region yet.</p>
        ) : (
          <DataTable
            minWidth={420}
            head={
              <>
                <th scope="col" className="text-left">Language</th>
                <th scope="col" className="px-2 text-right">Badges</th>
                <th scope="col" className="px-2 text-right">Speakers sharing</th>
                <th scope="col" className="text-right">Trend</th>
              </>
            }
          >
            {data.map((l) => (
              <tr key={l.name}>
                <th scope="row" className="h-[44px] text-left font-normal">{l.name}</th>
                <td className="px-2 text-right">{l.badges.toLocaleString("en-US")}</td>
                <td className="px-2 text-right">{l.speakers.toLocaleString("en-US")}</td>
                <td className="text-right">
                  <span className="inline-flex h-[18px] items-center rounded-[5px] bg-[#e8f7ee] px-1.5 text-[10px] font-semibold text-[#16a34a]">+{l.trendPct}%</span>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </Card>
  );
}

function TopCollectiblesCard({ data }: { data: NonNullable<CiOverview["topCollectibles"]> }) {
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={starIcon} title="Top Collectible Badges" tip={{ title: "Top Collectible Badges", body: "Limited editions with the most claims. Open one to see its claims and ownership history." }} />
      </div>
      <div className="mt-4">
        <DataTable
          minWidth={420}
          head={
            <>
              <th scope="col" className="text-left">Badge</th>
              <th scope="col" className="px-2 text-right">Price</th>
              <th scope="col" className="text-right">Claimed</th>
            </>
          }
        >
          {data.map((b) => (
            <tr key={b.id}>
              <th scope="row" className="h-[52px] text-left font-normal">
                <Link to={`badges/${b.id}`} className="block hover:underline">
                  {b.title}
                </Link>
                <span className="text-[11px] text-[#6b7180]">{b.creator}</span>
              </th>
              <td className="px-2 text-right">{usd(b.price)}</td>
              <td className="text-right">
                {b.claimed} of {b.editions}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </Card>
  );
}

function CommunitiesCard({ data }: { data: CiOverview["communities"] }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data : data.slice(0, COMMUNITIES_PREVIEW);
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={usersIcon} title="Most active communities" tip={{ title: "Most active communities", body: "Communities preserving the most culture, and how much of it their Keepers approve." }}>
          {data.length > COMMUNITIES_PREVIEW && (
            <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="text-[12px] font-medium text-[#3310be] hover:underline">
              {expanded ? "Show fewer" : "See all"}
            </button>
          )}
        </CardHeader>
      </div>
      <div className="mt-4">
        {data.length === 0 ? (
          <p className="px-[17px] pb-5 text-[13px] text-[#6b7180]">No communities in this region yet.</p>
        ) : (
          <DataTable
            head={
              <>
                <th scope="col" className="text-left">Community</th>
                <th scope="col" className="px-2 text-right">Badges</th>
                <th scope="col" className="px-2 text-right">Verifiers</th>
                <th scope="col" className="text-right">Verification rate</th>
              </>
            }
          >
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-[#fafbfc]">
                <th scope="row" className="h-[61px] text-left font-normal">
                  <Link to={`communities/${c.id}`} className="flex items-center gap-3 outline-none focus-visible:underline">
                    <Avatar name={c.name} size={36} color="#3e3a36" />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-[#1c1a18]">{c.name}</span>
                      <span className="block truncate text-[11px] text-[#6b7180]">{c.place}</span>
                    </span>
                  </Link>
                </th>
                <td className="px-2 text-right">{c.badges.toLocaleString("en-US")}</td>
                <td className="px-2 text-right">{c.verifiers}</td>
                <td className="text-right">
                  <StatusPill tone={rateTone(c.ratePct)}>{c.ratePct}%</StatusPill>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </Card>
  );
}

/* ---------- Loading ---------- */

function CiSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-[420px] max-w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="space-y-5 p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-2.5 w-full" />
          ))}
        </Card>
        <Card className="flex items-center justify-around p-[17px]">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="size-[86px] rounded-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { key: string; data?: CiOverview; failed?: boolean };

export function CulturalIntelligence() {
  const [filters, setFilters] = useState<CiFilters>({ tab: "contribution", region: "all", months: 12 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const key = `${filters.tab}|${filters.region}|${filters.months}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getCulturalIntelligence(filters)
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
  usePageSubtitle(!data && loading ? "Loading the latest numbers…" : `How culture is being preserved on Auvra · ${regionLabel}Last ${filters.months} months`);

  const handleExport = ({ from, to, include, format }: ExportRequest) => {
    if (!data) return;
    // return api.culture.export({ from, to, include, format, tab: filters.tab, region: filters.region });
    const sections = buildReport(data, include);
    const tabLabel = CI_TABS.find((t) => t.value === filters.tab)!.label;
    const subtitle = `${tabLabel} · ${from} to ${to}${filters.region === "all" ? "" : ` · ${filters.region}`}`;
    if (format === "csv") downloadCsv(`auvra-cultural-intelligence-${from}-to-${to}.csv`, sections);
    else printReport("Cultural Intelligence", subtitle, sections);
  };

  if (result?.failed && !loading) {
    return <LoadError title="We couldn't load Cultural Intelligence" onRetry={() => setAttempt((a) => a + 1)} />;
  }
  if (!data) return <CiSkeleton />;

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

      <div className="mb-3 overflow-x-auto [scrollbar-width:none]">
        <SegmentedControl<CiTab>
          label="What to show"
          value={filters.tab}
          onChange={(tab) => setFilters((f) => ({ ...f, tab }))}
          options={CI_TABS}
          className="[&>button]:h-[26px] [&>button]:whitespace-nowrap [&>button]:px-3"
        />
      </div>

      <div aria-busy={loading} className={`space-y-3 transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {data.kpis.map((k) => (
            <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <CategoryCard key={filters.tab} title={data.categoryTitle} data={data.categories} showAreas={filters.region === "all"} />
          <VerificationCard data={data.verification} showQueueLink={filters.tab === "contribution"} />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          {data.topCollectibles ? <TopCollectiblesCard data={data.topCollectibles} /> : <LanguagesCard data={data.languages} />}
          <CommunitiesCard key={filters.region} data={data.communities} />
        </div>
      </div>
    </>
  );
}
