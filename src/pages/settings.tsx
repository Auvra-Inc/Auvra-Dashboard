import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  Flag,
  KeyRound,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSessionUser, SUPER_ADMIN } from "../auth/session";
import { getAuditEvents, recordAuditEvent } from "../data/audit";
import type { AuditEvent } from "../data/audit";
import { getAdminRoles } from "../data/invitations";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/table";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";

type SettingsTab = "general" | "integrations" | "notifications" | "pricing" | "features" | "team" | "audit";

type SettingsState = {
  general: { appName: string; timezone: string; language: string };
  notifications: { email: boolean; push: boolean; sms: boolean; securityAlerts: boolean };
  pricing: { monthlySubscription: number; vaultFee: number; communityFee: number; payoutFee: number };
  features: { creatorPayouts: boolean; ownershipTransfers: boolean; communitySubscriptions: boolean; aiModeration: boolean };
  integrations: { breet: boolean; fonbnk: boolean; paystack: boolean; elevenlabs: boolean };
};

const DEFAULT_SETTINGS: SettingsState = {
  general: { appName: "Auvra Admin", timezone: "Africa/Lagos", language: "English" },
  notifications: { email: true, push: true, sms: false, securityAlerts: true },
  pricing: { monthlySubscription: 9.99, vaultFee: 5, communityFee: 7.5, payoutFee: 1.5 },
  features: { creatorPayouts: true, ownershipTransfers: true, communitySubscriptions: true, aiModeration: false },
  integrations: { breet: true, fonbnk: true, paystack: true, elevenlabs: false },
};

const SETTINGS_STORAGE_KEY = "auvra_demo_settings";

function readSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<SettingsState>;
    return {
      general: { ...DEFAULT_SETTINGS.general, ...saved.general },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
      pricing: { ...DEFAULT_SETTINGS.pricing, ...saved.pricing },
      features: { ...DEFAULT_SETTINGS.features, ...saved.features },
      integrations: { ...DEFAULT_SETTINGS.integrations, ...saved.integrations },
    };
  } catch (error) {
    console.error("Demo settings could not be loaded; using the sample settings.", error);
    return DEFAULT_SETTINGS;
  }
}

