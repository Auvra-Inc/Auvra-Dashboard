// Shapes of the Lens AI responses. Values are placeholders until
// GET /api/v1/lens/overview, /lens/languages/:code and POST /lens/routing exist; the backend applies the filters.
import type { Kpi } from "./businessIntelligence";

export type LensModel = "a-chronos-0.7" | "a-chronos-0.6";
export type LensDays = 1 | 7 | 30;
export type LatencyRange = "24h" | "7d" | "30d";
export type LensFilters = { model: LensModel; days: LensDays };
// Who serves a language's transcriptions
export type Provider = "a-chronos" | "elevenlabs";

export const MODELS: { value: LensModel; label: string }[] = [
  { value: "a-chronos-0.7", label: "A-Chronos v0.7" },
  { value: "a-chronos-0.6", label: "A-Chronos v0.6" },
];

export type LatencySeries = { labels: string[]; avg: number[]; p95: number[]; p99: number[] };

export type LensLanguageRow = {
  code: string;
  name: string;
  status: "live" | "development";
  provider: Provider;
  wer: number;
  bleu: number;
  transcriptions: number;
};

export type LensIncident = {
  errorRatePct: number;
  alertPct: number;
  minutes: number;
  language: { code: string; name: string };
};

export type LensOverview = {
  kpis: Kpi[];
  latency: Record<LatencyRange, LatencySeries>;
  training: { run: number; description: string; epoch: number; epochs: number; wer: number; bleu: number; fallbackPct: number; nextCheckpoint: string };
  languages: LensLanguageRow[];
  pairs: { name: string; count: number }[];
  // Live error rate above the alert level; null when healthy
  incident: LensIncident | null;
};

export type LensLanguage = {
  code: string;
  name: string;
  status: "live" | "development";
  provider: Provider;
  liveSince: string | null;
  kpis: Kpi[];
  werWeeks: number[];
  dialects: { name: string; sharePct: number; wer: number }[];
};

/* ---------- Mock data ---------- */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Stable wobble so mock charts look organic but never change between renders
const wobble = (i: number, seed: number) => Math.sin(i * 12.9898 + seed * 78.233) * 0.5;

const DAY_SHARE: Record<LensDays, number> = { 1: 0.15, 7: 1, 30: 4.1 };

type LanguageSpec = Omit<LensLanguageRow, "provider"> & {
  liveSince: string | null;
  speakers: number;
  transcriptionChange: number;
  werChange: number;
  bleuChange: number;
  speakerChange: number;
  dialects: { name: string; sharePct: number; wer: number }[];
};

