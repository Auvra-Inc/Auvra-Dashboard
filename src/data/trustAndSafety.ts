// Shapes of the Trust and Safety responses. Values are placeholders until GET /api/v1/safety, /safety/reports,
// POST /safety/reports/:id/decision, GET /safety/kyc, POST /safety/kyc/:id/decision and /safety/fraud-alerts/:id exist.
import type { Kpi } from "./businessIntelligence";
import { setBadgeHidden, setBadgeStatus } from "./culturalIntelligence";
import { findUserRow, setUserKyc, suspendUser } from "./users";

/* ---------- Reports ---------- */

export type ReportDecision = "dismiss" | "hide" | "restrict" | "escalate" | "remove";

export const REPORT_DECISIONS: { value: ReportDecision; label: string; done: string }[] = [
  { value: "dismiss", label: "Dismiss, nothing wrong", done: "Dismissed" },
  { value: "hide", label: "Hide from everyone", done: "Hidden from everyone" },
  { value: "restrict", label: "Restrict to the community only", done: "Restricted to the community" },
  { value: "escalate", label: "Escalate to community Keepers", done: "Sent to community Keepers" },
  { value: "remove", label: "Remove and suspend the creator", done: "Removed, creator suspended" },
];

export const decisionLabel = (d: ReportDecision) => REPORT_DECISIONS.find((o) => o.value === d)!.done;

export type Report = {
  id: string;
  badgeId: string;
  title: string;
  badgeKind: "contribution" | "collectible";
  category: string;
  creator: string;
  // User account of the creator; community accounts also have a Cultural Intelligence record
  creatorId: string;
  communityId?: string;
  preservedOn: string;
  description: string;
  autoHidden: boolean;
  reasons: { label: string; count: number }[];
  received: string;
  today: boolean;
  resolution?: { decision: ReportDecision; reason: string; by: string; when: string };
};

export const reportCount = (r: Report) => r.reasons.reduce((sum, x) => sum + x.count, 0);
// Most-cited reason, shown under the title in the queue
export const topReason = (r: Report) => [...r.reasons].sort((a, b) => b.count - a.count)[0].label;

const SACRED = "Sacred or restricted knowledge shared without permission";
const ORIGIN = "Wrong culture or origin";
const NOT_THEIRS = "Not the creator's work";
const SPAM = "Spam or misleading";
const HATE = "Hate or harassment";

// Short labels for the queue list
export const REASON_SHORT: Record<string, string> = { [SACRED]: "Sacred knowledge" };

type ReportSeed = Omit<Report, "id" | "received" | "today">;

const seed = (id: string, received: string, today: boolean, r: ReportSeed): Report => ({ id, received, today, ...r });

