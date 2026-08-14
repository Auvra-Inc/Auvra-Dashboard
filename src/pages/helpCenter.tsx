import { useEffect, useState } from "react";

export function HelpCenter() {
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
          setData(jsonData.helpCenter);
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
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Help Center</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Support articles, FAQs, and contact options for assistance.</p>
          </div>
          <div className="text-sm text-zinc-500">API: {ok ? <span className="text-green-600">ok</span> : <span className="text-red-500">error</span>}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Articles</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{data.articles}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">FAQs</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{data.faq}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Avg Response</p>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{data.avgResolutionTime}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
          <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wide">Satisfaction</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{data.satisfactionScore}</p>
        </div>
      </div>

      {/* Top Articles */}
      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/60">
          <h3 className="text-lg font-semibold text-zinc-900">Top Articles</h3>
        </div>
        <div className="divide-y divide-zinc-200/60">
          {data.topArticles.map((article: any, idx: number) => (
            <div key={idx} className="px-6 py-4 flex items-center justify-between">
              <p className="font-medium text-zinc-900">{article.title}</p>
              <p className="text-sm font-semibold text-zinc-600">{article.views.toLocaleString()} views</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
