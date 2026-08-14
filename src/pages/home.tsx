import { DashboardCard } from "../components/ui/dashboardCard";
import { GrowthChart } from "../components/ui/growthChart";
import { useEffect, useState } from "react";
// import api from "../utils/api";

export function Home() {
  const [loaded, setLoaded] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadMetrics = async () => {
      try {
        // const res = await api.dashboard.getMetrics();
        const res = await fetch('/mock-api.json');
        const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setMetrics(data.metrics);
          setLoaded(true);
        }
      } catch (error) {
        if (mounted) {
          setLoaded(false);
          setMetrics(null);
        }
      }
    };

    loadMetrics();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Platform Overview</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Real-time metrics across all cultural preservation activities.</p>
          </div>
          <div className="text-sm font-medium text-zinc-500">API: {loaded ? <span className="text-green-600">connected</span> : <span className="text-red-500">disconnected</span>}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard 
          title="Total Users" 
          value={metrics ? metrics.totalUsers.toLocaleString() : "--"} 
          trend="up" 
          trendValue={metrics?.growth?.users || "+0%"} 
          subtitle="Creators, Collectors, and Families"
        />
        <DashboardCard 
          title="Total Revenue" 
          value={metrics ? `$${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "--"} 
          trend="up" 
          trendValue={metrics?.growth?.revenue || "+0%"} 
          subtitle="Vault, Community, and Badges"
        />
        <DashboardCard 
          title="Languages Preserved" 
          value={metrics ? "142" : "--"} 
          trend="up" 
          trendValue="+3 this week" 
          subtitle="Across all active communities"
        />
        <DashboardCard 
          title="Cultural Entries" 
          value={metrics ? "8,904" : "--"} 
          trend="neutral" 
          subtitle="Total verified platform footprints"
        />
        <DashboardCard 
          title="Active Communities" 
          value={metrics ? "315" : "--"} 
          trend="down" 
          trendValue="-1.2%" 
          subtitle="Communities with recent activity"
        />
        <DashboardCard 
          title="Countries Reached" 
          value={metrics ? "48" : "--"} 
          trend="up" 
          trendValue="+2" 
          subtitle="Global footprint distribution"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Chart takes up 2/3 of the space */}
        <div className="lg:col-span-2">
           <GrowthChart />
        </div>

        {/* The Promo/Action card takes up 1/3 */}
        <div className="bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <span className="text-white font-semibold">Auvra</span>
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Invite New Admins</h3>
          <p className="text-sm text-zinc-400 mb-6">Manage roles and permissions for your team workspace.</p>
          <button className="w-full py-2.5 bg-white hover:bg-zinc-100 text-black text-sm font-semibold rounded-md transition-colors">
            Send Invitation
          </button>
        </div>
        
      </div>

    </div>
  );
}