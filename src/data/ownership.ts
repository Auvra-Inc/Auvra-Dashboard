// Ownership response shapes. Replace the mock responses with the ownership API when available.
import { getOwnershipBadgeRecords } from "./culturalIntelligence";
import type { BadgeRecord } from "./culturalIntelligence";

export type ProvenanceStatus = "verified" | "pending" | "disputed" | "removed";
export type DisputeDecision = "creator" | "evidence" | "remove";
export type DisputeStatus = "open" | "evidence_requested" | "resolved" | "removed";

export type OwnershipRecord = {
  badgeId: string;
  title: string;
  kind: BadgeRecord["kind"];
  category: string;
  creator: string;
  community: string;
  owners: string;
  provenance: ProvenanceStatus;
  record: string;
  chain: string;
  editions: number;
  claims: NonNullable<BadgeRecord["claims"]>;
  checks: NonNullable<BadgeRecord["checks"]>;
};

export type OwnershipEvent = {
  id: string;
  badgeId: string;
  text: string;
  by: string;
  when: string;
  kind: "mint" | "transfer" | "sale" | "verified" | "dispute";
  record: string;
};

export type OwnershipDispute = {
  id: string;
  badgeId: string;
  badge: string;
  edition: string;
  claimant: string;
  claimantRole: string;
  creator: string;
  creatorRole: string;
  statement: string;
  response: string;
  claimantEvidence: string[];
  creatorEvidence: string[];
  opened: string;
  status: DisputeStatus;
  salesPaused: boolean;
  audit: { text: string; by: string; when: string }[];
};

const hashPart = (text: string) =>
  [...text].reduce((hash, character) => ((hash * 33) ^ character.charCodeAt(0)) >>> 0, 5381).toString(16).padStart(8, "0");

const recordHash = (id: string) => `0x${hashPart(id)}…${hashPart(`${id}-record`)}`;

const disputes: OwnershipDispute[] = [
  {
    id: "OWN-D-0007",
    badgeId: "queens-of-the-coast",
    badge: "Queens of the Coast",
    edition: "Collectible · 1 of 1",
    claimant: "Bisi Adeyemi",
    claimantRole: "Painter · Ibadan",
    creator: "Kwame Mensah",
    creatorRole: "Musician · Accra",
    statement: "The painting copies her 2019 work “Coast Queens” and asks for the badge to be removed.",
    response: "The work was made from the creator’s grandmother’s photographs in 2025. The creator has shared process photos.",
    claimantEvidence: ["Coast Queens · 2019 original.jpg", "Studio catalogue · 2019.pdf"],
    creatorEvidence: ["Grandmother’s photographs.zip", "Recording session · 2025.mp4"],
    opened: "5 days ago",
    status: "open",
    salesPaused: true,
    audit: [
      { text: "New ownership dispute opened; collectible sales paused.", by: "Ownership system", when: "5 days ago" },
      { text: "Creator submitted process photos and source material.", by: "Kwame Mensah", when: "4 days ago" },
      { text: "Claimant submitted the original work and catalogue entry.", by: "Bisi Adeyemi", when: "3 days ago" },
    ],
  },
];

const resolutions = new Map<string, DisputeDecision>();
const extraAudit = new Map<string, OwnershipDispute["audit"]>();

function liveDispute(dispute: OwnershipDispute): OwnershipDispute {
  const decision = resolutions.get(dispute.id);
  return {
    ...dispute,
    status: decision === "creator" ? "resolved" : decision === "remove" ? "removed" : decision === "evidence" ? "evidence_requested" : dispute.status,
    salesPaused: decision !== "creator" && (dispute.salesPaused || decision === "evidence" || decision === "remove"),
    audit: [...(extraAudit.get(dispute.id) ?? []), ...dispute.audit],
  };
}

