// Shapes of the Users responses. Values are placeholders until GET /api/v1/users, /users/:id,
// POST /users/:id/suspend, /users/:id/reactivate and /users/:id/notes exist; the backend applies the filters.
import type { Kpi } from "./businessIntelligence";
import { userPath } from "../utils/navigation";

export type UserType = "creator" | "collector" | "community" | "family";
export type UserStatus = "active" | "pending" | "suspended";
export type KycStatus = "verified" | "pending" | "not_started" | "rejected";

export const USER_TYPES: { value: UserType; label: string; plural: string }[] = [
  { value: "creator", label: "Creator", plural: "Creators" },
  { value: "collector", label: "Collector", plural: "Collectors" },
  { value: "community", label: "Community", plural: "Communities" },
  { value: "family", label: "Family", plural: "Families" },
];

export const typeLabel = (t: UserType) => USER_TYPES.find((o) => o.value === t)!.label;

const STATUS_LABELS: Record<UserStatus, string> = { active: "Active", pending: "Pending", suspended: "Suspended" };
const KYC_LABELS: Record<KycStatus, string> = { verified: "Verified", pending: "Pending", not_started: "Not started", rejected: "Rejected" };

export const statusLabel = (s: UserStatus) => STATUS_LABELS[s];
export const kycLabel = (k: KycStatus) => KYC_LABELS[k];

export const STATUS_OPTIONS: { value: UserStatus | "all"; label: string }[] = [
  { value: "all", label: "Any status" },
  ...(Object.keys(STATUS_LABELS) as UserStatus[]).map((value) => ({ value, label: STATUS_LABELS[value] })),
];
export const KYC_OPTIONS: { value: KycStatus | "all"; label: string }[] = [
  { value: "all", label: "Any KYC" },
  ...(Object.keys(KYC_LABELS) as KycStatus[]).map((value) => ({ value, label: KYC_LABELS[value] })),
];

export type UserFilters = {
  query: string;
  type: UserType | "all";
  status: UserStatus | "all";
  kyc: KycStatus | "all";
  country: string;
  page: number;
};

export const PAGE_SIZE = 8;

export type UserRow = {
  // URL id; a name slug in the mock, the API's user id later
  id: string;
  code: string;
  name: string;
  email: string;
  type: UserType;
  // Shown under the name, e.g. "ada@mail.com · Creator" or "Community · 1.2K members"
  subline: string;
  country: string;
  status: UserStatus;
  kyc: KycStatus;
  badges: number;
  lastActive: string;
};

export type UserList = {
  kpis: Kpi[];
  // People and countries on Auvra overall, for the page subtitle
  totalPeople: number;
  totalCountries: number;
  rows: UserRow[];
  // Matches for the current filters across all pages
  total: number;
  countries: string[];
};

export type ProfileStat = { key: string; label: string; value: string; note: string; tip: string };

export type ActivityKind = "claim" | "preserve" | "withdraw" | "report" | "publish" | "join" | "suspend" | "reactivate";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  text: string;
  when: string;
  // Optional record the item opens (badge, transaction, community)
  to?: string;
};

export type AdminNote = { id: string; author: string; when: string; body: string };

export type Suspension = { reason: string; details: string; by: string; when: string };

export type UserProfile = UserRow & {
  // "Photographer", "1.2K members"…
  role: string;
  place: string;
  joined: string;
  stats: ProfileStat[];
  account: {
    phoneMasked: string;
    phone: string;
    kyc: string;
    payout: { label: string; value: string };
    plan: string;
    lastSignIn: string;
  };
  activity: ActivityItem[];
  notes: AdminNote[];
  suspension: Suspension | null;
  // Community accounts link to their Cultural Intelligence record
  communityId?: string;
};

export const SUSPEND_REASONS = ["Fraud or payment abuse", "Repeated community guideline breaches", "Impersonation", "Other"] as const;

/* ---------- Mock data ---------- */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// name, type, city, country, status, kyc, badges, last active, role (craft or member count)
type Seed = [string, UserType, string, string, UserStatus, KycStatus, number, string, string];

