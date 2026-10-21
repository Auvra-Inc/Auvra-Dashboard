// Shapes of the Cultural Intelligence responses. Values are placeholders until
// GET /api/v1/culture/overview, /culture/badges/:id, /culture/communities/:id and /culture/review exist;
// the backend applies the filters.
import { REGIONS } from "./businessIntelligence";
import type { Kpi, RangeMonths, Region, RegionFilter } from "./businessIntelligence";

export type CiTab = "contribution" | "collectible" | "honors" | "entries";
export type CiFilters = { tab: CiTab; region: RegionFilter; months: RangeMonths };
// Local breakdown inside the "by category" card
export type CategoryArea = "all" | "west" | "east";

export const CI_TABS: { value: CiTab; label: string }[] = [
  { value: "contribution", label: "Contribution Badges" },
  { value: "collectible", label: "Collectible Badges" },
  { value: "honors", label: "Honors and Witnesses" },
  { value: "entries", label: "Cultural entries" },
];

export const CATEGORIES = ["Language", "Story", "Ritual", "Performance", "Artifact", "Food"] as const;
export type Category = (typeof CATEGORIES)[number];

export type VerificationStatus = "verified" | "pending" | "restricted" | "disputed";

export type CommunityRow = { id: string; name: string; place: string; badges: number; verifiers: number; ratePct: number };

export type CiOverview = {
  kpis: Kpi[];
  categoryTitle: string;
  categories: Record<CategoryArea, { name: string; count: number }[]>;
  verification: { verified: number; pending: number; disputed: number };
  languages: { name: string; badges: number; speakers: number; trendPct: number }[];
  communities: CommunityRow[];
  // Collectible tab only: best-selling Collectible Badges
  topCollectibles?: { id: string; title: string; creator: string; claimed: number; editions: number; price: number }[];
};

export type BadgeRecord = {
  id: string;
  title: string;
  kind: "contribution" | "collectible";
  category: string;
  creator: string;
  city: string;
  preservedOn: string;
  description: string;
  status: VerificationStatus;
  hidden: boolean;
  community: { id: string; name: string };
  honors: number;
  notesCount: number;
  // Collectible only
  price?: number;
  editions?: number;
  // Single-edition claims carry their transaction id; grouped rows ("4 collectors") have none
  claims?: { edition: string; collector: string; paid: number; status: "delivered" | "held"; date: string; txId?: string }[];
  // Contribution only: what each assigned Keeper decided
  checks?: { keeper: string; role: string; decision: VerificationStatus | "unchecked"; when: string }[];
  notes: { id: string; author: string; when: string; body: string }[];
};

export type CommunityRecord = {
  id: string;
  name: string;
  place: string;
  plan: string;
  kpis: Kpi[];
  verifications: { badgeId: string; badge: string; category: Category; decision: VerificationStatus; by: string; when: string }[];
  keepers: { name: string; role: string; language: string; checks: number }[];
  languages: { name: string; badges: number }[];
};

export type ReviewItem = {
  badgeId: string;
  badge: string;
  communityId: string;
  community: string;
  category: Category;
  waitingDays: number;
  keepersAssigned: number;
};

export type ReviewQueue = { total: number; items: ReviewItem[] };

/* ---------- Mock data ---------- */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Share of activity in each country, used to scale counts when a region is picked
const REGION_SHARE: Record<Region, number> = { Nigeria: 0.48, Ghana: 0.2, Kenya: 0.14, "United Kingdom": 0.1, "United States": 0.08 };
const PERIOD_SHARE: Record<RangeMonths, number> = { 3: 0.31, 6: 0.57, 12: 1 };

type CommunitySpec = CommunityRow & {
  country: Region;
  plan: string;
  members: number;
  memberChange: number;
  badgeChange: number;
  rateChange: number;
  activeKeepers: number;
  languages: { name: string; badges: number }[];
};

