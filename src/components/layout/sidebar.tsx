import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home, BarChart3, Globe, Users, Cpu, 
  ShieldAlert, CreditCard, UserPlus, Settings, Bell, Fingerprint, Command, X, LogOut 
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", path: "/app", icon: Home },
  { name: "Business Intelligence", path: "/app/business", icon: BarChart3 },
  { name: "Cultural Intelligence", path: "/app/culture", icon: Globe },
  { name: "Users", path: "/app/users", icon: Users },
  { name: "Vault", path: "/app/vault", icon: Cpu },
  { name: "Trust & Safety", path: "/app/safety", icon: ShieldAlert },
  { name: "Transactions", path: "/app/transactions", icon: CreditCard },
  { name: "Communities", path: "/app/communities", icon: UserPlus },
  { name: "Badges", path: "/app/badges", icon: Fingerprint },
  { name: "Help Center", path: "/app/help", icon: Bell },
  { name: "Settings", path: "/app/settings", icon: Settings },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // On mobile the sidebar overlays and translates in/out. On md+ it is always visible and full width.
  const baseClasses = `h-screen bg-white border-r border-zinc-200/60 flex flex-col font-sans transition-all duration-200 z-40`;
  const mobileClasses = `fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`;
  const widthClass = `w-[260px]`;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auvra_user");
    setShowLogoutConfirm(false);
    onClose?.();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                aria-label="Close logout confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-5 text-xl font-semibold text-zinc-900">Log out?</h3>
            <p className="mt-2 text-sm text-zinc-600">Are you sure you want to log out of Auvra Admin?</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Backdrop for mobile when open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => onClose?.()}
        />
      )}

      <aside className={`${baseClasses} ${mobileClasses} ${widthClass}`}>
      
      {/* Brand Logo Area */}
      <div className="h-16 flex items-center px-4 sm:px-6 border-b border-zinc-200/60 justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center mr-3">
            <Command className="w-4 h-4" />
          </div>
            <span className="font-semibold text-zinc-900 tracking-tight">Auvra Admin</span>
        </div>

        {/* Close button inside the navigation so it's visible when open */}
          {isOpen && (
            <button
              onClick={() => onClose?.()}
              aria-label="Close navigation"
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors mr-2 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="tracking-wide truncate max-w-[150px]">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-200/60 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
    </>
  );
}