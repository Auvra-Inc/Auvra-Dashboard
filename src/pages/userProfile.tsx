import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardHeader, InfoTip, Skeleton } from "../components/ui/card";
import { Avatar } from "../components/ui/controls";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { KpiSkeleton, LoadError } from "../components/business/biParts";
import { BackToUsers, KycPill, ReactivateUserModal, SuspendUserModal, UserStatusPill } from "../components/users/userParts";
import { addAdminNote, getUserProfile, reactivateUser, suspendUser, typeLabel } from "../data/users";
import type { ActivityKind, ProfileStat, UserProfile as Profile } from "../data/users";
import { can, useSessionUser } from "../auth/session";
import { kycCheckIdFor } from "../data/trustAndSafety";
import { backState } from "../utils/navigation";
import copyIcon from "../assets/dashboard/card-copy.svg";
import starIcon from "../assets/dashboard/card-star.svg";
import barsIcon from "../assets/dashboard/card-bars.svg";
import eyeIcon from "../assets/dashboard/eye-14.svg";
import usersIcon from "../assets/dashboard/card-users.svg";
import clockIcon from "../assets/dashboard/card-clock.svg";
import noteIcon from "../assets/dashboard/card-note.svg";
import plusIcon from "../assets/dashboard/plus-14.svg";
import flagIcon from "../assets/dashboard/card-flag.svg";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import sparklesIcon from "../assets/dashboard/card-sparkles.svg";
import alertIcon from "../assets/dashboard/card-alert.svg";
import checkIcon from "../assets/dashboard/card-check.svg";
import lockWhiteIcon from "../assets/dashboard/lock-13-white.svg";
import unlockIcon from "../assets/dashboard/unlock-13.svg";
import chevronRightIcon from "../assets/dashboard/chevron-right-13.svg";

const STAT_ICONS: Record<string, string> = { badges: copyIcon, honors: starIcon, earned: barsIcon, witnesses: eyeIcon, members: usersIcon };

const ACTIVITY_ICONS: Record<ActivityKind, string> = {
  claim: starIcon,
  preserve: plusIcon,
  withdraw: arrowsIcon,
  report: flagIcon,
  publish: sparklesIcon,
  join: usersIcon,
  suspend: alertIcon,
  reactivate: checkIcon,
};

/* ---------- Header ---------- */

