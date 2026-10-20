import { useSyncExternalStore } from "react";

// One key per dashboard area; roles grant a set of these
export type Permission =
  | "home"
  | "business"
  | "culture"
  | "users"
  | "lens"
  | "safety"
  | "transactions"
  | "invites"
  | "notifications"
  | "ownership"
  | "settings"
  | "audit";

export const ALL_PERMISSIONS: Permission[] = [
  "home",
  "business",
  "culture",
  "users",
  "lens",
  "safety",
  "transactions",
  "invites",
  "notifications",
  "ownership",
  "settings",
  "audit",
];

export const SUPER_ADMIN = "Super Admin";

// Placeholder presets until roles come from the API (PRD §4: Super Admin creates custom roles)
const ROLE_PRESETS: Record<string, Permission[]> = {
  [SUPER_ADMIN]: ALL_PERMISSIONS,
  Admin: ALL_PERMISSIONS.filter((p) => p !== "invites" && p !== "audit"),
  "Data Analyst": ["home", "business", "culture", "users", "lens"],
  CFO: ["home", "business", "transactions"],
  Viewer: ["home"],
};

export type SessionUser = {
  name: string;
  email: string;
  role: string;
  // Sent by the backend; falls back to the role preset when missing
  permissions?: Permission[];
};

const USER_KEY = "auvra_user";
const TOKEN_KEY = "token";
const CHANGE_EVENT = "auvra-session-change";

let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;

function readUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    cachedUser = parsed?.email ? { name: parsed.name ?? parsed.email, role: parsed.role ?? "Viewer", ...parsed } : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useSessionUser() {
  return useSyncExternalStore(subscribe, readUser);
}

export function saveSessionUser(user: SessionUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function hasToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function permissionsFor(user: SessionUser | null): Permission[] {
  if (!user) return [];
  if (user.role === SUPER_ADMIN) return ALL_PERMISSIONS;
  return user.permissions ?? ROLE_PRESETS[user.role] ?? [];
}

export function can(user: SessionUser | null, permission: Permission) {
  return permissionsFor(user).includes(permission);
}

export function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
