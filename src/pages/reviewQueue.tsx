import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, Skeleton } from "../components/ui/card";
import { SegmentedControl, StatusPill, ToolbarMenu } from "../components/ui/controls";
import type { PillTone } from "../components/ui/controls";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { LoadError } from "../components/business/biParts";
import { BackToCulture } from "../components/culture/ciParts";
import { DataTable } from "../components/ui/table";
import { CATEGORIES, COMMUNITY_OPTIONS, getReviewQueue, isNudged, nudgeKeepers } from "../data/culturalIntelligence";
import type { ReviewItem, ReviewQueue as Queue } from "../data/culturalIntelligence";
import clockIcon from "../assets/dashboard/card-clock.svg";
import checkIcon from "../assets/dashboard/card-check.svg";
import searchIcon from "../assets/dashboard/search-13.svg";
import filterIcon from "../assets/dashboard/filter.svg";
import usersIcon from "../assets/dashboard/users-13.svg";
import sendIcon from "../assets/dashboard/send-13.svg";
import chevronRightIcon from "../assets/dashboard/chevron-right-13.svg";
import { backState } from "../utils/navigation";

// Items waiting this long get a "Nudge Keepers" action instead of "Open"
const NUDGE_AFTER_DAYS = 5;

// Records opened from the queue come back here
const QUEUE_BACK = backState("/app/culture/review", "Waiting for review");

const waitingTone = (days: number): PillTone => (days >= 8 ? "red" : days >= NUDGE_AFTER_DAYS ? "amber" : "gray");

const CATEGORY_OPTIONS = [{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))];
const COMMUNITY_FILTER_OPTIONS = [{ value: "all", label: "All communities" }, ...COMMUNITY_OPTIONS];

const ROW_BUTTON = "inline-flex h-[34px] items-center gap-2 rounded-[8px] border border-[#eceef2] bg-white px-3 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8] disabled:opacity-60";

