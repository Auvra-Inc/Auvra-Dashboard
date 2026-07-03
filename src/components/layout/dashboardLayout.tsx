import { Outlet } from "react-router";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans">
      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 ensures content doesn't break the layout */}
        <Header onToggleNav={() => setNavOpen((v) => !v)} navOpen={navOpen} />

        {/* The Main Content Area where pages load */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}