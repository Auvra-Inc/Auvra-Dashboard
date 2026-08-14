import { useEffect, useState } from "react";

export function Communities() {
  const [ok, setOk] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const res = await fetch('/mock-api.json');
        const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setCommunities(data.communities || []);
          setOk(true);
        }
      } catch (error) {
        if (mounted) {
          setCommunities([]);
          setOk(false);
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Communities</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Overview and management of communities and groups on the platform.</p>
          </div>
          <div className="text-sm text-zinc-500">API: {ok ? <span className="text-green-600">ok</span> : <span className="text-red-500">error</span>}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 px-6 py-4 border-b border-zinc-200/60 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <span>Community Name</span>
          <span>Members</span>
          <span>Engagement</span>
          <span>Status</span>
        </div>
        {communities.map((community) => (
          <div key={community.id} className="grid grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 px-6 py-4 border-b border-zinc-200/60 last:border-b-0 text-sm items-center">
            <span className="font-medium text-zinc-900">{community.name}</span>
            <span className="text-zinc-700">{community.memberCount.toLocaleString()}</span>
            <span className="text-emerald-600 font-semibold">{community.engagement}</span>
            <span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {community.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
