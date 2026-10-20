import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, StatusPill } from "../components/ui/controls";
import { Modal } from "../components/ui/modal";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { LoadError } from "../components/business/biParts";
import { BackToCulture, DecisionPill, NotFound, PersonLink } from "../components/culture/ciParts";
import { backState } from "../utils/navigation";
import { DataTable } from "../components/ui/table";
import { claimedCount, getBadgeRecord, setBadgeHidden } from "../data/culturalIntelligence";
import type { BadgeRecord as Badge } from "../data/culturalIntelligence";
import { can, useSessionUser } from "../auth/session";
import { usd } from "../utils/format";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import checkIcon from "../assets/dashboard/card-check.svg";
import noteIcon from "../assets/dashboard/card-note.svg";
import starIcon from "../assets/dashboard/card-star.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import eyeIcon from "../assets/dashboard/eye-14.svg";
import eyeOffIcon from "../assets/dashboard/eye-off-14.svg";

const compact = (v: number) => (v < 1000 ? `${v}` : `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`);

const OUTLINE_BUTTON = "flex h-10 items-center gap-2 rounded-[10px] border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8] disabled:opacity-40";

/* ---------- Hide dialog ---------- */

function HideBadgeModal({ badge, onDone, onClose }: { badge: Badge; onDone: () => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    if (!reason.trim() || busy) return;
    setBusy(true);
    setError(false);
    try {
      await setBadgeHidden(badge.id, true, reason.trim());
      onDone();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Hide this badge?"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-[42px] rounded-[10px] border border-[#eceef2] px-5 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reason.trim() || busy}
            className="h-[42px] min-w-[116px] rounded-[10px] bg-[#dc2626] px-5 text-[13px] font-medium text-white hover:bg-[#b91c1c] disabled:opacity-40"
          >
            {busy ? "Hiding…" : "Hide Badge"}
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-[20px] text-[#6b7180]">
        {badge.title} will disappear from Auvra for everyone except {badge.creator}. Collectors keep what they own. You can unhide it at any time.
      </p>
      <label className="mt-5 block">
        <span className="text-[13px] font-medium text-[#1c1a18]">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Reported as sacred content by the community"
          className="mt-2 w-full resize-none rounded-[12px] bg-[#f4f5f8] px-4 py-3 text-[14px] text-[#1c1a18] outline-none placeholder:text-[#8a8f99] focus:ring-2 focus:ring-[#3310be]/30"
        />
      </label>
      {error && <p className="mt-2 text-[12px] text-[#dc2626]">We couldn't hide the badge. Try again.</p>}
      <p className="mt-4 text-[12px] text-[#6b7180]">The reason is recorded in the audit log.</p>
    </Modal>
  );
}

/* ---------- Cards ---------- */

function Hero({ badge, onToggleHidden, busy }: { badge: Badge; onToggleHidden: () => void; busy: boolean }) {
  const user = useSessionUser();
  const collectible = badge.kind === "collectible";
  // Pages opened from here link back to this badge
  const selfBack = backState(`/app/culture/badges/${badge.id}`, badge.title);
  const stats: { label: string; value: string; to?: string }[] = collectible
    ? [
        { label: "Price", value: usd(badge.price ?? 0), to: can(user, "business") ? "/app/business/collectibles" : undefined },
        { label: "Claimed", value: `${claimedCount(badge.claims ?? [])} of ${badge.editions}` },
        { label: "Honors", value: compact(badge.honors) },
        { label: "Notes", value: badge.notesCount.toLocaleString("en-US") },
      ]
    : [
        { label: "Category", value: badge.category },
        { label: "Community", value: badge.community.name, to: `/app/culture/communities/${badge.community.id}` },
        { label: "Honors", value: compact(badge.honors) },
        { label: "Notes", value: badge.notesCount.toLocaleString("en-US") },
      ];

  return (
    <Card className="flex flex-col gap-5 p-4 md:flex-row">
      {/* Media placeholder until badge media URLs come from the API */}
      <div aria-hidden className="aspect-[4/3] w-full shrink-0 rounded-[12px] bg-[#2a2622] md:aspect-[13/15] md:w-[260px]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-1.5">
          <StatusPill tone="purple">{collectible ? "Collectible Badge" : "Contribution Badge"}</StatusPill>
          {collectible ? <StatusPill tone="green">Provenance verified</StatusPill> : <DecisionPill decision={badge.status} />}
          {badge.hidden && <StatusPill tone="red">Hidden</StatusPill>}
        </div>
        <h2 className="mt-3 text-[24px] font-medium leading-[30px] text-[#1c1a18]">{badge.title}</h2>
        <p className="mt-2 text-[13px] text-[#6b7180]">
          By <PersonLink name={badge.creator} /> · {badge.category} · {badge.city} ·{" "}
          <Link to={`/app/culture/communities/${badge.community.id}`} state={selfBack} className="hover:underline">
            {badge.community.name}
          </Link>{" "}
          · Preserved {badge.preservedOn}
        </p>
        <p className="mt-3 text-[14px] leading-[21px] text-[#1c1a18]">{badge.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="relative min-w-0 rounded-[10px] bg-[#f4f5f8] px-3 py-2.5 has-[a:hover]:bg-[#eceef2]">
              <dt className="text-[11px] text-[#6b7180]">{s.label}</dt>
              <dd className="mt-1 truncate text-[19px] text-[#1c1a18]">
                {s.to ? (
                  // Stretched link: the whole tile is the click target
                  <Link to={s.to} state={selfBack} className="after:absolute after:inset-0 after:rounded-[10px] focus-visible:underline focus-visible:outline-none">
                    {s.value}
                  </Link>
                ) : (
                  s.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2.5 md:mt-auto md:pt-6">
          {collectible ? (
            can(user, "ownership") && (
              <Link to={`/app/ownership?badge=${badge.id}`} className={OUTLINE_BUTTON}>
                <img src={starIcon} alt="" width={14} height={14} />
                Open ownership history
              </Link>
            )
          ) : (
            <Link to={`/app/culture/communities/${badge.community.id}`} state={selfBack} className={OUTLINE_BUTTON}>
              <img src={usersIcon} alt="" width={14} height={14} />
              Open community
            </Link>
          )}
          <button type="button" onClick={onToggleHidden} disabled={busy} className={OUTLINE_BUTTON}>
            <img src={badge.hidden ? eyeIcon : eyeOffIcon} alt="" width={14} height={14} />
            {badge.hidden ? "Unhide Badge" : "Hide Badge"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function ClaimsCard({ badge }: { badge: Badge }) {
  const user = useSessionUser();
  const canSeeTransactions = can(user, "transactions");
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={arrowsIcon} title="Claims" tip={{ title: "Claims", body: "Who claimed each edition and whether the money has been released to the creator." }}>
          {canSeeTransactions && (
            <Link to={`/app/transactions?badge=${badge.id}`} className="text-[12px] font-medium text-[#3310be] hover:underline">
              All transactions
            </Link>
          )}
        </CardHeader>
      </div>
      <div className="mt-4">
        {(badge.claims ?? []).length === 0 ? (
          <p className="px-[17px] pb-5 text-[13px] text-[#6b7180]">No one has claimed an edition yet.</p>
        ) : (
          <DataTable
            head={
              <>
                <th scope="col" className="text-left">Edition</th>
                <th scope="col" className="px-2 text-left">Collector</th>
                <th scope="col" className="px-2 text-right">Paid</th>
                <th scope="col" className="px-2 pl-6 text-left">Status</th>
                <th scope="col" className="text-right">Date</th>
              </>
            }
          >
            {badge.claims!.map((c) => (
              <tr key={c.edition}>
                <th scope="row" className="h-[47px] text-left font-normal">
                  {c.txId && canSeeTransactions ? (
                    <Link to={`/app/transactions/${c.txId}`} state={backState(`/app/culture/badges/${badge.id}`, badge.title)} className="hover:underline" aria-label={`Edition ${c.edition} transaction`}>
                      {c.edition}
                    </Link>
                  ) : (
                    c.edition
                  )}
                </th>
                {/* Grouped rows ("4 collectors") have no single person to open */}
                <td className="px-2">{c.txId ? <PersonLink name={c.collector} /> : c.collector}</td>
                <td className="px-2 text-right">{usd(c.paid, 2)}</td>
                <td className="px-2 pl-6">
                  {c.status === "delivered" ? <StatusPill tone="green">Delivered</StatusPill> : <StatusPill tone="purple">Held until delivery</StatusPill>}
                </td>
                <td className="text-right">{c.date}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </Card>
  );
}

function ChecksCard({ badge }: { badge: Badge }) {
  const checks = badge.checks ?? [];
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={checkIcon} title="Community checks" tip={{ title: "Community checks", body: `What the Keepers of ${badge.community.name} decided about this badge.` }} />
      </div>
      <div className="mt-4">
        {checks.length === 0 ? (
          <p className="px-[17px] pb-5 text-[13px] text-[#6b7180]">No Keeper has been assigned yet. Nudge the community from the review queue.</p>
        ) : (
          <DataTable
            minWidth={440}
            head={
              <>
                <th scope="col" className="text-left">Keeper</th>
                <th scope="col" className="px-2 text-left">Decision</th>
                <th scope="col" className="text-right">When</th>
              </>
            }
          >
            {checks.map((c) => (
              <tr key={c.keeper}>
                <th scope="row" className="h-[52px] text-left font-normal">
                  <PersonLink name={c.keeper} className="block w-fit" />
                  <span className="text-[11px] text-[#6b7180]">{c.role}</span>
                </th>
                <td className="px-2">
                  <DecisionPill decision={c.decision} />
                </td>
                <td className="text-right">{c.when}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </Card>
  );
}

function NotesCard({ notes }: { notes: Badge["notes"] }) {
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={noteIcon} title="Latest Notes" tip={{ title: "Latest Notes", body: "What people are saying about this badge. Reported notes appear in Trust and Safety." }} />
      {notes.length === 0 ? (
        <p className="mt-5 text-[13px] text-[#6b7180]">No notes yet.</p>
      ) : (
        <ul className="mt-5 space-y-5">
          {notes.map((n) => (
            <li key={n.id}>
              <div className="flex items-center gap-3">
                <Avatar name={n.author.replace(".", "")} size={36} color="#3e3a36" />
                <div>
                  <PersonLink name={n.author} className="block w-fit text-[14px] text-[#1c1a18]" />
                  <div className="text-[11px] text-[#6b7180]">{n.when}</div>
                </div>
              </div>
              <p className="mt-2.5 text-[13px] leading-[20px] text-[#1c1a18] sm:pl-12">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function BadgeSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Card className="flex flex-col gap-5 p-4 md:flex-row">
        <Skeleton className="aspect-[4/3] w-full md:aspect-[13/15] md:w-[260px]" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[62px]" />
            ))}
          </div>
        </div>
      </Card>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {[0, 1].map((i) => (
          <Card key={i} className="space-y-4 p-[17px]">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { id: string; badge?: Badge | null; failed?: boolean };

export function BadgeRecord() {
  const { badgeId = "" } = useParams();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [hideOpen, setHideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBadgeRecord(badgeId)
      .then((badge) => !cancelled && setResult({ id: badgeId, badge }))
      .catch(() => !cancelled && setResult({ id: badgeId, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [badgeId, attempt]);

  const loading = result?.id !== badgeId;
  const badge = loading ? undefined : result?.badge;
  usePageTitle("Badge record");
  usePageSubtitle(badge ? badge.title : loading ? "Loading…" : null);

  const setHidden = (hidden: boolean) => setResult((r) => (r?.badge ? { ...r, badge: { ...r.badge, hidden } } : r));

  const toggleHidden = async () => {
    if (!badge) return;
    if (!badge.hidden) {
      setHideOpen(true);
      return;
    }
    setBusy(true);
    try {
      await setBadgeHidden(badge.id, false, "Unhidden from badge record");
      setHidden(false);
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (loading) body = <BadgeSkeleton />;
  else if (result?.failed) body = <LoadError title="We couldn't load this badge" onRetry={() => setAttempt((a) => a + 1)} />;
  else if (!badge) body = <NotFound title="We couldn't find that badge" body="It may have been removed by its creator, or the link is wrong." />;
  else
    body = (
      <div className="space-y-3">
        <Hero badge={badge} onToggleHidden={toggleHidden} busy={busy} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {badge.kind === "collectible" ? <ClaimsCard badge={badge} /> : <ChecksCard badge={badge} />}
          <NotesCard notes={badge.notes} />
        </div>
        {hideOpen && (
          <HideBadgeModal
            badge={badge}
            onClose={() => setHideOpen(false)}
            onDone={() => {
              setHidden(true);
              setHideOpen(false);
            }}
          />
        )}
      </div>
    );

  return (
    <>
      <BackToCulture />
      {body}
    </>
  );
}
