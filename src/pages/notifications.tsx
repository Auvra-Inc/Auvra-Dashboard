import { useEffect, useMemo, useState } from "react";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { Card, InfoTip, Skeleton } from "../components/ui/card";
import { Modal } from "../components/ui/modal";
import { StatusPill, TrendBadge } from "../components/ui/controls";
import { DataTable } from "../components/ui/table";
import {
  Bell,
  CalendarClock,
  Check,
  MessageSquareText,
  Pencil,
  Plus,
  Send,
  Smartphone,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  cancelScheduledNotification,
  deleteNotificationTemplate,
  getNotificationTemplates,
  getNotifications,
  NOTIFICATION_AUDIENCES,
  saveNotificationTemplate,
  scheduleNotification,
  sendNotification,
  sendNotificationTest,
  updateScheduledNotification,
} from "../data/notifications";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationDraft,
  NotificationRecord,
  NotificationTab,
  NotificationTemplate,
  ScheduleOptions,
} from "../data/notifications";

const statusTone = {
  Scheduled: "purple",
  Live: "green",
  Sent: "gray",
} as const;

const newDraft = (): NotificationDraft => ({
  title: "",
  message: "",
  channel: "Push notification",
  audience: "All users",
});

function LoadingCard() {
  return (
    <Card className="space-y-4 p-[17px]" aria-busy="true" aria-label="Loading notifications">
      <Skeleton className="h-4 w-1/3" />
      {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-10 w-full" />)}
    </Card>
  );
}

function MetricCard({ label, value, note, trend, icon: Icon, tip }: {
  label: string;
  value: string;
  note: string;
  trend?: number;
  icon: typeof Bell;
  tip: string;
}) {
  return (
    <Card className="px-[14px] pb-[13px] pt-[12px]">
      <div className="flex items-center gap-2">
        <span className="flex size-[22px] items-center justify-center rounded-[6px] bg-[#f4f5f8]"><Icon size={12} /></span>
        <span className="truncate text-[11px] font-medium text-[#6b7180]">{label}</span>
        <InfoTip tip={{ title: label, body: tip }} align="end" />
      </div>
      <div className="mt-[17px] flex flex-wrap items-center gap-2">
        <span className="text-[24px] font-medium leading-[29px] tracking-[-0.4px] text-[#1c1a18]">{value}</span>
        {trend !== undefined && <TrendBadge value={trend} unit={trend > 0 ? "%" : "pts"} good={trend >= 0} />}
      </div>
      <p className="mt-1.5 text-[10px] text-[#8a8f9b]">{note}</p>
    </Card>
  );
}

function TabBar({ value, onChange }: { value: NotificationTab; onChange: (value: NotificationTab) => void }) {
  const tabs: { value: NotificationTab; label: string }[] = [
    { value: "all", label: "All" },
    { value: "scheduled", label: "Scheduled" },
    { value: "templates", label: "Templates" },
  ];
  return (
    <div role="tablist" aria-label="Notification views" className="flex items-center gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-[7px] px-[10px] py-[6px] text-[10px] font-medium ${value === tab.value ? "bg-[#f1f2f5] text-[#1c1a18]" : "text-[#737986] hover:bg-[#f8f9fb]"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function NotificationTable({ rows, onSelect }: { rows: NotificationRecord[]; onSelect: (record: NotificationRecord) => void }) {
  return (
    <DataTable
      minWidth={610}
      head={
        <>
          <th scope="col" className="text-left">Title</th>
          <th scope="col" className="text-left">Channel and audience</th>
          <th scope="col" className="text-left">Status</th>
          <th scope="col" className="text-right">Open rate</th>
          <th scope="col" className="text-right">When</th>
        </>
      }
    >
      {rows.map((row) => (
        <tr
          key={row.id}
          tabIndex={0}
          aria-label={`View notification ${row.title}`}
          onClick={() => onSelect(row)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(row);
            }
          }}
          className="cursor-pointer outline-none hover:bg-[#fbfbfc] focus-visible:bg-[#f8f9fb]"
        >
          <th scope="row" className="h-[48px] max-w-[190px] text-left font-normal">
            <span className="block truncate text-[10px] font-medium text-[#1c1a18]">{row.title}</span>
            <span className="block text-[9px] text-[#8a8f9b]">{row.id}</span>
          </th>
          <td>
            <span className="block text-[9px] text-[#535966]">{row.channel} · {row.audience}</span>
            <span className="block text-[9px] text-[#8a8f9b]">{row.audienceCount.toLocaleString("en-US")} recipients</span>
          </td>
          <td><StatusPill tone={statusTone[row.status]}>{row.status}</StatusPill></td>
          <td className="text-right text-[10px] text-[#535966]">{row.openRate === null ? "—" : `${row.openRate.toFixed(1)}%`}</td>
          <td className="whitespace-nowrap text-right text-[9px] text-[#535966]">{row.when}</td>
        </tr>
      ))}
      {rows.length === 0 && (
        <tr><td colSpan={5} className="h-[110px] text-center text-[11px] text-[#737986]">No notifications in this view yet.</td></tr>
      )}
    </DataTable>
  );
}

function NotificationPreview({ draft }: { draft: NotificationDraft }) {
  return (
    <Card className="h-full p-[14px]">
      <div className="flex items-center gap-2">
        <span className="flex size-[23px] items-center justify-center rounded-[6px] bg-[#f4f5f8]"><Smartphone size={12} /></span>
        <h2 className="text-[11px] font-medium text-[#1c1a18]">Preview</h2>
        <InfoTip tip={{ title: "Notification preview", body: "A preview of how this message will appear on a recipient’s device. The final layout can vary by operating system." }} />
      </div>
      {draft.channel === "Push notification" ? (
        <div className="mx-auto mt-4 flex min-h-[295px] max-w-[172px] items-start justify-center rounded-[25px] border-[5px] border-[#1c1a18] bg-[#dfe6fb] px-2.5 pt-[42px]">
          <div className="w-full">
            <div className="mb-3 text-center text-[20px] font-light text-[#1c1a18]">9:41</div>
            <div className="rounded-[10px] bg-white/95 p-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex size-[16px] items-center justify-center rounded-[5px] bg-[#1c1a18] text-white"><Bell size={9} /></span>
                <span className="text-[8px] font-semibold text-[#1c1a18]">Auvra · now</span>
              </div>
              <p className="mt-1.5 break-words text-[9px] font-semibold leading-[13px] text-[#1c1a18]">{draft.title || "Notification title"}</p>
              <p className="mt-1 break-words text-[8px] leading-[12px] text-[#535966]">{draft.message || "Your message preview will appear here."}</p>
            </div>
          </div>
        </div>
      ) : draft.channel === "Email" ? (
        <div className="mx-auto mt-5 max-w-[290px] rounded-[10px] border border-[#eceef2] bg-white p-4">
          <div className="text-[9px] text-[#8a8f9b]">Auvra · to {draft.audience.toLowerCase()}</div>
          <h3 className="mt-3 text-[13px] font-semibold text-[#1c1a18]">{draft.title || "Email subject"}</h3>
          <p className="mt-2 whitespace-pre-wrap text-[10px] leading-[16px] text-[#535966]">{draft.message || "Your email message preview will appear here."}</p>
          <div className="mt-4 inline-flex h-[28px] items-center rounded-[7px] bg-[#1c1a18] px-3 text-[9px] font-medium text-white">Open Auvra</div>
        </div>
      ) : (
        <div className="mx-auto mt-5 max-w-[250px] rounded-[10px] border border-[#eceef2] bg-[#f8f9fb] p-3">
          <div className="text-[9px] text-[#8a8f9b]">In-app notification</div>
          <div className="mt-2 flex gap-2 rounded-[8px] border border-[#eceef2] bg-white p-2.5">
            <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[#1c1a18] text-white"><Bell size={12} /></span>
            <span className="min-w-0">
              <span className="block break-words text-[9px] font-semibold leading-[13px] text-[#1c1a18]">{draft.title || "Notification title"}</span>
              <span className="mt-1 block break-words text-[8px] leading-[12px] text-[#535966]">{draft.message || "Your message preview will appear here."}</span>
            </span>
          </div>
        </div>
      )}
      <p className="mt-3 text-center text-[9px] text-[#8a8f9b]">{draft.channel} · {draft.audience}</p>
    </Card>
  );
}

function ScheduleModal({
  audience,
  isEditing,
  initialSendAt,
  initialTimeZone,
  initialRepeats,
  onClose,
  onSchedule,
  busy,
  error,
}: {
  audience: NotificationAudience;
  isEditing: boolean;
  initialSendAt: string;
  initialTimeZone: "local" | "wat";
  initialRepeats: ScheduleOptions["repeats"];
  onClose: () => void;
  onSchedule: (options: ScheduleOptions) => void;
  busy: boolean;
  error: string | null;
}) {
  const [date, setDate] = useState(initialSendAt.split("T")[0]);
  const [time, setTime] = useState(initialSendAt.split("T")[1]?.slice(0, 5) ?? "18:00");
  const [timeZone, setTimeZone] = useState<"local" | "wat">(initialTimeZone);
  const [repeats, setRepeats] = useState<ScheduleOptions["repeats"]>(initialRepeats);
  const recipients = NOTIFICATION_AUDIENCES.find((item) => item.value === audience)?.count ?? 0;
  const schedule = () => onSchedule({ sendAt: `${date}T${time}`, timeZone, repeats });

  return (
    <Modal
      title={isEditing ? "Update scheduled notification" : "Schedule notification"}
      onClose={onClose}
      width={470}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={schedule} disabled={busy || !date || !time} className="inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-50">
            <CalendarClock size={12} /> {busy ? "Saving…" : isEditing ? "Save schedule" : "Schedule"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        <label className="text-[10px] font-medium text-[#535966]">Date
          <input aria-label="Schedule date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
        </label>
        <label className="text-[10px] font-medium text-[#535966]">Time
          <input aria-label="Schedule time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-[10px] font-medium text-[#535966]">Time zone</legend>
        <div className="mt-2 space-y-1.5">
          <label className="flex items-center gap-2 rounded-[8px] border border-[#1c1a18] px-2.5 py-2 text-[10px] text-[#1c1a18]">
            <input type="radio" checked={timeZone === "local"} onChange={() => setTimeZone("local")} name="notification-timezone" className="accent-[#1c1a18]" />
            Each person’s local time
          </label>
          <label className="flex items-center gap-2 rounded-[8px] border border-[#eceef2] px-2.5 py-2 text-[10px] text-[#535966]">
            <input type="radio" checked={timeZone === "wat"} onChange={() => setTimeZone("wat")} name="notification-timezone" className="accent-[#1c1a18]" />
            West Africa Time (WAT) for everyone
          </label>
        </div>
      </fieldset>
      <div className="mt-4 divide-y divide-[#eceef2] rounded-[8px] bg-[#f8f9fb] px-2.5">
        <div className="flex justify-between py-2 text-[10px]"><span className="text-[#737986]">Audience</span><span className="font-medium text-[#1c1a18]">{audience} · {recipients.toLocaleString("en-US")}</span></div>
        <div className="flex justify-between py-2 text-[10px]"><span className="text-[#737986]">Opted out</span><span className="text-[#1c1a18]">{Math.round(recipients * 0.081).toLocaleString("en-US")} won’t receive it</span></div>
        <label className="flex items-center justify-between gap-3 py-2 text-[10px]">
          <span className="text-[#737986]">Repeats</span>
          <select value={repeats} onChange={(event) => setRepeats(event.target.value as ScheduleOptions["repeats"])} className="bg-transparent text-right text-[#1c1a18] outline-none">
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-[9px] text-[#8a8f9b]">You can cancel or edit a scheduled notification before it starts sending.</p>
      {error && <p role="alert" className="mt-3 rounded-[8px] bg-[#fdedee] px-3 py-2 text-[10px] text-[#b91c1c]">{error}</p>}
    </Modal>
  );
}

function DetailModal({ notification, onClose, onCancel, onEdit }: { notification: NotificationRecord; onClose: () => void; onCancel: (id: string) => void; onEdit: (notification: NotificationRecord) => void }) {
  return (
    <Modal
      title={notification.title}
      onClose={onClose}
      width={480}
      footer={
        <>
          {notification.status === "Scheduled" && (
            <button type="button" onClick={() => onEdit(notification)} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb]">Edit schedule</button>
          )}
          {notification.status === "Scheduled" && (
            <button type="button" onClick={() => onCancel(notification.id)} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium text-[#b91c1c] hover:bg-[#fff7f7]">Cancel schedule</button>
          )}
          <button type="button" onClick={onClose} className="h-[36px] rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white hover:bg-[#2f2c29]">Done</button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={statusTone[notification.status]}>{notification.status}</StatusPill>
        <span className="text-[9px] text-[#8a8f9b]">{notification.id} · {notification.when}</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-[11px] leading-[18px] text-[#1c1a18]">{notification.message}</p>
      <dl className="mt-4 divide-y divide-[#eceef2] rounded-[9px] bg-[#f8f9fb] px-3">
        <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-[#737986]">Channel</dt><dd className="font-medium text-[#1c1a18]">{notification.channel}</dd></div>
        <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-[#737986]">Audience</dt><dd className="font-medium text-[#1c1a18]">{notification.audience} · {notification.audienceCount.toLocaleString("en-US")}</dd></div>
        <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-[#737986]">Open rate</dt><dd className="font-medium text-[#1c1a18]">{notification.openRate === null ? "Not available yet" : `${notification.openRate.toFixed(1)}%`}</dd></div>
        {notification.status === "Scheduled" && (
          <>
            <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-[#737986]">Time zone</dt><dd className="font-medium text-[#1c1a18]">{notification.timeZone === "wat" ? "West Africa Time (WAT)" : "Each person’s local time"}</dd></div>
            <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-[#737986]">Repeats</dt><dd className="font-medium capitalize text-[#1c1a18]">{notification.repeats ?? "never"}</dd></div>
          </>
        )}
      </dl>
      <p className="mt-3 text-[9px] leading-[14px] text-[#8a8f9b]">Delivery and engagement analytics are demo metrics until connected to the notification service.</p>
    </Modal>
  );
}

function TemplateEditor({ template, onClose, onSave }: { template: NotificationTemplate | null; onClose: () => void; onSave: (value: Omit<NotificationTemplate, "id" | "updated"> & { id?: string }) => void }) {
  const [title, setTitle] = useState(template?.title ?? "");
  const [message, setMessage] = useState(template?.message ?? "");
  const [channel, setChannel] = useState<NotificationChannel>(template?.channel ?? "Push notification");
  const [audience, setAudience] = useState<NotificationAudience>(template?.audience ?? "All users");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveNotificationTemplate({ id: template?.id, title, message, channel, audience });
      onSave({ id: template?.id, title, message, channel, audience });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The template could not be saved.");
      setBusy(false);
    }
  };
  return (
    <Modal
      title={template ? "Edit template" : "New template"}
      onClose={onClose}
      width={520}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium hover:bg-[#f8f9fb]">Cancel</button>
          <button type="button" onClick={() => void submit()} disabled={busy || !title.trim() || !message.trim()} className="h-[36px] rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white disabled:opacity-50">{busy ? "Saving…" : "Save template"}</button>
        </>
      }
    >
      <label className="block text-[10px] font-medium text-[#535966]">Template name
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
      </label>
      <label className="mt-3 block text-[10px] font-medium text-[#535966]">Message
        <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 w-full resize-y rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 py-2 text-[10px] leading-[16px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
      </label>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-[10px] font-medium text-[#535966]">Channel
          <select value={channel} onChange={(event) => setChannel(event.target.value as NotificationChannel)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18]">
            <option>Push notification</option><option>Email</option><option>In-app notification</option>
          </select>
        </label>
        <label className="text-[10px] font-medium text-[#535966]">Audience
          <select value={audience} onChange={(event) => setAudience(event.target.value as NotificationAudience)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18]">
            {NOTIFICATION_AUDIENCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-[10px] text-[#b91c1c]">{error}</p>}
    </Modal>
  );
}

function NotificationComposer({ template, scheduled, onBack, onSent, onScheduled }: {
  template: NotificationTemplate | null;
  scheduled: NotificationRecord | null;
  onBack: () => void;
  onSent: () => void;
  onScheduled: () => void;
}) {
  const [draft, setDraft] = useState<NotificationDraft>(() => {
    const source = scheduled ?? template;
    return source
      ? { title: source.title, message: source.message, channel: source.channel, audience: source.audience }
      : newDraft();
  });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [busy, setBusy] = useState<"test" | "send" | "schedule" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scheduleWhen] = useState(() => {
    if (scheduled?.sendAt) return scheduled.sendAt;
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  });
  const [sendDate, setSendDate] = useState(scheduleWhen.split("T")[0]);
  const [sendTime, setSendTime] = useState(scheduleWhen.split("T")[1]?.slice(0, 5) ?? "18:00");

  const update = <K extends keyof NotificationDraft>(key: K, value: NotificationDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const test = async () => {
    setBusy("test"); setError(null); setNotice(null);
    try {
      await sendNotificationTest(draft);
      setNotice("Test notification sent to your admin account.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The test notification could not be sent.");
    } finally { setBusy(null); }
  };

  const send = async () => {
    setBusy("send"); setError(null); setNotice(null);
    try {
      await sendNotification(draft);
      onSent();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The notification could not be sent.");
    } finally { setBusy(null); }
  };

  const schedule = async (options: ScheduleOptions) => {
    setBusy("schedule"); setError(null);
    try {
      if (scheduled) await updateScheduledNotification(scheduled.id, draft, options);
      else await scheduleNotification(draft, options);
      setScheduleOpen(false);
      onScheduled();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The notification could not be scheduled.");
    } finally { setBusy(null); }
  };

  const canCompose = Boolean(draft.title.trim() && draft.message.trim() && !busy);

  return (
    <div className="space-y-4 pb-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#737986] hover:text-[#1c1a18]"><X size={12} /> Cancel and return to notifications</button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-[-0.4px] text-[#1c1a18]">{scheduled ? "Edit scheduled notification" : "New notification"}</h1>
          <p className="mt-1 text-[10px] text-[#737986]">{scheduled ? "Update the message, audience or delivery time for this scheduled notification." : "Compose a message, choose who receives it, and preview before sending."}</p>
        </div>
        <span className="rounded-[7px] bg-[#f4f5f8] px-2.5 py-1.5 text-[9px] text-[#737986]">Demo mode · no real recipients will be contacted</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.8fr)]">
        <Card className="p-[15px]">
          <div className="flex items-center gap-2">
            <span className="flex size-[23px] items-center justify-center rounded-[6px] bg-[#f4f5f8]"><Bell size={12} /></span>
            <h2 className="text-[11px] font-medium text-[#1c1a18]">Notification</h2>
            <InfoTip tip={{ title: "Notification", body: "Create a push or email message, select a recipient audience and review the live preview before sending." }} />
          </div>
          <label className="mt-4 block text-[10px] font-medium text-[#535966]">Title
            <input maxLength={100} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="A short, clear title" className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18] outline-none placeholder:text-[#a0a4ad] focus:ring-2 focus:ring-[#3310be]/30" />
            <span className="mt-1 block text-right text-[9px] text-[#a0a4ad]">{draft.title.length}/100</span>
          </label>
          <label className="mt-2 block text-[10px] font-medium text-[#535966]">Message
            <textarea maxLength={500} rows={4} value={draft.message} onChange={(event) => update("message", event.target.value)} placeholder="Write a helpful, concise message…" className="mt-1.5 w-full resize-y rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 py-2 text-[10px] leading-[16px] text-[#1c1a18] outline-none placeholder:text-[#a0a4ad] focus:ring-2 focus:ring-[#3310be]/30" />
            <span className="mt-1 block text-right text-[9px] text-[#a0a4ad]">{draft.message.length}/500</span>
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-[10px] font-medium text-[#535966]">Channel
              <select value={draft.channel} onChange={(event) => update("channel", event.target.value as NotificationChannel)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30">
                <option>Push notification</option><option>Email</option><option>In-app notification</option>
              </select>
            </label>
            <label className="text-[10px] font-medium text-[#535966]">Audience
              <select value={draft.audience} onChange={(event) => update("audience", event.target.value as NotificationAudience)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30">
                {NOTIFICATION_AUDIENCES.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count.toLocaleString("en-US")}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-[10px] font-medium text-[#535966]">Send on
              <input aria-label="Send on" type="date" value={sendDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setSendDate(event.target.value)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#535966]" />
            </label>
            <label className="text-[10px] font-medium text-[#535966]">Time (user’s local time)
              <input aria-label="Time (user’s local time)" type="time" value={sendTime} onChange={(event) => setSendTime(event.target.value)} className="mt-1.5 h-[36px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[10px] text-[#535966]" />
            </label>
          </div>
          {notice && <p role="status" className="mt-3 rounded-[8px] bg-[#f0faf3] px-3 py-2 text-[10px] text-[#176b37]">{notice}</p>}
          {error && <p role="alert" className="mt-3 rounded-[8px] bg-[#fdedee] px-3 py-2 text-[10px] text-[#b91c1c]">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {!scheduled && (
              <button type="button" onClick={() => void test()} disabled={!canCompose} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb] disabled:opacity-50">
                <Send size={12} /> {busy === "test" ? "Sending…" : "Send test to me"}
              </button>
            )}
            <button type="button" onClick={() => { setError(null); setScheduleOpen(true); }} disabled={!canCompose} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] px-3 text-[10px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb] disabled:opacity-50">
              <CalendarClock size={12} /> {scheduled ? "Update schedule" : "Schedule"}
            </button>
            {!scheduled && (
              <button type="button" onClick={() => void send()} disabled={!canCompose} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-50">
                <Send size={12} /> {busy === "send" ? "Sending…" : "Send now"}
              </button>
            )}
          </div>
        </Card>
        <NotificationPreview draft={draft} />
      </div>
      {scheduleOpen && (
        <ScheduleModal
          audience={draft.audience}
          isEditing={Boolean(scheduled)}
          initialSendAt={`${sendDate}T${sendTime}`}
          initialTimeZone={scheduled?.timeZone ?? "local"}
          initialRepeats={scheduled?.repeats ?? "never"}
          onClose={() => { if (busy !== "schedule") setScheduleOpen(false); }}
          onSchedule={(options) => void schedule(options)}
          busy={busy === "schedule"}
          error={error}
        />
      )}
    </div>
  );
}

function TemplateTable({ rows, onUse, onEdit, onDelete }: {
  rows: NotificationTemplate[];
  onUse: (template: NotificationTemplate) => void;
  onEdit: (template: NotificationTemplate) => void;
  onDelete: (template: NotificationTemplate) => void;
}) {
  return (
    <DataTable
      minWidth={590}
      head={<><th scope="col" className="text-left">Template</th><th scope="col" className="text-left">Channel and audience</th><th scope="col" className="text-left">Updated</th><th scope="col" className="text-right">Actions</th></>}
    >
      {rows.map((template) => (
        <tr key={template.id}>
          <th scope="row" className="h-[49px] max-w-[200px] text-left font-normal">
            <span className="block truncate text-[10px] font-medium text-[#1c1a18]">{template.title}</span>
            <span className="block truncate text-[9px] text-[#8a8f9b]">{template.message}</span>
          </th>
          <td className="text-[9px] text-[#535966]">{template.channel} · {template.audience}</td>
          <td className="whitespace-nowrap text-[9px] text-[#737986]">{template.updated}</td>
          <td>
            <div className="flex justify-end gap-1">
              <button type="button" onClick={() => onUse(template)} className="rounded-[6px] px-2 py-1 text-[9px] font-medium text-[#3310be] hover:bg-[#f5f2ff]">Use</button>
              <button type="button" aria-label={`Edit ${template.title}`} onClick={() => onEdit(template)} className="rounded-[6px] p-1.5 text-[#737986] hover:bg-[#f4f5f8]"><Pencil size={12} /></button>
              <button type="button" aria-label={`Delete ${template.title}`} onClick={() => onDelete(template)} className="rounded-[6px] p-1.5 text-[#737986] hover:bg-[#fff1f1] hover:text-[#b91c1c]"><Trash2 size={12} /></button>
            </div>
          </td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={4} className="h-[100px] text-center text-[11px] text-[#737986]">No templates yet. Create one to reuse a message.</td></tr>}
    </DataTable>
  );
}

export function Notifications() {
  const [tab, setTab] = useState<NotificationTab>("all");
  const [rows, setRows] = useState<NotificationRecord[] | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [compose, setCompose] = useState(false);
  const [seedTemplate, setSeedTemplate] = useState<NotificationTemplate | null>(null);
  const [editingScheduled, setEditingScheduled] = useState<NotificationRecord | null>(null);
  const [scheduleModal, setScheduleModal] = useState<NotificationRecord | null>(null);
  const [templateModal, setTemplateModal] = useState<NotificationTemplate | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  usePageTitle(compose ? editingScheduled ? "Edit scheduled notification" : "New notification" : "Notifications");
  usePageSubtitle(compose ? "Push, email or in-app" : "Keep people informed and engaged");

  useEffect(() => {
    let active = true;
    void Promise.all([getNotifications(), getNotificationTemplates()])
      .then(([notifications, savedTemplates]) => {
        if (!active) return;
        setRows(notifications);
        setTemplates(savedTemplates);
        setLoadError(false);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [attempt]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    return tab === "scheduled" ? rows.filter((row) => row.status === "Scheduled") : rows;
  }, [rows, tab]);

  const refresh = async () => {
    try {
      const [notifications, savedTemplates] = await Promise.all([getNotifications(), getNotificationTemplates()]);
      setRows(notifications);
      setTemplates(savedTemplates);
      setActionError(null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The notification list could not be refreshed.");
    }
  };

  const cancelSchedule = async (id: string) => {
    try {
      await cancelScheduledNotification(id);
      setScheduleModal(null);
      setNotice("Scheduled notification cancelled.");
      await refresh();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The schedule could not be cancelled.");
    }
  };

  const removeTemplate = async (template: NotificationTemplate) => {
    try {
      await deleteNotificationTemplate(template.id);
      await refresh();
      setNotice("Template deleted.");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The template could not be deleted.");
    }
  };

  if (loadError) {
    return (
      <Card className="flex flex-col items-center px-5 py-14 text-center">
        <div className="text-[15px] font-medium text-[#1c1a18]">We couldn’t load notifications</div>
        <p className="mt-2 max-w-[350px] text-[11px] leading-[17px] text-[#737986]">Check your connection and try again. Nothing has been changed.</p>
        <button type="button" onClick={() => { setLoadError(false); setAttempt((value) => value + 1); }} className="mt-4 h-[34px] rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white">Try again</button>
      </Card>
    );
  }

  if (!rows || !templates) return <LoadingCard />;

  if (compose) {
    return (
      <NotificationComposer
        template={seedTemplate}
        scheduled={editingScheduled}
        onBack={() => { setCompose(false); setSeedTemplate(null); setEditingScheduled(null); setActionError(null); }}
        onSent={() => {
          setCompose(false); setSeedTemplate(null); setEditingScheduled(null); setTab("all"); setNotice("Notification sent. Delivery metrics will appear as they are reported."); void refresh();
        }}
        onScheduled={() => {
          setCompose(false); setSeedTemplate(null); setEditingScheduled(null); setTab("scheduled"); setNotice(editingScheduled ? "Scheduled notification updated." : "Notification scheduled."); void refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-5 pb-5">
      <PageActions>
        <button type="button" onClick={() => { setActionError(null); setEditingScheduled(null); setSeedTemplate(null); setCompose(true); }} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#1c1a18] px-3 text-[10px] font-medium text-white hover:bg-[#2f2c29]">
          <Plus size={13} /> New notification
        </button>
      </PageActions>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-[-0.4px] text-[#1c1a18]">Notifications</h1>
          <p className="mt-1 text-[10px] text-[#737986]">Keep people informed and engaged.</p>
        </div>
      </header>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-[8px] border border-[#d9efdf] bg-[#f0faf3] px-3 py-2 text-[10px] text-[#176b37]">
          <span className="flex items-center gap-2"><Check size={13} />{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}
      {actionError && <p role="alert" className="rounded-[8px] bg-[#fdedee] px-3 py-2 text-[10px] text-[#b91c1c]">{actionError}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sent this month" value="412K" note="vs previous 30 days" trend={8} icon={Send} tip="Total push and email notifications sent during this month." />
        <MetricCard label="Delivered" value="97.8%" note="Of all sends" icon={Check} tip="Share of attempted notifications accepted by the push or email delivery provider." />
        <MetricCard label="Opened" value="31.4%" note="vs previous 30 days" trend={2.1} icon={MessageSquareText} tip="Share of delivered notifications opened by recipients." />
        <MetricCard label="Scheduled" value="3" note="Next: today 18:00" icon={CalendarClock} tip="Notifications scheduled for future delivery. You can cancel or edit one before it starts sending." />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef2] px-[15px] py-[13px]">
          <div className="flex items-center gap-2">
            <span className="flex size-[24px] items-center justify-center rounded-[6px] bg-[#f4f5f8]"><Bell size={12} /></span>
            <h2 className="text-[12px] font-medium text-[#1c1a18]">Notifications</h2>
            <InfoTip tip={{ title: "Notification history", body: "Review sent and scheduled notifications, channels, audiences and engagement metrics. Manage reusable templates from the Templates tab." }} />
          </div>
          <TabBar value={tab} onChange={setTab} />
        </div>
        {tab === "templates" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 px-[15px] py-[10px]">
              <div>
                <h3 className="text-[10px] font-medium text-[#1c1a18]">Templates</h3>
                <p className="mt-0.5 text-[9px] text-[#8a8f9b]">Save, edit and reuse approved messages.</p>
              </div>
              <button type="button" onClick={() => setTemplateModal(null)} className="inline-flex h-[29px] items-center gap-1 rounded-[7px] border border-[#eceef2] px-2.5 text-[9px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb]"><Plus size={11} /> New template</button>
            </div>
            <TemplateTable
              rows={templates}
              onUse={(template) => { setEditingScheduled(null); setSeedTemplate(template); setCompose(true); }}
              onEdit={(template) => setTemplateModal(template)}
              onDelete={(template) => void removeTemplate(template)}
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef2] px-[15px] py-[10px]">
              <div>
                <h3 className="text-[10px] font-medium text-[#1c1a18]">{tab === "scheduled" ? "Scheduled notifications" : "All notifications"}</h3>
                <p className="mt-0.5 text-[9px] text-[#8a8f9b]">Sent, ongoing and upcoming messages across your audiences.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-[#737986]">
                <Users size={12} /> {visibleRows.length} {visibleRows.length === 1 ? "notification" : "notifications"}
              </div>
            </div>
            <NotificationTable rows={visibleRows} onSelect={setScheduleModal} />
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eceef2] px-[15px] py-[9px] text-[9px] text-[#8a8f9b]">
          <span>{tab === "templates" ? `${templates.length} saved templates` : `${visibleRows.length} notification records`}</span>
          <span>Delivery and engagement figures are sample metrics.</span>
        </div>
      </Card>

      {scheduleModal && <DetailModal
        notification={scheduleModal}
        onClose={() => setScheduleModal(null)}
        onCancel={(id) => void cancelSchedule(id)}
        onEdit={(notification) => {
          setScheduleModal(null);
          setActionError(null);
          setEditingScheduled(notification);
          setCompose(true);
        }}
      />}
      {templateModal !== undefined && (
        <TemplateEditor
          template={templateModal}
          onClose={() => setTemplateModal(undefined)}
          onSave={() => {
            setTemplateModal(undefined);
            setNotice(templateModal ? "Template updated." : "Template created.");
            void refresh();
          }}
        />
      )}
    </div>
  );
}
