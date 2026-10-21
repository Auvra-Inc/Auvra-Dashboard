export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
};

const STORAGE_KEY = "auvra_demo_audit_events";

function createSeedEvents(): AuditEvent[] {
  const now = Date.now();
  return [
    { id: "AUD-006", actor: "Emmanuel John", action: "Role updated", target: "Chidi Nwosu", details: "Changed role from Viewer to CFO", createdAt: new Date(now - 1000 * 60 * 18).toISOString() },
    { id: "AUD-005", actor: "Emmanuel John", action: "Settings updated", target: "Notification preferences", details: "Updated email and push notification preferences", createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString() },
    { id: "AUD-004", actor: "Emmanuel John", action: "Invitation sent", target: "tunde@goauvra.com", details: "Invited as Data Analyst; expires in 7 days", createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString() },
    { id: "AUD-003", actor: "Amara Okafor", action: "Signed in", target: "Admin dashboard", details: "Successful sign-in", createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString() },
    { id: "AUD-002", actor: "Emmanuel John", action: "Feature updated", target: "Creator payouts", details: "Feature enabled", createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString() },
    { id: "AUD-001", actor: "Emmanuel John", action: "Invitation revoked", target: "david@goauvra.com", details: "Invitation revoked before acceptance", createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString() },
  ];
}

function readEvents(): AuditEvent[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createSeedEvents();
  try {
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((item) =>
      typeof item === "object" && item !== null &&
      "id" in item && "actor" in item && "action" in item &&
      "target" in item && "details" in item && "createdAt" in item
    )) {
      return parsed as AuditEvent[];
    }
    console.error("Demo audit data has an invalid format; loading the sample audit events.");
  } catch (error) {
    console.error("Demo audit data could not be read; loading the sample audit events.", error);
  }
  return createSeedEvents();
}

let events = readEvents();

function currentActor() {
  const rawUser = localStorage.getItem("auvra_user");
  if (!rawUser) return "Emmanuel John";
  try {
    const user: unknown = JSON.parse(rawUser);
    if (typeof user === "object" && user !== null && "name" in user && typeof user.name === "string") {
      return user.name;
    }
  } catch (error) {
    console.error("The demo session user could not be read for audit attribution.", error);
  }
  return "Admin user";
}

export function getAuditEvents() {
  return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordAuditEvent(action: string, target: string, details: string) {
  const event: AuditEvent = {
    id: `AUD-${Date.now()}`,
    actor: currentActor(),
    action,
    target,
    details,
    createdAt: new Date().toISOString(),
  };
  events = [event, ...events];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  return { ...event };
}