const COMMUNITIES: CommunitySpec[] = [
  {
    id: "lagos-heritage-circle", name: "Lagos Heritage Circle", place: "Lagos, Nigeria", country: "Nigeria", plan: "Community Steward plan",
    badges: 1204, verifiers: 38, ratePct: 92, members: 1240, memberChange: 6.1, badgeChange: 11, rateChange: 2, activeKeepers: 31,
    languages: [{ name: "Yoruba", badges: 612 }, { name: "Igbo", badges: 284 }, { name: "Hausa", badges: 198 }, { name: "Pidgin", badges: 110 }],
  },
  {
    id: "asante-kente-guild", name: "Asante Kente Guild", place: "Kumasi, Ghana", country: "Ghana", plan: "Community Steward plan",
    badges: 986, verifiers: 24, ratePct: 88, members: 860, memberChange: 4.2, badgeChange: 8, rateChange: 1, activeKeepers: 19,
    languages: [{ name: "Twi", badges: 702 }, { name: "Ewe", badges: 166 }, { name: "English", badges: 118 }],
  },
  {
    id: "swahili-coast-keepers", name: "Swahili Coast Keepers", place: "Mombasa, Kenya", country: "Kenya", plan: "Community plan",
    badges: 742, verifiers: 19, ratePct: 81, members: 690, memberChange: 9.4, badgeChange: 14, rateChange: -1, activeKeepers: 15,
    languages: [{ name: "Swahili", badges: 588 }, { name: "Giriama", badges: 96 }, { name: "Arabic", badges: 58 }],
  },
  {
    id: "igbo-ukwu-archive", name: "Igbo-Ukwu Archive", place: "Anambra, Nigeria", country: "Nigeria", plan: "Community plan",
    badges: 615, verifiers: 12, ratePct: 64, members: 410, memberChange: 2.3, badgeChange: 5, rateChange: -4, activeKeepers: 8,
    languages: [{ name: "Igbo", badges: 548 }, { name: "English", badges: 67 }],
  },
  {
    id: "ekiti-story-keepers", name: "Ekiti Story Keepers", place: "Ado-Ekiti, Nigeria", country: "Nigeria", plan: "Community plan",
    badges: 488, verifiers: 9, ratePct: 71, members: 352, memberChange: 3.8, badgeChange: 6, rateChange: 3, activeKeepers: 6,
    languages: [{ name: "Yoruba", badges: 451 }, { name: "English", badges: 37 }],
  },
  {
    id: "accra-highlife-society", name: "Accra Highlife Society", place: "Accra, Ghana", country: "Ghana", plan: "Community plan",
    badges: 402, verifiers: 11, ratePct: 84, members: 515, memberChange: 5.5, badgeChange: 9, rateChange: 2, activeKeepers: 9,
    languages: [{ name: "Ga", badges: 214 }, { name: "Twi", badges: 188 }],
  },
  {
    id: "nairobi-oral-history", name: "Nairobi Oral History Circle", place: "Nairobi, Kenya", country: "Kenya", plan: "Community plan",
    badges: 356, verifiers: 10, ratePct: 79, members: 448, memberChange: 7.1, badgeChange: 12, rateChange: 0, activeKeepers: 7,
    languages: [{ name: "Kikuyu", badges: 162 }, { name: "Swahili", badges: 140 }, { name: "Luo", badges: 54 }],
  },
  {
    id: "yoruba-diaspora-london", name: "Yoruba Diaspora London", place: "London, United Kingdom", country: "United Kingdom", plan: "Community Steward plan",
    badges: 298, verifiers: 8, ratePct: 86, members: 620, memberChange: 3.1, badgeChange: 4, rateChange: 1, activeKeepers: 6,
    languages: [{ name: "Yoruba", badges: 241 }, { name: "English", badges: 57 }],
  },
  {
    id: "gullah-roots-society", name: "Gullah Roots Society", place: "Charleston, United States", country: "United States", plan: "Community plan",
    badges: 214, verifiers: 6, ratePct: 83, members: 305, memberChange: 2.7, badgeChange: 7, rateChange: 2, activeKeepers: 5,
    languages: [{ name: "Gullah", badges: 214 }],
  },
  {
    id: "ife-heritage-society", name: "Ife Heritage Society", place: "Ile-Ife, Nigeria", country: "Nigeria", plan: "Community plan",
    badges: 168, verifiers: 9, ratePct: 88, members: 412, memberChange: 3.9, badgeChange: 6, rateChange: 1, activeKeepers: 7,
    languages: [{ name: "Yoruba", badges: 151 }, { name: "English", badges: 17 }],
  },
];

const LANGUAGES: (CiOverview["languages"][number] & { countries: Region[] })[] = [
  { name: "Yoruba", badges: 3412, speakers: 1208, trendPct: 9, countries: ["Nigeria", "United Kingdom"] },
  { name: "Igbo", badges: 2906, speakers: 1034, trendPct: 7, countries: ["Nigeria"] },
  { name: "Hausa", badges: 1844, speakers: 612, trendPct: 4, countries: ["Nigeria", "Ghana"] },
  { name: "Swahili", badges: 1620, speakers: 588, trendPct: 11, countries: ["Kenya"] },
  { name: "Twi", badges: 1203, speakers: 402, trendPct: 2, countries: ["Ghana"] },
  { name: "Gullah", badges: 214, speakers: 61, trendPct: 6, countries: ["United States"] },
];

