// Shapes of the Transactions responses. Values are placeholders until GET /api/v1/transactions, /transactions/:id,
// GET /payouts and POST /payouts/:id/retry exist; the backend applies the filters and pages the history.
import type { Kpi } from "./businessIntelligence";
import { badgeSummary, findBadgeByTitle } from "./culturalIntelligence";
import { findTxActivity, findUserRow } from "./users";
import { decideKyc, getKycCheck, needsAction } from "./trustAndSafety";

export type TxType = "claim" | "subscription" | "payout" | "deposit";
export type TxStatus = "held" | "paid" | "pending" | "failed" | "refunded" | "disputed";
export type Provider = "Paystack" | "RevenueCat" | "Breet" | "Fonbnk";

export const TX_TABS: { value: TxType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "claim", label: "Claims" },
  { value: "subscription", label: "Subscriptions" },
  { value: "payout", label: "Payouts" },
  { value: "deposit", label: "Deposits" },
];

export const TX_STATUS_LABELS: Record<TxStatus, string> = { held: "Held", paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded", disputed: "Disputed" };
export const PROVIDERS: Provider[] = ["Paystack", "RevenueCat", "Breet", "Fonbnk"];

export type FailReason = "name_mismatch" | "bank_offline";
export const FAIL_TEXT: Record<FailReason, { short: string; long: (name: string) => string }> = {
  name_mismatch: { short: "name mismatch", long: (name) => `The account name doesn't match “${name}”` },
  bank_offline: { short: "bank offline", long: () => "The bank didn't respond; nothing left the balance" },
};

export type Person = { name: string; userId?: string };

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  provider: Provider;
  providerRef: string;
  status: TxStatus;
  date: string;
  // People column: who paid or was paid, and the line under the name
  person: Person & { sub: string };
  // Claims
  badgeId?: string;
  badgeTitle?: string;
  edition?: string;
  collector?: Person;
  creator?: Person;
  price?: number;
  shipping?: number;
  // When the collector is expected to confirm a held claim
  expected?: string;
  // Subscriptions
  plan?: string;
  store?: string;
  renews?: string;
  // Payouts
  payoutId?: string;
  bank?: string;
  failReason?: FailReason;
  // Short note on a payout waiting on someone, e.g. "Waiting on Ada" or "On hold · fraud review"
  note?: string;
  // Deposits
  from?: string;
  to?: string;
  rate?: string;
  // Extra lines for the audit trail, newest first
  log?: { text: string; by: string; when: string }[];
};

export const FEE_RATE = 0.05;
export const auvraFee = (t: Transaction) => Math.round((t.price ?? 0) * FEE_RATE * 100) / 100;

const label = (t: Transaction) => {
  if (t.type === "claim") return `Claim · ${t.badgeTitle}`;
  if (t.type === "subscription") return t.plan ?? "Subscription";
  return t.type === "payout" ? "Payout" : "Deposit";
};
export const txLabel = label;

/* ---------- Mock data ---------- */

const short = (name: string) => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};
const user = (name: string): Person => ({ name, userId: findUserRow(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))?.id });

function claim(
  id: string,
  collector: string,
  badgeId: string,
  edition: string,
  shipping: number,
  status: TxStatus,
  date: string,
  provider: Provider,
  ref: string,
  extra: Partial<Transaction> = {},
): Transaction {
  const b = badgeSummary(badgeId);
  const title = b?.title ?? extra.badgeTitle ?? "";
  const creator = b?.creator ?? extra.creator?.name ?? "";
  const price = extra.price ?? b?.price ?? 0;
  return {
    id, type: "claim", amount: price + shipping, provider, providerRef: ref, status, date,
    person: { ...user(collector), name: short(collector), sub: `to ${creator}` },
    badgeId: b ? badgeId : undefined, badgeTitle: title, edition: `${edition.replace("#", "")} of ${b?.editions ?? "—"}`,
    collector: user(collector), creator: user(creator), price, shipping, ...extra,
  };
}

function payout(id: string, payoutId: string, creator: string, amount: number, bank: string, provider: Provider, status: TxStatus, date: string, extra: Partial<Transaction> = {}): Transaction {
  return { id, type: "payout", amount, provider, providerRef: `${provider === "Breet" ? "BRT" : "PSK"}_${id.slice(3)}`, status, date, person: { ...user(creator), sub: bank }, payoutId, bank, creator: user(creator), ...extra };
}

