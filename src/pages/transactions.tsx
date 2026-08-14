import { useEffect, useState } from "react";

export function Transactions() {
  const [data, setData] = useState<any[]>([]);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const res = await fetch('/mock-api.json');
        const jsonData = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setData(jsonData.transactions || []);
          setOk(true);
        }
      } catch (error) {
        if (mounted) {
          setData([]);
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
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Transactions</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">View and manage financial transactions and payment records.</p>
          </div>
          <div className="text-sm text-zinc-500">Transactions API: {ok ? <span className="text-green-600">reachable</span> : <span className="text-red-500">unreachable</span>}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.2fr_0.8fr_0.8fr] gap-4 px-6 py-4 border-b border-zinc-200/60 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <span>User</span>
          <span>Amount</span>
          <span>Type</span>
          <span>Status</span>
        </div>
        {data.map((txn) => (
          <div key={txn.id} className="grid grid-cols-[1.5fr_1.2fr_0.8fr_0.8fr] gap-4 px-6 py-4 border-b border-zinc-200/60 last:border-b-0 text-sm items-center">
            <span className="font-medium text-zinc-900">{txn.user}</span>
            <span className="font-semibold text-zinc-900">${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-zinc-600 capitalize">{txn.type}</span>
            <span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                txn.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {txn.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
