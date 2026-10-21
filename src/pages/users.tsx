import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, IconButton, PrimaryAction, ToolbarButton, ToolbarMenu } from "../components/ui/controls";
import { DataTable } from "../components/ui/table";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle } from "../components/layout/headerSlots";
import { ExportReportModal, KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import type { ExportRequest } from "../components/business/biParts";
import { KycPill, UserStatusPill } from "../components/users/userParts";
import { KYC_OPTIONS, PAGE_SIZE, STATUS_OPTIONS, USER_TYPES, getAllUsers, getUsers, kycLabel, statusLabel, typeLabel } from "../data/users";
import type { KycStatus, UserFilters, UserList, UserRow, UserStatus, UserType } from "../data/users";
import { downloadCsv, printReport } from "../utils/report";
import type { ReportSection } from "../utils/report";
import { formatKpi } from "../utils/format";
import { backState } from "../utils/navigation";
import usersIcon from "../assets/dashboard/card-users.svg";
import zapIcon from "../assets/dashboard/card-zap.svg";
import searchIcon from "../assets/dashboard/search-13.svg";
import searchLargeIcon from "../assets/dashboard/search-20.svg";
import filterIcon from "../assets/dashboard/filter.svg";
import shieldIcon from "../assets/dashboard/shield-13.svg";
import countryIcon from "../assets/dashboard/slash-circle-13.svg";
import exportIcon from "../assets/dashboard/export.svg";
import exportWhiteIcon from "../assets/dashboard/export-white.svg";
import closeIcon from "../assets/dashboard/close-13.svg";
import chevronLeftIcon from "../assets/dashboard/chevron-left-13.svg";
import chevronRightIcon from "../assets/dashboard/chevron-right-13.svg";

const KPI_ICONS: Record<string, string> = { creators: usersIcon, collectors: usersIcon, communities: usersIcon, families: usersIcon, active: zapIcon };

const TYPE_TABS: { value: UserType | "all"; label: string }[] = [{ value: "all", label: "All" }, ...USER_TYPES.map((t) => ({ value: t.value, label: t.plural }))];

const EXPORT_OPTIONS = [
  { key: "summary", label: "Summary numbers", defaultChecked: true },
  { key: "users", label: "Users matching the current filters", defaultChecked: true },
];

const USER_COLUMNS = ["Name", "User ID", "Email", "Type", "Country", "Status", "KYC", "Badges", "Last active"];
const userCells = (u: UserRow) => [u.name, u.code, u.email, typeLabel(u.type), u.country, statusLabel(u.status), kycLabel(u.kyc), u.badges, u.lastActive];

/* ---------- Filters in the URL so "Back to users" returns to the same view ---------- */

function readFilters(params: URLSearchParams): UserFilters {
  const pick = <T extends string>(key: string, allowed: readonly T[]) => {
    const v = params.get(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : ("all" as const);
  };
  return {
    query: params.get("q") ?? "",
    type: pick<UserType>("type", USER_TYPES.map((t) => t.value)),
    status: pick<UserStatus>("status", ["active", "pending", "suspended"]),
    kyc: pick<KycStatus>("kyc", ["verified", "pending", "not_started", "rejected"]),
    country: params.get("country") ?? "all",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function writeFilters(f: UserFilters) {
  const params = new URLSearchParams();
  if (f.query) params.set("q", f.query);
  if (f.type !== "all") params.set("type", f.type);
  if (f.status !== "all") params.set("status", f.status);
  if (f.kyc !== "all") params.set("kyc", f.kyc);
  if (f.country !== "all") params.set("country", f.country);
  if (f.page > 1) params.set("page", String(f.page));
  return params;
}

/* ---------- Pieces ---------- */

function TypeTabs({ value, onChange }: { value: UserType | "all"; onChange: (v: UserType | "all") => void }) {
  return (
    <div role="radiogroup" aria-label="User type" className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-[9px] bg-[#f4f5f8] p-[3px]">
      {TYPE_TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={value === t.value}
          onClick={() => onChange(t.value)}
          className={`h-[28px] whitespace-nowrap rounded-[7px] px-[11px] text-[11px] font-medium ${
            value === t.value ? "bg-white text-[#1c1a18] shadow-[0_1px_2px_rgba(28,26,24,0.08)]" : "text-[#6b7180] hover:text-[#1c1a18]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Bolds the part of a name or email that matched the search
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-[#fdf3dc] px-px text-inherit">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

function EmptyState({ filters, onClear }: { filters: UserFilters; onClear: () => void }) {
  const typeName = filters.type === "all" ? null : USER_TYPES.find((t) => t.value === filters.type)!.plural;
  const otherFilters = filters.status !== "all" || filters.kyc !== "all" || filters.country !== "all";
  const title = filters.query ? `No users match “${filters.query}”` : "No users match these filters";
  let hint = "Check the spelling, or search by email or user ID.";
  if (typeName && !otherFilters) hint = `Check the spelling, or clear the ${typeName} filter to search everyone.`;
  else if (typeName || otherFilters) hint = filters.query ? "Check the spelling, or clear the filters to search everyone." : "Try fewer filters to see more people.";

  return (
    <div className="flex flex-col items-center px-5 pb-[72px] pt-[56px] text-center">
      <span className="flex size-14 items-center justify-center rounded-[14px] bg-[#f4f5f8]">
        <img src={searchLargeIcon} alt="" width={20} height={20} />
      </span>
      <div className="mt-6 text-[17px] font-semibold text-[#1c1a18]">{title}</div>
      <div className="mt-2 max-w-[420px] text-[13px] leading-[20px] text-[#6b7180]">{hint}</div>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 flex h-10 items-center gap-2 rounded-[10px] border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]"
      >
        <img src={closeIcon} alt="" width={13} height={13} />
        Clear filters
      </button>
    </div>
  );
}

function UsersTable({ rows, query, linkState }: { rows: UserRow[]; query: string; linkState: ReturnType<typeof backState> }) {
  const navigate = useNavigate();
  return (
    <DataTable
      minWidth={860}
      head={
        <>
          <th scope="col" className="w-[28%] text-left">User</th>
          <th scope="col" className="w-[15%] px-2 text-left">Country</th>
          <th scope="col" className="w-[14%] px-2 text-left">Status</th>
          <th scope="col" className="w-[15%] px-2 text-left">KYC</th>
          <th scope="col" className="w-[10%] px-2 text-right">Badges</th>
          <th scope="col" className="text-right">Last active</th>
        </>
      }
    >
      {rows.map((u) => (
        <tr
          key={u.id}
          // The name is the keyboard target; the whole row is a larger click area
          onClick={(e) => !(e.target as HTMLElement).closest("a") && navigate(`/app/users/${u.id}`, { state: linkState })}
          className="cursor-pointer hover:bg-[#f8f9fb]"
        >
          <th scope="row" className="h-[56px] text-left font-normal">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} size={36} color="#3e3a36" className="rounded-[8px] text-[12px]" />
              <div className="min-w-0">
                <Link to={`/app/users/${u.id}`} state={linkState} className="block truncate text-[14px] text-[#1c1a18] hover:underline">
                  <Highlight text={u.name} query={query} />
                </Link>
                <div className="truncate text-[11px] text-[#6b7180]">
                  {u.type === "community" ? u.subline : <Highlight text={u.subline} query={query} />}
                  {query && u.code.toLowerCase().includes(query.trim().toLowerCase()) && <> · <Highlight text={u.code} query={query} /></>}
                </div>
              </div>
            </div>
          </th>
          <td className="px-2">{u.country}</td>
          <td className="px-2">
            <UserStatusPill status={u.status} />
          </td>
          <td className="px-2">
            <KycPill kyc={u.kyc} />
          </td>
          <td className="px-2 text-right tabular-nums">{u.badges.toLocaleString("en-US")}</td>
          <td className="text-right text-[#1c1a18]">{u.lastActive}</td>
        </tr>
      ))}
    </DataTable>
  );
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(total, page * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#eceef2] px-[17px] py-[18px]">
      <span className="text-[11px] text-[#6b7180]">
        Showing {first}–{last} of {total.toLocaleString("en-US")}
      </span>
      <div className="flex gap-2">
        <IconButton icon={chevronLeftIcon} label="Previous page" size={34} disabled={page <= 1} onClick={() => onPage(page - 1)} className="flex disabled:opacity-40" />
        <IconButton icon={chevronRightIcon} label="Next page" size={34} disabled={page >= pages} onClick={() => onPage(page + 1)} className="flex disabled:opacity-40" />
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <Card className="space-y-5 p-[17px]">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-full" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </Card>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { key: string; data?: UserList; failed?: boolean };

export function Users() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [search, setSearch] = useState(filters.query);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const paramString = params.toString();
  const key = `${paramString}|${attempt}`;

  const update = (patch: Partial<UserFilters>) =>
    // Any filter change goes back to page 1
    setParams(writeFilters({ ...filters, page: 1, ...patch }), { replace: true });

  // Debounce typing into the URL; the search box stays responsive
  useEffect(() => {
    if (search === filters.query) return;
    const t = setTimeout(() => setParams(writeFilters({ ...filters, query: search, page: 1 }), { replace: true }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    getUsers(readFilters(new URLSearchParams(paramString)))
      .then((data) => !cancelled && setResult({ key, data }))
      .catch(() => !cancelled && setResult({ key, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [paramString, key]);

  const loading = result?.key !== key;
  const data = result?.data;
  usePageSubtitle(
    data ? `${data.totalPeople.toLocaleString("en-US")} people across ${data.totalCountries} countries` : loading ? "Loading…" : null,
  );

  const clearAll = () => {
    setSearch("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const exportCsv = async () => {
    // return api.users.export({ ...filters, format: "csv" });
    const rows = await getAllUsers(filters);
    downloadCsv(`auvra-users-${new Date().toISOString().slice(0, 10)}.csv`, [{ title: "Users", columns: USER_COLUMNS, rows: rows.map(userCells) }]);
  };

  const handleExport = async ({ from, to, include, format }: ExportRequest) => {
    if (!data) return;
    // return api.users.export({ from, to, include, format, ...filters });
    const sections: ReportSection[] = [];
    if (include.includes("summary")) sections.push({ title: "Summary", columns: ["Metric", "Value"], rows: data.kpis.map((k) => [k.label, formatKpi(k)]) });
    if (include.includes("users")) {
      const rows = await getAllUsers(filters);
      sections.push({ title: "Users", columns: USER_COLUMNS, rows: rows.map(userCells) });
    }
    if (format === "csv") downloadCsv(`auvra-users-${from}-to-${to}.csv`, sections);
    else printReport("Users", `Joined ${from} to ${to}`, sections);
  };

  if (result?.failed && !loading) return <LoadError title="We couldn't load users" onRetry={() => setAttempt((a) => a + 1)} />;
  if (!data) return <UsersSkeleton />;

  const filtered = !!filters.query || filters.type !== "all" || filters.status !== "all" || filters.kyc !== "all" || filters.country !== "all";
  const countryOptions = [{ value: "all", label: "Any country" }, ...data.countries.map((c) => ({ value: c, label: c }))];
  const linkState = backState(`/app/users${paramString ? `?${paramString}` : ""}`, "users");

  let resultLine: ReactNode = null;
  if (filters.query && data.total > 0) {
    resultLine = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-[17px] pb-3 text-[12px] text-[#6b7180]" role="status">
        <span>
          {data.total} {data.total === 1 ? "user matches" : "users match"} <span className="font-medium text-[#1c1a18]">“{filters.query}”</span>
          {filters.type !== "all" && ` in ${USER_TYPES.find((t) => t.value === filters.type)!.plural}`}
        </span>
        <button type="button" onClick={() => { setSearch(""); update({ query: "" }); }} className="font-medium text-[#1c1a18] underline-offset-2 hover:underline">
          Clear search
        </button>
      </div>
    );
  }

  return (
    <>
      <PageActions>
        <PrimaryAction onClick={() => setExportOpen(true)}>
          <img src={exportWhiteIcon} alt="" width={13} height={13} />
          Export
        </PrimaryAction>
      </PageActions>
      {exportOpen && <ExportReportModal options={EXPORT_OPTIONS} onExport={handleExport} onClose={() => setExportOpen(false)} />}

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {data.kpis.map((k) => (
            <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="px-[17px] pt-[13px]">
            <CardHeader
              icon={usersIcon}
              title="All users"
              tip={{ title: "All users", body: "Everyone with an Auvra account. Search by name, email or user ID, and open anyone to see their profile." }}
            />
            <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3 pb-[14px]">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                <label className="relative block w-full sm:w-[280px]">
                  <span className="sr-only">Search users</span>
                  <img src={searchIcon} alt="" width={13} height={13} className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                    placeholder="Search name, email or ID"
                    className="h-[34px] w-full rounded-[8px] bg-[#f4f5f8] pl-[34px] pr-3 text-[13px] text-[#1c1a18] outline-none placeholder:text-[#8a8f9c] focus:ring-2 focus:ring-[#3310be]/30"
                  />
                </label>
                <TypeTabs value={filters.type} onChange={(type) => update({ type })} />
              </div>
              <div className="flex flex-wrap gap-2">
                <ToolbarMenu
                  icon={filterIcon}
                  label="Status"
                  buttonText={filters.status === "all" ? "Status" : statusLabel(filters.status)}
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={(status) => update({ status })}
                />
                <ToolbarMenu
                  icon={shieldIcon}
                  label="KYC"
                  buttonText={filters.kyc === "all" ? "KYC" : kycLabel(filters.kyc)}
                  options={KYC_OPTIONS}
                  value={filters.kyc}
                  onChange={(kyc) => update({ kyc })}
                />
                <ToolbarMenu
                  icon={countryIcon}
                  label="Country"
                  buttonText={filters.country === "all" ? "Country" : filters.country}
                  options={countryOptions}
                  value={filters.country}
                  onChange={(country) => update({ country })}
                />
                {data.total > 0 && (
                  <ToolbarButton icon={exportIcon} onClick={exportCsv} className="h-[34px] px-3 text-[12px]">
                    Export
                  </ToolbarButton>
                )}
              </div>
            </div>
          </div>

          <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
            {resultLine}
            {data.total === 0 ? (
              <EmptyState filters={filters} onClear={clearAll} />
            ) : (
              <>
                <UsersTable rows={data.rows} query={filters.query} linkState={linkState} />
                <Pagination page={filters.page} total={data.total} onPage={(page) => setParams(writeFilters({ ...filters, page }), { replace: true })} />
              </>
            )}
          </div>
        </Card>
        {filtered && data.total > 0 && !filters.query && (
          <div className="flex justify-center">
            <button type="button" onClick={clearAll} className="text-[12px] text-[#6b7180] hover:text-[#1c1a18]">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