function subscription(id: string, name: string, plan: string, amount: number, store: string, date: string, renews: string, display?: string): Transaction {
  return { id, type: "subscription", amount, provider: "RevenueCat", providerRef: `RC_${id.slice(3)}`, status: "paid", date, person: { ...user(name), name: display ?? short(name), sub: store }, plan, store, renews };
}

let transactions: Transaction[] = [
  claim("TX-20419", "Tolu Adeyemi", "golden-hour-sisters", "3", 35, "held", "Today 10:34", "Paystack", "PSK_8812", { expected: "21 Oct" }),
  subscription("TX-20418", "Njeri Wanjiku", "Vault Basic subscription", 1.99, "App Store", "Today 10:12", "21 Nov"),
  payout("TX-20417", "PO-3312", "Ada Okafor", 300, "GTBank ••4417", "Paystack", "failed", "Today 08:02", { failReason: "name_mismatch" }),
  {
    id: "TX-20416", type: "deposit", amount: 120, provider: "Breet", providerRef: "BRT_20416", status: "paid", date: "Yesterday",
    person: { ...user("Kwame Mensah"), name: "Kwame M.", sub: "USDT → GHS" }, from: "120 USDT", to: "GHS 1,812.00", rate: "1 USDT = GHS 15.10",
  },
  claim("TX-20415", "Fatou Bah", "", "1", 35, "refunded", "Yesterday", "Fonbnk", "FNB_20415", {
    badgeTitle: "Bronze Memory", creator: user("Kemi Adebayo"), price: 180, edition: "1 of 12",
    log: [{ text: "Refunded: the parcel was lost in transit", by: "Joshua U.", when: "Yesterday" }],
  }),
  subscription("TX-20414", "Lagos Heritage Circle", "Community Steward plan", 2.99, "Google Play", "2 days ago", "19 Nov", "Lagos Heritage"),
  payout("TX-20413", "PO-3311", "Kemi Adebayo", 420, "Access ••0921", "Paystack", "pending", "Today 07:40"),
  payout("TX-20412", "PO-3310", "Kwame Mensah", 180, "MTN MoMo ••5520", "Breet", "paid", "Yesterday"),
  claim("TX-20411", "Amina Said", "golden-hour-sisters", "#9", 0, "held", "Today 09:11", "Paystack", "PSK_8807"),
  payout("TX-20410", "PO-3309", "Lagos Heritage Circle", 1140, "Zenith ••7702", "Paystack", "paid", "Yesterday"),
  claim("TX-20409", "Amina Said", "golden-hour-sisters", "#8", 0, "held", "Today 09:09", "Paystack", "PSK_8806"),
  payout("TX-20408", "PO-3308", "Igbo-Ukwu Archive", 96, "UBA ••1843", "Paystack", "failed", "2 days ago", { failReason: "bank_offline" }),
  subscription("TX-20407", "Obi Kalu", "Vault Family subscription", 4.99, "App Store", "2 days ago", "18 Nov"),
  {
    id: "TX-20406", type: "deposit", amount: 25, provider: "Fonbnk", providerRef: "FNB_20406", status: "paid", date: "2 days ago",
    person: { ...user("Fatou Bah"), name: "Fatou B.", sub: "Airtime → USD" }, from: "XOF 15,000 airtime", to: "$25.00", rate: "1 USD = XOF 600",
  },
  claim("TX-20405", "Amina Said", "lamu-door-studies", "#21", 0, "held", "Today 09:06", "Paystack", "PSK_8804"),
  claim("TX-20404", "Amina Said", "lamu-door-studies", "#20", 0, "held", "Today 09:05", "Paystack", "PSK_8803"),
  subscription("TX-20403", "Swahili Coast Keepers", "Community plan", 2.99, "Google Play", "3 days ago", "17 Nov", "Swahili Coast"),
  claim("TX-20402", "Amina Said", "kente-weave-no-4", "#15", 25, "held", "Today 09:03", "Paystack", "PSK_8802"),
  claim("TX-20401", "Amina Said", "kente-weave-no-4", "#14", 25, "held", "Today 09:02", "Paystack", "PSK_8801"),
  claim("TX-20390", "Ruth Grant", "lamu-door-studies", "#18", 0, "disputed", "4 days ago", "Paystack", "PSK_8760", {
    log: [{ text: "Dispute opened: “The prints don't match the preview”", by: "Ruth Grant", when: "3 days ago" }],
  }),
  payout("TX-20377", "PO-3305", "Chinwe Okeke", 420, "Access Bank ••9031", "Paystack", "pending", "Today 08:14", { note: "On hold · fraud review" }),
  claim("TX-20288", "Efua Sackey", "kente-weave-no-4", "#13", 50, "held", "Yesterday", "Paystack", "PSK_8590", { expected: "24 Oct" }),
  payout("TX-19310", "PO-3101", "Ada Okafor", 300, "GTBank ••4417", "Paystack", "paid", "10 Oct"),
  claim("TX-19077", "Amaka Nwosu", "golden-hour-sisters", "#2", 35, "paid", "2 Oct", "Paystack", "PSK_7702"),
  claim("TX-18213", "Kofi Mensah", "golden-hour-sisters", "#1", 35, "paid", "22 Sep", "Paystack", "PSK_6815"),
];