export async function getOwnershipRecords(): Promise<OwnershipRecord[]> {
  const badges = await getOwnershipBadgeRecords();
  const currentDisputes = disputes.map(liveDispute);
  return badges.map((badge) => {
    const dispute = currentDisputes.find((item) => item.badgeId === badge.id);
    const claims = badge.claims ?? [];
    const ownerClaim = [...claims].reverse().find((claim) => claim.collector !== "4 collectors" && !/collectors$/.test(claim.collector));
    const owners = ownerClaim?.collector ?? (badge.kind === "contribution" ? badge.community.name : "Available");
    const provenance: ProvenanceStatus =
      dispute?.status === "removed" ? "removed"
        : dispute?.status === "open" || dispute?.status === "evidence_requested" || badge.status === "disputed" ? "disputed"
          : badge.status === "pending" ? "pending" : "verified";
    return {
      badgeId: badge.id,
      title: badge.title,
      kind: badge.kind,
      category: badge.category,
      creator: badge.creator,
      community: badge.community.name,
      owners,
      provenance,
      record: recordHash(badge.id),
      chain: "Polygon",
      editions: badge.editions ?? 1,
      claims,
      checks: badge.checks ?? [],
    };
  });
}

export async function getOwnershipDisputes(): Promise<OwnershipDispute[]> {
  await delay(300);
  return disputes.map(liveDispute);
}

export async function getOwnershipDispute(id: string): Promise<OwnershipDispute | null> {
  await delay(250);
  const key = id.toLowerCase();
  const found = disputes.find((dispute) => dispute.id.toLowerCase() === key || dispute.badgeId === key);
  return found ? liveDispute(found) : null;
}

export async function decideOwnershipDispute(id: string, decision: DisputeDecision, note: string, by: string) {
  await delay(400);
  const dispute = disputes.find((item) => item.id.toLowerCase() === id.toLowerCase() || item.badgeId === id.toLowerCase());
  if (!dispute) throw new Error("Ownership dispute not found.");
  const current = liveDispute(dispute);
  if (current.status === "resolved" || current.status === "removed") throw new Error("This dispute has already been resolved.");
  if (!note.trim()) throw new Error("Add a note to the audit log before confirming.");

  resolutions.set(dispute.id, decision);
  const action = decision === "creator"
    ? "Decision: keep the badge with its creator. Sales resumed."
    : decision === "remove"
      ? "Decision: remove the badge and refund its collectors. Sales remain paused."
      : "Requested more evidence from both parties. Sales remain paused.";
  extraAudit.set(dispute.id, [
    { text: `${action} ${note.trim()}`, by, when: "Just now" },
    ...(extraAudit.get(dispute.id) ?? []),
  ]);
}

export async function getOwnershipHistory(badgeId: string): Promise<OwnershipEvent[]> {
  await delay(180);
  const records = await getOwnershipRecords();
  const record = records.find((item) => item.badgeId === badgeId);
  if (!record) return [];
  const events: OwnershipEvent[] = [
    {
      id: `${badgeId}-mint`,
      badgeId,
      text: `${record.kind === "collectible" ? "Collectible minted" : "Cultural record created"} · ${record.editions} ${record.editions === 1 ? "edition" : "editions"}`,
      by: record.creator,
      when: "Record created",
      kind: "mint",
      record: record.record,
    },
  ];
  for (const claim of record.claims) {
    events.push({
      id: `${badgeId}-${claim.edition}`,
      badgeId,
      text: `${claim.edition} claimed by ${claim.collector}`,
      by: claim.collector,
      when: claim.date,
      kind: "sale",
      record: recordHash(`${badgeId}-${claim.edition}`),
    });
  }
  for (const check of record.checks) {
    events.push({
      id: `${badgeId}-check-${check.keeper}`,
      badgeId,
      text: `Provenance ${check.decision}`,
      by: check.keeper,
      when: check.when,
      kind: "verified",
      record: recordHash(`${badgeId}-${check.keeper}`),
    });
  }
  const dispute = disputes.find((item) => item.badgeId === badgeId);
  if (dispute) {
    events.push({
      id: `${badgeId}-dispute`,
      badgeId,
      text: liveDispute(dispute).status === "open" ? "Ownership dispute opened" : `Dispute ${liveDispute(dispute).status.replace("_", " ")}`,
      by: dispute.claimant,
      when: dispute.opened,
      kind: "dispute",
      record: recordHash(`${badgeId}-dispute`),
    });
  }
  return events;
}

export const OWNERSHIP_METRICS = {
  records: 58_330,
  verified: 56_110,
  openDisputes: 7,
  transfers: 2_904,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
