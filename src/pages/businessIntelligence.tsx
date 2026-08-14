import { useEffect, useState } from "react";

export function BusinessIntelligence() {
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
          setData(jsonData.businessIntelligence);
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
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Business Intelligence</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Overview of business intelligence metrics and insights.</p>
          </div>
          <div className="text-sm text-zinc-500">Revenue API: {ok ? <span className="text-green-600">ok</span> : <span className="text-red-500">error</span>}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-widest">Total Monthly Revenue</p>
          <p className="text-4xl font-bold text-zinc-900 mt-3">${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm text-emerald-600 font-medium mt-2">Growth: {data.monthlyGrowth}</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-widest">Revenue Sources</p>
          <div className="space-y-3 mt-4">
            {data.revenueBySource.map((source: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-700">{source.source}</p>
                  <div className="w-full bg-zinc-100 rounded-full h-2 mt-1">
                    <div className="bg-black rounded-full h-2" style={{ width: `${source.percentage}%` }}></div>
                  </div>
                </div>
                <p className="text-sm font-semibold text-zinc-900 min-w-[80px] text-right">${source.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/60">
          <h3 className="text-lg font-semibold text-zinc-900">Top Products</h3>
        </div>
        <div className="divide-y divide-zinc-200/60">
          {data.topProducts.map((product: any, idx: number) => (
            <div key={idx} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{product.name}</p>
                <p className="text-sm text-zinc-500">{product.units} units sold</p>
              </div>
              <p className="font-semibold text-zinc-900">${product.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
