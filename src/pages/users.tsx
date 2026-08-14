import { useEffect, useState } from "react";
// import api from "../utils/api";

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
};

export function Users() {
  const [users, setUsers] = useState<MockUser[]>([]);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      try {
        // const res = await api.users.list();
        const res = await fetch('/mock-api.json');
        const data = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setUsers(data.users || []);
          setOk(true);
        }
      } catch (error) {
        if (mounted) {
          setUsers([]);
          setOk(false);
        }
      }
    };

    loadUsers();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Users</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Manage and view platform users, roles, and activity.</p>
          </div>
          <div className="text-sm text-zinc-500">Users API: {ok ? <span className="text-green-600">loaded</span> : <span className="text-red-500">unavailable</span>}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] gap-4 px-6 py-4 border-b border-zinc-200/60 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>

        {users.length === 0 ? (
          <p className="px-6 py-10 text-zinc-400 font-medium text-sm">No user data available</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] gap-4 px-6 py-4 border-b border-zinc-200/60 last:border-b-0 text-sm text-zinc-700 items-center">
              <span className="font-medium text-zinc-900">{user.name}</span>
              <span>{user.email}</span>
              <span>{user.role}</span>
              <span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {user.status}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
