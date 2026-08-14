import { useEffect, useState } from "react";

export function CulturalIntelligence() {
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
          setData(jsonData.culturalIntelligence);
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
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Cultural Intelligence</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Insights into cultural content, engagement, and preservation metrics.</p>
          </div>
          <div className="text-sm text-zinc-500">API: {ok ? <span className="text-green-600">ok</span> : <span className="text-red-500">error</span>}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Languages</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{data.languagesTracked}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Total Entries</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{data.totalEntries.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Countries</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{data.countriesReached}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Preservation Score</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{data.preservationScore}%</p>
        </div>
      </div>

      {/* Top Languages */}
      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/60">
          <h3 className="text-lg font-semibold text-zinc-900">Top Languages by Entries</h3>
        </div>
        <div className="divide-y divide-zinc-200/60">
          {data.topLanguages.map((lang: any, idx: number) => (
            <div key={idx} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{lang.name}</p>
                <p className="text-sm text-zinc-500">{lang.community}</p>
              </div>
              <p className="font-semibold text-zinc-900">{lang.entries} entries</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