const SEEDS: Seed[] = [
  ["Ada Okafor", "creator", "Lagos", "Nigeria", "active", "verified", 42, "2 min ago", "Photographer"],
  ["Tolu Adeyemi", "collector", "Ibadan", "Nigeria", "active", "verified", 0, "1 h ago", "Collector"],
  ["Lagos Heritage Circle", "community", "Lagos", "Nigeria", "active", "verified", 1204, "5 h ago", "1.2K members"],
  ["Kwame Mensah", "creator", "Accra", "Ghana", "pending", "pending", 3, "Yesterday", "Musician"],
  ["Njeri Wanjiku", "family", "Nairobi", "Kenya", "active", "not_started", 11, "Yesterday", "Family of 6"],
  ["Sade Daramola", "creator", "London", "United Kingdom", "suspended", "rejected", 7, "6 days ago", "Painter"],
  ["Fatou Bah", "collector", "Dakar", "Senegal", "active", "verified", 0, "2 days ago", "Collector"],
  ["Obi Kalu", "family", "Enugu", "Nigeria", "active", "pending", 5, "3 days ago", "Family of 4"],
  ["Kwabena Asare", "creator", "Kumasi", "Ghana", "active", "verified", 31, "12 min ago", "Weaver"],
  ["Amaka Nwosu", "collector", "Abuja", "Nigeria", "active", "verified", 0, "40 min ago", "Collector"],
  ["Zawadi Mwangi", "creator", "Mombasa", "Kenya", "active", "verified", 26, "3 h ago", "Photographer"],
  ["Asante Kente Guild", "community", "Kumasi", "Ghana", "active", "verified", 642, "2 h ago", "860 members"],
  ["Kofi Mensah", "collector", "Accra", "Ghana", "active", "verified", 0, "Today", "Collector"],
  ["Obiora Eze", "creator", "Lagos", "Nigeria", "active", "verified", 18, "Today", "Archivist"],
  ["Efua Sackey", "collector", "Cape Coast", "Ghana", "active", "pending", 0, "Yesterday", "Collector"],
  ["Swahili Coast Keepers", "community", "Mombasa", "Kenya", "active", "verified", 388, "Yesterday", "540 members"],
  ["Tunde Bakare", "creator", "Lagos", "Nigeria", "active", "verified", 14, "Yesterday", "Storyteller"],
  ["Bola Ige", "creator", "Abeokuta", "Nigeria", "active", "pending", 6, "2 days ago", "Cook"],
  ["Hauwa Musa", "family", "Kano", "Nigeria", "active", "verified", 9, "2 days ago", "Family of 5"],
  ["Musa Bello", "creator", "Kano", "Nigeria", "active", "verified", 12, "2 days ago", "Performer"],
  ["Igbo-Ukwu Archive", "community", "Awka", "Nigeria", "active", "verified", 274, "3 days ago", "310 members"],
  ["Kemi Olatunji", "creator", "Ado-Ekiti", "Nigeria", "active", "verified", 8, "3 days ago", "Poet"],
  ["Chinwe Okeke", "creator", "Awka", "Nigeria", "pending", "pending", 2, "3 days ago", "Linguist"],
  ["Ruth Grant", "collector", "London", "United Kingdom", "active", "verified", 0, "4 days ago", "Collector"],
  ["Ekiti Story Keepers", "community", "Ado-Ekiti", "Nigeria", "pending", "pending", 41, "4 days ago", "120 members"],
  ["Yaw Darko", "creator", "Bonwire", "Ghana", "active", "verified", 10, "4 days ago", "Weaver"],
  ["Fatma Ali", "creator", "Mombasa", "Kenya", "active", "not_started", 4, "5 days ago", "Singer"],
  ["Accra Highlife Society", "community", "Accra", "Ghana", "active", "verified", 196, "5 days ago", "430 members"],
  ["Segun Ade", "creator", "Lagos", "Nigeria", "active", "verified", 15, "5 days ago", "Chef"],
  ["Kojo Antwi", "creator", "Accra", "Ghana", "active", "verified", 7, "6 days ago", "Guitarist"],
  ["Ifeoma Nwankwo", "family", "Onitsha", "Nigeria", "active", "verified", 13, "6 days ago", "Family of 7"],
  ["Nairobi Oral History Circle", "community", "Nairobi", "Kenya", "active", "verified", 152, "1 week ago", "290 members"],
  ["Njoroge Kariuki", "creator", "Nairobi", "Kenya", "active", "verified", 9, "1 week ago", "Elder"],
  ["Yoruba Diaspora London", "community", "London", "United Kingdom", "active", "verified", 118, "1 week ago", "640 members"],
  ["Mary Jackson", "creator", "Charleston", "United States", "active", "verified", 5, "1 week ago", "Basket maker"],
  ["Gullah Roots Society", "community", "Charleston", "United States", "active", "pending", 87, "1 week ago", "210 members"],
  ["Ife Heritage Society", "community", "Ile-Ife", "Nigeria", "active", "verified", 168, "1 week ago", "412 members"],
  ["Nana Boateng", "collector", "Kumasi", "Ghana", "suspended", "verified", 0, "2 weeks ago", "Collector"],
  ["Mzee Rashid", "creator", "Mombasa", "Kenya", "active", "not_started", 3, "2 weeks ago", "Elder"],
  ["Amina Said", "collector", "Zanzibar", "Tanzania", "active", "verified", 0, "2 weeks ago", "Collector"],
  ["Emeka Obi", "family", "Owerri", "Nigeria", "pending", "not_started", 1, "3 weeks ago", "Family of 3"],
  ["Kemi Adebayo", "creator", "Ibadan", "Nigeria", "active", "verified", 19, "Today", "Sculptor"],
];