const KEEPERS: (CommunityRecord["keepers"][number] & { communityId: string })[] = [
  { communityId: "lagos-heritage-circle", name: "Baba Adewale", role: "Elder", language: "Yoruba", checks: 214 },
  { communityId: "lagos-heritage-circle", name: "Funmi Ojo", role: "Verifier", language: "Yoruba", checks: 168 },
  { communityId: "lagos-heritage-circle", name: "Chidi Ibe", role: "Verifier", language: "Igbo", checks: 121 },
  { communityId: "lagos-heritage-circle", name: "Hauwa Musa", role: "Verifier", language: "Hausa", checks: 96 },
  { communityId: "asante-kente-guild", name: "Nana Boateng", role: "Elder", language: "Twi", checks: 188 },
  { communityId: "asante-kente-guild", name: "Akosua Mensah", role: "Verifier", language: "Twi", checks: 131 },
  { communityId: "asante-kente-guild", name: "Kofi Agyei", role: "Verifier", language: "Ewe", checks: 74 },
  { communityId: "swahili-coast-keepers", name: "Mzee Rashid", role: "Elder", language: "Swahili", checks: 156 },
  { communityId: "swahili-coast-keepers", name: "Amina Said", role: "Verifier", language: "Swahili", checks: 118 },
  { communityId: "igbo-ukwu-archive", name: "Ifeoma Nwankwo", role: "Elder", language: "Igbo", checks: 92 },
  { communityId: "igbo-ukwu-archive", name: "Emeka Obi", role: "Verifier", language: "Igbo", checks: 47 },
  { communityId: "ekiti-story-keepers", name: "Yemi Fasina", role: "Elder", language: "Yoruba", checks: 63 },
  { communityId: "accra-highlife-society", name: "Ama Owusu", role: "Verifier", language: "Ga", checks: 81 },
  { communityId: "nairobi-oral-history", name: "Wanjiru Kamau", role: "Elder", language: "Kikuyu", checks: 77 },
  { communityId: "yoruba-diaspora-london", name: "Bisi Adeyemi", role: "Verifier", language: "Yoruba", checks: 58 },
  { communityId: "gullah-roots-society", name: "Ruth Grant", role: "Elder", language: "Gullah", checks: 44 },
  { communityId: "ife-heritage-society", name: "Adebayo Fakunle", role: "Elder", language: "Yoruba", checks: 52 },
  { communityId: "ife-heritage-society", name: "Morenike Ajayi", role: "Verifier", language: "Yoruba", checks: 29 },
];

type BadgeSpec = Omit<BadgeRecord, "community" | "hidden" | "checks"> & {
  communityId: string;
  decidedBy?: string;
  decidedWhen?: string;
  // Pending badges only
  waitingDays?: number;
  keepersAssigned?: number;
};