let openReports: Report[] = [
  seed("rp-1042", "Today, 09:12", true, {
    badgeId: "sacred-mask-of-ife", title: "Sacred Mask of Ife", badgeKind: "contribution", category: "Ritual", creator: "Ife Heritage Society",
    creatorId: "ife-heritage-society", communityId: "ife-heritage-society", preservedOn: "4 Oct", description: "A ceremonial mask with a story of its use in a closed rite.",
    autoHidden: true, reasons: [{ label: SACRED, count: 2 }, { label: ORIGIN, count: 1 }],
  }),
  seed("rp-1041", "Today, 08:40", true, {
    badgeId: "market-day", title: "Market Day", badgeKind: "contribution", category: "Story", creator: "Segun Ade", creatorId: "segun-ade",
    preservedOn: "9 Oct", description: "A morning at Balogun market told through the traders' calls and greetings.", autoHidden: false, reasons: [{ label: ORIGIN, count: 2 }],
  }),
  seed("rp-1040", "Today, 07:55", true, {
    badgeId: "queens-of-the-coast", title: "Queens of the Coast", badgeKind: "collectible", category: "Music", creator: "Kwame Mensah", creatorId: "kwame-mensah",
    preservedOn: "13 Oct", description: "A highlife recording dedicated to the market queens of Accra. Limited edition of 15.", autoHidden: false, reasons: [{ label: NOT_THEIRS, count: 1 }],
  }),
  seed("rp-1039", "Today, 06:20", true, {
    badgeId: "golden-hour-sisters", title: "Golden Hour Sisters", badgeKind: "collectible", category: "Photography", creator: "Ada Okafor", creatorId: "ada-okafor",
    preservedOn: "2 Sep", description: "A photo series on sisterhood and the joy of dressing together. Limited edition of 10.", autoHidden: false, reasons: [{ label: SPAM, count: 1 }],
  }),
  seed("rp-1038", "Yesterday", false, {
    badgeId: "durbar-riders", title: "Durbar Riders", badgeKind: "contribution", category: "Performance", creator: "Musa Bello", creatorId: "musa-bello",
    preservedOn: "17 Oct", description: "Footage of the Sallah Durbar procession with commentary on the riders' regalia.", autoHidden: false, reasons: [{ label: HATE, count: 1 }],
  }),
  seed("rp-1037", "Yesterday", false, {
    badgeId: "egungun-festival-chant", title: "Egungun Festival Chant", badgeKind: "contribution", category: "Ritual", creator: "Tunde Bakare", creatorId: "tunde-bakare",
    preservedOn: "19 Oct", description: "A recording of the opening chant, shared with the permission of the masquerade society.", autoHidden: false, reasons: [{ label: SACRED, count: 1 }],
  }),
  seed("rp-1036", "Yesterday", false, {
    badgeId: "jollof-origins", title: "Jollof Origins", badgeKind: "contribution", category: "Food", creator: "Segun Ade", creatorId: "segun-ade",
    preservedOn: "15 Oct", description: "Where jollof began, told through three family recipes.", autoHidden: false, reasons: [{ label: ORIGIN, count: 1 }],
  }),
  seed("rp-1035", "2 days ago", false, {
    badgeId: "lamu-door-studies", title: "Lamu Door Studies", badgeKind: "collectible", category: "Photography", creator: "Zawadi Mwangi", creatorId: "zawadi-mwangi",
    preservedOn: "28 Jul", description: "Twelve carved Swahili doors from Lamu Old Town, with the stories of the families behind them.", autoHidden: false, reasons: [{ label: NOT_THEIRS, count: 1 }],
  }),
  seed("rp-1034", "2 days ago", false, {
    badgeId: "taarab-song-lyrics", title: "Taarab Song Lyrics", badgeKind: "contribution", category: "Performance", creator: "Fatma Ali", creatorId: "fatma-ali",
    preservedOn: "14 Oct", description: "Lyrics of five taarab songs with notes on the poets who wrote them.", autoHidden: false, reasons: [{ label: NOT_THEIRS, count: 1 }],
  }),
  seed("rp-1033", "3 days ago", false, {
    badgeId: "highlife-guitar-tunings", title: "Highlife Guitar Tunings", badgeKind: "contribution", category: "Performance", creator: "Kojo Antwi", creatorId: "kojo-antwi",
    preservedOn: "16 Oct", description: "Palm-wine guitar tunings, with recordings of each.", autoHidden: false, reasons: [{ label: SPAM, count: 1 }],
  }),
  seed("rp-1032", "3 days ago", false, {
    badgeId: "nsibidi-symbols", title: "Nsibidi Symbols", badgeKind: "contribution", category: "Language", creator: "Chinwe Okeke", creatorId: "chinwe-okeke",
    preservedOn: "13 Oct", description: "Forty Nsibidi symbols with their meanings and where they are still used.", autoHidden: false, reasons: [{ label: ORIGIN, count: 1 }],
  }),
  seed("rp-1031", "4 days ago", false, {
    badgeId: "kikuyu-proverbs", title: "Kikuyu Proverbs", badgeKind: "contribution", category: "Language", creator: "Njoroge Kariuki", creatorId: "njoroge-kariuki",
    preservedOn: "12 Oct", description: "Thirty proverbs with literal and intended meanings.", autoHidden: false, reasons: [{ label: HATE, count: 1 }],
  }),
];