// Short names used in Cultural Intelligence records, mapped to the full account
const ALIASES: Record<string, string> = {
  "sade-d": "sade-daramola",
  "kwame-m": "kwame-mensah",
  "njeri-w": "njeri-wanjiku",
  "hauwa-m": "hauwa-musa",
};

const slug = (name: string) => userPath(name).replace("/app/users/", "");

// Small deterministic generator so each mock user keeps the same numbers between visits
function rng(seed: string) {
  let h = [...seed].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 7);
  return () => {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5) | 0;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const firstName = (name: string) => name.split(" ")[0];

function emailFor(seed: Seed, index: number) {
  const [name, type] = seed;
  if (type === "community") return `hello@${slug(name).replace(/-/g, "")}.org`;
  const first = firstName(name).toLowerCase();
  const clash = SEEDS.findIndex((s) => s[1] !== "community" && firstName(s[0]).toLowerCase() === first) !== index;
  return clash ? `${first}.${name.split(" ")[1][0].toLowerCase()}@mail.com` : `${first}@mail.com`;
}

function codeFor(name: string) {
  if (name === "Ada Okafor") return "usr_8F2K91";
  const r = rng(`code:${name}`);
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return `usr_${Array.from({ length: 6 }, () => chars[Math.floor(r() * chars.length)]).join("")}`;
}

const compactCount = (v: number) => (v < 1000 ? `${v}` : `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`);
const money = (v: number) => `$${v.toLocaleString("en-US")}`;

function toRow(seed: Seed, index: number): UserRow {
  const [name, type, , country, status, kyc, badges, lastActive, role] = seed;
  const email = emailFor(seed, index);
  return {
    id: slug(name),
    code: codeFor(name),
    name,
    email,
    type,
    subline: type === "community" ? `Community · ${role}` : `${email} · ${typeLabel(type)}`,
    country,
    status,
    kyc,
    badges,
    lastActive,
  };
}

// Mutable so suspend / reactivate / notes show up across pages until reload
const users: UserRow[] = SEEDS.map(toRow);
const notesById: Record<string, AdminNote[]> = {
  "ada-okafor": [{ id: "n1", author: "Emmanuel John", when: "3 Oct", body: "Verified photographer. Partner for the Lagos Heritage pilot." }],
  "sade-daramola": [
    { id: "n1", author: "Amara O.", when: "15 Oct", body: "Posted Badges under another artist's name. Three reports upheld; KYC documents did not match." },
  ],
  "nana-boateng": [{ id: "n1", author: "Emmanuel John", when: "8 Oct", body: "Chargebacks on four claims in one week. Paystack flagged the card." }],
};
const suspensions: Record<string, Suspension> = {
  "sade-daramola": { reason: "Impersonation", details: "Posted Badges under another artist's name.", by: "Amara O.", when: "15 Oct" },
  "nana-boateng": { reason: "Fraud or payment abuse", details: "Four chargebacks in one week.", by: "Emmanuel John", when: "8 Oct" },
};
const extraActivity: Record<string, ActivityItem[]> = {};