const BADGES: BadgeSpec[] = [
  {
    id: "golden-hour-sisters", title: "Golden Hour Sisters", kind: "collectible", category: "Photography", creator: "Ada Okafor", city: "Lagos",
    preservedOn: "2 Sep 2026", description: "A photo series on sisterhood and the joy of dressing together. Limited edition of 10.",
    status: "verified", communityId: "lagos-heritage-circle", honors: 12_900, notesCount: 248, price: 180, editions: 10,
    claims: [
      { edition: "#1", collector: "Kofi Mensah", paid: 215, status: "delivered", date: "22 Sep", txId: "TX-18213" },
      { edition: "#2", collector: "Amaka Nwosu", paid: 215, status: "delivered", date: "2 Oct", txId: "TX-19077" },
      { edition: "#3", collector: "Tolu Adeyemi", paid: 215, status: "held", date: "Today", txId: "TX-20419" },
      { edition: "#4–7", collector: "4 collectors", paid: 860, status: "delivered", date: "Sep–Oct" },
    ],
    notes: [
      { id: "n1", author: "Njeri W.", when: "2 h ago", body: "This reminds me of my sisters getting ready for weddings." },
      { id: "n2", author: "Kwame M.", when: "Yesterday", body: "The colours are beautiful. Which market are the fabrics from?" },
    ],
  },
  {
    id: "kente-weave-no-4", title: "Kente Weave No. 4", kind: "collectible", category: "Textile", creator: "Kwabena Asare", city: "Kumasi",
    preservedOn: "14 Aug 2026", description: "A hand-woven Adweneasa strip, photographed loom to finish. Limited edition of 25.",
    status: "verified", communityId: "asante-kente-guild", honors: 8_420, notesCount: 131, price: 240, editions: 25,
    claims: [
      { edition: "#1–12", collector: "12 collectors", paid: 3_480, status: "delivered", date: "Aug–Sep" },
      { edition: "#13", collector: "Efua Sackey", paid: 290, status: "held", date: "Yesterday", txId: "TX-20288" },
    ],
    notes: [{ id: "n1", author: "Abena K.", when: "3 days ago", body: "My grandfather wove this pattern for the Asantehene." }],
  },
  {
    id: "lamu-door-studies", title: "Lamu Door Studies", kind: "collectible", category: "Photography", creator: "Zawadi Mwangi", city: "Mombasa",
    preservedOn: "28 Jul 2026", description: "Twelve carved Swahili doors from Lamu Old Town, with the stories of the families behind them.",
    status: "verified", communityId: "swahili-coast-keepers", honors: 5_310, notesCount: 87, price: 95, editions: 30,
    claims: [{ edition: "#1–19", collector: "19 collectors", paid: 1_995, status: "delivered", date: "Jul–Oct" }],
    notes: [{ id: "n1", author: "Hassan A.", when: "1 week ago", body: "The second door is my uncle's house." }],
  },
  {
    id: "igbo-ukwu-bronze-vessels", title: "Igbo-Ukwu Bronze Vessels", kind: "contribution", category: "Artifact", creator: "Obiora Eze", city: "Lagos",
    preservedOn: "20 Oct 2026", description: "Notes and photographs of the 9th-century bronze vessels, with the oral history of their discovery.",
    status: "verified", communityId: "lagos-heritage-circle", decidedBy: "Chidi I.", decidedWhen: "Today", honors: 1_204, notesCount: 36,
    notes: [{ id: "n1", author: "Ngozi A.", when: "4 h ago", body: "Please add the names of the families who kept these safe." }],
  },
  {
    id: "egungun-festival-chant", title: "Egungun Festival Chant", kind: "contribution", category: "Ritual", creator: "Tunde Bakare", city: "Lagos",
    preservedOn: "19 Oct 2026", description: "A recording of the opening chant, shared with the permission of the masquerade society.",
    status: "restricted", communityId: "lagos-heritage-circle", decidedBy: "Baba A.", decidedWhen: "Yesterday", honors: 610, notesCount: 12,
    notes: [{ id: "n1", author: "Baba A.", when: "Yesterday", body: "Only initiated members should hear the second verse." }],
  },
  {
    id: "ofada-rice-recipe", title: "Ofada Rice Recipe", kind: "contribution", category: "Food", creator: "Bola Ige", city: "Abeokuta",
    preservedOn: "18 Oct 2026", description: "Ofada rice and ayamase stew the way it is made in Abeokuta, with the market names for each pepper.",
    status: "verified", communityId: "lagos-heritage-circle", decidedBy: "Funmi O.", decidedWhen: "2 days ago", honors: 2_480, notesCount: 64,
    notes: [{ id: "n1", author: "Sade D.", when: "2 days ago", body: "My mother adds locust beans at the very end." }],
  },
  {
    id: "durbar-riders", title: "Durbar Riders", kind: "contribution", category: "Performance", creator: "Musa Bello", city: "Kano",
    preservedOn: "17 Oct 2026", description: "Footage of the Sallah Durbar procession with commentary on the riders' regalia.",
    status: "disputed", communityId: "lagos-heritage-circle", decidedBy: "Hauwa M.", decidedWhen: "3 days ago", honors: 940, notesCount: 21,
    notes: [{ id: "n1", author: "Hauwa M.", when: "3 days ago", body: "Some of the titles in the commentary are wrong. Asking the creator to fix them." }],
  },
  // Reported in Trust and Safety
  {
    id: "sacred-mask-of-ife", title: "Sacred Mask of Ife", kind: "contribution", category: "Ritual", creator: "Ife Heritage Society", city: "Ile-Ife",
    preservedOn: "4 Oct 2026", description: "A ceremonial mask with a story of its use in a closed rite.",
    status: "verified", communityId: "ife-heritage-society", decidedBy: "Morenike A.", decidedWhen: "5 Oct", honors: 2_140, notesCount: 58,
    notes: [{ id: "n1", author: "Adebayo F.", when: "Yesterday", body: "Parts of this rite are not meant to be shown outside the shrine." }],
  },
  {
    id: "market-day", title: "Market Day", kind: "contribution", category: "Story", creator: "Segun Ade", city: "Lagos",
    preservedOn: "9 Oct 2026", description: "A morning at Balogun market told through the traders' calls and greetings.",
    status: "verified", communityId: "lagos-heritage-circle", decidedBy: "Funmi O.", decidedWhen: "10 Oct", honors: 1_380, notesCount: 27,
    notes: [{ id: "n1", author: "Chidi I.", when: "2 days ago", body: "Some of the greetings are Ghanaian, not Yoruba." }],
  },
  {
    id: "queens-of-the-coast", title: "Queens of the Coast", kind: "collectible", category: "Music", creator: "Kwame Mensah", city: "Accra",
    preservedOn: "13 Oct 2026", description: "A highlife recording dedicated to the market queens of Accra. Limited edition of 15.",
    status: "verified", communityId: "accra-highlife-society", honors: 940, notesCount: 18, price: 120, editions: 15,
    claims: [{ edition: "#1–4", collector: "4 collectors", paid: 480, status: "delivered", date: "Oct" }],
    notes: [{ id: "n1", author: "Ama O.", when: "3 days ago", body: "This sounds like a track I heard on the radio years ago." }],
  },
  // Waiting for community review
  {
    id: "iwi-ancestral-poem", title: "Iwi Ancestral Poem", kind: "contribution", category: "Story", creator: "Kemi Olatunji", city: "Ado-Ekiti",
    preservedOn: "11 Oct 2026", description: "An Iwi Egungun poem praising the ancestors of Ado-Ekiti, transcribed with an English gloss.",
    status: "pending", communityId: "ekiti-story-keepers", waitingDays: 9, keepersAssigned: 0, honors: 120, notesCount: 4, notes: [],
  },
  {
    id: "nsibidi-symbols", title: "Nsibidi Symbols", kind: "contribution", category: "Language", creator: "Chinwe Okeke", city: "Awka",
    preservedOn: "13 Oct 2026", description: "Forty Nsibidi symbols with their meanings, drawn from a family notebook.",
    status: "pending", communityId: "igbo-ukwu-archive", waitingDays: 7, keepersAssigned: 1, honors: 310, notesCount: 9, notes: [],
  },
  {
    id: "kente-weaving-steps", title: "Kente Weaving Steps", kind: "contribution", category: "Artifact", creator: "Yaw Darko", city: "Bonwire",
    preservedOn: "15 Oct 2026", description: "Step-by-step photos of setting up a narrow-strip loom.",
    status: "pending", communityId: "asante-kente-guild", waitingDays: 5, keepersAssigned: 2, honors: 205, notesCount: 6, notes: [],
  },
  {
    id: "taarab-song-lyrics", title: "Taarab Song Lyrics", kind: "contribution", category: "Performance", creator: "Fatma Ali", city: "Mombasa",
    preservedOn: "18 Oct 2026", description: "Lyrics of six Taarab songs from the 1970s with notes on the poets.",
    status: "pending", communityId: "swahili-coast-keepers", waitingDays: 2, keepersAssigned: 3, honors: 88, notesCount: 2, notes: [],
  },
  {
    id: "jollof-origins", title: "Jollof Origins", kind: "contribution", category: "Food", creator: "Segun Ade", city: "Lagos",
    preservedOn: "19 Oct 2026", description: "How jollof travelled from the Wolof empire to Lagos kitchens.",
    status: "pending", communityId: "lagos-heritage-circle", waitingDays: 1, keepersAssigned: 2, honors: 402, notesCount: 17, notes: [],
  },
  {
    id: "highlife-guitar-tunings", title: "Highlife Guitar Tunings", kind: "contribution", category: "Performance", creator: "Kojo Antwi", city: "Accra",
    preservedOn: "16 Oct 2026", description: "Open tunings used by palm-wine guitarists, with recordings.",
    status: "pending", communityId: "accra-highlife-society", waitingDays: 4, keepersAssigned: 1, honors: 64, notesCount: 1, notes: [],
  },
  {
    id: "kikuyu-proverbs", title: "Kikuyu Proverbs", kind: "contribution", category: "Language", creator: "Njoroge Kariuki", city: "Nairobi",
    preservedOn: "12 Oct 2026", description: "Thirty proverbs with literal and intended meanings.",
    status: "pending", communityId: "nairobi-oral-history", waitingDays: 8, keepersAssigned: 0, honors: 51, notesCount: 3, notes: [],
  },
  {
    id: "sweetgrass-baskets", title: "Sweetgrass Baskets", kind: "contribution", category: "Artifact", creator: "Mary Jackson", city: "Charleston",
    preservedOn: "17 Oct 2026", description: "Coiling technique for Gullah sweetgrass baskets, passed down five generations.",
    status: "pending", communityId: "gullah-roots-society", waitingDays: 3, keepersAssigned: 1, honors: 96, notesCount: 5, notes: [],
  },
];

