import { useEffect, useState } from "react";

export function Badges() {
  const [ok, setOk] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const res = await fetch('/mock-api.json');
        const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setBadges(data.badges || []);
          setOk(true);
        }
      } catch (error) {
        if (mounted) {
          setBadges([]);
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
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Badges</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Create and manage badges, achievements, and recognition systems.</p>
          </div>
          <div className="text-sm text-zinc-500">API: {ok ? <span className="text-green-600">ok</span> : <span className="text-red-500">error</span>}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div key={badge.id} className="bg-white rounded-xl border border-zinc-200/60 p-6">
            <div className="text-5xl mb-4">{badge.icon}</div>
            <h3 className="text-lg font-semibold text-zinc-900">{badge.name}</h3>
            <p className="text-sm text-zinc-600 mt-2">{badge.description}</p>
            <p className="text-sm font-semibold text-zinc-700 mt-4">Recipients: {badge.recipients.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
