import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Search, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import type { LinkHealthBatchResult, LinkHealthCheckResult, LinkHealthStatus } from '@linkora/shared';
import { checkUrl, runHealthCheckBatch } from '../api/healthChecks';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

function statusVariant(status: LinkHealthStatus): 'green' | 'yellow' | 'red' {
  if (status === 'healthy') return 'green';
  if (status === 'warning') return 'yellow';
  return 'red';
}

function StatusIcon({ status }: { status: LinkHealthStatus }) {
  if (status === 'healthy') return <CheckCircle2 size={15} className="text-emerald-400" />;
  if (status === 'warning') return <AlertTriangle size={15} className="text-yellow-400" />;
  return <XCircle size={15} className="text-red-400" />;
}

function Metric({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-100">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}

function emptySummary(): LinkHealthBatchResult {
  return { items: [], total: 0, healthy: 0, warning: 0, broken: 0 };
}

function resultLink(result: LinkHealthCheckResult): string {
  if (!result.slug) return result.url;
  return result.domain ? `${result.domain}/${result.slug}` : `/${result.slug}`;
}

export function HealthChecks() {
  const { success, error } = useToast();
  const [limit, setLimit] = useState(20);
  const [url, setUrl] = useState('');
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [results, setResults] = useState<LinkHealthCheckResult[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const summary = useMemo<LinkHealthBatchResult>(() => {
    if (results.length === 0) return emptySummary();
    return {
      items: results,
      total: results.length,
      healthy: results.filter((item) => item.status === 'healthy').length,
      warning: results.filter((item) => item.status === 'warning').length,
      broken: results.filter((item) => item.status === 'broken').length,
    };
  }, [results]);

  const runBatch = async () => {
    setLoadingBatch(true);
    try {
      const result = await runHealthCheckBatch({ limit });
      setResults(result.items);
      setLastRunAt(new Date().toISOString());
      success(`Checked ${result.total} links`);
    } catch (e) {
      error(String(e));
    } finally {
      setLoadingBatch(false);
    }
  };

  const runUrlCheck = async () => {
    const target = url.trim();
    if (!target) {
      error('URL is required');
      return;
    }

    setLoadingUrl(true);
    try {
      const result = await checkUrl(target);
      setResults([result, ...results.filter((item) => item.url !== result.url)]);
      setLastRunAt(new Date().toISOString());
      success('URL checked');
    } catch (e) {
      error(String(e));
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Health Checks</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {lastRunAt ? `Last checked ${dayjs(lastRunAt).format('YYYY-MM-DD HH:mm:ss')}` : 'Manual target URL checks'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select
            label="Batch Size"
            value={String(limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-32"
          >
            <option value="10">10 links</option>
            <option value="20">20 links</option>
            <option value="50">50 links</option>
          </Select>
          <Button icon={<RefreshCw size={15} />} onClick={runBatch} loading={loadingBatch}>
            Check Active Links
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Checked" value={summary.total} icon={<Activity size={17} className="text-brand-400" />} />
        <Metric label="Healthy" value={summary.healthy} icon={<CheckCircle2 size={17} className="text-emerald-400" />} />
        <Metric label="Warnings" value={summary.warning} icon={<AlertTriangle size={17} className="text-yellow-400" />} />
        <Metric label="Broken" value={summary.broken} icon={<XCircle size={17} className="text-red-400" />} />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Input
            label="Check URL"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button variant="secondary" icon={<Search size={15} />} onClick={runUrlCheck} loading={loadingUrl}>
            Check URL
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {results.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
            <Activity size={26} className="text-slate-600" />
            <p className="text-sm">No health checks run yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">HTTP</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3 text-left">Final URL</th>
                  <th className="px-4 py-3 text-left">Checked</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.map((result) => (
                  <tr key={`${result.link_id ?? result.url}-${result.checked_at}`} className="transition-colors hover:bg-slate-800/50">
                    <td className="max-w-xs px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={result.status} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100" title={resultLink(result)}>
                            {resultLink(result)}
                          </p>
                          <p className="truncate text-xs text-slate-500" title={result.url}>{result.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(result.status)}>{result.status}</Badge>
                      {result.error && <p className="mt-1 max-w-48 truncate text-xs text-red-400" title={result.error}>{result.error}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{result.http_status ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{result.response_time_ms.toLocaleString()} ms</td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="truncate text-slate-400" title={result.final_url ?? ''}>{result.final_url ?? '-'}</p>
                      {result.fallback_url && <p className="mt-1 truncate text-xs text-slate-600" title={result.fallback_url}>fallback: {result.fallback_url}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {dayjs(result.checked_at).format('YYYY-MM-DD HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {result.link_id && (
                          <Link
                            to={`/links/${result.link_id}/edit`}
                            title="Edit link"
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
                          >
                            <Activity size={14} />
                          </Link>
                        )}
                        <a
                          href={result.final_url ?? result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open target"
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