const communityById = (id: string) => COMMUNITIES.find((c) => c.id === id);
const shortName = (name: string) => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};

// Sacred Mask of Ife was hidden automatically after its third report
const hiddenBadges = new Set<string>(["sacred-mask-of-ife"]);
const nudged = new Set<string>();

/* ---------- Overview ---------- */

type TabSpec = {
  categoryTitle: string;
  totalLabel: string;
  totalTip: string;
  totalChange: number;
  verifiedLabel: string;
  pendingLabel: string;
  oldestDays: number;
  disputedChange: number;
  peopleLabel: string;
  people: number;
  peoplePool: number;
  verification: CiOverview["verification"];
  categories: number[];
  categoryNames?: string[];
};

const TABS: Record<CiTab, TabSpec> = {
  contribution: {
    categoryTitle: "Badges by category", totalLabel: "Contribution Badges", totalChange: 7.8,
    totalTip: "Culture shared by people on Auvra as free Contribution Badges.",
    verifiedLabel: "Verified by communities", pendingLabel: "Waiting for review", oldestDays: 9, disputedChange: -2.1,
    peopleLabel: "Active Keepers", people: 842, peoplePool: 1190,
    verification: { verified: 24_190, pending: 5_860, disputed: 1_370 },
    categories: [9820, 7340, 5110, 4260, 3080, 1810],
  },
  collectible: {
    categoryTitle: "Collectibles by category", totalLabel: "Collectible Badges", totalChange: 12.4,
    totalTip: "Limited-edition badges that collectors can claim and own.",
    verifiedLabel: "Provenance verified", pendingLabel: "Waiting for provenance", oldestDays: 6, disputedChange: -0.8,
    peopleLabel: "Active collectors", people: 1940, peoplePool: 6210,
    verification: { verified: 4_352, pending: 412, disputed: 96 },
    categories: [1420, 1105, 862, 640, 488, 345],
    categoryNames: ["Photography", "Textile", "Artifact", "Painting", "Music", "Jewellery"],
  },
  honors: {
    categoryTitle: "Honors by category", totalLabel: "Honors given", totalChange: 9.1,
    totalTip: "Honors are how people thank a creator for sharing. Witnesses add a first-hand account.",
    verifiedLabel: "Witness accounts confirmed", pendingLabel: "Witness accounts waiting", oldestDays: 4, disputedChange: -12,
    peopleLabel: "Active honorers", people: 9840, peoplePool: 41_200,
    verification: { verified: 58_900, pending: 4_870, disputed: 440 },
    categories: [48_200, 39_600, 31_100, 28_400, 21_300, 13_800],
  },
  entries: {
    categoryTitle: "Entries by category", totalLabel: "Cultural entries", totalChange: 5.2,
    totalTip: "Words, proverbs and facts added to Auvra's shared cultural record.",
    verifiedLabel: "Verified entries", pendingLabel: "Waiting for review", oldestDays: 12, disputedChange: 1.4,
    peopleLabel: "Active contributors", people: 3410, peoplePool: 41_200,
    verification: { verified: 49_100, pending: 7_420, disputed: 1_780 },
    categories: [22_400, 13_100, 8_300, 6_200, 4_900, 3_400],
  },
};

