import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Link2, MousePointerClick } from 'lucide-react';
import { getAnalytics, type AnalyticsSummary } from '../api/analytics';
import { Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import dayjs from 'dayjs';

function Metric({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-100">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}

function BarList({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">{title}</h2>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No data yet.</p>
        ) : items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between gap-3 text-xs">
              <span className="truncate text-slate-400">{item.label}</span>
              <span className="text-slate-500">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Analytics() {
  const { error } = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics(days)
      .then(setData)
      .catch(() => error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  const dailyMax = useMemo(() => Math.max(...(data?.daily.map((item) => item.clicks) ?? [1]), 1), [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Traffic overview for the selected range</p>
        </div>
        <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Clicks" value={data?.totalClicks ?? 0} icon={<MousePointerClick size={16} />} />
        <Metric label="Unique Links" value={data?.uniqueLinks ?? 0} icon={<Link2 size={16} />} />
        <Metric label="Bot Clicks" value={data?.botClicks ?? 0} icon={<Bot size={16} />} />
        <Metric label="Bot Rate" value={`${data?.totalClicks ? Math.round(((data.botClicks ?? 0) / data.totalClicks) * 100) : 0}%`} icon={<Activity size={16} />} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Daily Clicks</h2>
        <div className="flex h-44 items-end gap-1">
          {(data?.daily ?? []).length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No visits in this range.</div>
          ) : data?.daily.map((item) => (
            <div key={item.date} className="flex min-w-4 flex-1 flex-col items-center gap-2">
              <div
                title={`${item.date}: ${item.clicks}`}
                className="w-full rounded-t bg-brand-500"
                style={{ height: `${Math.max(4, (item.clicks / dailyMax) * 100)}%` }}
              />
              <span className="hidden text-[10px] text-slate-600 md:inline">{dayjs(item.date).format('M/D')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarList title="Top Links" items={(data?.topLinks ?? []).map((item) => ({ label: `/${item.slug}${item.title ? ` - ${item.title}` : ''}`, value: item.clicks }))} />
        <BarList title="Top Countries" items={(data?.topCountries ?? []).map((item) => ({ label: item.country, value: item.clicks }))} />
        <BarList title="Top Referrers" items={(data?.topReferrers ?? []).map((item) => ({ label: item.referer, value: item.clicks }))} />
        <BarList title="Browsers" items={(data?.topBrowsers ?? []).map((item) => ({ label: item.browser, value: item.clicks }))} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Visits</h2>
        <div className="divide-y divide-slate-800">
          {(data?.recentVisits ?? []).length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No recent visits.</p>
          ) : data?.recentVisits.map((visit) => (
            <div key={visit.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_1fr_1fr_auto]">
              <span className="font-mono text-brand-400">/{visit.slug}</span>
              <span className="truncate text-slate-400">{visit.referer ?? 'Direct'}</span>
              <span className="text-slate-500">{visit.country ?? 'Unknown'} / {visit.browser ?? 'Other'} / {visit.device_type ?? 'unknown'}</span>
              <span className="text-xs text-slate-600">{dayjs(visit.created_at).format('MMM D HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
