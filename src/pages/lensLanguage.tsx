import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { LineChart } from "../components/ui/charts";
import { DataTable } from "../components/ui/table";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { getLensLanguage } from "../data/lensAi";
import type { LensLanguage as Language } from "../data/lensAi";
import sparklesIcon from "../assets/dashboard/card-sparkles.svg";
import alertIcon from "../assets/dashboard/card-alert.svg";
import globeIcon from "../assets/dashboard/card-globe.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import chevronLeftIcon from "../assets/dashboard/chevron-left-13.svg";

const KPI_ICONS: Record<string, string> = { transcriptions: sparklesIcon, wer: alertIcon, bleu: globeIcon, speakers: usersIcon };

// Matches the overview's model filter default until the API returns the serving model
const SERVING_MODEL = "A-Chronos v0.7";

function WerCard({ weeks }: { weeks: number[] }) {
  const step = 12;
  const max = Math.max(step * 2, Math.ceil(Math.max(...weeks) / step) * step);
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  return (
    <Card className="flex flex-col px-[17px] pb-[17px] pt-[13px]">
      <CardHeader
        icon={clockIcon}
        title="Word error rate · last 10 weeks"
        tip={{ title: "Word error rate", body: "Share of words transcribed wrongly each week, checked against Keeper-verified recordings. Lower is better." }}
      />
      <div className="mt-6 h-[260px] min-h-0 flex-1">
        <LineChart
          series={[{ name: "WER", color: "#3310be", values: weeks, area: true }]}
          labels={weeks.map((_, i) => `W${i + 1}`)}
          max={max}
          ticks={ticks}
          formatTick={(v) => `${v}%`}
          formatValue={(v) => `${v.toFixed(1)}%`}
          ariaLabel="Word error rate by week"
        />
      </div>
    </Card>
  );
}

function DialectsCard({ data }: { data: Language["dialects"] }) {
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={globeIcon} title="Dialects" tip={{ title: "Dialects", body: "Share of transcriptions in each dialect, and how accurate Lens AI is for each." }} />
      </div>
      <div className="mt-4">
        <DataTable
          minWidth={300}
          head={
            <>
              <th scope="col" className="text-left">Dialect</th>
              <th scope="col" className="px-2 text-right">Share</th>
              <th scope="col" className="text-right">WER</th>
            </>
          }
        >
          {data.map((d) => (
            <tr key={d.name}>
              <th scope="row" className="h-[42px] text-left font-normal">{d.name}</th>
              <td className="px-2 text-right">{d.sharePct}%</td>
              <td className="text-right">{d.wer.toFixed(1)}%</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </Card>
  );
}

function LanguageSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-6 h-[240px] w-full" />
        </Card>
        <Card className="space-y-4 p-[17px]">
          <Skeleton className="h-3 w-1/3" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}

type LoadResult = { code: string; language?: Language | null; failed?: boolean };

export function LensLanguage() {
  const { code = "" } = useParams();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getLensLanguage(code)
      .then((language) => !cancelled && setResult({ code, language }))
      .catch(() => !cancelled && setResult({ code, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [code, attempt]);

  const loading = result?.code !== code;
  const language = loading ? undefined : result?.language;
  const model = language?.provider === "elevenlabs" ? "ElevenLabs (fallback)" : SERVING_MODEL;
  usePageTitle(language ? language.name : "Language");
  usePageSubtitle(
    language ? `${language.liveSince ? `Live since ${language.liveSince}` : "In development"} · ${model}` : loading ? "Loading…" : null,
  );

  let body;
  if (loading) body = <LanguageSkeleton />;
  else if (result?.failed) body = <LoadError title="We couldn't load this language" onRetry={() => setAttempt((a) => a + 1)} />;
  else if (!language)
    body = (
      <Card className="flex flex-col items-center px-5 py-14 text-center">
        <div className="text-[17px] font-semibold text-[#1c1a18]">We couldn't find that language</div>
        <div className="mt-2 max-w-[358px] text-[13px] leading-[20px] text-[#6b7180]">Lens AI may not support it yet, or the link is wrong.</div>
      </Card>
    );
  else
    body = (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
          {language.kpis.map((k) => (
            <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <WerCard weeks={language.werWeeks} />
          <DialectsCard data={language.dialects} />
        </div>
      </div>
    );

  return (
    <>
      <Link to="/app/lens" className="-mt-3 mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#6b7180] hover:text-[#1c1a18] sm:-mt-4">
        <img src={chevronLeftIcon} alt="" width={13} height={13} />
        Back to Lens AI
      </Link>
      {body}
    </>
  );
}
