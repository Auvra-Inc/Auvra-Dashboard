import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { SegmentedControl, StatusPill, ToolbarMenu } from "../components/ui/controls";
import { BarList, LineChart } from "../components/ui/charts";
import { DataTable } from "../components/ui/table";
import { Modal } from "../components/ui/modal";
import { usePageSubtitle } from "../components/layout/headerSlots";
import { KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { MODELS, getLensOverview, setProvider } from "../data/lensAi";
import type { LatencyRange, LensDays, LensFilters, LensModel, LensOverview, Provider } from "../data/lensAi";
import sparklesIcon from "../assets/dashboard/card-sparkles.svg";
import sparklesSmallIcon from "../assets/dashboard/sparkles-13.svg";
import globeIcon from "../assets/dashboard/card-globe.svg";
import zapIcon from "../assets/dashboard/card-zap.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import alertIcon from "../assets/dashboard/card-alert.svg";
import alertRedIcon from "../assets/dashboard/alert-16-red.svg";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import refreshIcon from "../assets/dashboard/refresh-13.svg";
import calendarIcon from "../assets/dashboard/calendar.svg";

const KPI_ICONS: Record<string, string> = {
  transcriptions: sparklesIcon,
  translations: globeIcon,
  requests: zapIcon,
  latency: clockIcon,
  errors: alertIcon,
  languages: globeIcon,
};

const LATENCY_SERIES = [
  { key: "avg", name: "Average", color: "#3310be" },
  { key: "p95", name: "p95", color: "#1c1a18" },
  { key: "p99", name: "p99", color: "#e5484d" },
] as const;

const DAY_OPTIONS: { value: `${LensDays}`; label: string }[] = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

const PROVIDER_NAMES: Record<Provider, string> = { "a-chronos": "A-Chronos", elevenlabs: "ElevenLabs" };

const modelLabel = (m: LensModel) => MODELS.find((x) => x.value === m)!.label;

/* ---------- Provider switch ---------- */

type SwitchRequest = { code: string; name: string; to: Provider };

function SwitchProviderModal({ request, model, onDone, onClose }: { request: SwitchRequest; model: LensModel; onDone: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const toFallback = request.to === "elevenlabs";

  const confirm = async () => {
    setBusy(true);
    setError(false);
    try {
      await setProvider(request.code, request.to);
      onDone();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={toFallback ? `Switch ${request.name} to ElevenLabs?` : `Switch ${request.name} back to A-Chronos?`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-[42px] rounded-[10px] border border-[#eceef2] px-5 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="h-[42px] min-w-[96px] rounded-[10px] bg-[#1c1a18] px-5 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-40"
          >
            {busy ? "Switching…" : "Switch"}
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-[20px] text-[#6b7180]">
        {toFallback
          ? `New ${request.name} transcriptions will go to ElevenLabs instead of ${modelLabel(model)} until you switch back. ElevenLabs costs more per minute, and its transcripts don't train A-Chronos.`
          : `New ${request.name} transcriptions will go to ${modelLabel(model)} again. Check the error rate for a few minutes afterwards.`}
      </p>
      {error && <p className="mt-3 text-[12px] text-[#dc2626]">We couldn't switch providers. Try again.</p>}
      <p className="mt-4 text-[12px] text-[#6b7180]">The change is recorded in the audit log.</p>
    </Modal>
  );
}

function IncidentBanner({ incident, model, onSwitch }: { incident: NonNullable<LensOverview["incident"]>; model: LensModel; onSwitch: () => void }) {
  return (
    <div role="alert" className="mb-3 flex flex-col gap-3 rounded-[12px] bg-[#fdedee] px-4 py-3 sm:flex-row sm:items-center">
      <img src={alertRedIcon} alt="" width={16} height={16} className="hidden shrink-0 sm:block" />
      <p className="flex-1 text-[13px] leading-[19px] text-[#dc2626]">
        <strong className="font-semibold">Error rate is {incident.errorRatePct}%,</strong> above the {incident.alertPct}% alert level for {incident.minutes} minutes. Most failures are{" "}
        {incident.language.name} transcriptions on {modelLabel(model)}.
      </p>
      <button
        type="button"
        onClick={onSwitch}
        className="flex h-[34px] shrink-0 items-center gap-2 self-start rounded-[8px] bg-white px-3 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8] sm:self-auto"
      >
        <img src={refreshIcon} alt="" width={13} height={13} />
        Switch {incident.language.name} to ElevenLabs
      </button>
    </div>
  );
}

// Shown while a language is routed to the fallback provider
function FallbackBanner({ names, onSwitchBack }: { names: { code: string; name: string }[]; onSwitchBack: (lang: { code: string; name: string }) => void }) {
  return (
    <div role="status" className="mb-3 flex flex-col gap-3 rounded-[12px] bg-[#fdf3dc] px-4 py-3 sm:flex-row sm:items-center">
      <p className="flex-1 text-[13px] leading-[19px] text-[#8a5a12]">
        {names.map((n) => n.name).join(", ")} transcriptions are going to ElevenLabs while A-Chronos recovers.
      </p>
      <div className="flex flex-wrap gap-2">
        {names.map((n) => (
          <button
            key={n.code}
            type="button"
            onClick={() => onSwitchBack(n)}
            className="flex h-[34px] items-center gap-2 rounded-[8px] bg-white px-3 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]"
          >
            <img src={refreshIcon} alt="" width={13} height={13} />
            Switch {n.name} back
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Cards ---------- */

function LatencyCard({ data }: { data: LensOverview["latency"] }) {
  const [range, setRange] = useState<LatencyRange>("7d");
  const view = data[range];
  const step = 1.5;
  const max = Math.max(step * 2, Math.ceil(Math.max(...view.p99) / step) * step);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);

  return (
    <Card className="flex flex-col px-[17px] pb-[17px] pt-[13px]">
      <CardHeader icon={clockIcon} title="Inference latency" tip={{ title: "Inference latency", body: "How long Lens AI takes to answer. p95 and p99 are the times 95% and 99% of requests finish within." }}>
        <SegmentedControl
          label="Latency period"
          value={range}
          onChange={setRange}
          options={[
            { value: "24h", label: "24h" },
            { value: "7d", label: "7d" },
            { value: "30d", label: "30d" },
          ]}
        />
      </CardHeader>
      <ul className="mt-5 flex items-center gap-4" aria-label="Legend">
        {LATENCY_SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[12px] text-[#6b7180]">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
      <div className="mt-5 h-[240px] min-h-0 flex-1">
        <LineChart
          series={LATENCY_SERIES.map((s) => ({ name: s.name, color: s.color, values: view[s.key] }))}
          labels={view.labels}
          max={max}
          ticks={ticks}
          formatTick={(v) => `${v}s`}
          formatValue={(v) => `${v.toFixed(2)}s`}
          ariaLabel="Inference latency"
        />
      </div>
    </Card>
  );
}

function TrainingCard({ data }: { data: LensOverview["training"] }) {
  const pct = Math.round((data.epoch / data.epochs) * 100);
  const tiles = [
    { label: "WER", value: `${data.wer}%` },
    { label: "BLEU", value: data.bleu.toFixed(1) },
    { label: "ElevenLabs fallback", value: `${data.fallbackPct}% of calls` },
    { label: "Next checkpoint", value: data.nextCheckpoint },
  ];
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={sparklesIcon} title="A-Chronos training" tip={{ title: "A-Chronos training", body: "Auvra's own speech model. Each run trains on Keeper-verified recordings; calls it can't handle yet fall back to ElevenLabs." }} />
      <p className="mt-5 text-[13px] text-[#6b7180]">
        Run {data.run} · {data.description}
      </p>
      <div className="mt-4 flex items-center justify-between text-[13px] text-[#1c1a18]">
        <span className="font-medium">
          Epoch {data.epoch} of {data.epochs}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-[10px] rounded-full bg-[#f4f5f8]" role="progressbar" aria-label="Training progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-[#3310be]" style={{ width: `${pct}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="min-w-0 rounded-[10px] bg-[#f4f5f8] px-3 py-3">
            <dt className="truncate text-[11px] text-[#6b7180]">{t.label}</dt>
            <dd className="mt-1 truncate text-[18px] text-[#1c1a18]">{t.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function QualityCard({ data }: { data: LensOverview["languages"] }) {
  const top = data[0];
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader
          icon={globeIcon}
          title="Quality by language"
          tip={{ title: "Quality by language", body: "WER is the share of words transcribed wrongly (lower is better). BLEU scores translations from 0 to 100 (higher is better)." }}
        >
          {top && (
            <Link to={`languages/${top.code}`} className="text-[12px] font-medium text-[#3310be] hover:underline">
              Open {top.name}
            </Link>
          )}
        </CardHeader>
      </div>
      <div className="mt-4">
        <DataTable
          minWidth={560}
          head={
            <>
              <th scope="col" className="text-left">Language</th>
              <th scope="col" className="px-2 text-left">Status</th>
              <th scope="col" className="px-2 text-right">WER</th>
              <th scope="col" className="px-2 text-right">BLEU</th>
              <th scope="col" className="text-right">Transcriptions</th>
            </>
          }
        >
          {data.map((l) => (
            <tr key={l.code} className="hover:bg-[#fafbfc]">
              <th scope="row" className="h-[37px] text-left font-normal">
                <Link to={`languages/${l.code}`} className="hover:underline">
                  {l.name}
                </Link>
              </th>
              <td className="px-2">
                <span className="flex flex-wrap gap-1.5">
                  {l.status === "live" ? <StatusPill tone="green">Live</StatusPill> : <StatusPill tone="amber">In development</StatusPill>}
                  {l.provider !== "a-chronos" && <StatusPill tone="gray">On {PROVIDER_NAMES[l.provider]}</StatusPill>}
                </span>
              </td>
              <td className="px-2 text-right">{l.wer.toFixed(1)}%</td>
              <td className="px-2 text-right">{l.bleu.toFixed(1)}</td>
              <td className="text-right">{l.transcriptions.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </Card>
  );
}

function PairsCard({ data }: { data: LensOverview["pairs"] }) {
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={arrowsIcon} title="Top translation pairs" tip={{ title: "Top translation pairs", body: "The language pairs people translate between most." }} />
      <div className="mt-5">
        <BarList items={data} label="Top translation pairs" color="#1c1a18" />
      </div>
    </Card>
  );
}

/* ---------- Loading ---------- */

function LensSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-6 h-[240px] w-full" />
        </Card>
        <Card className="space-y-4 p-[17px]">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2.5 w-full" />
          <div className="grid grid-cols-2 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[62px]" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { key: string; data?: LensOverview; failed?: boolean };

export function LensAi() {
  const [filters, setFilters] = useState<LensFilters>({ model: "a-chronos-0.7", days: 7 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [switching, setSwitching] = useState<SwitchRequest | null>(null);
  const key = `${filters.model}|${filters.days}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getLensOverview(filters)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch(() => !cancelled && setResult({ key, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [filters, key]);

  // Keep showing the last numbers (dimmed) while a filter change loads
  const loading = result?.key !== key;
  const data = result?.data;
  const periodLabel = DAY_OPTIONS.find((o) => o.value === `${filters.days}`)!.label;
  usePageSubtitle(!data && loading ? "Loading the latest numbers…" : `Auvra's intelligence layer · ${periodLabel}`);

  if (result?.failed && !loading) {
    return <LoadError title="We couldn't load Lens AI" onRetry={() => setAttempt((a) => a + 1)} />;
  }
  if (!data) return <LensSkeleton />;

  const onFallback = data.languages.filter((l) => l.provider === "elevenlabs");

  return (
    <>
      {data.incident && (
        <IncidentBanner
          incident={data.incident}
          model={filters.model}
          onSwitch={() => setSwitching({ code: data.incident!.language.code, name: data.incident!.language.name, to: "elevenlabs" })}
        />
      )}
      {onFallback.length > 0 && <FallbackBanner names={onFallback} onSwitchBack={(l) => setSwitching({ ...l, to: "a-chronos" })} />}
      {switching && (
        <SwitchProviderModal
          request={switching}
          model={filters.model}
          onClose={() => setSwitching(null)}
          onDone={() => {
            setSwitching(null);
            setAttempt((a) => a + 1);
          }}
        />
      )}

      <div className={`mb-3 flex flex-wrap justify-end gap-2.5 ${data.incident || onFallback.length ? "" : "-mt-3 sm:-mt-4"}`}>
        <ToolbarMenu
          icon={sparklesSmallIcon}
          label="Model"
          buttonText={`Model: ${modelLabel(filters.model)}`}
          options={MODELS}
          value={filters.model}
          onChange={(model) => setFilters((f) => ({ ...f, model }))}
        />
        <ToolbarMenu icon={calendarIcon} label="Period" options={DAY_OPTIONS} value={`${filters.days}`} onChange={(v) => setFilters((f) => ({ ...f, days: Number(v) as LensDays }))} />
      </div>

      <div aria-busy={loading} className={`space-y-3 transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {data.kpis.map((k) => (
            <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <LatencyCard data={data.latency} />
          <TrainingCard data={data.training} />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <QualityCard data={data.languages} />
          <PairsCard data={data.pairs} />
        </div>
      </div>
    </>
  );
}
