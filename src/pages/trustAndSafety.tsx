import { useEffect, useState } from "react";

export function TrustAndSafety() {
  const [ok, setOk] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const res = await fetch('/mock-api.json');
        const jsonData = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setData(jsonData.trustAndSafety);
          setOk(true);
        }
      } catch (error) {
        if (mounted) {
          setData(null);
          setOk(false);
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Trust & Safety</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Policies, moderation tools, and safety reports for the platform.</p>
          </div>
          <div className="text-sm text-zinc-500">Audit API: {ok ? <span className="text-green-600">available</span> : <span className="text-red-500">unavailable</span>}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Total Reports</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{data.totalReports}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Resolved</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{data.resolvedReports}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{data.pendingReports}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Critical</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{data.criticalIssues}</p>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/60">
          <h3 className="text-lg font-semibold text-zinc-900">Recent Safety Actions</h3>
        </div>
        <div className="divide-y divide-zinc-200/60">
          {data.recentActions.map((action: any) => (
            <div key={action.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{action.action}</p>
                <p className="text-sm text-zinc-500">{action.reason}</p>
              </div>
              <p className="text-xs text-zinc-500">{new Date(action.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
