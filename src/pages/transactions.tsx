import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Download,
  ExternalLink,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Card, InfoTip } from "../components/ui/card";
import { Avatar, StatusPill, TrendBadge } from "../components/ui/controls";
import { DataTable } from "../components/ui/table";
import { Drawer } from "../components/ui/drawer";
import { Modal } from "../components/ui/modal";
import { PageActions } from "../components/layout/pageActions";
import { usePageTitle } from "../components/layout/headerSlots";
import {
  FAIL_TEXT,
  PAYOUT_TABS,
  PROVIDERS,
  TX_PAGE_SIZE,
  TX_STATUS_LABELS,
  TX_TABS,
  auditTrail,
  auvraFee,
  getAllTransactions,
  getPayouts,
  getTransaction,
  getTransactions,
  providerUrl,
  retryOptions,
  retryPayout,
  txLabel,
  txSteps,
} from "../data/transactions";
import type {
  Period,
  PayoutFilters,
  PayoutTab,
  Provider,
  RetryChoice,
  Transaction,
  TxFilters,
  TxStatus,
  TxType,
} from "../data/transactions";
import type { Kpi } from "../data/businessIntelligence";
import { formatKpi, usd } from "../utils/format";
import { downloadCsv } from "../utils/report";

const INITIAL_TX_FILTERS: TxFilters = {
  query: "",
  type: "all",
  status: "all",
  provider: "all",
  badge: "",
  period: 30,
  page: 1,
};

const INITIAL_PAYOUT_FILTERS: PayoutFilters = { tab: "all", query: "", provider: "all" };

const STATUS_TONES: Record<TxStatus, "green" | "purple" | "amber" | "red" | "gray"> = {
  held: "amber",
  paid: "green",
  pending: "amber",
  failed: "red",
  refunded: "purple",
  disputed: "red",
};

function MetricCard({ kpi, selected, onClick }: { kpi: Kpi; selected?: boolean; onClick?: () => void }) {
  return (
    <Card className={`relative px-[14px] pb-[13px] pt-[12px] ${selected ? "border-[#1c1a18]" : ""}`}>
      <div className="flex min-w-0 items-center gap-2 pr-5">
        {onClick ? (
          <button type="button" onClick={onClick} aria-pressed={selected} className="truncate text-left text-[12px] font-medium text-[#6b7180] outline-none hover:text-[#1c1a18] focus-visible:ring-2 focus-visible:ring-[#3310be]/40">
            {kpi.label}
          </button>
        ) : (
          <span className="truncate text-[12px] font-medium text-[#6b7180]">{kpi.label}</span>
        )}
        <InfoTip tip={{ title: kpi.label, body: kpi.tip }} align="end" />
      </div>
      <div className="mt-[18px] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[25px] font-medium leading-[30px] tracking-[-0.5px] text-[#1c1a18]">{formatKpi(kpi)}</span>
        {kpi.change !== undefined && (
          <TrendBadge value={kpi.change} unit={kpi.changeUnit} good={kpi.upIsGood ? kpi.change >= 0 : kpi.change <= 0} />
        )}
      </div>
      <div className="mt-1.5 text-[11px] text-[#8a8f9b]">{kpi.note ?? "vs previous 30 days"}</div>
    </Card>
  );
}

