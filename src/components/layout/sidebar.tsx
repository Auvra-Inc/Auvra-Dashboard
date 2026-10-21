import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, UserPlus, X } from "lucide-react";
import { NAV_ITEMS, SETTINGS_ITEM } from "./navConfig";
import type { NavItem } from "./navConfig";
import { can, clearSession, initials, SUPER_ADMIN, useSessionUser } from "../../auth/session";
import logoMark from "../../assets/dashboard/logo-mark.svg";

// The Figma icons have a fixed stroke colour, so they're drawn through a mask to follow the active/inactive text colour
function NavIcon({ item }: { item: NavItem }) {
  if (item.icon === "invites") return <UserPlus size={20} strokeWidth={1.25} absoluteStrokeWidth />;
  return (
    <span
      aria-hidden
      className="block size-5 bg-current"
      style={{ mask: `url("${item.icon}") center / contain no-repeat`, WebkitMask: `url("${item.icon}") center / contain no-repeat` }}
    />
  );
}

function RailLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/app"}
      onClick={onNavigate}
      aria-label={item.label}
      className={({ isActive }) =>
        `group relative flex size-[52px] items-center justify-center rounded-[12px] transition-colors ${
          isActive ? "bg-[#1c1a18] text-white" : "bg-[#f4f5f8] text-[#1c1a18] hover:bg-[#eceef2]"
        }`
      }
    >
      <NavIcon item={item} />
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[8px] bg-[#1c1a18] px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {item.label}
      </span>
    </NavLink>
  );
}

function DrawerLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/app"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex h-[48px] items-center gap-3 rounded-[12px] px-[14px] text-[14px] font-medium transition-colors ${
          isActive ? "bg-[#1c1a18] text-white" : "text-[#1c1a18] hover:bg-[#f4f5f8]"
        }`
      }
    >
      <NavIcon item={item} />
      {item.label}
    </NavLink>
  );
}

function LogoutDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(28,26,24,0.55)] p-4" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <div className="w-full max-w-[380px] rounded-[20px] bg-white p-6 text-left">
        <div className="flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-[14px] bg-[#fdedee] text-[#dc2626]">
            <LogOut size={20} strokeWidth={1.5} />
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="flex size-8 items-center justify-center rounded-[8px] text-[#6b7180] hover:bg-[#f4f5f8]">
            <X size={16} />
          </button>
        </div>
        <div id="logout-title" className="mt-5 text-[20px] font-semibold text-[#1c1a18]">Log out?</div>
        <div className="mt-1.5 text-[14px] text-[#6b7180]">You'll need to sign in again to use Auvra Admin.</div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} className="h-10 rounded-[10px] border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-[10px] bg-[#dc2626] px-4 text-[13px] font-medium text-white hover:bg-[#c21f1f]">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountMenu({ placement }: { placement: "rail" | "drawer" }) {
  const navigate = useNavigate();
  const user = useSessionUser();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const logout = () => {
    // await api.auth.logout();
    clearSession();
    navigate("/login", { replace: true });
  };

  const name = user?.name ?? "";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className={
          placement === "rail"
            ? "flex h-[52px] w-[44px] items-center justify-center rounded-[12px] bg-[#8e2b2b] text-[14px] font-semibold text-white"
            : "flex w-full items-center gap-3 rounded-[12px] p-2 text-left hover:bg-[#f4f5f8]"
        }
      >
        {placement === "rail" ? (
          initials(name)
        ) : (
          <>
            <span className="flex h-[44px] w-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[#8e2b2b] text-[14px] font-semibold text-white">
              {initials(name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium text-[#1c1a18]">{name}</span>
              <span className="block truncate text-[12px] text-[#6b7180]">{user?.role}</span>
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 w-[220px] rounded-[14px] border border-[#eceef2] bg-white p-1.5 text-left shadow-[0_12px_32px_rgba(28,26,24,0.12)] ${
            placement === "rail" ? "bottom-0 left-full ml-3" : "bottom-full left-0 mb-2"
          }`}
        >
          <div className="px-3 py-2">
            <div className="truncate text-[13px] font-semibold text-[#1c1a18]">{name}</div>
            <div className="truncate text-[12px] text-[#6b7180]">{user?.email}</div>
            <div className="mt-1.5 inline-flex rounded-full bg-[#efebfe] px-2 py-0.5 text-[11px] font-medium text-[#3310be]">{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
            className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium text-[#dc2626] hover:bg-[#fdedee]"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Log out
          </button>
        </div>
      )}

      {confirming && <LogoutDialog onCancel={() => setConfirming(false)} onConfirm={logout} />}
    </div>
  );
}

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const user = useSessionUser();
  const isSuperAdmin = user?.role === SUPER_ADMIN;
  const items = NAV_ITEMS.filter((item) => item.permission === "invites" ? isSuperAdmin : can(user, item.permission));
  const showSettings = can(user, SETTINGS_ITEM.permission);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  return (
    <>
      {/* Icon rail (md and up) */}
      <aside className="hidden w-[88px] shrink-0 flex-col items-center py-5 md:flex">
        <div className="flex size-10 items-center justify-center rounded-[35px] bg-[#1c1a18]">
          <img src={logoMark} alt="Auvra" width={20} height={24} />
        </div>
        <nav aria-label="Main" className="my-auto flex flex-col gap-1.5 py-6">
          {items.map((item) => (
            <RailLink key={item.path} item={item} />
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2.5">
          {showSettings && <RailLink item={SETTINGS_ITEM} />}
          <AccountMenu placement="rail" />
        </div>
      </aside>

      {/* Drawer (below md) */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-[rgba(28,26,24,0.45)] md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white p-4 transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-[11px] bg-[#1c1a18]">
              <img src={logoMark} alt="" width={21.8} height={24} />
            </div>
            <span className="text-[16px] font-semibold text-[#1c1a18]">Auvra Admin</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="flex size-9 items-center justify-center rounded-[10px] bg-[#f4f5f8] text-[#1c1a18]">
            <X size={16} />
          </button>
        </div>
        <nav aria-label="Main" className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
          {items.map((item) => (
            <DrawerLink key={item.path} item={item} onNavigate={onClose} />
          ))}
          {showSettings && <DrawerLink item={SETTINGS_ITEM} onNavigate={onClose} />}
        </nav>
        <div className="border-t border-[#eceef2] pt-3">
          <AccountMenu placement="drawer" />
        </div>
      </aside>
    </>
  );
}