const COMMUNITY_IDS: Record<string, string> = {
  "lagos-heritage-circle": "lagos-heritage-circle",
  "asante-kente-guild": "asante-kente-guild",
  "swahili-coast-keepers": "swahili-coast-keepers",
  "igbo-ukwu-archive": "igbo-ukwu-archive",
  "ekiti-story-keepers": "ekiti-story-keepers",
  "accra-highlife-society": "accra-highlife-society",
  "nairobi-oral-history-circle": "nairobi-oral-history",
  "yoruba-diaspora-london": "yoruba-diaspora-london",
  "gullah-roots-society": "gullah-roots-society",
  "ife-heritage-society": "ife-heritage-society",
};

// Badges with a Cultural Intelligence record, by creator
const CREATOR_BADGES: Record<string, { id: string; title: string }> = {
  "ada-okafor": { id: "golden-hour-sisters", title: "Golden Hour Sisters" },
  "kwabena-asare": { id: "kente-weave-no-4", title: "Kente Weave No. 4" },
  "zawadi-mwangi": { id: "lamu-door-studies", title: "Lamu Door Studies" },
  "obiora-eze": { id: "igbo-ukwu-bronze-vessels", title: "Igbo-Ukwu Bronze Vessels" },
  "tunde-bakare": { id: "egungun-festival-chant", title: "Egungun Festival Chant" },
  "bola-ige": { id: "ofada-rice-recipe", title: "Ofada Rice Recipe" },
  "musa-bello": { id: "durbar-riders", title: "Durbar Riders" },
  "kemi-olatunji": { id: "iwi-ancestral-poem", title: "Iwi Ancestral Poem" },
  "chinwe-okeke": { id: "nsibidi-symbols", title: "Nsibidi Symbols" },
  "yaw-darko": { id: "kente-weaving-steps", title: "Kente Weaving Steps" },
  "fatma-ali": { id: "taarab-song-lyrics", title: "Taarab Song Lyrics" },
  "segun-ade": { id: "jollof-origins", title: "Jollof Origins" },
  "kojo-antwi": { id: "highlife-guitar-tunings", title: "Highlife Guitar Tunings" },
  "njoroge-kariuki": { id: "kikuyu-proverbs", title: "Kikuyu Proverbs" },
  "mary-jackson": { id: "sweetgrass-baskets", title: "Sweetgrass Baskets" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September"];
const BANKS = ["GTBank", "Access Bank", "Zenith", "Ecobank", "Equity Bank", "Barclays", "Wema Bank"];
const DEVICES = ["iPhone", "Android", "Chrome on Mac", "Chrome on Windows"];
const DIAL: Record<string, string> = {
  Nigeria: "+234",
  Ghana: "+233",
  Kenya: "+254",
  "United Kingdom": "+44",
  Senegal: "+221",
  "United States": "+1",
  Tanzania: "+255",
};

const KYC_TEXT: Record<KycStatus, string> = {
  verified: "Verified",
  pending: "Waiting for Dojah",
  not_started: "Not started",
  rejected: "Rejected",
};

function buildProfile(row: UserRow): UserProfile {
  const seed = SEEDS.find((s) => s[0] === row.name)!;
  const [, type, city, country, , , badges, lastActive, role] = seed;
  // Live value, so KYC decisions made in Trust and Safety show here
  const kyc = row.kyc;
  const r = rng(row.id);
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const between = (lo: number, hi: number) => Math.round(lo + r() * (hi - lo));

  const isAda = row.id === "ada-okafor";
  const joinDay = between(2, 20);
  const joinMonth = Math.floor(r() * MONTHS.length);
  const joined = isAda ? "12 March 2026" : `${joinDay} ${MONTHS[joinMonth]} 2026`;
  const last4 = String(between(1000, 9999));
  const bank = pick(BANKS);
  // KYC clears a few days after joining
  const kycDate = isAda ? "14 Mar 2026" : `${joinDay + between(1, 8)} ${MONTHS[joinMonth].slice(0, 3)} 2026`;
  const witnesses = between(800, 52000);
  const earned = type === "collector" ? 0 : between(120, 6000);
  const available = Math.round(earned * (0.05 + r() * 0.15));
  const held = Math.round(earned * r() * 0.05);
  const collectible = Math.round(badges * (0.5 + r() * 0.45));

  let stats: ProfileStat[];
  if (type === "creator") {
    stats = [
      { key: "badges", label: "Badges created", value: `${badges}`, note: `${collectible} Collectible · ${badges - collectible} Contribution`, tip: "Badges this creator has published, split by kind." },
      { key: "honors", label: "Honors received", value: compactCount(between(40, 14000)), note: "Across all Badges", tip: "Honors other people gave this creator's Badges." },
      { key: "earned", label: "Earned on Auvra", value: money(earned), note: `${money(available)} available · ${money(held)} on hold`, tip: "Lifetime earnings from Collectible claims, after Auvra's fee." },
      { key: "witnesses", label: "Witnesses", value: compactCount(witnesses), note: "Last 30 days", tip: "People who viewed this creator's Badges in the last 30 days." },
    ];
  } else if (type === "collector") {
    const claims = between(3, 40);
    stats = [
      { key: "badges", label: "Badges collected", value: `${claims}`, note: `${between(1, claims)} creators supported`, tip: "Collectible editions this person has claimed." },
      { key: "honors", label: "Honors given", value: compactCount(between(20, 900)), note: "Across all Badges", tip: "Honors this person gave to other people's Badges." },
      { key: "earned", label: "Spent on Auvra", value: money(claims * between(40, 220)), note: `Across ${claims} claims`, tip: "Total paid for Collectible claims and plans." },
      { key: "witnesses", label: "Badges witnessed", value: compactCount(between(60, 3000)), note: "Last 30 days", tip: "Badges this person viewed in the last 30 days." },
    ];
  } else if (type === "community") {
    stats = [
      { key: "members", label: "Members", value: role.replace(" members", ""), note: `${between(3, 14)} Keepers`, tip: "People in this community, including its Keepers." },
      { key: "badges", label: "Badges", value: compactCount(badges), note: `${Math.round(badges * 0.8)} verified by Keepers`, tip: "Badges posted to this community." },
      { key: "earned", label: "Earned on Auvra", value: money(earned * 3), note: `${money(available * 3)} available · ${money(held)} on hold`, tip: "Community plan revenue share and Collectible fees." },
      { key: "witnesses", label: "Witnesses", value: compactCount(witnesses * 2), note: "Last 30 days", tip: "People who viewed this community's Badges in the last 30 days." },
    ];
  } else {
    stats = [
      { key: "badges", label: "Badges preserved", value: `${badges}`, note: "In the family Vault", tip: "Badges this family has preserved privately." },
      { key: "members", label: "Family members", value: role.replace("Family of ", ""), note: "Sharing one Vault", tip: "People with access to this family's Vault." },
      { key: "earned", label: "Spent on Auvra", value: money(between(20, 160)), note: "Vault plan to date", tip: "Total paid for the family's Vault plan." },
      { key: "witnesses", label: "Witnesses", value: `${between(4, 60)}`, note: "Last 30 days · family only", tip: "Family members who viewed the Vault in the last 30 days." },
    ];
  }

  const badge = CREATOR_BADGES[row.id];
  const activity: ActivityItem[] = [];
  if (row.id === "ada-okafor") {
    activity.push(
      { id: "a1", kind: "claim", text: "Edition 3 of Golden Hour Sisters claimed by Tolu A.", when: "Today, 10:34 · $180", to: "/app/transactions/TX-20419" },
      { id: "a2", kind: "preserve", text: "Preserved a Collectible: Queens of the Coast", when: "Yesterday" },
      { id: "a3", kind: "withdraw", text: "Withdrew $300 to GTBank ••4417", when: "10 Oct", to: "/app/transactions/TX-19310" },
      { id: "a4", kind: "report", text: "Report on Sacred Mask of Ife dismissed", when: "2 Oct · by Amara O." },
    );
  } else if (type === "creator") {
    if (badge) activity.push({ id: "a1", kind: "publish", text: `Published ${badge.title}`, when: lastActive, to: `/app/culture/badges/${badge.id}` });
    activity.push({ id: "a2", kind: "preserve", text: "Preserved a new Contribution Badge", when: "Last week" });
    if (earned) activity.push({ id: "a3", kind: "withdraw", text: `Withdrew ${money(between(50, 400))} to ${bank} ••${last4}`, when: `${between(1, 18)} Oct`, to: `/app/transactions/TX-${between(10000, 17999)}` });
  } else if (type === "collector") {
    activity.push(
      { id: "a1", kind: "claim", text: `Claimed an edition of ${pick(Object.values(CREATOR_BADGES)).title}`, when: lastActive, to: `/app/transactions/TX-${between(10000, 17999)}` },
      { id: "a2", kind: "preserve", text: "Honored 3 Badges", when: "Last week" },
    );
  } else if (type === "community") {
    activity.push(
      { id: "a1", kind: "publish", text: `${between(2, 12)} Badges verified by Keepers`, when: lastActive, to: COMMUNITY_IDS[row.id] ? `/app/culture/communities/${COMMUNITY_IDS[row.id]}` : undefined },
      { id: "a2", kind: "join", text: `${between(4, 40)} new members joined`, when: "This week" },
    );
  } else {
    activity.push(
      { id: "a1", kind: "preserve", text: "Preserved a family recording", when: lastActive },
      { id: "a2", kind: "join", text: "Invited a family member to the Vault", when: "Last week" },
    );
  }
  activity.push({ id: "a-join", kind: "join", text: `Joined Auvra as a ${typeLabel(type)}`, when: joined });

  return {
    ...row,
    role,
    place: `${city}, ${country}`,
    joined,
    stats: isAda
      ? [
          { ...stats[0], value: "42", note: "38 Collectible · 4 Contribution" },
          { ...stats[1], value: "12.9K" },
          { ...stats[2], value: "$4,820", note: "$403 available · $171 on hold" },
          { ...stats[3], value: "48.2K" },
        ]
      : stats,
    account: {
      phoneMasked: `${DIAL[country] ?? "+234"} ••• ••• ${isAda ? "4417" : last4}`,
      phone: `${DIAL[country] ?? "+234"} ${between(700, 909)} ${between(100, 999)} ${isAda ? "4417" : last4}`,
      kyc: kyc === "verified" ? `Verified ${kycDate}` : KYC_TEXT[kyc],
      payout:
        type === "collector" || type === "family"
          ? { label: "Card (Paystack)", value: `Visa ••${last4}` }
          : { label: "Bank (Paystack)", value: isAda ? "GTBank ••4417 · verified" : `${bank} ••${last4} · ${kyc === "verified" ? "verified" : "unverified"}` },
      plan: type === "community" ? "Community plan · $29/mo" : type === "family" ? "Vault Family · $4.99/mo" : type === "collector" ? "Free" : "Vault Basic · $1.99/mo",
      lastSignIn: isAda ? "Today, 09:41 · iPhone" : `${lastActive} · ${pick(DEVICES)}`,
    },
    activity: [...(extraActivity[row.id] ?? []), ...activity],
    notes: notesById[row.id] ?? [],
    suspension: suspensions[row.id] ?? null,
    communityId: COMMUNITY_IDS[row.id],
  };
}

const KPIS: Kpi[] = [
  { key: "creators", label: "Creators", value: 14920, format: "count", change: 9.4, changeUnit: "%", upIsGood: true, tip: "People who have published at least one Badge." },
  { key: "collectors", label: "Collectors", value: 18330, format: "count", change: 7.1, changeUnit: "%", upIsGood: true, tip: "People who have claimed at least one Collectible edition." },
  { key: "communities", label: "Communities", value: 1284, format: "count", change: 3.4, changeUnit: "%", upIsGood: true, tip: "Community accounts on a Community plan." },
  { key: "families", label: "Families", value: 13676, format: "count", change: 10.2, changeUnit: "%", upIsGood: true, tip: "Family accounts sharing a private Vault." },
  { key: "active", label: "Monthly active", value: 21480, format: "count", changeUnit: "%", upIsGood: true, tip: "People who opened Auvra at least once in the last 30 days.", note: "44.6% of users" },
];

export function matchesUser(u: UserRow, f: Omit<UserFilters, "page">) {
  const q = f.query.trim().toLowerCase();
  if (q && ![u.name, u.email, u.code, u.id].some((v) => v.toLowerCase().includes(q))) return false;
  if (f.type !== "all" && u.type !== f.type) return false;
  if (f.status !== "all" && u.status !== f.status) return false;
  if (f.kyc !== "all" && u.kyc !== f.kyc) return false;
  if (f.country !== "all" && u.country !== f.country) return false;
  return true;
}

export async function getUsers(filters: UserFilters): Promise<UserList> {
  await delay(450);
  const matches = users.filter((u) => matchesUser(u, filters));
  const start = (filters.page - 1) * PAGE_SIZE;
  return {
    kpis: KPIS,
    totalPeople: 48210,
    totalCountries: 63,
    rows: matches.slice(start, start + PAGE_SIZE),
    total: matches.length,
    countries: [...new Set(users.map((u) => u.country))].sort(),
  };
}

// Every match for the current filters (page ignored), for export
export async function getAllUsers(filters: UserFilters): Promise<UserRow[]> {
  await delay(250);
  return users.filter((u) => matchesUser(u, filters));
}

const resolveId = (id: string) => ALIASES[id] ?? id;

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  await delay(400);
  const row = users.find((u) => u.id === resolveId(id));
  return row ? buildProfile(row) : null;
}

const todayLabel = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export async function suspendUser(id: string, reason: string, details: string, by: string) {
  await delay(600);
  const row = users.find((u) => u.id === resolveId(id));
  if (!row) throw new Error("User not found");
  row.status = "suspended";
  suspensions[row.id] = { reason, details, by, when: todayLabel() };
  extraActivity[row.id] = [{ id: `s${Date.now()}`, kind: "suspend", text: `Suspended by ${by}: ${reason}`, when: "Just now" }, ...(extraActivity[row.id] ?? [])];
}

export async function reactivateUser(id: string, by: string) {
  await delay(500);
  const row = users.find((u) => u.id === resolveId(id));
  if (!row) throw new Error("User not found");
  row.status = "active";
  delete suspensions[row.id];
  extraActivity[row.id] = [{ id: `r${Date.now()}`, kind: "reactivate", text: `Reactivated by ${by}`, when: "Just now" }, ...(extraActivity[row.id] ?? [])];
}

// The activity item that links to a transaction, so Transactions can show the same payout or claim the profile lists
export function findTxActivity(txId: string) {
  const to = `/app/transactions/${txId}`;
  for (const row of users) {
    const item = buildProfile(row).activity.find((a) => a.to === to);
    if (item) return { user: row, item };
  }
  return null;
}

// Synchronous lookup for other sections' mock data (Trust and Safety shows the user ID and status)
export const findUserRow = (id: string) => users.find((u) => u.id === resolveId(id)) ?? null;

// KYC decisions in Trust and Safety show on the profile and in the Users KYC filter
export function setUserKyc(id: string, kyc: KycStatus) {
  // The backend updates this when the KYC decision is saved
  const row = users.find((u) => u.id === resolveId(id));
  if (row) row.kyc = kyc;
}

export async function addAdminNote(id: string, body: string, author: string): Promise<AdminNote> {
  await delay(350);
  const key = resolveId(id);
  const note = { id: `n${Date.now()}`, author, when: todayLabel(), body };
  notesById[key] = [...(notesById[key] ?? []), note];
  return note;
}