function ProfileHeader({ user, onAddNote, onSuspend, onReactivate }: { user: Profile; onAddNote: () => void; onSuspend: () => void; onReactivate: () => void }) {
  const meta = [typeLabel(user.type), user.role, user.place, `Joined ${user.joined}`, `ID ${user.code}`];
  // Collectors' role is just "Collector"; skip it so the type isn't repeated
  if (user.type === "collector") meta.splice(1, 1);

  return (
    <Card className="flex flex-wrap items-center justify-between gap-5 p-[21px]">
      <div className="flex min-w-0 items-center gap-[18px]">
        <Avatar name={user.name} size={72} color="#8e2b2b" className="rounded-full text-[22px] font-medium" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-[22px] font-medium tracking-[-0.3px] text-[#1c1a18]">{user.name}</h1>
            <div className="flex gap-1.5">
              <UserStatusPill status={user.status} />
              <KycPill kyc={user.kyc} prefixed />
            </div>
          </div>
          <p className="mt-2 text-[13px] leading-[19px] text-[#6b7180]">
            {meta.join(" · ")}
            {user.communityId && (
              <>
                {" · "}
                <Link to={`/app/culture/communities/${user.communityId}`} state={backState(`/app/users/${user.id}`, user.name)} className="text-[#1c1a18] hover:underline">
                  Open community record
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAddNote}
          className="flex h-10 items-center gap-2 rounded-[10px] border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]"
        >
          <img src={plusIcon} alt="" width={14} height={14} />
          Add note
        </button>
        {user.status === "suspended" ? (
          <button
            type="button"
            onClick={onReactivate}
            className="flex h-10 items-center gap-2 rounded-[10px] border border-[#eceef2] bg-white px-6 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]"
          >
            <img src={unlockIcon} alt="" width={13} height={13} />
            Reactivate user
          </button>
        ) : (
          <button type="button" onClick={onSuspend} className="flex h-10 items-center gap-2 rounded-[10px] bg-[#dc2626] px-6 text-[13px] font-medium text-white hover:bg-[#c21f1f]">
            <img src={lockWhiteIcon} alt="" width={13} height={13} />
            Suspend user
          </button>
        )}
      </div>
    </Card>
  );
}

function SuspendedBanner({ suspension }: { suspension: NonNullable<Profile["suspension"]> }) {
  return (
    <div role="status" className="rounded-[14px] border border-[#f6c9cc] bg-[#fdedee] px-[17px] py-3 text-[13px] text-[#1c1a18]">
      <span className="font-medium text-[#dc2626]">Suspended</span> on {suspension.when} by {suspension.by} · {suspension.reason}
      {suspension.details && <span className="text-[#6b7180]"> — {suspension.details}</span>}
    </div>
  );
}

/* ---------- Stats ---------- */

function StatCard({ stat }: { stat: ProfileStat }) {
  return (
    <Card className="relative px-[15px] pb-[15px] pt-[13px]">
      <div className="pr-6">
        <CardHeader icon={STAT_ICONS[stat.key] ?? copyIcon} title={stat.label} />
      </div>
      <div className="absolute right-[15px] top-[19px] flex">
        <InfoTip tip={{ title: stat.label, body: stat.tip }} align="end" />
      </div>
      <div className="mt-[22px] text-[30px] font-light leading-[36px] tracking-[-0.8px] text-[#1c1a18]">{stat.value}</div>
      <div className="mt-2 text-[11px] text-[#6b7180]">{stat.note}</div>
    </Card>
  );
}

/* ---------- Account ---------- */

// Links to the identity check in Trust and Safety for admins who can review it
function KycValue({ user }: { user: Profile }) {
  const session = useSessionUser();
  const checkId = kycCheckIdFor(user.id);
  if (!checkId || !can(session, "safety")) return <>{user.account.kyc}</>;
  return (
    <>
      {user.account.kyc} ·{" "}
      <Link to={`/app/safety/kyc?status=all&review=${checkId}`} className="hover:underline">
        Open check
      </Link>
    </>
  );
}

function AccountCard({ user }: { user: Profile }) {
  const [revealed, setRevealed] = useState(false);
  const rows: [string, ReactNode][] = [
    ["Email", user.email],
    [
      "Phone",
      revealed ? (
        user.account.phone
      ) : (
        <>
          {user.account.phoneMasked} ·{" "}
          {/* return api.users.revealPhone(user.id) — the backend logs every reveal */}
          <button type="button" onClick={() => setRevealed(true)} className="hover:underline">
            Reveal
          </button>
        </>
      ),
    ],
    ["KYC (Dojah)", <KycValue key="kyc" user={user} />],
    [user.account.payout.label, user.account.payout.value],
    ["Plan", user.account.plan],
    ["Last sign-in", user.account.lastSignIn],
  ];
  return (
    <Card className="px-[17px] pb-6 pt-[13px]">
      <CardHeader icon={usersIcon} title="Account" tip={{ title: "Account", body: "Contact and payment details. Phone numbers stay masked until you reveal them; every reveal is logged." }} />
      <dl className="mt-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-h-[42px] items-center justify-between gap-4 border-b border-[#eceef2] py-2">
            <dt className="shrink-0 text-[11px] text-[#6b7180]">{label}</dt>
            <dd className="min-w-0 break-words text-right text-[13px] text-[#1c1a18]">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ---------- Activity ---------- */

function ActivityCard({ user }: { user: Profile }) {
  const back = backState(`/app/users/${user.id}`, user.name);
  return (
    <Card className="px-[17px] pb-6 pt-[13px]">
      <CardHeader icon={clockIcon} title="Activity" tip={{ title: "Activity", body: "The latest things this account did on Auvra, and admin actions taken on it." }} />
      <ul className="mt-5 space-y-[22px]">
        {user.activity.map((a) => {
          const body = (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#f4f5f8]">
                <img src={ACTIVITY_ICONS[a.kind]} alt="" width={14} height={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-[18px] text-[#1c1a18]">{a.text}</span>
                <span className="mt-0.5 block text-[11px] text-[#6b7180]">{a.when}</span>
              </span>
              {a.to && <img src={chevronRightIcon} alt="" width={13} height={13} className="mt-2 shrink-0 opacity-60" />}
            </>
          );
          return (
            <li key={a.id}>
              {a.to ? (
                <Link to={a.to} state={back} className="-m-1.5 flex items-start gap-3 rounded-[10px] p-1.5 hover:bg-[#f8f9fb]">
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------- Admin notes ---------- */

function NotesCard({ user, inputRef, onAdded }: { user: Profile; inputRef: RefObject<HTMLTextAreaElement | null>; onAdded: (note: Profile["notes"][number]) => void }) {
  const session = useSessionUser();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      onAdded(await addAdminNote(user.id, body, session?.name ?? "Admin"));
      setDraft("");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="px-[17px] pb-6 pt-[13px]">
      <CardHeader icon={noteIcon} title="Admin notes" tip={{ title: "Admin notes", body: "Private notes for other admins. The person never sees them." }} />
      <div className="mt-4 space-y-2.5">
        {user.notes.map((n) => (
          <div key={n.id} className="rounded-[12px] bg-[#f4f5f8] px-3 py-2.5">
            <p className="text-[13px] leading-[18px] text-[#1c1a18]">{n.body}</p>
            <p className="mt-1.5 text-[11px] text-[#6b7180]">
              {n.author} · {n.when}
            </p>
          </div>
        ))}
        <label className="block">
          <span className="sr-only">New admin note</span>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && save()}
            placeholder="Add a note only admins can see"
            className="block min-h-[70px] w-full resize-y rounded-[12px] border border-[#eceef2] bg-white px-[10px] py-[9px] text-[13px] text-[#1c1a18] outline-none placeholder:text-[#a0a5b1] focus:border-[#1c1a18]"
          />
        </label>
        {failed && <p className="text-[12px] text-[#dc2626]">We couldn't save the note. Try again.</p>}
        {draft.trim() && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="h-9 rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save note"}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Loading ---------- */

function ProfileSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Card className="flex items-center gap-[18px] p-[21px]">
        <Skeleton className="size-[72px] rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="space-y-4 p-[17px]">
            <Skeleton className="h-3 w-1/3" />
            {[0, 1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-3 w-full" />
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { id: string; user?: Profile | null; failed?: boolean };

export function UserProfile() {
  const { userId = "" } = useParams();
  const session = useSessionUser();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [dialog, setDialog] = useState<"suspend" | "reactivate" | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    getUserProfile(userId)
      .then((user) => !cancelled && setResult({ id: userId, user }))
      .catch(() => !cancelled && setResult({ id: userId, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const loading = result?.id !== userId;
  const user = loading ? undefined : result?.user;
  usePageTitle(user ? user.name : "User profile");
  usePageSubtitle(user ? `${typeLabel(user.type)} profile` : loading ? "Loading…" : null);

  const reload = () => setAttempt((a) => a + 1);
  const admin = session?.name ?? "Admin";

  let body;
  if (loading) body = <ProfileSkeleton />;
  else if (result?.failed) body = <LoadError title="We couldn't load this profile" onRetry={reload} />;
  else if (!user)
    body = (
      <Card className="flex flex-col items-center px-5 py-14 text-center">
        <div className="text-[17px] font-semibold text-[#1c1a18]">We couldn't find that user</div>
        <div className="mt-2 max-w-[358px] text-[13px] leading-[20px] text-[#6b7180]">The account may have been deleted, or the link is wrong.</div>
        <Link to="/app/users" className="mt-4 flex h-10 items-center rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
          Back to users
        </Link>
      </Card>
    );
  else
    body = (
      <div className="space-y-3">
        <ProfileHeader
          user={user}
          onAddNote={() => {
            noteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            noteRef.current?.focus({ preventScroll: true });
          }}
          onSuspend={() => setDialog("suspend")}
          onReactivate={() => setDialog("reactivate")}
        />
        {user.suspension && <SuspendedBanner suspension={user.suspension} />}
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
          {user.stats.map((s) => (
            <StatCard key={s.key} stat={s} />
          ))}
        </div>
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)_minmax(0,0.93fr)]">
          <AccountCard user={user} />
          <ActivityCard user={user} />
          <NotesCard
            user={user}
            inputRef={noteRef}
            onAdded={(note) => setResult({ id: userId, user: { ...user, notes: [...user.notes, note] } })}
          />
        </div>

        {dialog === "suspend" && (
          <SuspendUserModal
            name={user.name}
            isCommunity={user.type === "community"}
            onClose={() => setDialog(null)}
            onSuspend={async (reason, details) => {
              await suspendUser(user.id, reason, details, admin);
              setDialog(null);
              reload();
            }}
          />
        )}
        {dialog === "reactivate" && (
          <ReactivateUserModal
            name={user.name}
            onClose={() => setDialog(null)}
            onReactivate={async () => {
              await reactivateUser(user.id, admin);
              setDialog(null);
              reload();
            }}
          />
        )}
      </div>
    );

  return (
    <>
      <BackToUsers />
      {body}
    </>
  );
}
