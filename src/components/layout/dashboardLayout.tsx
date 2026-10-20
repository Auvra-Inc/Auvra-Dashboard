import { useCallback, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { clearSession, hasToken } from "../../auth/session";
import { useIdleTimeout } from "../../auth/useIdleTimeout";
import { HeaderSlotsContext } from "./headerSlots";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeNav = useCallback(() => setMobileNavOpen(false), []);
  const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const slots = useMemo(() => ({ actionsEl, setTitle, setSubtitle }), [actionsEl]);

  const signOutIdle = useCallback(() => {
    // await api.auth.logout();
    clearSession();
    navigate("/session-expired", { replace: true });
  }, [navigate]);
  useIdleTimeout(IDLE_TIMEOUT_MS, signOutIdle);

  if (!hasToken()) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="flex h-svh bg-[#f8f9fb] font-sans text-left text-[#1c1a18]">
      <Sidebar mobileOpen={mobileNavOpen} onClose={closeNav} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-[#eceef2] bg-white md:my-3 md:mr-3 md:rounded-[18px] md:border">
        <HeaderSlotsContext.Provider value={slots}>
          <Header onOpenNav={() => setMobileNavOpen(true)} actionsRef={setActionsEl} titleOverride={title} subtitleOverride={subtitle} />
          <main className="flex-1 overflow-y-auto px-4 pb-4 pt-6 sm:px-[17px] sm:pb-[17px] sm:pt-[33px]">
            <Outlet />
          </main>
        </HeaderSlotsContext.Provider>
      </div>
    </div>
  );
}
