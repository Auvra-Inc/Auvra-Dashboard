import { useEffect, useState } from "react";

export function Vault() {
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
          setData(jsonData.vault);
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
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Vault</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Secure storage and management for user assets and artifacts.</p>
          </div>
          <div className="text-sm text-zinc-500">API: {ok ? <span className="text-green-600">ok</span> : <span className="text-red-500">error</span>}</div>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-widest">Total Assets</p>
          <p className="text-4xl font-bold text-zinc-900 mt-3">{data.totalAssets.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-widest">Storage Usage</p>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{data.storageUsed}</p>
          <p className="text-sm text-zinc-600 mt-2">of {data.storageLimit}</p>
          <div className="w-full bg-zinc-100 rounded-full h-2 mt-3">
            <div className="bg-black rounded-full h-2" style={{ width: '46%' }}></div>
          </div>
        </div>
      </div>

      {/* Asset Types */}
      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/60">
          <h3 className="text-lg font-semibold text-zinc-900">Assets by Type</h3>
        </div>
        <div className="divide-y divide-zinc-200/60">
          {data.assetsByType.map((asset: any, idx: number) => (
            <div key={idx} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-zinc-900">{asset.type}</p>
                <p className="text-sm font-semibold text-zinc-700">{asset.count.toLocaleString()} files</p>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2">
                <div className="bg-black rounded-full h-2" style={{ width: `${asset.percentage}%` }}></div>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{asset.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
