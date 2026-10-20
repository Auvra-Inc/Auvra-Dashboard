// Shapes of the Business Intelligence responses. Values are placeholders until
// GET /api/v1/business/overview and GET /api/v1/business/vault exist; the backend applies the filters.

export const REGIONS = ["Nigeria", "Ghana", "Kenya", "United Kingdom", "United States"] as const;
export type Region = (typeof REGIONS)[number];
export type RegionFilter = Region | "all";
export type RangeMonths = 3 | 6 | 12;
export type BiFilters = { region: RegionFilter; months: RangeMonths };

export type Kpi = {
  key: string;
  label: string;
  value: number;
  // seconds: 1.42s · compact: 38.4K · decimal: 35.1
  format: "usd" | "usd2" | "pct" | "count" | "seconds" | "compact" | "decimal";
  // Omitted for counts with no trend (e.g. Waiting for review)
  change?: number;
  // "s" for latency changes, "" for plain scores (BLEU)
  changeUnit: "%" | "pts" | "s" | "";
  // False for metrics where a drop is good (churn, CAC)
  upIsGood: boolean;
  tip: string;
  // Replaces "vs previous 30 days", e.g. "Oldest: 9 days"
  note?: string;
};

export type BiOverview = {
  kpis: Kpi[];
  revenue: { total: number; projectedTotal: number; months: { label: string; actual: number; projected: number }[] };
  sources: { key: "vault" | "community" | "collectibleFees"; name: string; amount: number }[];
  providers: { name: string; coverage: string; volume: number }[];
  regions: { region: Region; revenue: number; users: number; arpu: number }[];
  payouts: { paidOut: number; pending: number; failed: number; months: { label: string; amount: number }[] };
};

export type PlanChangeKind = "upgrade" | "new" | "downgrade" | "cancelled";

export type SubscriptionKind = "vault" | "community";

export type SubscriptionPlan = { key: string; name: string; price: number; subscribers: number; churnPct: number };

// Shared by My Vault and Community subscriptions; mrrByPlan values are keyed by plan key
export type SubscriptionOverview = {
  shareOfRevenuePct: number;
  kpis: Kpi[];
  mrrByPlan: { label: string; values: Record<string, number> }[];
  changes: { id: string; name: string; detail: string; kind: PlanChangeKind }[];
  plans: SubscriptionPlan[];
};

export type ClaimFeeStatus = "held" | "released";

export type CollectibleFeesOverview = {
  shareOfRevenuePct: number;
  feeRatePct: number;
  kpis: Kpi[];
  months: { label: string; fees: number }[];
  // badgeId links to the Cultural Intelligence badge record when one exists
  topBadges: { id: string; badgeId?: string; title: string; creator: string; claims: number; price: number }[];
  recentClaims: { id: string; collector: string; badge: string; fee: number; status: ClaimFeeStatus; when: string }[];
};

/* ---------- Mock data ---------- */

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
// Sums to 182,440 over 12 months
const ACTUAL = [10_200, 11_100, 11_800, 12_900, 14_100, 15_000, 15_800, 16_400, 17_200, 18_300, 19_200, 20_440];
const PROJECTED_TOTAL = 194_000;
// Sums to 24,180
const PAYOUTS = [1100, 1250, 1400, 1550, 1700, 1850, 2000, 2150, 2350, 2650, 2900, 3280];

const SOURCE_SHARES = [
  { key: "vault", name: "My Vault subscriptions", share: 0.58 },
  { key: "community", name: "Community subscriptions", share: 0.27 },
  { key: "collectibleFees", name: "Collectible Badge fees", share: 0.15 },
] as const;

const PROVIDERS = [
  { name: "Paystack", coverage: "Nigeria", regions: ["Nigeria"], volume: 412_000 },
  { name: "Breet", coverage: "Nigeria, Ghana", regions: ["Nigeria", "Ghana"], volume: 268_000 },
  { name: "Fonbnk", coverage: "rest of Africa", regions: ["Kenya"], volume: 97_000 },
];