const heldTotal = () => transactions.filter((t) => t.status === "held").reduce((sum, t) => sum + t.amount, 0);
const HELD_AT_START = { amount: heldTotal(), count: transactions.filter((t) => t.status === "held").length };

// Profile activity links to older transactions outside this page of mock data; build them from the activity line
function fromActivity(id: string): Transaction | null {
  const found = findTxActivity(id);
  if (!found) return null;
  const { user: row, item } = found;
  const withdraw = item.text.match(/^Withdrew \$([\d,]+) to (.+)$/);
  if (withdraw) return payout(id, `PO-${id.slice(3)}`, row.name, Number(withdraw[1].replace(/,/g, "")), withdraw[2], "Paystack", "paid", item.when);
  const claimed = item.text.match(/^Claimed an edition of (.+)$/);
  const b = claimed && findBadgeByTitle(claimed[1]);
  if (b) return claim(id, row.name, b.id, `#${(Number(id.slice(3)) % Math.max(1, b.editions)) + 1}`, 0, "paid", item.when, "Paystack", `PSK_${id.slice(3)}`);
  return null;
}

/* ---------- History ---------- */

export type Period = 7 | 30 | 90;
export type TxFilters = { query: string; type: TxType | "all"; status: TxStatus | "all"; provider: Provider | "all"; badge: string; period: Period; page: number };
export const TX_PAGE_SIZE = 8;

export function matchesTx(t: Transaction, f: Omit<TxFilters, "page" | "period">) {
  const q = f.query.trim().toLowerCase();
  const haystack = [t.id, t.person.name, t.person.sub, t.badgeTitle, t.collector?.name, t.creator?.name, t.payoutId, t.providerRef];
  if (q && !haystack.some((v) => v?.toLowerCase().includes(q))) return false;
  if (f.type !== "all" && t.type !== f.type) return false;
  // Refunds and disputes are counted together on the KPI, so the filter keeps them together too
  if (f.status !== "all" && t.status !== f.status && !(f.status === "refunded" && t.status === "disputed")) return false;
  if (f.provider !== "all" && t.provider !== f.provider) return false;
  if (f.badge && t.badgeId !== f.badge) return false;
  return true;
}

const PERIOD_SHARE: Record<Period, number> = { 7: 0.24, 30: 1, 90: 2.9 };

function txKpis(period: Period): Kpi[] {
  const s = PERIOD_SHARE[period];
  const vs = `vs previous ${period} days`;
  return [
    { key: "volume", label: "Volume", value: Math.round(777_000 * s), format: "usdShort", change: 9.8, changeUnit: "%", upIsGood: true, note: vs, tip: "All money in and out of Auvra: claims, subscriptions, deposits and payouts." },
    { key: "success", label: "Success rate", value: 98.4, format: "pct", change: 0.3, changeUnit: "pts", upIsGood: true, note: vs, tip: "Share of payment attempts that went through first time." },
    { key: "average", label: "Average value", value: 42.1, format: "usd2", change: 2, changeUnit: "%", upIsGood: true, note: vs, tip: "Average amount per successful transaction." },
    {
      key: "held", label: "Held until delivery", value: 8_940 + heldTotal() - HELD_AT_START.amount, format: "usd", changeUnit: "%", upIsGood: true,
      note: `${52 + transactions.filter((t) => t.status === "held").length - HELD_AT_START.count} claims`, tip: "Collectible payments Auvra holds until the collector confirms the edition arrived.",
    },
    { key: "refunds", label: "Refunds and disputes", value: Math.round(14 * s), format: "count", changeUnit: "%", upIsGood: false, note: `Last ${period} days`, tip: "Payments returned to the collector, or that the collector has disputed." },
  ];
}