const LANGUAGES: LanguageSpec[] = [
  {
    code: "yoruba", name: "Yoruba", status: "live", wer: 14.2, bleu: 35.1, transcriptions: 41_280, liveSince: "March 2026",
    speakers: 1208, transcriptionChange: 12, werChange: -1.1, bleuChange: 0.8, speakerChange: 9,
    dialects: [
      { name: "Ọ̀yọ́", sharePct: 46, wer: 12.8 },
      { name: "Ẹ̀gbá", sharePct: 21, wer: 14.9 },
      { name: "Ìjẹ̀ṣà", sharePct: 14, wer: 16.1 },
      { name: "Èkìtì", sharePct: 11, wer: 17.4 },
      { name: "Other", sharePct: 8, wer: 19.0 },
    ],
  },
  {
    code: "igbo", name: "Igbo", status: "live", wer: 16.8, bleu: 33.0, transcriptions: 29_640, liveSince: "April 2026",
    speakers: 1034, transcriptionChange: 9, werChange: -0.8, bleuChange: 0.6, speakerChange: 7,
    dialects: [
      { name: "Owerri", sharePct: 38, wer: 15.1 },
      { name: "Onitsha", sharePct: 27, wer: 16.4 },
      { name: "Nsukka", sharePct: 19, wer: 18.2 },
      { name: "Other", sharePct: 16, wer: 19.6 },
    ],
  },
  {
    code: "hausa", name: "Hausa", status: "live", wer: 17.5, bleu: 30.4, transcriptions: 22_910, liveSince: "May 2026",
    speakers: 612, transcriptionChange: 6, werChange: -0.4, bleuChange: 0.3, speakerChange: 4,
    dialects: [
      { name: "Kano", sharePct: 49, wer: 16.2 },
      { name: "Sokoto", sharePct: 22, wer: 18.3 },
      { name: "Zaria", sharePct: 17, wer: 18.9 },
      { name: "Other", sharePct: 12, wer: 20.4 },
    ],
  },
  {
    code: "swahili", name: "Swahili", status: "live", wer: 12.9, bleu: 36.8, transcriptions: 19_870, liveSince: "June 2026",
    speakers: 588, transcriptionChange: 15, werChange: -1.4, bleuChange: 1.1, speakerChange: 11,
    dialects: [
      { name: "Kiunguja", sharePct: 44, wer: 11.6 },
      { name: "Kimvita", sharePct: 31, wer: 13.2 },
      { name: "Kiamu", sharePct: 13, wer: 14.8 },
      { name: "Other", sharePct: 12, wer: 15.9 },
    ],
  },
  {
    code: "ewe", name: "Ewe", status: "development", wer: 27.3, bleu: 21.6, transcriptions: 2_140, liveSince: null,
    speakers: 96, transcriptionChange: 31, werChange: -3.2, bleuChange: 2.4, speakerChange: 18,
    dialects: [
      { name: "Anlo", sharePct: 52, wer: 25.9 },
      { name: "Tongu", sharePct: 30, wer: 28.1 },
      { name: "Other", sharePct: 18, wer: 30.2 },
    ],
  },
  {
    code: "fula", name: "Fula", status: "development", wer: 31.0, bleu: 18.9, transcriptions: 980, liveSince: null,
    speakers: 41, transcriptionChange: 44, werChange: -4.1, bleuChange: 2.9, speakerChange: 22,
    dialects: [
      { name: "Pulaar", sharePct: 47, wer: 29.4 },
      { name: "Fulfulde", sharePct: 39, wer: 31.8 },
      { name: "Other", sharePct: 14, wer: 34.0 },
    ],
  },
];

const PAIRS = [
  { name: "Yoruba → English", count: 22_410 },
  { name: "Igbo → English", count: 17_020 },
  { name: "Swahili → English", count: 14_330 },
  { name: "Hausa → French", count: 8_960 },
  { name: "Twi → English", count: 6_120 },
];

// Older model is slower and less accurate
const MODEL_PENALTY: Record<LensModel, number> = { "a-chronos-0.7": 1, "a-chronos-0.6": 1.14 };

const providers = new Map<string, Provider>();
const providerOf = (code: string): Provider => providers.get(code) ?? "a-chronos";

// Mock switch: open Lens AI with ?incident in the URL to see the error spike state
const simulatingIncident = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("incident");

function latencySeries(range: LatencyRange, penalty: number): LatencySeries {
  const now = new Date();
  let labels: string[];
  if (range === "24h") {
    labels = Array.from({ length: 24 }, (_, i) => `${String((now.getHours() + 1 + i) % 24).padStart(2, "0")}:00`);
  } else if (range === "7d") {
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  } else {
    labels = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 29 + i);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
  }
  const seed = range === "24h" ? 1 : range === "7d" ? 2 : 3;
  const round = (v: number) => Math.round(v * 100) / 100;
  // Wednesday's p99 spike in the 7-day view comes from the design
  const spike = (i: number) => (range === "7d" && i === 2 ? 0.65 : 0);
  return {
    labels,
    avg: labels.map((_, i) => round((0.36 + wobble(i, seed) * 0.03) * penalty)),
    p95: labels.map((_, i) => round((1.42 + wobble(i, seed + 1) * 0.12 + spike(i) * 0.15) * penalty)),
    p99: labels.map((_, i) => round((2.2 + wobble(i, seed + 2) * 0.2 + spike(i)) * penalty)),
  };
}