let resolvedReports: Report[] = [
  {
    ...seed("rp-1030", "18 Oct", false, {
      badgeId: "kente-weave-no-4", title: "Kente Weave No. 4", badgeKind: "collectible", category: "Textile", creator: "Kwabena Asare", creatorId: "kwabena-asare",
      preservedOn: "14 Aug", description: "A hand-woven Adweneasa strip, photographed loom to finish. Limited edition of 25.", autoHidden: false, reasons: [{ label: NOT_THEIRS, count: 1 }],
    }),
    resolution: { decision: "dismiss", reason: "Kwabena wove the strip himself; the loom video confirms it.", by: "Amara O.", when: "18 Oct" },
  },
  {
    ...seed("rp-1029", "16 Oct", false, {
      badgeId: "iwi-ancestral-poem", title: "Iwi Ancestral Poem", badgeKind: "contribution", category: "Story", creator: "Kemi Olatunji", creatorId: "kemi-olatunji",
      preservedOn: "11 Oct", description: "An Iwi Egungun poem praising the ancestors of Ado-Ekiti, transcribed with an English gloss.", autoHidden: false, reasons: [{ label: SACRED, count: 1 }],
    }),
    resolution: { decision: "escalate", reason: "Only the Ekiti Keepers can say whether this verse may be shared.", by: "Emmanuel J.", when: "16 Oct" },
  },
  {
    ...seed("rp-1028", "12 Oct", false, {
      badgeId: "ofada-rice-recipe", title: "Ofada Rice Recipe", badgeKind: "contribution", category: "Food", creator: "Bola Ige", creatorId: "bola-ige",
      preservedOn: "18 Oct", description: "Ofada rice and ayamase stew the way it is made in Abeokuta, with the market names for each pepper.", autoHidden: false, reasons: [{ label: SPAM, count: 1 }],
    }),
    resolution: { decision: "dismiss", reason: "A real recipe; the reporter disagreed with the pepper names.", by: "Joshua U.", when: "12 Oct" },
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const shortName = (name: string) => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};
const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export type ReportView = "open" | "resolved";

export async function getReports(view: ReportView): Promise<{ open: number; items: Report[] }> {
  // return api.safety.reports({ status: view }); newest first
  await delay(450);
  return { open: openReports.length, items: view === "open" ? [...openReports] : [...resolvedReports] };
}

export async function decideReport(id: string, decision: ReportDecision, reason: string, by: string) {
  // return api.safety.decideReport(id, { decision, reason }); the backend applies it and writes the audit log
  await delay(600);
  const report = openReports.find((r) => r.id === id);
  if (!report) throw new Error("Report not found");

  if (decision === "dismiss" && report.autoHidden) await setBadgeHidden(report.badgeId, false, reason);
  if (decision === "hide") await setBadgeHidden(report.badgeId, true, reason);
  if (decision === "restrict") {
    await setBadgeStatus(report.badgeId, "restricted", by);
    await setBadgeHidden(report.badgeId, false, reason);
  }
  // Collectibles have no Keeper check, so escalating only flags them for the community
  if (decision === "escalate" && report.badgeKind === "contribution") await setBadgeStatus(report.badgeId, "pending", by);
  if (decision === "remove") {
    await setBadgeHidden(report.badgeId, true, reason);
    await suspendUser(report.creatorId, "Repeated community guideline breaches", `${report.title}: ${reason}`, by);
  }

  openReports = openReports.filter((r) => r.id !== id);
  resolvedReports = [{ ...report, resolution: { decision, reason, by: shortName(by), when: "Just now" } }, ...resolvedReports];
}

/* ---------- KYC and bank checks ---------- */

export type KycCheckStatus = "pending" | "name_mismatch" | "photo_requested" | "rejected" | "verified";
export type KycTab = "pending" | "rejected" | "verified" | "all";
export type KycDecision = "approve" | "resubmit" | "reject";

export const KYC_TABS: { value: KycTab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "verified", label: "Verified" },
  { value: "all", label: "All" },
];