export type TxList = { kpis: Kpi[]; rows: Transaction[]; total: number; badgeTitle?: string };

export async function getTransactions(f: TxFilters): Promise<TxList> {
  // return api.transactions.list(f);
  await delay(450);
  const matches = transactions.filter((t) => matchesTx(t, f));
  const start = (f.page - 1) * TX_PAGE_SIZE;
  return { kpis: txKpis(f.period), rows: matches.slice(start, start + TX_PAGE_SIZE), total: matches.length, badgeTitle: f.badge ? badgeSummary(f.badge)?.title : undefined };
}

export async function getAllTransactions(f: TxFilters) {
  await delay(250);
  return transactions.filter((t) => matchesTx(t, f));
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  // return api.transactions.get(id);
  await delay(300);
  const key = id.toUpperCase();
  return transactions.find((t) => t.id === key) ?? fromActivity(key);
}

/* ---------- Status steps and audit trail ---------- */

export type Step = { label: string; note: string; state: "done" | "current" | "todo" | "failed" };

export function txSteps(t: Transaction): Step[] {
  const paidBy = `${t.date} · ${t.provider} ref ${t.providerRef}`;
  if (t.type === "claim") {
    const receives = `$${((t.price ?? 0) - auvraFee(t)).toFixed(2)}${t.shipping ? ` + $${t.shipping.toFixed(2)} shipping` : ""}`;
    const paid: Step = { label: "Paid by collector", note: paidBy, state: "done" };
    if (t.status === "refunded") return [paid, { label: "Refunded to collector", note: t.log?.[0]?.text.replace(/^Refunded: /, "") ?? "", state: "done" }];
    if (t.status === "disputed") return [paid, { label: "Delivered", note: "Digital edition", state: "done" }, { label: "Collector opened a dispute", note: "Money stays held until it's resolved", state: "current" }];
    if (!t.shipping) {
      return t.status === "held"
        ? [paid, { label: "Released to creator", note: `${receives} · after a 24 h fraud check`, state: "current" }]
        : [paid, { label: "Released to creator", note: receives, state: "done" }];
    }
    const done = t.status === "paid";
    return [
      paid,
      { label: "Creator ships", note: done ? "Tracking added" : "Waiting for tracking", state: done ? "done" : "current" },
      { label: "Collector confirms delivery", note: done ? "Confirmed" : `Expected around ${t.expected ?? "next week"}`, state: done ? "done" : "todo" },
      { label: "Released to creator", note: receives, state: done ? "done" : "todo" },
    ];
  }
  if (t.type === "payout") {
    const requested: Step = { label: "Requested by creator", note: t.date, state: "done" };
    if (t.status === "failed") return [requested, { label: "Sent to bank", note: FAIL_TEXT[t.failReason!].long(t.creator?.name ?? ""), state: "failed" }];
    if (t.status === "pending") return [requested, { label: "Sent to bank", note: t.note ?? `Waiting on ${t.provider}`, state: "current" }, { label: "Arrived", note: t.bank ?? "", state: "todo" }];
    return [requested, { label: "Sent to bank", note: `${t.provider} ref ${t.providerRef}`, state: "done" }, { label: "Arrived", note: t.bank ?? "", state: "done" }];
  }
  if (t.type === "subscription") return [{ label: "Charged", note: paidBy, state: "done" }, { label: "Renews", note: t.renews ?? "", state: "todo" }];
  return [{ label: "Received", note: t.from ?? "", state: "done" }, { label: "Credited to balance", note: t.to ?? "", state: "done" }];
}

export function auditTrail(t: Transaction) {
  const base = [{ text: `Created from the ${t.provider} webhook`, by: "System", when: t.date }];
  if (t.status === "held") base.unshift({ text: "Held until delivery is confirmed", by: "System", when: t.date });
  return [...(t.log ?? []), ...base];
}

// The provider's own dashboard, for checking a payment at source
export function providerUrl(t: Transaction) {
  const urls: Record<Provider, string> = {
    Paystack: `https://dashboard.paystack.com/#/search?query=${t.providerRef}`,
    RevenueCat: "https://app.revenuecat.com/",
    Breet: "https://app.breet.io/",
    Fonbnk: "https://dashboard.fonbnk.com/",
  };
  return urls[t.provider];
}

/* ---------- Payouts ---------- */

export type PayoutTab = "all" | "pending" | "completed" | "failed";
export const PAYOUT_TABS: { value: PayoutTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];
export type PayoutFilters = { tab: PayoutTab; query: string; provider: Provider | "all" };

