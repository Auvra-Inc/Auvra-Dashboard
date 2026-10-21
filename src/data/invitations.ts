import { ALL_PERMISSIONS, SUPER_ADMIN } from "../auth/session";
import type { Permission } from "../auth/session";
import { recordAuditEvent } from "./audit";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Suspended";
  lastActive: string;
};

export type TeamInvitation = {
  id: string;
  email: string;
  role: string;
  status: "Pending" | "Expired";
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
};

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
};

export const PERMISSION_LABELS: { value: Permission; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "business", label: "Business Intelligence" },
  { value: "culture", label: "Cultural Intelligence" },
  { value: "users", label: "Users" },
  { value: "transactions", label: "Transactions" },
  { value: "ownership", label: "Ownership" },
  { value: "safety", label: "Trust and Safety" },
  { value: "lens", label: "Lens AI" },
  { value: "notifications", label: "Notifications" },
  { value: "settings", label: "Settings" },
  { value: "audit", label: "Audit log" },
];

let members: TeamMember[] = [
  { id: "ADM-001", name: "Emmanuel John", email: "emmanuel@goauvra.com", role: SUPER_ADMIN, status: "Active", lastActive: "Just now" },
  { id: "ADM-002", name: "Amara Okafor", email: "amara@goauvra.com", role: "Data Analyst", status: "Active", lastActive: "12 minutes ago" },
  { id: "ADM-003", name: "Chidi Nwosu", email: "chidi@goauvra.com", role: "CFO", status: "Active", lastActive: "Yesterday" },
  { id: "ADM-004", name: "Zainab Bello", email: "zainab@goauvra.com", role: "Admin", status: "Active", lastActive: "2 days ago" },
  { id: "ADM-005", name: "Kemi Adeyemi", email: "kemi@goauvra.com", role: "Viewer", status: "Active", lastActive: "4 days ago" },
];

let invitations: TeamInvitation[] = [
  { id: "INV-104", email: "tunde@goauvra.com", role: "Data Analyst", status: "Pending", invitedBy: "Emmanuel John", invitedAt: "20 Oct 2026", expiresAt: "27 Oct 2026" },
  { id: "INV-103", email: "ifeoma@goauvra.com", role: "Viewer", status: "Pending", invitedBy: "Emmanuel John", invitedAt: "18 Oct 2026", expiresAt: "25 Oct 2026" },
  { id: "INV-099", email: "david@goauvra.com", role: "CFO", status: "Expired", invitedBy: "Emmanuel John", invitedAt: "02 Oct 2026", expiresAt: "09 Oct 2026" },
];

let roles: AdminRole[] = [
  { id: "role-super-admin", name: SUPER_ADMIN, description: "Full access to every dashboard area and team administration.", permissions: [...ALL_PERMISSIONS], system: true },
  { id: "role-admin", name: "Admin", description: "Operational access without team or audit administration.", permissions: ALL_PERMISSIONS.filter((permission) => permission !== "invites" && permission !== "audit"), system: true },
  { id: "role-data-analyst", name: "Data Analyst", description: "Explore product and business performance.", permissions: ["home", "business", "culture", "users", "lens"], system: true },
  { id: "role-cfo", name: "CFO", description: "Review financial performance and transactions.", permissions: ["home", "business", "transactions"], system: true },
  { id: "role-viewer", name: "Viewer", description: "Read-only access to the dashboard home.", permissions: ["home"], system: true },
];

let nextInvite = 105;
let nextRole = 1;

export function getTeamMembers() {
  return members.map((member) => ({ ...member }));
}

export function getTeamInvitations() {
  return invitations.map((invitation) => ({ ...invitation }));
}

export function getAdminRoles() {
  return roles.map((role) => ({ ...role, permissions: [...role.permissions] }));
}

