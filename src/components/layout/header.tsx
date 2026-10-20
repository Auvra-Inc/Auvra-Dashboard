import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { NOTIFICATIONS_ITEM, SETTINGS_ITEM, findNavItem } from "./navConfig";
import { can, useSessionUser } from "../../auth/session";
import searchIcon from "../../assets/dashboard/search.svg";
import settingsIcon from "../../assets/dashboard/header-settings.svg";
import bellIcon from "../../assets/dashboard/bell.svg";

type HeaderProps = {
  onOpenNav: () => void;
  actionsRef: (el: HTMLElement | null) => void;
  // Set by the current page, e.g. "My Vault subscriptions" / "Loading the latest numbers…"
  titleOverride: string | null;
  subtitleOverride: string | null;
};

export function Header({ onOpenNav, actionsRef, titleOverride, subtitleOverride }: HeaderProps) {
  const { pathname } = useLocation();
  const user = useSessionUser();
  const searchRef = useRef<HTMLInputElement>(null);
  const item = findNavItem(pathname);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isHome = item?.path === "/app";
  const title = titleOverride ?? (isHome ? `Hi, ${user?.name.split(" ")[0] ?? "there"}!` : item?.label ?? "Auvra Admin");
  const restricted = item ? !can(user, item.permission) : false;
  const subtitle = restricted
    ? "Restricted page"
    : subtitleOverride ?? (isHome
      ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : item?.subtitle);

  return (
    <header className="flex items-center gap-3 px-4 pt-4 sm:px-[19px] sm:pt-[18px]">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f4f5f8] text-[#1c1a18] md:hidden"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      <div className="min-w-0 flex-1 lg:flex-none lg:basis-[300px]">
        <div role="heading" aria-level={1} className="truncate text-[18px] font-medium text-[#1c1a18]">
          {title}
        </div>
        {subtitle && <div className="mt-[3px] truncate text-[11px] text-[#6b7180]">{subtitle}</div>}
      </div>

      <label className="mx-auto hidden h-[38px] w-full max-w-[372px] items-center gap-3 rounded-[10px] bg-[#f4f5f8] px-3 lg:flex">
        <img src={searchIcon} alt="" width={17} height={17} className="shrink-0" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Find something"
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1c1a18] outline-none placeholder:text-[#8a8f99]"
        />
        <kbd className="font-sans text-[13px] text-[#1c1a18]">⌘K</kbd>
      </label>

      <div className="flex shrink-0 items-center gap-2.5 lg:basis-[300px] lg:justify-end">
        {can(user, SETTINGS_ITEM.permission) && (
          <Link to={SETTINGS_ITEM.path} aria-label="Settings" className="flex h-10 w-11 items-center justify-center rounded-[10px] bg-[#f4f5f8] hover:bg-[#eceef2]">
            <img src={settingsIcon} alt="" width={17} height={17} />
          </Link>
        )}
        {can(user, NOTIFICATIONS_ITEM.permission) && (
          <Link to={NOTIFICATIONS_ITEM.path} aria-label="Notifications" className="relative flex h-10 w-11 items-center justify-center rounded-[10px] bg-[#f4f5f8] hover:bg-[#eceef2]">
            <img src={bellIcon} alt="" width={17} height={17} />
            <span className="absolute right-[13px] top-[10px] size-1.5 rounded-full bg-[#15803d]" />
          </Link>
        )}
        {!restricted && <div ref={actionsRef} className="hidden items-center gap-2.5 sm:flex" />}
      </div>
    </header>
  );
}
