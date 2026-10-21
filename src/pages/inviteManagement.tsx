import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PageActions } from "../components/layout/pageActions";
import { usePageSubtitle, usePageTitle } from "../components/layout/headerSlots";
import { Card, InfoTip } from "../components/ui/card";
import { Modal } from "../components/ui/modal";
import { StatusPill } from "../components/ui/controls";
import { DataTable } from "../components/ui/table";
import { SUPER_ADMIN } from "../auth/session";
import type { Permission } from "../auth/session";
import {
  createTeamInvitation,
  deleteAdminRole,
  getAdminRoles,
  getTeamInvitations,
  getTeamMembers,
  PERMISSION_LABELS,
  resendTeamInvitation,
  revokeTeamInvitation,
  saveAdminRole,
  updateTeamMemberRole,
} from "../data/invitations";
import type { AdminRole, TeamInvitation, TeamMember } from "../data/invitations";

type InviteTab = "team" | "invitations" | "roles";

function Metric({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) {
  return (
    <Card className="p-[14px]">
      <div className="flex items-center gap-2 text-[#6b7180]">
        <span className="flex size-[23px] items-center justify-center rounded-[6px] bg-[#f4f5f8] text-[#1c1a18]"><Icon size={12} /></span>
        <span className="text-[14px] font-medium">{label}</span>
      </div>
      <div className="mt-3 text-[23px] font-medium tracking-[-0.4px] text-[#1c1a18]">{value}</div>
      <p className="mt-1 text-[12px] text-[#8a8f9b]">{note}</p>
    </Card>
  );
}

function TeamTabs({ value, onChange, pendingCount }: { value: InviteTab; onChange: (tab: InviteTab) => void; pendingCount: number }) {
  const tabs: { value: InviteTab; label: string }[] = [
    { value: "team", label: "Team members" },
    { value: "invitations", label: "Invitations" },
    { value: "roles", label: "Roles and permissions" },
  ];
  return (
    <div role="tablist" aria-label="Invite management views" className="flex flex-wrap gap-1 rounded-[8px] bg-[#f4f5f8] p-[3px]">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} onClick={() => onChange(tab.value)}
          className={`rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium ${tab.value === value ? "bg-white text-[#1c1a18] shadow-sm" : "text-[#737986] hover:text-[#1c1a18]"}`}>
          {tab.label}{tab.value === "invitations" && pendingCount > 0 ? ` (${pendingCount})` : ""}
        </button>
      ))}
    </div>
  );
}

