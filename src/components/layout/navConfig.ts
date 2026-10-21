import type { Permission } from "../../auth/session";
import homeIcon from "../../assets/dashboard/nav-home.svg";
import businessIcon from "../../assets/dashboard/nav-business.svg";
import cultureIcon from "../../assets/dashboard/nav-culture.svg";
import usersIcon from "../../assets/dashboard/nav-users.svg";
import transactionsIcon from "../../assets/dashboard/nav-transactions.svg";
import ownershipIcon from "../../assets/dashboard/nav-ownership.svg";
import safetyIcon from "../../assets/dashboard/nav-safety.svg";
import lensIcon from "../../assets/dashboard/nav-lens.svg";
import settingsIcon from "../../assets/dashboard/nav-settings.svg";

export type NavItem = {
  label: string;
  path: string;
  permission: Permission;
  subtitle: string;
  // Figma SVG URL, or a lucide icon name for sections without a design
  icon: string | "invites";
};

// Order follows the Figma sidebar, with Invite Management after Lens AI.
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/app", permission: "home", icon: homeIcon, subtitle: "" },
  { label: "Business Intelligence", path: "/app/business", permission: "business", icon: businessIcon, subtitle: "Financial health of Auvra · Last 12 months" },
  { label: "Cultural Intelligence", path: "/app/culture", permission: "culture", icon: cultureIcon, subtitle: "How culture is being preserved on Auvra · Last 12 months" },
  { label: "Users", path: "/app/users", permission: "users", icon: usersIcon, subtitle: "Everyone on Auvra" },
  { label: "Transactions", path: "/app/transactions", permission: "transactions", icon: transactionsIcon, subtitle: "The flow of money on Auvra" },
  { label: "Ownership", path: "/app/ownership", permission: "ownership", icon: ownershipIcon, subtitle: "Badge ownership and provenance" },
  { label: "Trust and Safety", path: "/app/safety", permission: "safety", icon: safetyIcon, subtitle: "Keep Auvra culturally safe, legal and trustworthy" },
  { label: "Lens AI", path: "/app/lens", permission: "lens", icon: lensIcon, subtitle: "Auvra's intelligence layer · Last 7 days" },
  { label: "Invite Management", path: "/app/invites", permission: "invites", icon: "invites", subtitle: "Only Super Admins can invite people and change roles" },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  path: "/app/settings",
  permission: "settings",
  icon: settingsIcon,
  subtitle: "Integrations, pricing and roles",
};

export const NOTIFICATIONS_ITEM: NavItem = {
  label: "Notifications",
  path: "/app/notifications",
  permission: "notifications",
  icon: "",
  subtitle: "Messages sent to people on Auvra",
};

const ALL_ITEMS = [...NAV_ITEMS, SETTINGS_ITEM, NOTIFICATIONS_ITEM];

export function findNavItem(pathname: string) {
  // Longest matching path wins so /app/users/123 resolves to Users, not Home
  return [...ALL_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}