// Share of each category in West and East Africa, so the two views differ a little
const WEST_SHARE = [0.66, 0.6, 0.71, 0.58, 0.63, 0.69];
const EAST_SHARE = [0.21, 0.27, 0.16, 0.3, 0.22, 0.18];

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export async function getCulturalIntelligence({ tab, region, months }: CiFilters): Promise<CiOverview> {
  // return api.culture.overview({ tab, region, months });
  await delay(650);

  const spec = TABS[tab];
  const regionFactor = region === "all" ? 1 : REGION_SHARE[region];
  const f = regionFactor * PERIOD_SHARE[months];
  const scale = (v: number) => Math.round(v * f);

  const verification = { verified: scale(spec.verification.verified), pending: scale(spec.verification.pending), disputed: scale(spec.verification.disputed) };
  const total = verification.verified + verification.pending + verification.disputed;
  const people = Math.round(spec.people * regionFactor);
  const peoplePool = Math.round(spec.peoplePool * regionFactor);
  const names = spec.categoryNames ?? CATEGORIES;
  const breakdown = (shares?: number[]) =>
    names.map((name, i) => ({ name, count: scale(spec.categories[i] * (shares ? shares[i] : 1)) }));

  const communities = COMMUNITIES.filter((c) => region === "all" || c.country === region).map(({ id, name, place, badges, verifiers, ratePct }) => ({
    id, name, place, badges, verifiers, ratePct,
  }));

  return {
    kpis: [
      { key: "total", label: spec.totalLabel, value: total, format: "count", change: spec.totalChange, changeUnit: "%", upIsGood: true, tip: spec.totalTip },
      {
        key: "verified", label: spec.verifiedLabel, value: verification.verified, format: "count", changeUnit: "%", upIsGood: true,
        note: `${pct(verification.verified, total)}% verification rate`, tip: "Checked and approved by the Keepers of the community the culture belongs to.",
      },
      {
        key: "pending", label: spec.pendingLabel, value: verification.pending, format: "count", changeUnit: "%", upIsGood: false,
        note: `Oldest: ${spec.oldestDays} days`, tip: "Shared but not yet checked by a community. Nudge Keepers when items wait more than 5 days.",
      },
      {
        key: "disputed", label: "Disputed", value: verification.disputed, format: "count", change: spec.disputedChange, changeUnit: "%", upIsGood: false,
        tip: "A Keeper flagged something as inaccurate, uncredited or not meant to be shared. Lower is better.",
      },
      {
        key: "people", label: spec.peopleLabel, value: people, format: "count", changeUnit: "%", upIsGood: true,
        note: `of ${peoplePool.toLocaleString("en-US")} total`, tip: "People who took part in the last 30 days.",
      },
    ],
    categoryTitle: spec.categoryTitle,
    categories: { all: breakdown(), west: breakdown(WEST_SHARE), east: breakdown(EAST_SHARE) },
    verification,
    languages: LANGUAGES.filter((l) => region === "all" || l.countries.includes(region)).map(({ name, badges, speakers, trendPct }) => ({
      name,
      badges: Math.round(badges * PERIOD_SHARE[months]),
      speakers,
      trendPct,
    })),
    communities,
    topCollectibles:
      tab === "collectible"
        ? BADGES.filter((b) => b.kind === "collectible" && (region === "all" || communityById(b.communityId)?.country === region)).map((b) => ({
            id: b.id,
            title: b.title,
            creator: b.creator,
            claimed: claimedCount(b.claims ?? []),
            editions: b.editions ?? 0,
            price: b.price ?? 0,
          }))
        : undefined,
  };
}

