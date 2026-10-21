export type NotificationChannel = "Push notification" | "Email" | "In-app notification";
export type NotificationStatus = "Scheduled" | "Live" | "Sent";
export type NotificationAudience = "All users" | "Creators" | "Subscribers" | "KYC pending";
export type NotificationTab = "all" | "scheduled" | "templates";

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  audience: NotificationAudience;
  audienceCount: number;
  status: NotificationStatus;
  openRate: number | null;
  when: string;
  sendAt?: string;
  timeZone?: "local" | "wat";
  optOut?: number;
  repeats?: "never" | "daily" | "weekly";
};

export type NotificationTemplate = {
  id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  audience: NotificationAudience;
  updated: string;
};

export type NotificationDraft = Pick<NotificationRecord, "title" | "message" | "channel" | "audience">;
export type ScheduleOptions = { sendAt: string; timeZone: "local" | "wat"; repeats: "never" | "daily" | "weekly" };

export const NOTIFICATION_AUDIENCES: { value: NotificationAudience; label: string; count: number }[] = [
  { value: "All users", label: "All users", count: 48_210 },
  { value: "Creators", label: "Creators", count: 14_380 },
  { value: "Subscribers", label: "Subscribers", count: 9_640 },
  { value: "KYC pending", label: "KYC pending", count: 124 },
];

const records: NotificationRecord[] = [
  {
    id: "NTF-0421", title: "Culture Connect is coming", message: "Guess where a culture comes from, finish proverbs and more. Tap to join the waitlist.",
    channel: "Push notification", audience: "All users", audienceCount: 48_210, status: "Scheduled", openRate: null, when: "Today 18:00",
    sendAt: "2026-10-21T18:00", timeZone: "local", optOut: 3_904, repeats: "never",
  },
  {
    id: "NTF-0418", title: "Your Badge was claimed", message: "A collector just claimed an edition of your Collectible Badge.",
    channel: "Push notification", audience: "Creators", audienceCount: 14_380, status: "Live", openRate: 48.2, when: "Ongoing",
  },
  {
    id: "NTF-0413", title: "Weekly heritage digest", message: "A new week of stories, languages and traditions to explore.",
    channel: "Email", audience: "Subscribers", audienceCount: 9_640, status: "Sent", openRate: 26.9, when: "13 Oct",
  },
  {
    id: "NTF-0410", title: "Verify your identity", message: "Complete identity verification to unlock payouts and creator tools.",
    channel: "Push notification", audience: "KYC pending", audienceCount: 124, status: "Sent", openRate: 39.4, when: "11 Oct",
  },
];

const templates: NotificationTemplate[] = [
  { id: "TPL-01", title: "Product announcement", message: "We have something new for you. Open Auvra to see what’s changed.", channel: "Push notification", audience: "All users", updated: "Updated 18 Oct" },
  { id: "TPL-02", title: "Weekly heritage digest", message: "A new week of stories, languages and traditions to explore.", channel: "Email", audience: "Subscribers", updated: "Updated 13 Oct" },
  { id: "TPL-03", title: "Creator payout update", message: "Your payout status has changed. Open Auvra to review the details.", channel: "Push notification", audience: "Creators", updated: "Updated 10 Oct" },
];

let nextId = 422;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const audienceCount = (audience: NotificationAudience) => NOTIFICATION_AUDIENCES.find((item) => item.value === audience)?.count ?? 0;

export async function getNotifications() {
  await delay(260);
  return [...records].sort((a, b) => b.id.localeCompare(a.id));
}

export async function getNotificationTemplates() {
  await delay(180);
  return [...templates];
}

export async function saveNotificationTemplate(template: Omit<NotificationTemplate, "id" | "updated"> & { id?: string }) {
  await delay(200);
  if (!template.title.trim() || !template.message.trim()) throw new Error("Add a title and message before saving the template.");
  if (template.id) {
    const index = templates.findIndex((item) => item.id === template.id);
    if (index < 0) throw new Error("The template could not be found.");
    templates[index] = { ...templates[index], ...template, id: template.id, updated: "Updated just now" };
    return templates[index];
  }
  const created = { ...template, id: `TPL-${String(templates.length + 1).padStart(2, "0")}`, updated: "Created just now" };
  templates.unshift(created);
  return created;
}

export async function deleteNotificationTemplate(id: string) {
  await delay(160);
  const index = templates.findIndex((template) => template.id === id);
  if (index < 0) throw new Error("The template could not be found.");
  templates.splice(index, 1);
}

export async function sendNotificationTest(draft: NotificationDraft) {
  await delay(250);
  if (!draft.title.trim() || !draft.message.trim()) throw new Error("Add a title and message before sending a test.");
}

export async function sendNotification(draft: NotificationDraft) {
  await delay(300);
  if (!draft.title.trim() || !draft.message.trim()) throw new Error("Add a title and message before sending.");
  const created: NotificationRecord = {
    id: `NTF-${String(nextId++).padStart(4, "0")}`,
    ...draft,
    audienceCount: audienceCount(draft.audience),
    status: "Sent",
    openRate: null,
    when: "Just now",
  };
  records.unshift(created);
  return created;
}

export async function scheduleNotification(draft: NotificationDraft, options: ScheduleOptions) {
  await delay(280);
  if (!draft.title.trim() || !draft.message.trim()) throw new Error("Add a title and message before scheduling.");
  const date = new Date(options.sendAt);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Choose a future date and time.");
  const created: NotificationRecord = {
    id: `NTF-${String(nextId++).padStart(4, "0")}`,
    ...draft,
    audienceCount: audienceCount(draft.audience),
    status: "Scheduled",
    openRate: null,
    when: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date),
    sendAt: options.sendAt,
    timeZone: options.timeZone,
    optOut: Math.round(audienceCount(draft.audience) * 0.081),
    repeats: options.repeats,
  };
  records.unshift(created);
  return created;
}

export async function updateScheduledNotification(id: string, draft: NotificationDraft, options: ScheduleOptions) {
  await delay(250);
  if (!draft.title.trim() || !draft.message.trim()) throw new Error("Add a title and message before scheduling.");
  const date = new Date(options.sendAt);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Choose a future date and time.");
  const index = records.findIndex((record) => record.id === id && record.status === "Scheduled");
  if (index < 0) throw new Error("This notification is no longer scheduled.");
  records[index] = {
    ...records[index],
    ...draft,
    audienceCount: audienceCount(draft.audience),
    when: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date),
    sendAt: options.sendAt,
    timeZone: options.timeZone,
    optOut: Math.round(audienceCount(draft.audience) * 0.081),
    repeats: options.repeats,
  };
  return records[index];
}

export async function cancelScheduledNotification(id: string) {
  await delay(180);
  const index = records.findIndex((record) => record.id === id && record.status === "Scheduled");
  if (index < 0) throw new Error("This notification is no longer scheduled.");
  records.splice(index, 1);
}
