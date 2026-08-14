import { Outlet } from "react-router";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
  const isSidebarOpen = isDesktop ? sidebarExpanded : mobileNavOpen;

  const toggleNav = () => {
    if (isDesktop) {
      setSidebarExpanded((open) => !open);
    } else {
      setMobileNavOpen((open) => !open);
    }
  };

  const closeNav = () => {
    setMobileNavOpen(false);
    setSidebarExpanded(false);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeNav}
      />
      <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 ensures content doesn't break the layout */}
        <Header
          onToggleNav={toggleNav}
          navOpen={isSidebarOpen}
        />

        {/* The Main Content Area where pages load */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}