// "#4–7" counts as four editions
export function claimedCount(claims: NonNullable<BadgeRecord["claims"]>) {
  return claims.reduce((sum, c) => {
    const m = c.edition.match(/#(\d+)(?:–(\d+))?/);
    return sum + (m ? (m[2] ? Number(m[2]) - Number(m[1]) + 1 : 1) : 0);
  }, 0);
}


/* ---------- Badge record ---------- */

export async function getBadgeRecord(id: string): Promise<BadgeRecord | null> {
  // return api.culture.badge(id);
  await delay(500);
  const b = BADGES.find((x) => x.id === id);
  if (!b) return null;
  const community = communityById(b.communityId)!;
  const keepers = KEEPERS.filter((k) => k.communityId === b.communityId);

  let checks: BadgeRecord["checks"];
  if (b.kind === "contribution") {
    checks =
      b.status === "pending"
        ? keepers.slice(0, b.keepersAssigned ?? 0).map((k) => ({ keeper: k.name, role: k.role, decision: "unchecked" as const, when: "—" }))
        : keepers
            .filter((k) => shortName(k.name) === b.decidedBy)
            .map((k) => ({ keeper: k.name, role: k.role, decision: b.status, when: b.decidedWhen ?? "" }));
  }

  return {
    id: b.id,
    title: b.title,
    kind: b.kind,
    category: b.category,
    creator: b.creator,
    city: b.city,
    preservedOn: b.preservedOn,
    description: b.description,
    status: b.status,
    hidden: hiddenBadges.has(id),
    community: { id: community.id, name: community.name },
    honors: b.honors,
    notesCount: b.notesCount,
    price: b.price,
    editions: b.editions,
    claims: b.claims,
    checks,
    notes: b.notes,
  };
}

export async function getOwnershipBadgeRecords(): Promise<BadgeRecord[]> {
  const records = await Promise.all(BADGES.map((badge) => getBadgeRecord(badge.id)));
  return records.filter((badge): badge is BadgeRecord => badge !== null);
}

export async function setBadgeHidden(id: string, hidden: boolean, reason: string) {
  // return api.culture.setBadgeHidden(id, { hidden, reason }); recorded in the audit log
  await delay(500);
  void reason;
  if (hidden) hiddenBadges.add(id);
  else hiddenBadges.delete(id);
}

// Trust and Safety decisions: restrict to the community, or send back to its Keepers for review
export async function setBadgeStatus(id: string, status: VerificationStatus, by: string) {
  // return api.culture.setBadgeStatus(id, { status }); recorded in the audit log
  await delay(300);
  const b = BADGES.find((x) => x.id === id);
  if (!b) return;
  b.status = status;
  if (status === "pending") {
    b.waitingDays = 0;
    b.keepersAssigned = KEEPERS.filter((k) => k.communityId === b.communityId).length;
  } else {
    b.decidedBy = shortName(by);
    b.decidedWhen = "Just now";
  }
}

/* ---------- Community record ---------- */

export async function getCommunityRecord(id: string): Promise<CommunityRecord | null> {
  // return api.culture.community(id);
  await delay(550);
  const c = communityById(id);
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    place: c.place,
    plan: c.plan,
    kpis: [
      { key: "members", label: "Members", value: c.members, format: "count", change: c.memberChange, changeUnit: "%", upIsGood: true, tip: "People who have joined this community on Auvra." },
      { key: "badges", label: "Badges preserved", value: c.badges, format: "count", change: c.badgeChange, changeUnit: "%", upIsGood: true, tip: "Badges this community has verified and keeps on Auvra." },
      {
        key: "keepers", label: "Keepers", value: c.verifiers, format: "count", changeUnit: "%", upIsGood: true,
        note: `${c.activeKeepers} active this month`, tip: "Members trusted to check culture shared under this community.",
      },
      { key: "rate", label: "Verification rate", value: c.ratePct, format: "pct", change: c.rateChange, changeUnit: "pts", upIsGood: true, tip: "Share of badges checked that the Keepers approved." },
    ],
    verifications: BADGES.filter((b) => b.communityId === id && b.kind === "contribution" && b.status !== "pending").map((b) => ({
      badgeId: b.id,
      badge: b.title,
      category: b.category as Category,
      decision: b.status,
      by: b.decidedBy ?? "",
      when: b.decidedWhen ?? "",
    })),
    keepers: KEEPERS.filter((k) => k.communityId === id).map(({ name, role, language, checks }) => ({ name, role, language, checks })),
    languages: c.languages,
  };
}