const tabs: { id: SettingsTab; label: string; icon: typeof Settings2 }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "integrations", label: "Integrations", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "pricing", label: "Pricing & fees", icon: CircleDollarSign },
  { id: "features", label: "Feature flags", icon: Flag },
  { id: "team", label: "Team & roles", icon: Users },
  { id: "audit", label: "Audit trail", icon: Activity },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${checked ? "bg-[#3310be]" : "bg-[#c7cad1]"}`}
    >
      <span className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

function SettingRow({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eceef2] py-4 last:border-b-0">
      <div className="min-w-[190px] flex-1">
        <div className="text-[14px] font-medium text-[#1c1a18]">{title}</div>
        {description && <p className="mt-1 text-[12px] leading-[18px] text-[#737986]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-2">
        <h2 className="text-[17px] font-medium text-[#1c1a18]">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-[19px] text-[#737986]">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function SaveButton({ onClick, label = "Save changes" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 inline-flex h-[36px] items-center gap-2 rounded-[8px] bg-[#1c1a18] px-3.5 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
      <Check size={14} />{label}
    </button>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function exportAuditEvents(events: AuditEvent[]) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    ["Timestamp", "Actor", "Action", "Target", "Details"],
    ...events.map((event) => [event.createdAt, event.actor, event.action, event.target, event.details]),
  ];
  const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "auvra-demo-audit-trail.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function AuditTrail() {
  const [events, setEvents] = useState(getAuditEvents);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All actions");
  const actions = [...new Set(events.map((event) => event.action))];
  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesSearch = `${event.actor} ${event.action} ${event.target} ${event.details}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (actionFilter === "All actions" || event.action === actionFilter);
  }), [events, search, actionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-medium text-[#1c1a18]">Administrative activity</h2>
          <p className="mt-1 text-[13px] text-[#737986]">A demo timeline of invitations, role changes, sign-ins and settings updates.</p>
        </div>
        <button type="button" onClick={() => exportAuditEvents(filteredEvents)} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#eceef2] px-3 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f8f9fb]">
          <Download size={14} /> Export CSV
        </button>
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eceef2] p-3.5">
          <label className="relative min-w-[200px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f9b]" />
            <input aria-label="Search audit events" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, actions or details" className="h-[36px] w-full rounded-[8px] border border-[#eceef2] pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
          </label>
          <select aria-label="Filter audit events by action" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-[36px] rounded-[8px] border border-[#eceef2] bg-white px-2.5 text-[13px] text-[#535966]">
            <option>All actions</option>
            {actions.map((action) => <option key={action}>{action}</option>)}
          </select>
          <button type="button" onClick={() => setEvents(getAuditEvents())} className="h-[36px] rounded-[8px] px-2.5 text-[13px] font-medium text-[#535966] hover:bg-[#f8f9fb]">Refresh demo log</button>
        </div>
        <DataTable minWidth={780} head={<><th scope="col" className="text-left">Date & time</th><th scope="col" className="text-left">Actor</th><th scope="col" className="text-left">Action</th><th scope="col" className="text-left">Target / details</th></>}>
          {filteredEvents.map((event) => (
            <tr key={event.id}>
              <td className="h-[58px] whitespace-nowrap text-[12px] text-[#737986]">{formatTimestamp(event.createdAt)}</td>
              <td className="text-[13px] font-medium">{event.actor}</td>
              <td><span className="rounded-[6px] bg-[#f4f5f8] px-2 py-1 text-[12px] font-medium text-[#535966]">{event.action}</span></td>
              <td className="max-w-[340px]">
                <span className="block text-[13px] font-medium text-[#1c1a18]">{event.target}</span>
                <span className="block text-[12px] leading-[17px] text-[#737986]">{event.details}</span>
              </td>
            </tr>
          ))}
          {filteredEvents.length === 0 && <tr><td colSpan={4} className="h-[90px] text-center text-[13px] text-[#737986]">No audit events match this filter.</td></tr>}
        </DataTable>
      </Card>
      <div className="flex items-start gap-2 rounded-[10px] border border-[#f2deb1] bg-[#fffaf0] p-3.5 text-[12px] leading-[18px] text-[#795b16]">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <p><strong>Demo only:</strong> events are stored in this browser and can be changed or cleared by a user. This is not an immutable audit log; production integrity and access restrictions must be enforced by the backend.</p>
      </div>
    </div>
  );
}

export function Settings() {
  const user = useSessionUser();
  const isSuperAdmin = user?.role === SUPER_ADMIN;
  const [settings, setSettings] = useState(readSettings);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auditVersion, setAuditVersion] = useState(0);

  usePageTitle("Settings");
  usePageSubtitle("Manage integrations, pricing, features and account preferences");

  const visibleTabs = tabs.filter((item) => (item.id !== "team" && item.id !== "audit") || isSuperAdmin);
  const update = (next: SettingsState, target: string, details: string) => {
    setError(null);
    setNotice(null);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      recordAuditEvent("Settings updated", target, details);
      setSettings(next);
      setAuditVersion((version) => version + 1);
      setNotice(`${target} saved to this browser's demo settings.`);
    } catch (reason) {
      console.error("Demo settings could not be saved.", reason);
      setError("Could not save the demo settings in this browser. Please try again.");
    }
  };

  const toggle = (section: "notifications" | "features" | "integrations", key: string, value: boolean, label: string) => {
    const next = { ...settings, [section]: { ...settings[section], [key]: value } } as SettingsState;
    update(next, label, `${label} ${value ? "enabled" : "disabled"}`);
  };

  const roles = getAdminRoles();
  return (
    <div className="space-y-4 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-[-0.4px] text-[#1c1a18]">Settings</h1>
          <p className="mt-1 text-[13px] text-[#737986]">Configure the Auvra Admin demo. Changes are saved locally in this browser.</p>
        </div>
        <span className="rounded-[7px] bg-[#fff4d6] px-2.5 py-1.5 text-[12px] font-medium text-[#795b16]">Demo mode · No API connected</span>
      </header>

      {notice && <div role="status" className="rounded-[8px] border border-[#d9efdf] bg-[#f0faf3] px-3 py-2.5 text-[13px] text-[#176b37]">{notice}</div>}
      {error && <p role="alert" className="rounded-[8px] bg-[#fdedee] px-3 py-2.5 text-[13px] text-[#b91c1c]">{error}</p>}

      <div className="flex flex-wrap gap-1 rounded-[10px] bg-[#f4f5f8] p-1" role="tablist" aria-label="Settings sections">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex h-[36px] items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors ${tab === id ? "bg-white text-[#1c1a18] shadow-sm" : "text-[#737986] hover:text-[#1c1a18]"}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <SectionCard title="Application settings" description="Basic product metadata and regional defaults for the admin workspace.">
          <SettingRow title="Application name" description="Name shown in the administration workspace.">
            <input aria-label="Application name" value={settings.general.appName} onChange={(event) => setSettings({ ...settings, general: { ...settings.general, appName: event.target.value } })} className="h-[36px] w-full max-w-[260px] rounded-[8px] border border-[#eceef2] px-2.5 text-[13px]" />
          </SettingRow>
          <SettingRow title="Default timezone" description="Used when displaying dates and scheduling administrative activity.">
            <select aria-label="Default timezone" value={settings.general.timezone} onChange={(event) => setSettings({ ...settings, general: { ...settings.general, timezone: event.target.value } })} className="h-[36px] w-full max-w-[260px] rounded-[8px] border border-[#eceef2] bg-white px-2.5 text-[13px]">
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option>
            </select>
          </SettingRow>
          <SettingRow title="Dashboard language">
            <select aria-label="Dashboard language" value={settings.general.language} onChange={(event) => setSettings({ ...settings, general: { ...settings.general, language: event.target.value } })} className="h-[36px] w-full max-w-[260px] rounded-[8px] border border-[#eceef2] bg-white px-2.5 text-[13px]">
              <option>English</option><option>French</option><option>Portuguese</option>
            </select>
          </SettingRow>
          <SaveButton onClick={() => update(settings, "Application settings", `Updated app name, timezone or language (${settings.general.appName}, ${settings.general.timezone}, ${settings.general.language})`)} />
        </SectionCard>
      )}

      {tab === "integrations" && (
        <div className="space-y-4">
          <SectionCard title="Payment and product integrations" description="Demo connection states only. API credentials are not entered or stored here.">
            {([
              ["breet", "Breet", "Crypto-to-fiat payouts"],
              ["fonbnk", "Fonbnk", "Mobile money and digital cash"],
              ["paystack", "Paystack", "Card and bank payments"],
              ["elevenlabs", "ElevenLabs", "AI voice and audio tools"],
            ] as const).map(([key, name, description]) => (
              <SettingRow key={key} title={name} description={`${description} · Demo connection status`}>
                <div className="flex items-center gap-3">
                  <span className={`text-[12px] font-medium ${settings.integrations[key] ? "text-[#176b37]" : "text-[#737986]"}`}>{settings.integrations[key] ? "Connected (demo)" : "Disconnected"}</span>
                  <Toggle checked={settings.integrations[key]} label={`${name} demo connection`} onChange={(value) => toggle("integrations", key, value, `${name} integration`)} />
                </div>
              </SettingRow>
            ))}
          </SectionCard>
          <div className="flex items-start gap-2 rounded-[10px] border border-[#f2deb1] bg-[#fffaf0] p-3.5 text-[12px] leading-[18px] text-[#795b16]">
            <KeyRound size={15} className="mt-0.5 shrink-0" />
            <p>Connection switches only change the demo display. Configure real credentials through the secure backend integration flow when its endpoints are available.</p>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <SectionCard title="Admin notification preferences" description="Choose which operational updates administrators receive in the demo.">
          {([
            ["email", "Email notifications", "Receive operational summaries and account updates."],
            ["push", "Push notifications", "Show urgent admin alerts in the dashboard."],
            ["sms", "SMS notifications", "Send high-priority notifications by text message."],
            ["securityAlerts", "Security alerts", "Notify administrators about sign-ins and access changes."],
          ] as const).map(([key, label, description]) => (
            <SettingRow key={key} title={label} description={description}>
              <Toggle checked={settings.notifications[key]} label={label} onChange={(value) => toggle("notifications", key, value, label)} />
            </SettingRow>
          ))}
        </SectionCard>
      )}

      {tab === "pricing" && (
        <SectionCard title="Subscription prices and fees" description="Demo values in USD. These controls do not affect live products or payments.">
          {([
            ["monthlySubscription", "Monthly subscription price", "Base monthly plan price", "currency"],
            ["vaultFee", "Vault transaction fee", "Percentage charged on vault transactions", "percent"],
            ["communityFee", "Community transaction fee", "Percentage charged on community transactions", "percent"],
            ["payoutFee", "Creator payout fee", "Percentage deducted from creator payouts", "percent"],
          ] as const).map(([key, label, description, unit]) => (
            <SettingRow key={key} title={label} description={description}>
              <div className="flex h-[36px] w-[150px] items-center rounded-[8px] border border-[#eceef2] px-2.5">
                <span className="text-[13px] text-[#737986]">{unit === "currency" ? "$" : ""}</span>
                <input aria-label={label} type="number" min="0" step={unit === "currency" ? "0.01" : "0.1"} value={settings.pricing[key]} onChange={(event) => setSettings({ ...settings, pricing: { ...settings.pricing, [key]: Number(event.target.value) } })} className="min-w-0 flex-1 bg-transparent px-1 text-right text-[13px] outline-none" />
                <span className="text-[13px] text-[#737986]">{unit === "percent" ? "%" : ""}</span>
              </div>
            </SettingRow>
          ))}
          <SaveButton onClick={() => update(settings, "Pricing and fees", `Saved subscription and transaction fees: $${settings.pricing.monthlySubscription}, vault ${settings.pricing.vaultFee}%, community ${settings.pricing.communityFee}%, payout ${settings.pricing.payoutFee}%`)} />
        </SectionCard>
      )}

      {tab === "features" && (
        <SectionCard title="Feature flags" description="Switch demo product capabilities on or off. Changes do not affect the live application.">
          {([
            ["creatorPayouts", "Creator payouts", "Enable the creator payout workflow."],
            ["ownershipTransfers", "Ownership transfers", "Allow demo ownership transfer actions."],
            ["communitySubscriptions", "Community subscriptions", "Enable paid community membership."],
            ["aiModeration", "AI moderation assistance", "Show AI-assisted moderation features."],
          ] as const).map(([key, label, description]) => (
            <SettingRow key={key} title={label} description={description}>
              <Toggle checked={settings.features[key]} label={label} onChange={(value) => toggle("features", key, value, label)} />
            </SettingRow>
          ))}
        </SectionCard>
      )}

      {tab === "team" && isSuperAdmin && (
        <div className="space-y-4">
          <SectionCard title="Roles and permissions" description="Review the current demo role presets and manage team access in Invite Management.">
            {roles.map((role) => (
              <SettingRow key={role.id} title={role.name} description={`${role.permissions.length} dashboard permissions · ${role.system ? "Built-in role" : "Custom role"}`}>
                <span className="text-[12px] text-[#737986]">{role.system ? "Protected" : "Custom"}</span>
              </SettingRow>
            ))}
            <Link to="/app/invites" className="mt-4 inline-flex h-[36px] items-center gap-2 rounded-[8px] bg-[#1c1a18] px-3.5 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
              Open Invite Management <ChevronRight size={14} />
            </Link>
          </SectionCard>
        </div>
      )}

      {tab === "audit" && isSuperAdmin && <AuditTrail key={auditVersion} />}

      {!isSuperAdmin && (tab === "team" || tab === "audit") && (
        <Card className="p-5 text-[14px] text-[#737986]">This section is available to Super Admins only.</Card>
      )}
    </div>
  );
}