function SmallSelect<T extends string | number>({
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
        value={String(value)}
        onChange={(event) => {
          const selected = options.find((option) => String(option.value) === event.target.value);
          if (selected) onChange(selected.value);
        }}
        className="h-full appearance-none rounded-[8px] border border-[#eceef2] bg-white py-0 pl-[11px] pr-8 text-[11px] font-medium text-[#1c1a18] outline-none hover:bg-[#f8f9fb] focus:ring-2 focus:ring-[#3310be]/30"
      >
        {options.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
      </select>
      <ChevronDown aria-hidden size={13} className="pointer-events-none absolute right-[10px] text-[#6b7180]" />
    </label>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-[34px] min-w-[170px] flex-1 items-center gap-2 rounded-[8px] border border-[#eceef2] bg-white px-[10px] focus-within:ring-2 focus-within:ring-[#3310be]/30 sm:max-w-[270px]">
      <Search aria-hidden size={14} className="shrink-0 text-[#8a8f9b]" />
      <span className="sr-only">Search</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[11px] text-[#1c1a18] outline-none placeholder:text-[#a0a4ad]"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="text-[#8a8f9b] hover:text-[#1c1a18]">
          <X size={13} />
        </button>
      )}
    </label>
  );
}

function TabStrip<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex min-w-max items-center gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-[7px] px-[10px] py-[6px] text-[11px] font-medium transition-colors ${
            value === option.value ? "bg-[#f1f2f5] text-[#1c1a18]" : "text-[#737986] hover:bg-[#f8f9fb] hover:text-[#1c1a18]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ transaction }: { transaction: Transaction }) {
  let label = TX_STATUS_LABELS[transaction.status];
  if (transaction.status === "failed" && transaction.type === "payout" && transaction.failReason) {
    label = `Failed · ${FAIL_TEXT[transaction.failReason].short}`;
  }
  return <StatusPill tone={STATUS_TONES[transaction.status]}>{label}</StatusPill>;
}

function PersonCell({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex min-w-[145px] items-center gap-2.5">
      <Avatar name={transaction.person.name} size={28} className="rounded-[8px] text-[10px]" />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-[#1c1a18]">{transaction.person.name}</span>
        <span className="block truncate text-[10px] text-[#8a8f9b]">{transaction.person.sub}</span>
      </span>
    </div>
  );
}

function TransactionDetails({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const steps = txSteps(transaction);
  const trail = auditTrail(transaction);
  const rows: [string, string][] = [
    ["Transaction", transaction.id],
    ...(transaction.payoutId ? [["Payout ID", transaction.payoutId] as [string, string]] : []),
    ["Creator / customer", transaction.creator?.name ?? transaction.person.name],
    ["Provider reference", transaction.providerRef],
    ["Payment method", transaction.provider],
    ...(transaction.bank ? [["Bank or wallet", transaction.bank] as [string, string]] : []),
    ...(transaction.type === "claim" ? [
      ["Edition", transaction.edition ?? "—"],
      ["Item price", usd(transaction.price ?? transaction.amount, 2)],
      ["Auvra fee", usd(auvraFee(transaction), 2)],
      ["Shipping", usd(transaction.shipping ?? 0, 2)],
    ] as [string, string][] : []),
    ...(transaction.type === "subscription" ? [["Plan", transaction.plan ?? "Subscription"] as [string, string]] : []),
    ...(transaction.type === "deposit" ? [
      ["Received from", transaction.from ?? "—"],
      ["Credited as", transaction.to ?? usd(transaction.amount, 2)],
      ["Exchange rate", transaction.rate ?? "—"],
    ] as [string, string][] : []),
    ["Date", transaction.date],
  ];

  return (
    <Drawer title={transaction.id} onClose={onClose} width={430}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge transaction={transaction} />
            {transaction.type === "claim" && transaction.status === "held" && <StatusPill tone="purple">Held until delivery</StatusPill>}
          </div>
          <div className="mt-3 text-[26px] font-medium tracking-[-0.5px] text-[#1c1a18]">{usd(transaction.amount, 2)}</div>
          <div className="mt-1 text-[12px] text-[#6b7180]">{txLabel(transaction)} · {transaction.date}</div>
        </div>
      </div>

      <section className="mt-7">
        <h3 className="text-[12px] font-semibold text-[#1c1a18]">Transaction details</h3>
        <dl className="mt-3 divide-y divide-[#eceef2]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-[11px]">
              <dt className="text-[#737986]">{label}</dt>
              <dd className="max-w-[62%] break-words text-right font-medium text-[#1c1a18]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-7">
        <h3 className="text-[12px] font-semibold text-[#1c1a18]">Status</h3>
        <ol className="mt-3 space-y-0">
          {steps.map((step, index) => {
            const Icon = step.state === "done" ? CircleCheck : step.state === "failed" ? CircleAlert : step.state === "current" ? Clock3 : Clock3;
            const tone = step.state === "done" ? "text-[#16a34a]" : step.state === "failed" ? "text-[#dc2626]" : step.state === "current" ? "text-[#b7791f]" : "text-[#a0a4ad]";
            return (
              <li key={`${step.label}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                {index < steps.length - 1 && <span className="absolute bottom-0 left-[9px] top-[21px] w-px bg-[#eceef2]" />}
                <span className={`relative z-[1] flex size-[19px] shrink-0 items-center justify-center rounded-full bg-white ${tone}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0 pt-[1px]">
                  <span className="block text-[12px] font-medium text-[#1c1a18]">{step.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-[16px] text-[#737986]">{step.note}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-7">
        <h3 className="text-[12px] font-semibold text-[#1c1a18]">Audit trail</h3>
        <div className="mt-3 space-y-3">
          {trail.map((item, index) => (
            <div key={`${item.text}-${index}`} className="rounded-[10px] bg-[#f8f9fb] px-3 py-2.5">
              <p className="text-[11px] leading-[17px] text-[#1c1a18]">{item.text}</p>
              <p className="mt-1 text-[10px] text-[#8a8f9b]">{item.by} · {item.when}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-7 flex flex-wrap gap-2">
        <a
          href={providerUrl(transaction)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-[34px] items-center gap-2 rounded-[8px] border border-[#eceef2] px-3 text-[11px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb]"
        >
          Open in {transaction.provider} <ExternalLink size={13} />
        </a>
        {transaction.creator?.userId && (
          <a href={`/app/users/${transaction.creator.userId}`} className="inline-flex h-[34px] items-center gap-2 rounded-[8px] border border-[#eceef2] px-3 text-[11px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb]">
            View creator <ArrowUpRight size={13} />
          </a>
        )}
      </div>
    </Drawer>
  );
}

function RetryPayoutModal({
  transaction,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSubmit: (choice: RetryChoice) => void;
  busy: boolean;
  error: string | null;
}) {
  const options = retryOptions(transaction);
  const [choice, setChoice] = useState<RetryChoice>(options[0].value);

  return (
    <Modal
      title={`Retry payout to ${transaction.person.name}?`}
      onClose={onClose}
      width={470}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="h-[38px] rounded-[8px] border border-[#eceef2] px-3.5 text-[11px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb] disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={() => onSubmit(choice)} disabled={busy} className="inline-flex h-[38px] items-center gap-2 rounded-[8px] bg-[#1c1a18] px-3.5 text-[11px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-50">
            {busy ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            {busy ? "Retrying…" : "Send request"}
          </button>
        </>
      }
    >
      <dl className="space-y-2 rounded-[10px] bg-[#f8f9fb] p-3 text-[11px]">
        <div className="flex justify-between gap-3"><dt className="text-[#737986]">Amount</dt><dd className="font-medium">{usd(transaction.amount, 2)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-[#737986]">Bank</dt><dd className="text-right font-medium">{transaction.bank ?? "Not provided"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-[#737986]">Why it failed</dt><dd className="text-right font-medium">{transaction.failReason ? FAIL_TEXT[transaction.failReason].long(transaction.person.name) : "The provider rejected the payout"}</dd></div>
      </dl>
      <fieldset className="mt-5">
        <legend className="text-[11px] font-semibold text-[#1c1a18]">What to do</legend>
        <div className="mt-2 space-y-2">
          {options.map((option) => (
            <label key={option.value} className={`flex cursor-pointer items-start gap-2.5 rounded-[9px] border px-3 py-2.5 ${choice === option.value ? "border-[#1c1a18] bg-[#fbfbfc]" : "border-[#eceef2] hover:bg-[#f8f9fb]"}`}>
              <input type="radio" name="retry-choice" value={option.value} checked={choice === option.value} onChange={() => setChoice(option.value)} className="mt-[2px] accent-[#1c1a18]" />
              <span className="text-[11px] font-medium text-[#1c1a18]">{option.label}</span>
            </label>
          ))}
        </div>
        {choice === "ask" && <p className="mt-2 text-[10px] leading-[16px] text-[#737986]">A secure request will be sent to the creator to update their bank details.</p>}
      </fieldset>
      {error && <p role="alert" className="mt-3 rounded-[8px] bg-[#fdedee] px-3 py-2 text-[11px] text-[#b91c1c]">{error}</p>}
    </Modal>
  );
}

function TransactionTable({
  rows,
  onSelect,
  onRetry,
}: {
  rows: Transaction[];
  onSelect: (transaction: Transaction) => void;
  onRetry?: (transaction: Transaction) => void;
}) {
  return (
    <DataTable
      minWidth={850}
      head={
        <>
          <th scope="col" className="text-left">ID</th>
          <th scope="col" className="text-left">Type</th>
          <th scope="col" className="text-left">People</th>
          <th scope="col" className="text-right">Amount</th>
          <th scope="col" className="text-left">Provider</th>
          <th scope="col" className="text-left">Status</th>
          <th scope="col" className="text-left">Date</th>
          {onRetry && <th scope="col" className="text-right">Action</th>}
        </>
      }
    >
      {rows.map((transaction) => (
        <tr
          key={transaction.id}
          tabIndex={0}
          aria-label={`Open transaction ${transaction.id}`}
          onClick={() => onSelect(transaction)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(transaction);
            }
          }}
          className="cursor-pointer outline-none hover:bg-[#fbfbfc] focus-visible:bg-[#f8f9fb]"
        >
          <td className="h-[52px] whitespace-nowrap text-[11px] font-medium text-[#1c1a18]">{transaction.id}</td>
          <td className="whitespace-nowrap text-[11px] text-[#6b7180]">{txLabel(transaction)}</td>
          <td><PersonCell transaction={transaction} /></td>
          <td className="whitespace-nowrap text-right text-[11px] font-medium text-[#1c1a18]">{usd(transaction.amount, 2)}</td>
          <td className="whitespace-nowrap text-[11px] text-[#6b7180]">{transaction.provider}</td>
          <td className="whitespace-nowrap"><StatusBadge transaction={transaction} /></td>
          <td className="whitespace-nowrap text-[11px] text-[#6b7180]">{transaction.date}</td>
          {onRetry && (
            <td className="whitespace-nowrap text-right">
              {transaction.status === "failed" ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRetry(transaction);
                  }}
                  className="inline-flex h-[28px] items-center gap-1.5 rounded-[7px] border border-[#eceef2] px-2 text-[10px] font-medium text-[#1c1a18] hover:bg-white"
                >
                  <RotateCcw size={12} /> Retry
                </button>
              ) : <span className="pr-2 text-[#b4b8c0]">—</span>}
            </td>
          )}
        </tr>
      ))}
      {rows.length === 0 && (
        <tr>
          <td colSpan={onRetry ? 8 : 7} className="h-[116px] text-center text-[12px] text-[#737986]">No transactions match these filters.</td>
        </tr>
      )}
    </DataTable>
  );
}

export function Transactions() {
  usePageTitle("Transactions");
  const [view, setView] = useState<"history" | "payouts">("history");
  const [filters, setFilters] = useState<TxFilters>(INITIAL_TX_FILTERS);
  const [payoutFilters, setPayoutFilters] = useState<PayoutFilters>(INITIAL_PAYOUT_FILTERS);
  const [txRows, setTxRows] = useState<Transaction[]>([]);
  const [txKpis, setTxKpis] = useState<Kpi[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [payoutRows, setPayoutRows] = useState<Transaction[]>([]);
  const [payoutKpis, setPayoutKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const selectedId = useRef<string | null>(null);
  const [retrying, setRetrying] = useState<Transaction | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      const request = view === "history" ? getTransactions(filters) : getPayouts(payoutFilters);
      void request.then((result) => {
        if (!active) return;
        if (view === "history") {
          const history = result as Awaited<ReturnType<typeof getTransactions>>;
          setTxRows(history.rows);
          setTxKpis(history.kpis);
          setTxTotal(history.total);
        } else {
          const payouts = result as Awaited<ReturnType<typeof getPayouts>>;
          setPayoutRows(payouts.rows);
          setPayoutKpis(payouts.kpis);
        }
        setLoading(false);
      }).catch((error: unknown) => {
        if (!active) return;
        setLoading(false);
        setLoadError(error instanceof Error ? error.message : "Unable to load transactions.");
      });
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [view, filters, payoutFilters, reloadKey]);

  const maxPages = Math.max(1, Math.ceil(txTotal / TX_PAGE_SIZE));
  const setTxFilter = <K extends keyof TxFilters>(key: K, value: TxFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "page" ? {} : { page: 1 }) }));
  };

  const openTransaction = async (transaction: Transaction) => {
    selectedId.current = transaction.id;
    setSelected(transaction);
    try {
      const details = await getTransaction(transaction.id);
      if (details && selectedId.current === transaction.id) setSelected(details);
    } catch (error) {
      if (selectedId.current === transaction.id) {
        setNotice(error instanceof Error ? error.message : "Could not load transaction details.");
      }
    }
  };

  const exportRows = async () => {
    try {
      if (view === "history") {
        const rows = await getAllTransactions(filters);
        downloadCsv("auvra-transactions.csv", [{
          title: "Transactions",
          columns: ["ID", "Type", "Person", "Amount", "Provider", "Provider reference", "Status", "Date"],
          rows: rows.map((row) => [row.id, txLabel(row), row.person.name, row.amount, row.provider, row.providerRef, TX_STATUS_LABELS[row.status], row.date]),
        }]);
      } else {
        const rows = payoutRows;
        downloadCsv("auvra-payouts.csv", [{
          title: "Payouts",
          columns: ["Payout ID", "Creator", "Amount", "Bank or wallet", "Provider", "Status", "Date"],
          rows: rows.map((row) => [row.payoutId ?? row.id, row.person.name, row.amount, row.bank ?? "", row.provider, TX_STATUS_LABELS[row.status], row.date]),
        }]);
      }
      setNotice(`${view === "history" ? "Transactions" : "Payouts"} exported.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The export could not be created.");
    }
  };

  const submitRetry = async (choice: RetryChoice) => {
    if (!retrying) return;
    setRetryBusy(true);
    setRetryError(null);
    try {
      await retryPayout(retrying.id, choice, "Auvra Admin");
      setRetrying(null);
      setRetryBusy(false);
      setNotice(`Payout ${retrying.payoutId ?? retrying.id} has been moved to pending.`);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "The payout could not be retried.");
      setRetryBusy(false);
    }
  };

  const changeView = (next: "history" | "payouts") => {
    setView(next);
    setNotice(null);
    setLoadError(null);
  };

  return (
    <div className="space-y-5 pb-5">
      <PageActions>
        <button type="button" onClick={exportRows} className="inline-flex h-[34px] items-center gap-2 rounded-[8px] bg-[#1c1a18] px-3 text-[11px] font-medium text-white hover:bg-[#2f2c29]">
          <Download size={13} /> Export
        </button>
      </PageActions>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.45px] text-[#1c1a18]">{view === "history" ? "Transactions" : "Payouts"}</h1>
          <p className="mt-1 text-[11px] text-[#737986]">
            {view === "history" ? "Every payment of money in and out of Auvra." : "Money paid to creators."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "history" ? (
            <SmallSelect<Period>
              label="Reporting period"
              value={filters.period}
              options={[{ value: 7, label: "Last 7 days" }, { value: 30, label: "Last 30 days" }, { value: 90, label: "Last 90 days" }]}
              onChange={(period) => setTxFilter("period", period)}
            />
          ) : (
            <button type="button" onClick={() => setPayoutFilters(INITIAL_PAYOUT_FILTERS)} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] px-3 text-[11px] font-medium hover:bg-[#f8f9fb]">
              Reset filters
            </button>
          )}
          <button type="button" aria-label="Refresh" onClick={() => setReloadKey((key) => key + 1)} className="flex size-[34px] items-center justify-center rounded-[8px] border border-[#eceef2] text-[#535966] hover:bg-[#f8f9fb]">
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-[9px] border border-[#d9efdf] bg-[#f0faf3] px-3 py-2 text-[11px] text-[#176b37]">
          <span className="flex items-center gap-2"><Check size={14} />{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      )}

      {view === "history" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {txKpis.map((kpi) => (
              <MetricCard
                key={kpi.key}
                kpi={kpi}
                selected={kpi.key === "refunds" && filters.status === "refunded"}
                onClick={kpi.key === "refunds" ? () => setTxFilter("status", filters.status === "refunded" ? "all" : "refunded") : undefined}
              />
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef2] px-[15px] py-[13px]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-medium text-[#1c1a18]">Transaction history</h2>
                  <span className="text-[10px] text-[#8a8f9b]">{txTotal.toLocaleString("en-US")} records</span>
                </div>
                <p className="mt-1 text-[10px] text-[#8a8f9b]">Search, filter and inspect individual payments.</p>
              </div>
              <button type="button" onClick={() => changeView("payouts")} className="inline-flex h-[31px] items-center gap-1.5 rounded-[7px] px-2.5 text-[10px] font-medium text-[#3310be] hover:bg-[#f5f2ff]">
                Open payouts <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto border-b border-[#eceef2] px-[12px] py-2">
              <TabStrip<TxType | "all">
                label="Transaction category"
                value={filters.type}
                options={TX_TABS}
                onChange={(type) => setTxFilter("type", type)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eceef2] px-[15px] py-[10px]">
              <SearchField value={filters.query} onChange={(query) => setTxFilter("query", query)} placeholder="Search person, ID or reference" />
              <SmallSelect<TxStatus | "all">
                label="Filter by status"
                value={filters.status}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "held", label: "Held" },
                  { value: "paid", label: "Paid" },
                  { value: "pending", label: "Pending" },
                  { value: "failed", label: "Failed" },
                  { value: "refunded", label: "Refunds & disputes" },
                ]}
                onChange={(status) => setTxFilter("status", status)}
              />
              <SmallSelect<Provider | "all">
                label="Filter by provider"
                value={filters.provider}
                options={[{ value: "all", label: "All providers" }, ...PROVIDERS.map((provider) => ({ value: provider, label: provider }))]}
                onChange={(provider) => setTxFilter("provider", provider)}
              />
              <span className="hidden items-center gap-1 text-[10px] text-[#a0a4ad] md:flex"><Filter size={12} /> Filters apply together</span>
            </div>

            {loadError ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 px-4 text-center">
                <p role="alert" className="text-[12px] text-[#b91c1c]">{loadError}</p>
                <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="h-[32px] rounded-[8px] bg-[#1c1a18] px-3 text-[11px] font-medium text-white">Try again</button>
              </div>
            ) : (
              <>
                {loading && <div className="h-1 animate-pulse bg-[#3310be]/30" aria-label="Loading transactions" />}
                <TransactionTable rows={txRows} onSelect={openTransaction} />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef2] px-[15px] py-[10px] text-[10px] text-[#737986]">
                  <span>{txTotal === 0 ? "Showing 0 records" : `Showing ${(filters.page - 1) * TX_PAGE_SIZE + 1}–${Math.min(filters.page * TX_PAGE_SIZE, txTotal)} of ${txTotal}`}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Previous page" disabled={filters.page <= 1 || loading} onClick={() => setTxFilter("page", filters.page - 1)} className="flex size-[27px] items-center justify-center rounded-[6px] border border-[#eceef2] disabled:opacity-40"><ChevronLeft size={14} /></button>
                    <span>Page {filters.page} of {maxPages}</span>
                    <button type="button" aria-label="Next page" disabled={filters.page >= maxPages || loading} onClick={() => setTxFilter("page", filters.page + 1)} className="flex size-[27px] items-center justify-center rounded-[6px] border border-[#eceef2] disabled:opacity-40"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      ) : (
        <>
          <button type="button" onClick={() => changeView("history")} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6b7180] hover:text-[#1c1a18]">
            <ArrowLeft size={13} /> Back to Transactions
          </button>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {payoutKpis.map((kpi) => (
              <MetricCard
                key={kpi.key}
                kpi={kpi}
                selected={payoutFilters.tab === ({ paid: "completed", pending: "pending", failed: "failed" }[kpi.key] ?? "")}
                onClick={kpi.key === "paid" || kpi.key === "pending" || kpi.key === "failed"
                  ? () => setPayoutFilters((current) => ({ ...current, tab: current.tab === ({ paid: "completed", pending: "pending", failed: "failed" }[kpi.key] as PayoutTab) ? "all" : ({ paid: "completed", pending: "pending", failed: "failed" }[kpi.key] as PayoutTab) }))
                  : undefined}
              />
            ))}
          </div>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef2] px-[15px] py-[13px]">
              <div>
                <h2 className="text-[13px] font-medium text-[#1c1a18]">Payouts</h2>
                <p className="mt-1 text-[10px] text-[#8a8f9b]">Track creator transfers and retry failed payouts.</p>
              </div>
              <TabStrip<PayoutTab> label="Payout status" value={payoutFilters.tab} options={PAYOUT_TABS} onChange={(tab) => setPayoutFilters((current) => ({ ...current, tab }))} />
            </div>
            <div className="flex flex-wrap items-center gap-2 px-[15px] py-[10px]">
              <SearchField value={payoutFilters.query} onChange={(query) => setPayoutFilters((current) => ({ ...current, query }))} placeholder="Search creator or payout ID" />
              <SmallSelect<Provider | "all">
                label="Filter by provider"
                value={payoutFilters.provider}
                options={[{ value: "all", label: "All providers" }, ...PROVIDERS.filter((provider) => provider === "Paystack" || provider === "Breet").map((provider) => ({ value: provider, label: provider }))]}
                onChange={(provider) => setPayoutFilters((current) => ({ ...current, provider }))}
              />
            </div>
            {loadError ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 px-4 text-center">
                <p role="alert" className="text-[12px] text-[#b91c1c]">{loadError}</p>
                <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="h-[32px] rounded-[8px] bg-[#1c1a18] px-3 text-[11px] font-medium text-white">Try again</button>
              </div>
            ) : (
              <>
                {loading && <div className="h-1 animate-pulse bg-[#3310be]/30" aria-label="Loading payouts" />}
                <TransactionTable rows={payoutRows} onSelect={openTransaction} onRetry={(transaction) => { setRetryError(null); setRetrying(transaction); }} />
                <div className="flex items-center justify-between border-t border-[#eceef2] px-[15px] py-[10px] text-[10px] text-[#737986]">
                  <span>{payoutRows.length} payouts</span>
                  <span>Failed payouts keep the creator’s balance until a retry succeeds.</span>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {selected && <TransactionDetails transaction={selected} onClose={() => { selectedId.current = null; setSelected(null); }} />}
      {retrying && (
        <RetryPayoutModal
          transaction={retrying}
          onClose={() => { if (!retryBusy) setRetrying(null); }}
          onSubmit={(choice) => void submitRetry(choice)}
          busy={retryBusy}
          error={retryError}
        />
      )}
    </div>
  );
}
