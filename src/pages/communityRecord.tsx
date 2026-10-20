import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { Avatar, PrimaryAction, SegmentedControl } from "../components/ui/controls";
import { Modal } from "../components/ui/modal";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { KpiCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { BackToCulture, DecisionPill, NotFound, PersonLink } from "../components/culture/ciParts";
import { DataTable } from "../components/ui/table";
import { BarList } from "../components/ui/charts";
import { getCommunityRecord, messageCommunity } from "../data/culturalIntelligence";
import type { CommunityRecord as Community } from "../data/culturalIntelligence";
import usersIcon from "../assets/dashboard/card-users.svg";
import globeIcon from "../assets/dashboard/card-globe.svg";
import checkIcon from "../assets/dashboard/card-check.svg";
import sendIcon from "../assets/dashboard/send-16.svg";
import { backState } from "../utils/navigation";

const KPI_ICONS: Record<string, string> = { members: usersIcon, badges: globeIcon, keepers: checkIcon, rate: checkIcon };

// Notification copy is capped so it fits a push message preview
const MESSAGE_MAX = 500;

type Audience = "members" | "keepers";

function MessageModal({ community, onSent, onClose }: { community: Community; onSent: (audience: Audience) => void; onClose: () => void }) {
  const members = community.kpis.find((k) => k.key === "members")?.value ?? 0;
  const [audience, setAudience] = useState<Audience>("members");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const canSend = body.trim().length > 0 && body.length <= MESSAGE_MAX && !busy;

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    setError(false);
    try {
      await messageCommunity(community.id, audience, body.trim());
      onSent(audience);
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Message ${community.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-[42px] rounded-[10px] border border-[#eceef2] px-5 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="h-[42px] min-w-[96px] rounded-[10px] bg-[#1c1a18] px-5 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </>
      }
    >
      <div className="text-[13px] font-medium text-[#1c1a18]">Send to</div>
      <SegmentedControl
        label="Send to"
        className="mt-2"
        value={audience}
        onChange={setAudience}
        options={[
          { value: "members", label: `All members (${members.toLocaleString("en-US")})` },
          { value: "keepers", label: `Keepers only (${community.keepers.length})` },
        ]}
      />
      <label className="mt-5 block">
        <span className="text-[13px] font-medium text-[#1c1a18]">Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Write to the community…"
          className="mt-2 w-full resize-none rounded-[12px] bg-[#f4f5f8] px-4 py-3 text-[14px] text-[#1c1a18] outline-none placeholder:text-[#8a8f99] focus:ring-2 focus:ring-[#3310be]/30"
        />
      </label>
      <div className={`mt-1 text-right text-[11px] ${body.length > MESSAGE_MAX ? "text-[#dc2626]" : "text-[#6b7180]"}`}>
        {body.length}/{MESSAGE_MAX}
      </div>
      {error && <p className="mt-1 text-[12px] text-[#dc2626]">We couldn't send the message. Try again.</p>}
      <p className="mt-3 text-[12px] text-[#6b7180]">Sent as an in-app notification from Auvra. The message is recorded in the audit log.</p>
    </Modal>
  );
}

/* ---------- Cards ---------- */

function VerificationsCard({ data, community }: { data: Community["verifications"]; community: Community }) {
  const back = backState(`/app/culture/communities/${community.id}`, community.name);
  return (
    <Card className="overflow-hidden pt-[13px]">
      <div className="px-[17px]">
        <CardHeader icon={checkIcon} title="Recent verifications" tip={{ title: "Recent verifications", body: "The latest decisions this community's Keepers made on shared culture." }} />
      </div>
      <div className="mt-4">
        {data.length === 0 ? (
          <p className="px-[17px] pb-5 text-[13px] text-[#6b7180]">No decisions yet.</p>
        ) : (
          <DataTable
            minWidth={600}
            head={
              <>
                <th scope="col" className="text-left">Badge</th>
                <th scope="col" className="px-2 text-left">Category</th>
                <th scope="col" className="px-2 text-left">Decision</th>
                <th scope="col" className="px-2 text-left">By</th>
                <th scope="col" className="text-right">When</th>
              </>
            }
          >
            {data.map((v) => (
              <tr key={v.badgeId}>
                <th scope="row" className="h-[47px] text-left font-normal">
                  <Link to={`/app/culture/badges/${v.badgeId}`} state={back} className="hover:underline">
                    {v.badge}
                  </Link>
                </th>
                <td className="px-2">{v.category}</td>
                <td className="px-2">
                  <DecisionPill decision={v.decision} />
                </td>
                <td className="px-2">{v.by}</td>
                <td className="whitespace-nowrap text-right">{v.when}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </Card>
  );
}

function KeepersCard({ data }: { data: Community["keepers"] }) {
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={usersIcon} title="Keepers" tip={{ title: "Keepers", body: "Members trusted to check culture shared under this community, ranked by checks made." }} />
      {data.length === 0 ? (
        <p className="mt-5 text-[13px] text-[#6b7180]">This community has no Keepers yet.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {data.map((k) => (
            <li key={k.name} className="flex items-center gap-3">
              <Avatar name={k.name} size={36} color="#3e3a36" />
              <div className="min-w-0 flex-1">
                <PersonLink name={k.name} className="block w-fit max-w-full truncate text-[14px] text-[#1c1a18]" />
                <div className="truncate text-[11px] text-[#6b7180]">
                  {k.role} · {k.language}
                </div>
              </div>
              <span className="shrink-0 text-[13px] text-[#1c1a18]">{k.checks.toLocaleString("en-US")} checks</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LanguagesCard({ data }: { data: Community["languages"] }) {
  return (
    <Card className="px-[17px] pb-5 pt-[13px]">
      <CardHeader icon={globeIcon} title="Languages preserved" tip={{ title: "Languages preserved", body: "Badges this community has preserved in each language." }} />
      <div className="mt-6">
        <BarList items={data.map((l) => ({ name: l.name, count: l.badges }))} label="Languages preserved" formatValue={(v, i) => (i === 0 ? `${v.toLocaleString("en-US")} Badges` : v.toLocaleString("en-US"))} />
      </div>
    </Card>
  );
}

function CommunitySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {[0, 1].map((i) => (
          <Card key={i} className="space-y-4 p-[17px]">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

type LoadResult = { id: string; community?: Community | null; failed?: boolean };

export function CommunityRecord() {
  const { communityId = "" } = useParams();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCommunityRecord(communityId)
      .then((community) => !cancelled && setResult({ id: communityId, community }))
      .catch(() => !cancelled && setResult({ id: communityId, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [communityId, attempt]);

  // Confirmation fades after a few seconds
  useEffect(() => {
    if (!sentTo) return;
    const t = setTimeout(() => setSentTo(null), 4000);
    return () => clearTimeout(t);
  }, [sentTo]);

  const loading = result?.id !== communityId;
  const community = loading ? undefined : result?.community;
  usePageTitle(community ? community.name : "Community");
  usePageSubtitle(community ? `Community · ${community.place} · ${community.plan}` : loading ? "Loading…" : null);

  let body;
  if (loading) body = <CommunitySkeleton />;
  else if (result?.failed) body = <LoadError title="We couldn't load this community" onRetry={() => setAttempt((a) => a + 1)} />;
  else if (!community) body = <NotFound title="We couldn't find that community" body="It may have been closed, or the link is wrong." />;
  else
    body = (
      <>
        <PageActions>
          <PrimaryAction onClick={() => setMessageOpen(true)}>
            <img src={sendIcon} alt="" width={16} height={16} />
            Message community
          </PrimaryAction>
        </PageActions>
        {messageOpen && (
          <MessageModal
            community={community}
            onClose={() => setMessageOpen(false)}
            onSent={(audience) => {
              setMessageOpen(false);
              setSentTo(audience === "keepers" ? `${community.keepers.length} Keepers` : `all ${community.kpis[0].value.toLocaleString("en-US")} members`);
            }}
          />
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
            {community.kpis.map((k) => (
              <KpiCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <VerificationsCard data={community.verifications} community={community} />
            <KeepersCard data={community.keepers} />
          </div>
          <LanguagesCard data={community.languages} />
        </div>
      </>
    );

  return (
    <>
      <BackToCulture />
      {body}
      <div role="status" className="pointer-events-none fixed bottom-6 right-6 z-40">
        {sentTo && <div className="rounded-[10px] bg-[#1c1a18] px-4 py-3 text-[13px] text-white shadow-[0_12px_32px_rgba(28,26,24,0.18)]">Message sent to {sentTo}.</div>}
      </div>
    </>
  );
}
