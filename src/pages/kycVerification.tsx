import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/card";
import { ToolbarMenu } from "../components/ui/controls";
import { DataTable } from "../components/ui/table";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { KpiLinkCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { DoneBanner, PersonCell } from "../components/ui/actions";
import { BackToSafety, CardListSkeleton, KycReviewDrawer, KycStatusPill } from "../components/safety/tsParts";
import { KYC_TABS, getKycChecks, needsAction } from "../data/trustAndSafety";
import type { KycFilters, KycList, KycTab } from "../data/trustAndSafety";
import clockIcon from "../assets/dashboard/card-clock.svg";
import checkIcon from "../assets/dashboard/card-check.svg";
import closeIcon from "../assets/dashboard/close-13.svg";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import shieldIcon from "../assets/dashboard/shield-13.svg";
import searchIcon from "../assets/dashboard/search-13.svg";
import searchLargeIcon from "../assets/dashboard/search-20.svg";
import filterIcon from "../assets/dashboard/filter.svg";
import countryIcon from "../assets/dashboard/slash-circle-13.svg";
import chevronRightIcon from "../assets/dashboard/chevron-right-13.svg";

const KPI_ICONS: Record<string, string> = { pending: clockIcon, verified: checkIcon, rejected: closeIcon, bank: arrowsIcon };

const PROVIDER_OPTIONS: { value: KycFilters["provider"]; label: string }[] = [
  { value: "all", label: "Any provider" },
  { value: "Dojah", label: "Dojah · identity" },
  { value: "Paystack", label: "Paystack · bank" },
];

/* ---------- Filters in the URL so links from the overview land on the right view ---------- */

function readFilters(params: URLSearchParams): KycFilters {
  const tab = params.get("status");
  const provider = params.get("provider");
  return {
    tab: KYC_TABS.some((t) => t.value === tab) ? (tab as KycTab) : "pending",
    query: params.get("q") ?? "",
    provider: provider === "Dojah" || provider === "Paystack" ? provider : "all",
    country: params.get("country") ?? "all",
  };
}

function writeFilters(f: KycFilters, review?: string | null) {
  const params = new URLSearchParams();
  if (f.tab !== "pending") params.set("status", f.tab);
  if (f.query) params.set("q", f.query);
  if (f.provider !== "all") params.set("provider", f.provider);
  if (f.country !== "all") params.set("country", f.country);
  if (review) params.set("review", review);
  return params;
}

function StatusTabs({ value, onChange }: { value: KycTab; onChange: (v: KycTab) => void }) {
  return (
    <div role="radiogroup" aria-label="Status" className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-[9px] bg-[#f4f5f8] p-[3px]">
      {KYC_TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={value === t.value}
          onClick={() => onChange(t.value)}
          className={`h-[28px] min-w-[60px] whitespace-nowrap rounded-[7px] px-[11px] text-[11px] font-medium ${
            value === t.value ? "bg-white text-[#1c1a18] shadow-[0_1px_2px_rgba(28,26,24,0.08)]" : "text-[#6b7180] hover:text-[#1c1a18]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Empty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center px-5 pb-[64px] pt-[48px] text-center">
      <span className="flex size-14 items-center justify-center rounded-[14px] bg-[#f4f5f8]">
        <img src={searchLargeIcon} alt="" width={20} height={20} />
      </span>
      <div className="mt-6 text-[17px] font-semibold text-[#1c1a18]">{filtered ? "No checks match" : "No checks waiting"}</div>
      <div className="mt-2 max-w-[400px] text-[13px] leading-[20px] text-[#6b7180]">
        {filtered ? "Check the spelling, or clear the filters to see every check." : "Every identity and bank check has a decision. New ones show up here as people submit them."}
      </div>
      {filtered && (
        <button type="button" onClick={onClear} className="mt-6 h-10 rounded-[10px] border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
          Clear filters
        </button>
      )}
    </div>
  );
}

type LoadResult = { key: string; data?: KycList; failed?: boolean };

export function KycVerification() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const review = params.get("review");
  const [search, setSearch] = useState(filters.query);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [done, setDone] = useState<string | null>(null);
  // The drawer opening or closing doesn't refetch the list
  const filterString = writeFilters(filters).toString();
  const key = `${filterString}|${attempt}`;

  usePageTitle("KYC and bank verification");
  usePageSubtitle("Creators can't withdraw until they pass");

  const update = (patch: Partial<KycFilters>) => setParams(writeFilters({ ...filters, ...patch }), { replace: true });

  useEffect(() => {
    if (search === filters.query) return;
    const t = setTimeout(() => setParams(writeFilters({ ...filters, query: search }, review), { replace: true }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    getKycChecks(readFilters(new URLSearchParams(filterString)))
      .then((data) => !cancelled && setResult({ key, data }))
      .catch(() => !cancelled && setResult({ key, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [filterString, key]);

  const loading = result?.key !== key;
  const data = result?.data;
  const openReview = (id: string) => setParams(writeFilters(filters, id));
  const closeReview = () => setParams(writeFilters(filters), { replace: true });
  const clearAll = () => {
    setSearch("");
    setParams(writeFilters({ tab: "all", query: "", provider: "all", country: "all" }), { replace: true });
  };

  const drawer = review && (
    <KycReviewDrawer
      checkId={review}
      onClose={closeReview}
      onDecided={(message) => {
        closeReview();
        setDone(message);
        setAttempt((a) => a + 1);
      }}
    />
  );

  if (result?.failed && !loading) return <LoadError title="We couldn't load KYC checks" onRetry={() => setAttempt((a) => a + 1)} />;
  if (!data)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        <BackToSafety />
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <CardListSkeleton rows={6} />
        {drawer}
      </div>
    );

  const filtered = !!filters.query || filters.tab !== "pending" || filters.provider !== "all" || filters.country !== "all";
  const countryOptions = [{ value: "all", label: "Any country" }, ...data.countries.map((c) => ({ value: c, label: c }))];

  // KPI cards switch the table to the matching view
  const kpiTargets: Record<string, Partial<KycFilters>> = {
    pending: { tab: "pending", provider: "all" },
    verified: { tab: "verified", provider: "all" },
    rejected: { tab: "rejected", provider: "all" },
    bank: { tab: "all", provider: "Paystack" },
  };
  const isActive = (k: string) => {
    const t = kpiTargets[k];
    return filters.tab === t.tab && filters.provider === t.provider;
  };

  return (
    <div className="space-y-3">
      {drawer}
      <BackToSafety />
      {done && <DoneBanner onClose={() => setDone(null)}>{done}</DoneBanner>}

      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <KpiLinkCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} active={isActive(k.key)} onClick={() => update(kpiTargets[k.key])} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-[17px] pt-[13px]">
          <CardHeader
            icon={shieldIcon}
            title="Identity and bank checks"
            tip={{ title: "Identity and bank checks", body: "Dojah checks the ID and selfie; Paystack checks that the bank account is in the person's name. Open any row to review it." }}
          />
          <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3 pb-[14px]">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
              <label className="relative block w-full sm:w-[280px]">
                <span className="sr-only">Search checks</span>
                <img src={searchIcon} alt="" width={13} height={13} className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                  placeholder="Search person or reference"
                  className="h-[34px] w-full rounded-[8px] bg-[#f4f5f8] pl-[34px] pr-3 text-[13px] text-[#1c1a18] outline-none placeholder:text-[#8a8f9c] focus:ring-2 focus:ring-[#3310be]/30"
                />
              </label>
              <StatusTabs value={filters.tab} onChange={(tab) => update({ tab })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <ToolbarMenu
                icon={filterIcon}
                label="Provider"
                buttonText={filters.provider === "all" ? "Provider" : filters.provider}
                options={PROVIDER_OPTIONS}
                value={filters.provider}
                onChange={(provider) => update({ provider })}
              />
              <ToolbarMenu
                icon={countryIcon}
                label="Country"
                buttonText={filters.country === "all" ? "Country" : filters.country}
                options={countryOptions}
                value={filters.country}
                onChange={(country) => update({ country })}
              />
            </div>
          </div>
        </div>

        <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
          {data.rows.length === 0 ? (
            <Empty filtered={filtered} onClear={clearAll} />
          ) : (
            <DataTable
              minWidth={860}
              head={
                <>
                  <th scope="col" className="w-[25%] text-left">Person</th>
                  <th scope="col" className="w-[17%] px-2 text-left">Document</th>
                  <th scope="col" className="w-[12%] px-2 text-left">Provider</th>
                  <th scope="col" className="w-[18%] px-2 text-left">Status</th>
                  <th scope="col" className="px-2 text-left">Submitted</th>
                  <th scope="col" className="text-right">
                    <span className="sr-only">Action</span>
                  </th>
                </>
              }
            >
              {data.rows.map((c) => {
                const action = needsAction(c.status) ? "Review" : "Open";
                return (
                  <tr key={c.id} onClick={(e) => !(e.target as HTMLElement).closest("button") && openReview(c.id)} className="cursor-pointer hover:bg-[#f8f9fb]">
                    <td className="h-[52px]">
                      <PersonCell name={c.name} sub={`${c.userType} · ${c.country}`} />
                    </td>
                    <td className="px-2">{c.document}</td>
                    <td className="px-2">{c.provider}</td>
                    <td className="px-2">
                      <KycStatusPill status={c.status} />
                    </td>
                    <td className="px-2">{c.submitted}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => openReview(c.id)}
                        aria-label={`${action} ${c.name}, ${c.document}`}
                        className="ml-auto flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] bg-white px-3 text-[13px] text-[#1c1a18] hover:bg-[#f4f5f8]"
                      >
                        <img src={chevronRightIcon} alt="" width={13} height={13} />
                        {action}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </div>
      </Card>
    </div>
  );
}