export const KYC_STATUS_LABELS: Record<KycCheckStatus, string> = {
  pending: "Pending",
  name_mismatch: "Name mismatch",
  photo_requested: "Photo requested",
  rejected: "Rejected",
  verified: "Verified",
};

// Pending, name mismatches and re-submissions all still need someone to act
export const needsAction = (s: KycCheckStatus) => s === "pending" || s === "name_mismatch" || s === "photo_requested";

export const kycDecisionOptions = (kind: KycCheck["kind"]): { value: KycDecision; label: string }[] => [
  { value: "approve", label: "Approve" },
  { value: "resubmit", label: kind === "bank" ? "Ask for new bank details" : "Ask for a clearer photo" },
  { value: "reject", label: "Reject" },
];

export type KycCheck = {
  id: string;
  userId: string;
  name: string;
  userType: string;
  country: string;
  document: string;
  kind: "identity" | "bank";
  provider: "Dojah" | "Paystack";
  status: KycCheckStatus;
  submitted: string;
  ref: string;
  // Masked previews; the real files only load after "Reveal documents"
  previews: string[];
  details: { label: string; value: string }[];
  history: { text: string; by: string; when: string }[];
};

type CheckSeed = [string, string, string, string, string, KycCheck["kind"], KycCheckStatus, string, string, number, string];

// userId, name, type, country, document, kind, status, submitted, ref, match %, document expiry / bank
const CHECK_SEEDS: CheckSeed[] = [
  ["kwame-mensah", "Kwame Mensah", "Creator", "Ghana", "Ghana Card", "identity", "pending", "2 days ago", "DJH-88120", 96, "2031"],
  ["obi-kalu", "Obi Kalu", "Family", "Nigeria", "NIN slip", "identity", "pending", "1 day ago", "DJH-88241", 91, "No expiry"],
  ["ada-okafor", "Ada Okafor", "Creator", "Nigeria", "Bank account", "bank", "name_mismatch", "2 h ago", "PSK-55017", 72, "GTBank ••4417"],
  ["sade-daramola", "Sade Daramola", "Creator", "UK", "Passport, face match", "identity", "rejected", "6 days ago", "DJH-87702", 41, "2029"],
  ["fatou-bah", "Fatou Bah", "Collector", "Senegal", "National ID", "identity", "verified", "3 h ago", "DJH-88390", 98, "2030"],
  ["chinwe-okeke", "Chinwe Okeke", "Creator", "Nigeria", "Bank account", "bank", "name_mismatch", "1 h ago", "PSK-55031", 64, "Access Bank ••9031"],
  ["efua-sackey", "Efua Sackey", "Collector", "Ghana", "Ghana Card", "identity", "pending", "Yesterday", "DJH-88302", 93, "2033"],
  ["chinwe-okeke", "Chinwe Okeke", "Creator", "Nigeria", "NIN slip", "identity", "pending", "3 days ago", "DJH-88177", 88, "No expiry"],
  ["bola-ige", "Bola Ige", "Creator", "Nigeria", "Bank account", "bank", "pending", "2 days ago", "PSK-54980", 100, "Zenith ••1180"],
  ["ekiti-story-keepers", "Ekiti Story Keepers", "Community", "Nigeria", "CAC certificate", "identity", "pending", "4 days ago", "DJH-88015", 100, "No expiry"],
  ["nana-boateng", "Nana Boateng", "Collector", "Ghana", "Bank account", "bank", "rejected", "2 weeks ago", "PSK-54412", 58, "Ecobank ••6624"],
  ["kwabena-asare", "Kwabena Asare", "Creator", "Ghana", "Ghana Card", "identity", "verified", "5 days ago", "DJH-87911", 97, "2032"],
  ["tolu-adeyemi", "Tolu Adeyemi", "Collector", "Nigeria", "National ID", "identity", "verified", "1 week ago", "DJH-87650", 95, "No expiry"],
];