export async function getLensOverview({ model, days }: LensFilters): Promise<LensOverview> {
  // return api.lens.overview({ model, days });
  await delay(650);
  const p = MODEL_PENALTY[model];
  const share = DAY_SHARE[days];
  const scale = (v: number) => Math.round(v * share);
  const vs = days === 1 ? "vs previous 24 hours" : `vs previous ${days} days`;
  // Counted across the full language roadmap, not just the rows in the quality table
  const liveTotal = 46;
  const inDevelopment = 12;

  return {
    kpis: [
      { key: "transcriptions", label: "Transcriptions", value: scale(184_920), format: "count", change: 14, changeUnit: "%", upIsGood: true, note: vs, tip: "Speech turned into text by Lens AI across every language." },
      { key: "translations", label: "Translations", value: scale(92_310), format: "count", change: 11, changeUnit: "%", upIsGood: true, note: vs, tip: "Text translated between languages, e.g. Yoruba to English." },
      { key: "requests", label: "API requests / day", value: 38_400, format: "compact", change: 6, changeUnit: "%", upIsGood: true, note: vs, tip: "Average calls to the Lens AI API per day, from the Auvra apps and partners." },
      {
        key: "latency", label: "Latency p95", value: Math.round(1.42 * p * 100) / 100, format: "seconds", change: model === "a-chronos-0.7" ? -0.18 : 0.04, changeUnit: "s", upIsGood: false, note: vs,
        tip: "95% of requests finish faster than this. Lower is better.",
      },
      {
        key: "errors", label: "Error rate", value: Math.round(0.8 * p * 10) / 10, format: "pct", change: model === "a-chronos-0.7" ? -0.3 : 0.1, changeUnit: "pts", upIsGood: false, note: vs,
        tip: "Share of requests that failed or fell back to ElevenLabs. Lens AI alerts above 2%.",
      },
      { key: "languages", label: "Languages live", value: liveTotal, format: "count", changeUnit: "%", upIsGood: true, note: `${inDevelopment} in development`, tip: "Languages people can use in the Auvra apps today." },
    ],
    latency: { "24h": latencySeries("24h", p), "7d": latencySeries("7d", p), "30d": latencySeries("30d", p) },
    training: { run: 7, description: "speech model for 12 West African languages", epoch: 34, epochs: 50, wer: 18.4, bleu: 31.2, fallbackPct: 9, nextCheckpoint: "in 6 h" },
    languages: LANGUAGES.map((l) => ({
      code: l.code,
      name: l.name,
      status: l.status,
      provider: providerOf(l.code),
      wer: Math.round(l.wer * p * 10) / 10,
      bleu: Math.round((l.bleu / p) * 10) / 10,
      transcriptions: scale(l.transcriptions),
    })),
    pairs: PAIRS.map((pair) => ({ ...pair, count: scale(pair.count) })),
    incident:
      simulatingIncident() && providerOf("hausa") === "a-chronos"
        ? { errorRatePct: 4.6, alertPct: 2, minutes: 12, language: { code: "hausa", name: "Hausa" } }
        : null,
  };
}

export async function getLensLanguage(code: string): Promise<LensLanguage | null> {
  // return api.lens.language(code);
  await delay(500);
  const l = LANGUAGES.find((x) => x.code === code);
  if (!l) return null;
  const start = l.wer + 6;
  return {
    code: l.code,
    name: l.name,
    status: l.status,
    provider: providerOf(l.code),
    liveSince: l.liveSince,
    kpis: [
      { key: "transcriptions", label: "Transcriptions", value: l.transcriptions, format: "count", change: l.transcriptionChange, changeUnit: "%", upIsGood: true, tip: `Speech in ${l.name} turned into text.` },
      { key: "wer", label: "Word error rate", value: l.wer, format: "pct", change: l.werChange, changeUnit: "pts", upIsGood: false, tip: "Share of words transcribed wrongly, checked against Keeper-verified recordings. Lower is better." },
      { key: "bleu", label: "BLEU", value: l.bleu, format: "decimal", change: l.bleuChange, changeUnit: "", upIsGood: true, tip: "How close translations are to ones written by fluent speakers, from 0 to 100. Higher is better." },
      { key: "speakers", label: "Speakers sharing", value: l.speakers, format: "count", change: l.speakerChange, changeUnit: "%", upIsGood: true, tip: `People recording ${l.name} speech that trains Lens AI.` },
    ],
    // Ten weeks easing down to today's rate
    werWeeks: Array.from({ length: 10 }, (_, i) => Math.round((start - ((start - l.wer) * i) / 9 + (i > 0 && i < 9 ? wobble(i, l.wer) * 0.3 : 0)) * 10) / 10),
    dialects: l.dialects,
  };
}

export async function setProvider(code: string, provider: Provider) {
  // return api.lens.setRouting(code, { provider }); recorded in the audit log
  await delay(600);
  if (provider === "a-chronos") providers.delete(code);
  else providers.set(code, provider);
}