const REGION_ROWS: BiOverview["regions"] = [
  { region: "Nigeria", revenue: 96_400, users: 27_940, arpu: 3.45 },
  { region: "Ghana", revenue: 28_100, users: 6_120, arpu: 4.59 },
  { region: "Kenya", revenue: 18_700, users: 4_830, arpu: 3.87 },
  { region: "United Kingdom", revenue: 15_900, users: 2_310, arpu: 6.88 },
  { region: "United States", revenue: 13_200, users: 1_940, arpu: 6.8 },
];

const BI_KPIS: Kpi[] = [
  { key: "mrr", label: "MRR", value: 21_860, format: "usd", change: 6.4, changeUnit: "%", upIsGood: true, tip: "Monthly recurring revenue from My Vault and Community subscriptions." },
  { key: "arpu", label: "ARPU", value: 3.78, format: "usd2", change: 1.2, changeUnit: "%", upIsGood: true, tip: "Average revenue per paying user over the last 30 days." },
  { key: "cac", label: "CAC", value: 4.1, format: "usd2", change: -8.0, changeUnit: "%", upIsGood: false, tip: "Average marketing spend to win one new paying user. Lower is better." },
  { key: "ltv", label: "LTV", value: 46.2, format: "usd2", change: 4.5, changeUnit: "%", upIsGood: true, tip: "Expected revenue from a paying user over their whole time on Auvra." },
  { key: "churn", label: "Churn", value: 3.1, format: "pct", change: -0.4, changeUnit: "pts", upIsGood: false, tip: "Share of paying users who cancelled in the last 30 days. Lower is better." },
  { key: "freeToPaid", label: "Free to paid", value: 6.8, format: "pct", change: 0.9, changeUnit: "pts", upIsGood: true, tip: "Share of free users who started a paid plan in the last 30 days." },
];

const VAULT_PLANS: SubscriptionPlan[] = [
  { key: "basic", name: "Vault Basic", price: 1.99, subscribers: 6_210, churnPct: 2.9 },
  { key: "family", name: "Vault Family", price: 4.99, subscribers: 2_140, churnPct: 2.4 },
  { key: "legacy", name: "Vault Legacy", price: 9.99, subscribers: 590, churnPct: 1.8 },
];

// Communities pay per community, not per member
const COMMUNITY_PLANS: SubscriptionPlan[] = [
  { key: "community", name: "Community", price: 9.99, subscribers: 410, churnPct: 3.4 },
  { key: "steward", name: "Community Steward", price: 24.99, subscribers: 168, churnPct: 1.6 },
];

const planMrr = (p: SubscriptionPlan) => Math.round(p.price * p.subscribers);

// Ramps each plan up to today's MRR, so October matches the Plans table
const ramp = (from: number, to: number) => MONTHS.map((_, i) => Math.round(from + ((to - from) * i) / (MONTHS.length - 1)));