// Names on the document that differ from the Auvra account
const NAME_ON_RECORD: Record<string, string> = { "ada-okafor-bank": "Adaeze Okafor", "chinwe-okeke-bank": "C. Okeke Ventures", "nana-boateng-bank": "Kwesi Boateng" };

const PAST_DECISIONS: Record<string, KycCheck["history"][number]> = {
  "sade-daramola-id": { text: "Rejected: the face did not match the passport photo", by: "Amara O.", when: "15 Oct" },
  "nana-boateng-bank": { text: "Rejected: the account belongs to someone else", by: "Emmanuel J.", when: "8 Oct" },
  "fatou-bah-id": { text: "Approved automatically by Dojah", by: "Dojah", when: "Today" },
  "kwabena-asare-id": { text: "Approved", by: "Joshua U.", when: "16 Oct" },
  "tolu-adeyemi-id": { text: "Approved automatically by Dojah", by: "Dojah", when: "14 Oct" },
};

function toCheck([userId, name, userType, country, document, kind, status, submitted, ref, match, extra]: CheckSeed): KycCheck {
  const id = `${userId}-${kind === "bank" ? "bank" : "id"}`;
  const provider = kind === "bank" ? "Paystack" : "Dojah";
  const details =
    kind === "bank"
      ? [
          { label: "Name on bank account", value: NAME_ON_RECORD[id] ?? name },
          { label: "Name on Auvra", value: name },
          { label: "Name match", value: `${match}%` },
          { label: "Bank", value: extra },
          { label: "Country", value: country },
        ]
      : [
          { label: userType === "Community" ? "Registered name" : "Name on ID", value: NAME_ON_RECORD[id] ?? name },
          { label: "Name on Auvra", value: name },
          ...(userType === "Community" ? [] : [{ label: "Face match", value: `${match}%` }]),
          { label: "Document expiry", value: extra },
          { label: "Country", value: country },
        ];
  const previews = kind === "bank" ? ["Bank letter · masked", "ID front · masked"] : userType === "Community" ? ["Certificate · masked", "Director ID · masked"] : ["ID front · masked", "Selfie · masked"];
  const history = [{ text: `Submitted to ${provider}`, by: name, when: submitted }];
  if (PAST_DECISIONS[id]) history.unshift(PAST_DECISIONS[id]);
  return { id, userId, name, userType, country, document, kind, provider, status, submitted, ref: `${provider} ref ${ref}`, previews, details, history };
}

const checks: KycCheck[] = CHECK_SEEDS.map(toCheck);

// Totals across all checks on Auvra; decisions made here move them
const KYC_TOTALS = { pending: 34, verified: 1962, rejected: 6 };

export type KycFilters = { tab: KycTab; query: string; provider: "all" | KycCheck["provider"]; country: string };

export function matchesCheck(c: KycCheck, f: KycFilters) {
  const q = f.query.trim().toLowerCase();
  if (q && ![c.name, c.ref, c.document, c.userId].some((v) => v.toLowerCase().includes(q))) return false;
  if (f.tab === "pending" && !needsAction(c.status)) return false;
  if ((f.tab === "rejected" || f.tab === "verified") && c.status !== f.tab) return false;
  if (f.provider !== "all" && c.provider !== f.provider) return false;
  if (f.country !== "all" && c.country !== f.country) return false;
  return true;
}

const bankFailed = () => checks.filter((c) => c.kind === "bank" && (c.status === "name_mismatch" || c.status === "rejected")).length;