function InviteDialog({ roleNames, onClose, onCreate }: {
  roleNames: string[];
  onClose: () => void;
  onCreate: (email: string, role: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roleNames.find((item) => item !== SUPER_ADMIN) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = () => {
    setBusy(true);
    setError(null);
    try {
      onCreate(email, role);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The invitation could not be created.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Invite a teammate" onClose={onClose} width={520} footer={
      <>
        <button type="button" onClick={onClose} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[13px] font-medium hover:bg-[#f8f9fb]">Cancel</button>
        <button type="button" onClick={submit} disabled={busy || !email.trim() || !role} className="inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#1c1a18] px-3 text-[13px] font-medium text-white disabled:opacity-50">
          <Mail size={12} /> {busy ? "Creating…" : "Send invitation"}
        </button>
      </>
    }>
      <p className="text-[13px] leading-[16px] text-[#737986]">Invite a teammate to Auvra Admin and choose the access they need. Invitations expire seven days after they are sent.</p>
      <label className="mt-4 block text-[13px] font-medium text-[#535966]">Work email
        <input type="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="mt-1.5 h-[38px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[14px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
      </label>
      <label className="mt-3 block text-[13px] font-medium text-[#535966]">Role
        <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 h-[38px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[14px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30">
          {roleNames.filter((item) => item !== SUPER_ADMIN).map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <div className="mt-4 flex gap-2 rounded-[8px] bg-[#f8f9fb] p-3 text-[12px] leading-[14px] text-[#737986]">
        <Shield size={14} className="mt-0.5 shrink-0 text-[#535966]" />
        <span>Access is controlled by the selected role. Super Admin access cannot be granted from this invitation form.</span>
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] text-[#b91c1c]">{error}</p>}
    </Modal>
  );
}

function ChangeRoleDialog({ member, roleNames, onClose, onSave }: {
  member: TeamMember;
  roleNames: string[];
  onClose: () => void;
  onSave: (role: string) => void;
}) {
  const [role, setRole] = useState(member.role);
  const [error, setError] = useState<string | null>(null);
  const permissions = getAdminRoles().find((item) => item.name === role)?.permissions ?? [];
  return (
    <Modal title={`Change ${member.name}'s role`} onClose={onClose} width={500} footer={
      <>
        <button type="button" onClick={onClose} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[13px] font-medium hover:bg-[#f8f9fb]">Cancel</button>
        <button type="button" onClick={() => { try { onSave(role); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "The role could not be updated."); } }} className="h-[36px] rounded-[8px] bg-[#1c1a18] px-3 text-[13px] font-medium text-white">Save changes</button>
      </>
    }>
      <p className="text-[13px] text-[#737986]">{member.email}</p>
      <label className="mt-4 block text-[13px] font-medium text-[#535966]">Select a role
        <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 h-[38px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[14px] text-[#1c1a18]">
          {roleNames.filter((item) => item !== SUPER_ADMIN).map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <div className="mt-4 rounded-[9px] border border-[#eceef2] p-3">
        <div className="text-[13px] font-medium text-[#1c1a18]">Access included in {role}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PERMISSION_LABELS.filter((item) => permissions.includes(item.value)).map((item) => <span key={item.value} className="rounded-[6px] bg-[#f4f5f8] px-2 py-1 text-[12px] text-[#535966]">{item.label}</span>)}
          {permissions.length === 0 && <span className="text-[12px] text-[#8a8f9b]">No permissions set.</span>}
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] text-[#b91c1c]">{error}</p>}
    </Modal>
  );
}

function RoleEditor({ role, onClose, onSave }: {
  role: AdminRole | null;
  onClose: () => void;
  onSave: (value: { id?: string; name: string; description: string; permissions: Permission[] }) => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<Permission[]>(role?.permissions ?? ["home"]);
  const [error, setError] = useState<string | null>(null);
  const toggle = (permission: Permission) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  return (
    <Modal title={role ? "Edit custom role" : "Create custom role"} onClose={onClose} width={560} footer={
      <>
        <button type="button" onClick={onClose} className="h-[36px] rounded-[8px] border border-[#eceef2] px-3 text-[13px] font-medium hover:bg-[#f8f9fb]">Cancel</button>
        <button type="button" onClick={() => { try { onSave({ id: role?.id, name, description, permissions }); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "The role could not be saved."); } }} className="h-[36px] rounded-[8px] bg-[#1c1a18] px-3 text-[13px] font-medium text-white">Save role</button>
      </>
    }>
      <label className="block text-[13px] font-medium text-[#535966]">Role name
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="e.g. Content Reviewer" className="mt-1.5 h-[38px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[14px] text-[#1c1a18]" />
      </label>
      <label className="mt-3 block text-[13px] font-medium text-[#535966]">Description
        <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={120} placeholder="What this role can do" className="mt-1.5 h-[38px] w-full rounded-[8px] border border-[#eceef2] bg-[#f8f9fb] px-2.5 text-[14px] text-[#1c1a18]" />
      </label>
      <fieldset className="mt-4">
        <legend className="text-[13px] font-medium text-[#535966]">Dashboard access</legend>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {PERMISSION_LABELS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 rounded-[8px] border border-[#eceef2] px-2.5 py-2 text-[13px] text-[#1c1a18]">
              <input type="checkbox" checked={permissions.includes(value)} onChange={() => toggle(value)} className="accent-[#1c1a18]" />{label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-[14px] text-[#8a8f9b]"><AlertCircle size={12} className="mt-0.5 shrink-0" />Invite Management and Super Admin access are reserved and cannot be granted to a custom role.</p>
      {error && <p role="alert" className="mt-2 text-[13px] text-[#b91c1c]">{error}</p>}
    </Modal>
  );
}

function MembersTable({ rows, onChangeRole }: { rows: TeamMember[]; onChangeRole: (member: TeamMember) => void }) {
  return (
    <DataTable minWidth={650} head={<><th scope="col" className="text-left">Team member</th><th scope="col" className="text-left">Role</th><th scope="col" className="text-left">Status</th><th scope="col" className="text-left">Last active</th><th scope="col" className="text-right">Actions</th></>}>
      {rows.map((member) => (
        <tr key={member.id}>
          <th scope="row" className="h-[52px] max-w-[220px] text-left font-normal">
            <span className="block truncate text-[13px] font-medium text-[#1c1a18]">{member.name}</span>
            <span className="block truncate text-[12px] text-[#8a8f9b]">{member.email}</span>
          </th>
          <td className="text-[13px] text-[#535966]">{member.role}</td>
          <td>          <StatusPill tone={member.status === "Active" ? "green" : "amber"} className="text-[12px]">{member.status}</StatusPill></td>
          <td className="text-[12px] text-[#737986]">{member.lastActive}</td>
          <td className="text-right">
            {member.role === SUPER_ADMIN
              ? <span className="pr-2 text-[12px] text-[#8a8f9b]">Protected</span>
              : <button type="button" onClick={() => onChangeRole(member)} className="inline-flex h-[29px] items-center gap-1 rounded-[7px] border border-[#eceef2] px-2 text-[12px] font-medium hover:bg-[#f8f9fb]"><Pencil size={11} /> Change role</button>}
          </td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={5} className="h-[90px] text-center text-[13px] text-[#737986]">No team members match your search.</td></tr>}
    </DataTable>
  );
}

function InvitationsTable({ rows, onResend, onRevoke }: {
  rows: TeamInvitation[];
  onResend: (invite: TeamInvitation) => void;
  onRevoke: (invite: TeamInvitation) => void;
}) {
  return (
    <DataTable minWidth={650} head={<><th scope="col" className="text-left">Email</th><th scope="col" className="text-left">Role</th><th scope="col" className="text-left">Status</th><th scope="col" className="text-left">Invited / expires</th><th scope="col" className="text-right">Actions</th></>}>
      {rows.map((invite) => (
        <tr key={invite.id}>
          <th scope="row" className="h-[50px] text-left font-normal">
            <span className="block text-[13px] font-medium text-[#1c1a18]">{invite.email}</span>
            <span className="block text-[12px] text-[#8a8f9b]">{invite.id} · by {invite.invitedBy}</span>
          </th>
          <td className="text-[13px] text-[#535966]">{invite.role}</td>
          <td><StatusPill tone={invite.status === "Pending" ? "purple" : "amber"} className="text-[12px]">{invite.status}</StatusPill></td>
          <td className="text-[12px] leading-[15px] text-[#737986]">{invite.invitedAt}<br />Expires {invite.expiresAt}</td>
          <td className="text-right">
            <div className="inline-flex gap-1">
              <button type="button" onClick={() => onResend(invite)} className="h-[28px] rounded-[7px] border border-[#eceef2] px-2 text-[12px] font-medium hover:bg-[#f8f9fb]">{invite.status === "Pending" ? "Resend" : "Re-invite"}</button>
              {invite.status === "Pending" && <button type="button" aria-label={`Revoke invitation to ${invite.email}`} onClick={() => onRevoke(invite)} className="flex size-[28px] items-center justify-center rounded-[7px] border border-[#eceef2] text-[#b91c1c] hover:bg-[#fff7f7]"><X size={12} /></button>}
            </div>
          </td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={5} className="h-[90px] text-center text-[13px] text-[#737986]">No invitations match this filter.</td></tr>}
    </DataTable>
  );
}

function RolesList({ roles, onEdit, onDelete }: { roles: AdminRole[]; onEdit: (role: AdminRole) => void; onDelete: (role: AdminRole) => void }) {
  return (
    <div className="divide-y divide-[#eceef2]">
      {roles.map((role) => (
        <div key={role.id} className="flex flex-wrap items-start justify-between gap-3 px-[15px] py-3.5">
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-medium text-[#1c1a18]">{role.name}</h3>
              {role.system && <span className="rounded-[5px] bg-[#f4f5f8] px-1.5 py-0.5 text-[8px] text-[#737986]">Built-in</span>}
            </div>
            <p className="mt-1 text-[12px] text-[#8a8f9b]">{role.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {PERMISSION_LABELS.filter((item) => role.permissions.includes(item.value)).map((item) => <span key={item.value} className="rounded-[5px] bg-[#f4f5f8] px-1.5 py-1 text-[8px] text-[#535966]">{item.label}</span>)}
              {role.name === SUPER_ADMIN && <span className="rounded-[5px] bg-[#efebfd] px-1.5 py-1 text-[8px] text-[#3310be]">Invite Management</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!role.system && <button type="button" onClick={() => onEdit(role)} aria-label={`Edit ${role.name}`} className="flex size-[30px] items-center justify-center rounded-[7px] border border-[#eceef2] hover:bg-[#f8f9fb]"><Pencil size={12} /></button>}
            {!role.system && <button type="button" onClick={() => onDelete(role)} aria-label={`Delete ${role.name}`} className="flex size-[30px] items-center justify-center rounded-[7px] border border-[#eceef2] text-[#b91c1c] hover:bg-[#fff7f7]"><Trash2 size={12} /></button>}
            {role.system && <span className="px-2 text-[12px] text-[#8a8f9b]">Protected</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function InviteManagement() {
  const [tab, setTab] = useState<InviteTab>("team");
  const [members, setMembers] = useState(getTeamMembers);
  const [invitations, setInvitations] = useState(getTeamInvitations);
  const [roles, setRoles] = useState(getAdminRoles);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<AdminRole | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePageTitle("Invite Management");
  usePageSubtitle("Only Super Admins can invite people and change roles");

  const pendingCount = invitations.filter((item) => item.status === "Pending").length;
  const filteredMembers = useMemo(() => members.filter((member) =>
    `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(search.toLowerCase().trim())), [members, search]);
  const filteredInvites = useMemo(() => invitations.filter((invite) =>
    `${invite.email} ${invite.role} ${invite.status}`.toLowerCase().includes(search.toLowerCase().trim())), [invitations, search]);

  const refresh = () => {
    setMembers(getTeamMembers());
    setInvitations(getTeamInvitations());
    setRoles(getAdminRoles());
  };
  const runAction = (action: () => void, message: string) => {
    setError(null);
    try {
      action();
      refresh();
      setNotice(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The action could not be completed.");
    }
  };

  return (
    <div className="space-y-4 pb-5">
      <PageActions>
        <button type="button" onClick={() => { setError(null); setInviteOpen(true); }} className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#1c1a18] px-3 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
          <UserPlus size={12} /> Invite teammate
        </button>
      </PageActions>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-[-0.4px] text-[#1c1a18]">Invite Management</h1>
          <p className="mt-1 text-[13px] text-[#737986]">Only Super Admins can invite people and change roles.</p>
        </div>
        <span className="rounded-[7px] bg-[#f4f5f8] px-2.5 py-1.5 text-[12px] text-[#737986]">Super Admin only · Demo data</span>
      </header>

      {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-[8px] border border-[#d9efdf] bg-[#f0faf3] px-3 py-2 text-[13px] text-[#176b37]"><span className="flex items-center gap-2"><Check size={12} />{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={12} /></button></div>}
      {error && <p role="alert" className="rounded-[8px] bg-[#fdedee] px-3 py-2 text-[13px] text-[#b91c1c]">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric icon={Users} label="Team members" value={members.length.toLocaleString("en-US")} note="Active and suspended admin accounts" />
        <Metric icon={Clock3} label="Pending invitations" value={pendingCount.toLocaleString("en-US")} note="Awaiting account setup" />
        <Metric icon={Shield} label="Access roles" value={roles.length.toLocaleString("en-US")} note="Built-in and custom permission sets" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef2] px-[15px] py-[12px]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-[24px] items-center justify-center rounded-[6px] bg-[#f4f5f8]"><Users size={12} /></span>
            <h2 className="text-[18px] font-medium text-[#1c1a18]">Access and roles</h2>
            <InfoTip tip={{ title: "Invite Management", body: "Only Super Admins can invite teammates, manage access roles or change team permissions." }} />
          </div>
          <TeamTabs value={tab} onChange={(value) => { setTab(value); setSearch(""); }} pendingCount={pendingCount} />
        </div>
        {tab !== "roles" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef2] px-[15px] py-[10px]">
            <div>
              <h3 className="text-[15px] font-medium text-[#1c1a18]">{tab === "team" ? "Team members" : "Invitations"}</h3>
              <p className="mt-0.5 text-[12px] leading-[18px] text-[#8a8f9b]">{tab === "team" ? "Review who can access the admin dashboard." : "Track, resend or revoke invitations."}</p>
            </div>
            <label className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8f9b]" />
              <input aria-label="Search team and invitations" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="h-[32px] w-[190px] rounded-[7px] border border-[#eceef2] bg-white pl-8 pr-2 text-[13px] text-[#1c1a18] outline-none focus:ring-2 focus:ring-[#3310be]/30" />
            </label>
          </div>
        )}
        {tab === "team" && <MembersTable rows={filteredMembers} onChangeRole={setMemberToEdit} />}
        {tab === "invitations" && <InvitationsTable
          rows={filteredInvites}
          onResend={(invite) => runAction(() => { resendTeamInvitation(invite.id); }, `Invitation resent to ${invite.email}.`)}
          onRevoke={(invite) => runAction(() => { revokeTeamInvitation(invite.id); }, `Invitation to ${invite.email} revoked.`)}
        />}
        {tab === "roles" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceef2] px-[15px] py-[10px]">
              <div><h3 className="text-[15px] font-medium text-[#1c1a18]">Roles and permissions</h3><p className="mt-0.5 text-[12px] leading-[18px] text-[#8a8f9b]">Define the dashboard areas each role can access.</p></div>
              <button type="button" onClick={() => setRoleToEdit(null)} className="inline-flex h-[29px] items-center gap-1 rounded-[7px] border border-[#eceef2] px-2.5 text-[12px] font-medium hover:bg-[#f8f9fb]"><Plus size={11} /> Create role</button>
            </div>
            <RolesList
              roles={roles}
              onEdit={setRoleToEdit}
              onDelete={(role) => runAction(() => deleteAdminRole(role.id), `${role.name} role deleted.`)}
            />
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eceef2] px-[15px] py-[9px] text-[12px] text-[#8a8f9b]">
          <span>{tab === "team" ? `${filteredMembers.length} team members` : tab === "invitations" ? `${filteredInvites.length} invitations` : `${roles.length} roles`}</span>
          <span>Changes are local demo data; connect the admin API to deliver invites and persist role updates.</span>
        </div>
      </Card>

      {inviteOpen && <InviteDialog roleNames={roles.map((role) => role.name)} onClose={() => setInviteOpen(false)} onCreate={(email, role) => {
        createTeamInvitation(email, role);
        refresh();
        setNotice(`Invitation created for ${email.trim()}.`);
      }} />}
      {memberToEdit && <ChangeRoleDialog member={memberToEdit} roleNames={roles.map((role) => role.name)} onClose={() => setMemberToEdit(null)} onSave={(role) => {
        updateTeamMemberRole(memberToEdit.id, role);
        refresh();
        setNotice(`${memberToEdit.name}'s role updated.`);
      }} />}
      {roleToEdit !== undefined && <RoleEditor role={roleToEdit} onClose={() => setRoleToEdit(undefined)} onSave={(value) => {
        saveAdminRole(value);
        refresh();
        setNotice(`${value.name} role saved.`);
      }} />}
    </div>
  );
}