export function createTeamInvitation(email: string, role: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter a valid work email.");
  if (!roles.some((item) => item.name === role)) throw new Error("Choose an available role.");
  if (role === SUPER_ADMIN) throw new Error("Super Admin access cannot be granted from an invitation.");
  if (members.some((member) => member.email.toLowerCase() === normalizedEmail) ||
      invitations.some((invitation) => invitation.email.toLowerCase() === normalizedEmail && invitation.status === "Pending")) {
    throw new Error("This email already has access or a pending invitation.");
  }
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 7);
  const format = (date: Date) => date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const created: TeamInvitation = {
    id: `INV-${nextInvite++}`,
    email: normalizedEmail,
    role,
    status: "Pending",
    invitedBy: members[0]?.name ?? "Super Admin",
    invitedAt: format(now),
    expiresAt: format(expiry),
  };
  invitations = [created, ...invitations];
  recordAuditEvent("Invitation sent", created.email, `Invited as ${role}; expires in 7 days`);
  return { ...created };
}

export function revokeTeamInvitation(id: string) {
  const invitation = invitations.find((item) => item.id === id && item.status === "Pending");
  if (!invitation) throw new Error("This invitation is no longer pending.");
  invitations = invitations.filter((item) => item.id !== id);
  recordAuditEvent("Invitation revoked", invitation.email, "Invitation revoked before acceptance");
}

export function resendTeamInvitation(id: string) {
  const invitation = invitations.find((item) => item.id === id);
  if (!invitation) throw new Error("This invitation could not be found.");
  const updated = { ...invitation, status: "Pending" as const, invitedAt: "Just now" };
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  updated.expiresAt = expiry.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  invitations = invitations.map((item) => item.id === id ? updated : item);
  recordAuditEvent("Invitation resent", invitation.email, `Invitation resent as ${invitation.role}; expires in 7 days`);
  return { ...updated };
}

export function updateTeamMemberRole(id: string, role: string) {
  if (!roles.some((item) => item.name === role)) throw new Error("Choose an available role.");
  const member = members.find((item) => item.id === id);
  if (!member) throw new Error("This team member could not be found.");
  if (role === SUPER_ADMIN) throw new Error("The Super Admin role cannot be assigned here.");
  if (member.role === SUPER_ADMIN) throw new Error("The Super Admin role cannot be changed here.");
  members = members.map((item) => item.id === id ? { ...item, role } : item);
  recordAuditEvent("Role updated", member.name, `Changed role from ${member.role} to ${role}`);
  return { ...members.find((item) => item.id === id)! };
}

export function saveAdminRole(input: { id?: string; name: string; description: string; permissions: Permission[] }) {
  const name = input.name.trim();
  if (!name) throw new Error("Enter a role name.");
  if (name === SUPER_ADMIN) throw new Error("The Super Admin role is reserved.");
  if (input.permissions.includes("invites")) throw new Error("Invite Management access is reserved for Super Admins.");
  if (roles.some((role) => role.name.toLowerCase() === name.toLowerCase() && role.id !== input.id)) {
    throw new Error("A role with this name already exists.");
  }
  if (input.permissions.length === 0) throw new Error("Select at least one permission.");
  const existing = input.id ? roles.find((role) => role.id === input.id) : undefined;
  if (input.id && !existing) throw new Error("This role could not be found.");
  if (existing?.system) throw new Error("Built-in roles cannot be edited.");
  const saved: AdminRole = {
    id: existing?.id ?? `role-custom-${nextRole++}`,
    name,
    description: input.description.trim(),
    permissions: [...new Set(input.permissions)],
    system: false,
  };
  roles = existing ? roles.map((role) => role.id === saved.id ? saved : role) : [...roles, saved];
  recordAuditEvent(existing ? "Role updated" : "Role created", saved.name, `${saved.permissions.length} dashboard permissions configured`);
  return { ...saved, permissions: [...saved.permissions] };
}

export function deleteAdminRole(id: string) {
  const role = roles.find((item) => item.id === id);
  if (!role) throw new Error("This role could not be found.");
  if (role.system) throw new Error("Built-in roles cannot be deleted.");
  if (members.some((member) => member.role === role.name) || invitations.some((invite) => invite.role === role.name)) {
    throw new Error("Reassign team members and pending invitations before deleting this role.");
  }
  roles = roles.filter((item) => item.id !== id);
  recordAuditEvent("Role deleted", role.name, "Custom role deleted");
}