const mrrByPlan = (plans: SubscriptionPlan[], startMrr: number[]) => {
  const series = plans.map((p, k) => ramp(startMrr[k], planMrr(p)));
  return MONTHS.map((label, i) => ({ label, values: Object.fromEntries(plans.map((p, k) => [p.key, series[k][i]])) }));
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBusinessIntelligence({ region, months }: BiFilters): Promise<BiOverview> {
  // return api.business.overview({ region, months });
  await delay(700);

  const from = MONTHS.length - months;
  const actual = ACTUAL.slice(from);
  const total = ACTUAL.reduce((a, b) => a + b, 0);
  const regionTotal = REGION_ROWS.reduce((a, r) => a + r.revenue, 0);
  const regionRow = REGION_ROWS.find((r) => r.region === region);
  // Share of revenue kept by the selected period and region
  const regionFactor = regionRow ? regionRow.revenue / regionTotal : 1;
  const periodFactor = actual.reduce((a, b) => a + b, 0) / total;
  const factor = regionFactor * periodFactor;

  const revenueMonths = MONTHS.slice(from).map((label, i) => {
    const a = Math.round(actual[i] * regionFactor);
    return { label, actual: a, projected: Math.round((a * PROJECTED_TOTAL) / total) };
  });
  const payoutMonths = MONTHS.slice(from).map((label, i) => ({ label, amount: Math.round(PAYOUTS[from + i] * regionFactor) }));

  const revenueTotal = revenueMonths.reduce((a, m) => a + m.actual, 0);

  return {
    kpis: BI_KPIS.map((k) => {
      if (!regionRow) return k;
      if (k.key === "mrr") return { ...k, value: Math.round(k.value * regionFactor) };
      if (k.key === "arpu") return { ...k, value: regionRow.arpu };
      return k;
    }),
    revenue: {
      total: revenueTotal,
      // From the unrounded forecast so the full year reads exactly $194,000
      projectedTotal: Math.round((revenueTotal * PROJECTED_TOTAL) / total),
      months: revenueMonths,
    },
    sources: SOURCE_SHARES.map((s) => ({ key: s.key, name: s.name, amount: Math.round(total * s.share * factor) })),
    providers: PROVIDERS.filter((p) => region === "all" || p.regions.includes(region)).map((p) => ({
      name: p.name,
      coverage: p.coverage,
      volume: Math.round(p.volume * periodFactor * (region === "all" ? 1 : 1 / p.regions.length)),
    })),
    regions: REGION_ROWS.filter((r) => region === "all" || r.region === region).map((r) => ({ ...r, revenue: Math.round(r.revenue * periodFactor) })),
    payouts: {
      paidOut: payoutMonths.reduce((a, m) => a + m.amount, 0),
      pending: Math.round(3_420 * regionFactor),
      failed: Math.round(612 * regionFactor),
      months: payoutMonths,
    },
  };
}

export async function getVaultOverview(): Promise<SubscriptionOverview> {
  // return api.business.vault();
  await delay(600);
  const mrr = VAULT_PLANS.reduce((a, p) => a + planMrr(p), 0);
  return {
    shareOfRevenuePct: Math.round(SOURCE_SHARES[0].share * 100),
    kpis: [
      { key: "subscribers", label: "Vault subscribers", value: VAULT_PLANS.reduce((a, p) => a + p.subscribers, 0), format: "count", change: 9.6, changeUnit: "%", upIsGood: true, tip: "People on any paid My Vault plan today." },
      { key: "mrr", label: "Vault MRR", value: mrr, format: "usd", change: 7.2, changeUnit: "%", upIsGood: true, tip: "Monthly recurring revenue across all My Vault plans." },
      { key: "churn", label: "Vault churn", value: 2.8, format: "pct", change: -0.3, changeUnit: "pts", upIsGood: false, tip: "Share of Vault subscribers who cancelled in the last 30 days. Lower is better." },
      { key: "trial", label: "Trial to paid", value: 41, format: "pct", change: 3, changeUnit: "pts", upIsGood: true, tip: "Share of free trials that became a paid plan in the last 30 days." },
    ],
    mrrByPlan: mrrByPlan(VAULT_PLANS, [7_100, 4_900, 2_400]),
    changes: [
      { id: "c1", name: "Njeri Wanjiku", detail: "Basic → Family", kind: "upgrade" },
      { id: "c2", name: "Obi Kalu", detail: "Started Basic", kind: "new" },
      { id: "c3", name: "Fatou Bah", detail: "Family → Basic", kind: "downgrade" },
      { id: "c4", name: "Sade Daramola", detail: "Cancelled Basic", kind: "cancelled" },
    ],
    plans: VAULT_PLANS,
  };
}

export async function getCommunitySubscriptions(): Promise<SubscriptionOverview> {
  // return api.business.communitySubscriptions();
  await delay(600);
  const mrr = COMMUNITY_PLANS.reduce((a, p) => a + planMrr(p), 0);
  return {
    shareOfRevenuePct: Math.round(SOURCE_SHARES[1].share * 100),
    kpis: [
      { key: "subscribers", label: "Paying communities", value: COMMUNITY_PLANS.reduce((a, p) => a + p.subscribers, 0), format: "count", change: 8.1, changeUnit: "%", upIsGood: true, tip: "Communities on a paid Community or Community Steward plan today." },
      { key: "mrr", label: "Community MRR", value: mrr, format: "usd", change: 10.4, changeUnit: "%", upIsGood: true, tip: "Monthly recurring revenue across all Community plans." },
      { key: "churn", label: "Community churn", value: 2.9, format: "pct", change: -0.2, changeUnit: "pts", upIsGood: false, tip: "Share of paying communities that cancelled in the last 30 days. Lower is better." },
      { key: "trial", label: "Upgrades to Steward", value: 12, format: "pct", change: 1.5, changeUnit: "pts", upIsGood: true, tip: "Share of Community plan communities that moved up to Community Steward in the last 90 days." },
    ],
    mrrByPlan: mrrByPlan(COMMUNITY_PLANS, [2_900, 2_600]),
    changes: [
      { id: "c1", name: "Lagos Heritage Circle", detail: "Community → Community Steward", kind: "upgrade" },
      { id: "c2", name: "Nairobi Oral History Circle", detail: "Started Community", kind: "new" },
      { id: "c3", name: "Igbo-Ukwu Archive", detail: "Community Steward → Community", kind: "downgrade" },
      { id: "c4", name: "Benue Weavers Collective", detail: "Cancelled Community", kind: "cancelled" },
    ],
    plans: COMMUNITY_PLANS,
  };
}

// Auvra keeps this share of every Collectible Badge claim; the rest goes to the creator
const FEE_RATE = 0.15;

export async function getCollectibleFees(): Promise<CollectibleFeesOverview> {
  // return api.business.collectibleFees();
  await delay(600);
  const share = SOURCE_SHARES[2].share;
  const months = MONTHS.map((label, i) => ({ label, fees: Math.round(ACTUAL[i] * share) }));
  const fees = months.reduce((a, m) => a + m.fees, 0);
  const claims = 1_124;
  return {
    shareOfRevenuePct: Math.round(share * 100),
    feeRatePct: FEE_RATE * 100,
    kpis: [
      { key: "fees", label: "Fee revenue", value: fees, format: "usd", change: 12.4, changeUnit: "%", upIsGood: true, note: "Last 12 months", tip: `Auvra's ${FEE_RATE * 100}% fee on every Collectible Badge claim.` },
      { key: "claims", label: "Claims", value: claims, format: "count", change: 9.8, changeUnit: "%", upIsGood: true, tip: "Editions of Collectible Badges claimed by collectors." },
      { key: "avgFee", label: "Average fee per claim", value: Math.round((fees / claims) * 100) / 100, format: "usd2", change: 2.3, changeUnit: "%", upIsGood: true, tip: "Fee revenue divided by claims." },
      {
        key: "creators", label: "Paid to creators", value: Math.round((fees / FEE_RATE) * (1 - FEE_RATE)), format: "usd", change: 12.1, changeUnit: "%", upIsGood: true, note: "Last 12 months",
        tip: `The ${100 - FEE_RATE * 100}% of each claim that goes to the badge's creator.`,
      },
    ],
    months,
    topBadges: [
      { id: "t1", badgeId: "kente-weave-no-4", title: "Kente Weave No. 4", creator: "Kwabena Asare", claims: 13, price: 240 },
      { id: "t2", badgeId: "lamu-door-studies", title: "Lamu Door Studies", creator: "Zawadi Mwangi", claims: 19, price: 95 },
      { id: "t3", title: "Benin Bronze Study", creator: "Osaro Igbinedion", claims: 11, price: 150 },
      { id: "t4", title: "Adire Indigo Prints", creator: "Funke Adebayo", claims: 16, price: 85 },
      { id: "t5", badgeId: "golden-hour-sisters", title: "Golden Hour Sisters", creator: "Ada Okafor", claims: 7, price: 180 },
    ],
    recentClaims: [
      { id: "r1", collector: "Tolu Adeyemi", badge: "Golden Hour Sisters", fee: 27, status: "held", when: "Today" },
      { id: "r2", collector: "Efua Sackey", badge: "Kente Weave No. 4", fee: 36, status: "held", when: "Yesterday" },
      { id: "r3", collector: "Amaka Nwosu", badge: "Golden Hour Sisters", fee: 27, status: "released", when: "2 Oct" },
      { id: "r4", collector: "Hassan Ali", badge: "Lamu Door Studies", fee: 14.25, status: "released", when: "30 Sep" },
    ],
  };
}