export async function messageCommunity(id: string, audience: "members" | "keepers", body: string) {
  // return api.culture.messageCommunity(id, { audience, body });
  await delay(600);
  void id;
  void audience;
  void body;
}

/* ---------- Review queue ---------- */

export async function getReviewQueue(): Promise<ReviewQueue> {
  // return api.culture.review(); the backend pages through the full queue
  await delay(550);
  return {
    total: TABS.contribution.verification.pending,
    items: BADGES.filter((b) => b.status === "pending").map((b) => ({
      badgeId: b.id,
      badge: b.title,
      communityId: b.communityId,
      community: communityById(b.communityId)!.name,
      category: b.category as Category,
      waitingDays: b.waitingDays ?? 0,
      keepersAssigned: b.keepersAssigned ?? 0,
    })),
  };
}

export const isNudged = (badgeId: string) => nudged.has(badgeId);

export async function nudgeKeepers(badgeId: string) {
  // return api.culture.nudge(badgeId); notifies the Keepers, or the whole community when none are assigned
  await delay(500);
  nudged.add(badgeId);
}

// Synchronous lookups so Transactions can name and link the Badge behind a claim
export function badgeSummary(id: string) {
  const b = BADGES.find((x) => x.id === id);
  return b ? { id: b.id, title: b.title, creator: b.creator, price: b.price ?? 0, editions: b.editions ?? 0 } : null;
}
export const findBadgeByTitle = (title: string) => {
  const b = BADGES.find((x) => x.title === title);
  return b ? badgeSummary(b.id) : null;
};

export const COMMUNITY_OPTIONS = COMMUNITIES.map((c) => ({ value: c.id, label: c.name }));
export { REGIONS };
