import { Search, Settings, Bell, Menu, X } from "lucide-react";

type HeaderProps = {
  onToggleNav?: () => void;
  navOpen?: boolean;
};

export function Header({ onToggleNav, navOpen }: HeaderProps) {
  // Eventually, this will come from your Auth Context/State
  const userName = "Vincent";
  
  // Format today's date dynamically
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 flex items-center justify-between sticky top-0 z-10 font-sans">
      
      <div className="flex items-center align-center gap-4">
        {/* Nav toggle for small screens only */}
        <button
          onClick={onToggleNav}
          aria-label="Toggle navigation"
          className="mr-2 inline-flex items-center justify-center w-9 h-9 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors md:hidden"
        >
          {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex flex-col items-start gap-1">
          <span className="text-sm sm:text-base font-medium text-zinc-900 tracking-tight">Hi, {userName}!</span>
          <p className="text-xs sm:text-sm text-zinc-500 tracking-wide">{today}</p>
        </div>
      </div>

      {/* Actions Area */}
      <div className="flex items-center gap-4">
        
        {/* Search Bar */}
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Find something..." 
            className="w-64 pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-md text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Icon Buttons */}
        <button className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors relative">
          <Bell className="w-4 h-4" />
          {/* Notification Dot */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-black rounded-full"></span>
        </button>

        {/* Optimize Button (from the design) */}
        <button className="ml-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-sm font-semibold tracking-wide rounded-md transition-all">
          Optimize
        </button>
      </div>
    </header>
  );
}