function kycKpis(): Kpi[] {
  return [
    { key: "pending", label: "Pending", value: KYC_TOTALS.pending, format: "count", changeUnit: "%", upIsGood: false, note: "Oldest 2 days", tip: "Identity and bank checks waiting for a decision. Creators can't withdraw until they pass." },
    { key: "verified", label: "Verified this month", value: KYC_TOTALS.verified, format: "count", change: 8, changeUnit: "%", upIsGood: true, tip: "Checks approved in the last 30 days, by Dojah automatically or by an admin." },
    { key: "rejected", label: "Rejected", value: KYC_TOTALS.rejected, format: "count", changeUnit: "%", upIsGood: false, note: "Last 30 days", tip: "Checks rejected in the last 30 days. The person is told why and can try again." },
    { key: "bank", label: "Bank checks failed", value: bankFailed(), format: "count", changeUnit: "%", upIsGood: false, note: "Paystack", tip: "Bank accounts Paystack couldn't match to the person's name. Payouts stay on hold." },
  ];
}

export type KycList = { kpis: Kpi[]; rows: KycCheck[]; countries: string[] };

export async function getKycChecks(filters: KycFilters): Promise<KycList> {
  // return api.safety.kyc(filters);
  await delay(450);
  return { kpis: kycKpis(), rows: checks.filter((c) => matchesCheck(c, filters)), countries: [...new Set(checks.map((c) => c.country))].sort() };
}

export async function getKycCheck(id: string): Promise<KycCheck | null> {
  await delay(250);
  const c = checks.find((x) => x.id === id);
  return c ? { ...c, history: [...c.history] } : null;
}

// Synchronous lookup so the user profile can link to the person's identity check
export const kycCheckIdFor = (userId: string) => checks.find((c) => c.userId === userId && c.kind === "identity")?.id ?? null;

export async function decideKyc(id: string, decision: KycDecision, reason: string, by: string) {
  // return api.safety.decideKyc(id, { decision, reason }); the backend tells the person and writes the audit log
  await delay(600);
  const c = checks.find((x) => x.id === id);
  if (!c) throw new Error("Check not found");
  const wasPending = needsAction(c.status);
  const text = { approve: "Approved", resubmit: c.kind === "bank" ? "Asked for new bank details" : "Asked for a clearer photo", reject: "Rejected" }[decision];
  c.history.unshift({ text: reason ? `${text}: ${reason}` : text, by: shortName(by), when: "Just now" });

  if (decision === "resubmit") {
    c.status = "photo_requested";
    return;
  }
  c.status = decision === "approve" ? "verified" : "rejected";
  if (wasPending) KYC_TOTALS.pending = Math.max(0, KYC_TOTALS.pending - 1);
  if (decision === "approve") KYC_TOTALS.verified += 1;
  else KYC_TOTALS.rejected += 1;
  if (c.kind === "identity") setUserKyc(c.userId, c.status === "verified" ? "verified" : "rejected");
}

/* ---------- Compliance log ---------- */

// checkId opens the KYC review drawer; to opens another page
export type ComplianceEntry = { id: string; who: string; role: string; viewed: string; checkId?: string; to?: string; when: string };


const complianceLog: ComplianceEntry[] = [
  { id: "cl-3", who: "Amara O.", role: "Data Analyst", viewed: "KYC record · Sade D.", checkId: "sade-daramola-id", when: "10:12" },
  { id: "cl-2", who: "Emmanuel J.", role: "Super Admin", viewed: "Exported users CSV", to: "/app/users", when: "09:40" },
  { id: "cl-1", who: "Joshua U.", role: "Admin", viewed: "Bank details · Ada O.", checkId: "ada-okafor-bank", when: "Yesterday" },
];

