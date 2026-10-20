// Shape of the Home overview response. Values are placeholders until GET /api/v1/dashboard/overview exists.
export type HomeOverview = {
  users: { total: number; growthPct: number; trend: number[]; signupsToday: number; topCountries: string[] };
  culture: { verificationRatePct: number; growthPct: number; trend: { label: string; x: number; value: number; marked?: boolean }[] };
  safety: { openReports: number };
  revenue: {
    total: number;
    growthPct: number;
    gainedThisYear: number;
    from: string;
    to: string;
    months: { label: string; vault: number; community: number; collectibleFees: number; growth: string }[];
  };
  transactions: { id: string; name: string; description: string; amount: number; avatarColor: string }[];
  snapshot: {
    payoutsSent: number;
    payoutBudget: number;
    tiles: { key: "ownership" | "lens" | "notifications"; title: string; caption: string; valuePct: number }[];
  };
};

const MOCK: HomeOverview = {
  users: { total: 48_210, growthPct: 8.2, trend: [18, 21, 33, 30, 47], signupsToday: 214, topCountries: ["Nigeria", "Ghana"] },
  culture: {
    verificationRatePct: 77,
    growthPct: 12.6,
    trend: [
      { label: "Jul", x: 0.214, value: 52 },
      { label: "Aug", x: 0.5, value: 70 },
      { label: "Sep", x: 0.643, value: 67, marked: true },
      { label: "Oct", x: 0.929, value: 77, marked: true },
    ],
  },
  safety: { openReports: 12 },
  revenue: {
    total: 182_440,
    growthPct: 12.6,
    gainedThisYear: 20_410,
    from: "2026-01-01",
    to: "2026-10-19",
    months: [
      { label: "Jan", vault: 3000, community: 3400, collectibleFees: 4200, growth: "+1.4%" },
      { label: "Feb", vault: 4600, community: 4200, collectibleFees: 5300, growth: "+6.2%" },
      { label: "Mar", vault: 5400, community: 3800, collectibleFees: 7000, growth: "+6.9%" },
      { label: "Apr", vault: 7200, community: 5300, collectibleFees: 8400, growth: "+12.1%" },
      { label: "May", vault: 6400, community: 5800, collectibleFees: 6800, growth: "+7.2%" },
      { label: "Jun", vault: 5800, community: 5300, collectibleFees: 7000, growth: "+6.1%" },
      { label: "Jul", vault: 5100, community: 5300, collectibleFees: 5300, growth: "+4.4%" },
      { label: "Aug", vault: 6400, community: 5300, collectibleFees: 7000, growth: "+8.0%" },
      { label: "Sep", vault: 7200, community: 5800, collectibleFees: 7000, growth: "+9.5%" },
      { label: "Oct", vault: 8100, community: 5800, collectibleFees: 8400, growth: "+11.2%" },
    ],
  },
  transactions: [
    { id: "t1", name: "Tolu Adeyemi", description: "Claimed Golden Hour Sisters", amount: 215, avatarColor: "#8e2b2b" },
    { id: "t2", name: "Njeri Wanjiku", description: "Vault Basic subscription", amount: 1.99, avatarColor: "#2f4a44" },
    { id: "t3", name: "Ada Okafor", description: "Payout to GTBank", amount: -300, avatarColor: "#5b4a3a" },
    { id: "t4", name: "Kwame Mensah", description: "Deposit via Breet", amount: 120, avatarColor: "#3e3a36" },
  ],
  snapshot: {
    payoutsSent: 24_200,
    payoutBudget: 40_000,
    tiles: [
      { key: "ownership", title: "Ownership", caption: "Badges verified", valuePct: 77 },
      { key: "lens", title: "Lens AI", caption: "Transcription accuracy", valuePct: 82 },
      { key: "notifications", title: "Notifications", caption: "Opened this month", valuePct: 31 },
    ],
  },
};

export async function getHomeOverview(): Promise<HomeOverview> {
  // return api.dashboard.overview();
  await new Promise((resolve) => setTimeout(resolve, 900));
  return MOCK;
}
