import { useEffect, useState } from "react";

export function Settings() {
  const [ok, setOk] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const res = await fetch('/mock-api.json');
        const jsonData = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setData(jsonData.settings);
          setOk(true);
        }
      } catch (error) {
        if (mounted) {
          setData(null);
          setOk(false);
        }
      }
    };

    loadSettings();
    return () => { mounted = false; };
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Settings</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">Application and account settings configuration.</p>
          </div>
          <div className="text-sm text-zinc-500">Settings API: {ok ? <span className="text-green-600">loaded</span> : <span className="text-red-500">unavailable</span>}</div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Application Info</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">App Name</span>
            <span className="font-medium text-zinc-900">{data.appName}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Version</span>
            <span className="font-medium text-zinc-900">{data.version}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Timezone</span>
            <span className="font-medium text-zinc-900">{data.timezone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600">Language</span>
            <span className="font-medium text-zinc-900">{data.language.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Email Notifications</span>
            <input type="checkbox" checked={data.notifications.email} readOnly className="w-4 h-4" />
          </label>
          <label className="flex items-center justify-between cursor-pointer pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Push Notifications</span>
            <input type="checkbox" checked={data.notifications.push} readOnly className="w-4 h-4" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-zinc-600">SMS Notifications</span>
            <input type="checkbox" checked={data.notifications.sms} readOnly className="w-4 h-4" />
          </label>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-xl border border-zinc-200/60 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Privacy</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Data Collection</span>
            <input type="checkbox" checked={data.privacy.dataCollection} readOnly className="w-4 h-4" />
          </label>
          <label className="flex items-center justify-between cursor-pointer pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Analytics</span>
            <input type="checkbox" checked={data.privacy.analytics} readOnly className="w-4 h-4" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-zinc-600">Third Party Sharing</span>
            <input type="checkbox" checked={data.privacy.thirdParty} readOnly className="w-4 h-4" />
          </label>
        </div>
      </div>
    </div>
  );
}