export const payoutTab = (t: Transaction): Exclude<PayoutTab, "all"> => (t.status === "paid" ? "completed" : t.status === "failed" ? "failed" : "pending");

// Totals across every payout this month; retries made here move them
const PAYOUT_TOTALS = { paid: 24_180, pending: 3_420, pendingCount: 14, failed: 612, failedCount: 3 };

function payoutKpis(): Kpi[] {
  return [
    { key: "paid", label: "Paid this month", value: PAYOUT_TOTALS.paid, format: "usd", change: 11, changeUnit: "%", upIsGood: true, tip: "Money that reached creators' banks or wallets this month." },
    { key: "pending", label: "Pending", value: PAYOUT_TOTALS.pending, format: "usd", changeUnit: "%", upIsGood: false, note: `${PAYOUT_TOTALS.pendingCount} payouts`, tip: "Payouts requested but not yet in the creator's account." },
    { key: "failed", label: "Failed", value: PAYOUT_TOTALS.failed, format: "usd", changeUnit: "%", upIsGood: false, note: `${PAYOUT_TOTALS.failedCount} payouts`, tip: "Payouts the bank or provider rejected. The creator keeps the balance until a retry succeeds." },
    { key: "time", label: "Average time to bank", value: 4, format: "hours", changeUnit: "%", upIsGood: false, note: "Paystack and Breet", tip: "From the creator's request to the money arriving, averaged over the last 30 days." },
  ];
}

export type PayoutList = { kpis: Kpi[]; rows: Transaction[] };

export async function getPayouts(f: PayoutFilters): Promise<PayoutList> {
  // return api.payouts.list(f);
  await delay(450);
  const q = f.query.trim().toLowerCase();
  const rows = transactions
    .filter((t) => t.type === "payout")
    .filter((t) => f.tab === "all" || payoutTab(t) === f.tab)
    .filter((t) => f.provider === "all" || t.provider === f.provider)
    .filter((t) => !q || [t.person.name, t.payoutId, t.bank, t.id].some((v) => v?.toLowerCase().includes(q)));
  return { kpis: payoutKpis(), rows };
}

export type RetryChoice = "ask" | "same" | "breet";

export const retryOptions = (t: Transaction): { value: RetryChoice; label: string }[] => {
  const first = t.person.name.split(" ")[0];
  const opts: { value: RetryChoice; label: string }[] = [
    { value: "same", label: "Retry to the same account" },
    { value: "breet", label: "Retry through Breet instead" },
  ];
  // A name mismatch won't fix itself, so asking for new details comes first
  return t.failReason === "name_mismatch" ? [{ value: "ask", label: `Ask ${first} to update the bank details` }, ...opts] : opts;
};

export async function retryPayout(id: string, choice: RetryChoice, by: string) {
  // return api.payouts.retry(id, { choice }); the backend writes the audit log
  await delay(600);
  const t = transactions.find((x) => x.id === id);
  if (!t || t.status !== "failed") throw new Error("Payout can't be retried");
  const first = t.person.name.split(" ")[0];
  const text = { ask: `Asked ${first} for new bank details`, same: "Retried to the same account", breet: "Retried through Breet" }[choice];
  const update: Partial<Transaction> = { status: "pending", note: choice === "ask" ? `Waiting on ${first}` : `Retrying · ${choice === "breet" ? "Breet" : t.provider}` };
  if (choice === "breet") Object.assign(update, { provider: "Breet" as Provider, providerRef: `BRT_${t.id.slice(3)}` });
  transactions = transactions.map((x) => (x.id === id ? { ...x, ...update, log: [{ text, by, when: "Just now" }, ...(x.log ?? [])] } : x));

  PAYOUT_TOTALS.failed = Math.max(0, PAYOUT_TOTALS.failed - t.amount);
  PAYOUT_TOTALS.failedCount = Math.max(0, PAYOUT_TOTALS.failedCount - 1);
  PAYOUT_TOTALS.pending += t.amount;
  PAYOUT_TOTALS.pendingCount += 1;

  // Asking for new details also updates the bank check in Trust and Safety
  if (choice === "ask" && t.creator?.userId) {
    const checkId = `${t.creator.userId}-bank`;
    const check = await getKycCheck(checkId);
    if (check && needsAction(check.status)) await decideKyc(checkId, "resubmit", `Payout ${t.payoutId} failed: the account name doesn't match`, by);
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