function RowAction({ item }: { item: ReviewItem }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">(isNudged(item.badgeId) ? "sent" : "idle");

  if (item.waitingDays < NUDGE_AFTER_DAYS) {
    return (
      <Link to={`/app/culture/badges/${item.badgeId}`} state={QUEUE_BACK} className={ROW_BUTTON} aria-label={`Open ${item.badge}`}>
        <img src={chevronRightIcon} alt="" width={13} height={13} />
        Open
      </Link>
    );
  }

  const nudge = async () => {
    setState("sending");
    try {
      await nudgeKeepers(item.badgeId);
      setState("sent");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={nudge}
      disabled={state === "sending" || state === "sent"}
      aria-label={`Nudge Keepers about ${item.badge}`}
      title={item.keepersAssigned === 0 ? "No Keeper assigned yet, so every Keeper in the community is nudged" : undefined}
      className={ROW_BUTTON}
    >
      <img src={state === "sent" ? checkIcon : sendIcon} alt="" width={13} height={13} />
      {state === "sending" ? "Nudging…" : state === "sent" ? "Nudged" : state === "failed" ? "Try again" : "Nudge Keepers"}
    </button>
  );
}

function QueueSkeleton() {
  return (
    <Card className="space-y-5 p-[17px]" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-9 w-full" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </Card>
  );
}

export function ReviewQueue() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"oldest" | "newest">("oldest");
  const [category, setCategory] = useState("all");
  const [community, setCommunity] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getReviewQueue()
      .then((q) => !cancelled && setQueue(q))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  usePageTitle("Waiting for review");
  usePageSubtitle("Badges communities still need to check");

  // Filtering is client-side over the loaded page; the API will take these as query params
  const rows = useMemo(() => {
    if (!queue) return [];
    const q = query.trim().toLowerCase();
    return queue.items
      .filter((i) => (category === "all" || i.category === category) && (community === "all" || i.communityId === community))
      .filter((i) => !q || i.badge.toLowerCase().includes(q) || i.community.toLowerCase().includes(q))
      .sort((a, b) => (order === "oldest" ? b.waitingDays - a.waitingDays : a.waitingDays - b.waitingDays));
  }, [queue, query, order, category, community]);

  const filtered = query.trim() !== "" || category !== "all" || community !== "all";
  const clear = () => {
    setQuery("");
    setCategory("all");
    setCommunity("all");
  };

  let body;
  if (failed) {
    body = (
      <LoadError
        title="We couldn't load the review queue"
        onRetry={() => {
          setFailed(false);
          setAttempt((a) => a + 1);
        }}
      />
    );
  } else if (!queue) {
    body = <QueueSkeleton />;
  } else {
    body = (
      <Card className="overflow-hidden pt-[13px]">
        <div className="px-[17px]">
          <CardHeader
            icon={clockIcon}
            title={`Waiting for community review · ${queue.total.toLocaleString("en-US")}`}
            tip={{ title: "Waiting for community review", body: `Badges shared but not yet checked by a Keeper. Nudge Keepers when a badge has waited ${NUDGE_AFTER_DAYS} days or more.` }}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <label className="flex h-[34px] w-full items-center gap-2 rounded-[8px] bg-[#f4f5f8] px-3 sm:w-[280px]">
              <img src={searchIcon} alt="" width={13} height={13} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Badge or community"
                aria-label="Search Badge or community"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#1c1a18] outline-none placeholder:text-[#8a8f99]"
              />
            </label>
            <SegmentedControl
              label="Order"
              value={order}
              onChange={setOrder}
              options={[
                { value: "oldest", label: "Oldest first" },
                { value: "newest", label: "Newest first" },
              ]}
              className="[&>button]:h-[26px] [&>button]:px-3"
            />
            <div className="flex gap-2.5 sm:ml-auto">
              <ToolbarMenu icon={filterIcon} label="Category" buttonText={category === "all" ? "Category" : category} options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
              <ToolbarMenu
                icon={usersIcon}
                label="Community"
                buttonText={community === "all" ? "Community" : COMMUNITY_OPTIONS.find((c) => c.value === community)?.label}
                options={COMMUNITY_FILTER_OPTIONS}
                value={community}
                onChange={setCommunity}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center border-t border-[#eceef2] px-5 py-12 text-center">
              <div className="text-[15px] font-medium text-[#1c1a18]">{filtered ? "No badges match" : "Nothing waiting"}</div>
              <div className="mt-1.5 text-[13px] text-[#6b7180]">{filtered ? "Try a different search or clear the filters." : "Every badge has been checked by its community."}</div>
              {filtered && (
                <button type="button" onClick={clear} className="mt-4 h-[34px] rounded-[8px] border border-[#eceef2] px-3 text-[12px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <DataTable
              minWidth={760}
              head={
                <>
                  <th scope="col" className="text-left">Badge</th>
                  <th scope="col" className="px-2 text-left">Community</th>
                  <th scope="col" className="px-2 text-left">Category</th>
                  <th scope="col" className="px-2 text-left">Waiting</th>
                  <th scope="col" className="px-2 text-right">Keepers assigned</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </>
              }
            >
              {rows.map((item) => (
                <tr key={item.badgeId}>
                  <th scope="row" className="h-[59px] text-left font-normal">
                    <Link to={`/app/culture/badges/${item.badgeId}`} state={QUEUE_BACK} className="hover:underline">
                      {item.badge}
                    </Link>
                  </th>
                  <td className="px-2">
                    <Link to={`/app/culture/communities/${item.communityId}`} state={QUEUE_BACK} className="hover:underline">
                      {item.community}
                    </Link>
                  </td>
                  <td className="px-2">{item.category}</td>
                  <td className="px-2">
                    <StatusPill tone={waitingTone(item.waitingDays)}>
                      {item.waitingDays} {item.waitingDays === 1 ? "day" : "days"}
                    </StatusPill>
                  </td>
                  <td className="px-2 text-right">{item.keepersAssigned}</td>
                  <td className="text-right">
                    <RowAction item={item} />
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Card>
    );
  }

  return (
    <>
      <BackToCulture />
      {body}
    </>
  );
}