// The backend logs every reveal; the mock adds it to the compliance log straight away
export async function revealDocuments(id: string, by: { name: string; role: string }) {
  await delay(350);
  const c = checks.find((x) => x.id === id);
  if (!c) throw new Error("Check not found");
  const what = c.kind === "bank" ? "Bank details" : "KYC documents";
  complianceLog.unshift({ id: `cl-${Date.now()}`, who: shortName(by.name), role: by.role, viewed: `${what} · ${shortName(c.name)}`, checkId: c.id, when: clock() });
}

/* ---------- Fraud alerts ---------- */

export type FraudAlert = {
  id: string;
  title: string;
  severity: "high" | "medium";
  userId: string;
  amount: number;
  raised: string;
  explanation: string;
  // What the rule saw, oldest first; transactions open their detail page
  events: { text: string; when: string; txId?: string }[];
  kycCheckId?: string;
};

let fraudAlerts: FraudAlert[] = [
  {
    id: "fa-210", title: "6 claims from one card in 10 minutes", severity: "high", userId: "amina-said", amount: 1080, raised: "Today, 09:14",
    explanation: "Six Collectible claims were paid with the same Visa ••2291 inside ten minutes. Cards used this way are often stolen.",
    events: [
      { text: "Claimed Kente Weave No. 4 · edition #14", when: "09:02", txId: "TX-20401" },
      { text: "Claimed Kente Weave No. 4 · edition #15", when: "09:03", txId: "TX-20402" },
      { text: "Claimed Lamu Door Studies · edition #20", when: "09:05", txId: "TX-20404" },
      { text: "Claimed Lamu Door Studies · edition #21", when: "09:06", txId: "TX-20405" },
      { text: "Claimed Golden Hour Sisters · edition #8", when: "09:09", txId: "TX-20409" },
      { text: "Claimed Golden Hour Sisters · edition #9", when: "09:11", txId: "TX-20411" },
    ],
  },
  {
    id: "fa-209", title: "Payout to a new bank 1 h after sign-up", severity: "medium", userId: "chinwe-okeke", amount: 420, raised: "Today, 08:20",
    explanation: "A payout was requested to a bank account added an hour after the account was created, before identity checks finished.",
    events: [
      { text: "Account created", when: "07:12" },
      { text: "Added Access Bank ••9031", when: "08:02" },
      { text: "Requested a $420 payout", when: "08:14", txId: "TX-20377" },
    ],
    kycCheckId: "chinwe-okeke-bank",
  },
];

export async function resolveFraudAlert(id: string, outcome: "dismissed" | "suspended", reason: string) {
  // return api.safety.resolveFraudAlert(id, { outcome, reason });
  await delay(400);
  void outcome;
  void reason;
  fraudAlerts = fraudAlerts.filter((a) => a.id !== id);
}

export const fraudUser = (a: FraudAlert) => findUserRow(a.userId);

/* ---------- Overview ---------- */

export type SafetyOverview = {
  kpis: Kpi[];
  checks: KycCheck[];
  fraudAlerts: FraudAlert[];
  complianceLog: ComplianceEntry[];
};

export async function getSafetyOverview(): Promise<SafetyOverview> {
  // return api.safety.overview();
  await delay(500);
  const k = kycKpis();
  return {
    kpis: [
      { key: "reports", label: "Open reports", value: openReports.length, format: "count", changeUnit: "%", upIsGood: false, note: `${openReports.filter((r) => r.today).length} today`, tip: "Badges people have reported that still need a decision." },
      { ...k[0], key: "kycPending", label: "KYC pending" },
      { ...k[2], key: "kycRejected", label: "KYC rejected" },
      k[3],
      { key: "fraud", label: "Fraud alerts", value: fraudAlerts.length, format: "count", changeUnit: "%", upIsGood: false, note: "Flagged transactions", tip: "Payments or payouts our rules flagged as unusual. Check them before the money moves." },
    ],
    checks: checks.slice(0, 5),
    fraudAlerts: [...fraudAlerts],
    complianceLog: complianceLog.slice(0, 5),
  };
}
