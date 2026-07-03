import { NavLink } from "react-router-dom";
import { 
  Home, BarChart3, Globe, Users, Cpu, 
  ShieldAlert, CreditCard, UserPlus, Settings, Bell, Fingerprint, Command, X 
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", path: "/", icon: Home },
  { name: "Business Intelligence", path: "/business", icon: BarChart3 },
  { name: "Cultural Intelligence", path: "/culture", icon: Globe },
  { name: "Users", path: "/users", icon: Users },
  { name: "Vault", path: "/vault", icon: Cpu },
  { name: "Trust & Safety", path: "/safety", icon: ShieldAlert },
  { name: "Transactions", path: "/transactions", icon: CreditCard },
  { name: "Communities", path: "/communities", icon: UserPlus },
  { name: "Badges", path: "/badges", icon: Fingerprint },
  { name: "Help Center", path: "/help", icon: Bell },
  { name: "Settings", path: "/settings", icon: Settings },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  // On mobile the sidebar overlays and translates in/out. On md+ it is always visible and full width.
  const baseClasses = `h-screen bg-white border-r border-zinc-200/60 flex flex-col font-sans transition-all duration-200 z-40`;
  const mobileClasses = `fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`;
  const widthClass = `w-[260px]`;

  return (
    <>
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
    </aside>
    </>
  );
}