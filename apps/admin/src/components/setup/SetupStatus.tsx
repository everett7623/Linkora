import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useLocale } from '../../contexts/LocaleContext';

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface SetupCheck {
  title: string;
  detail: string;
  status: CheckStatus;
  actionLabel?: string;
  actionTo?: string;
}

function statusVariant(status: CheckStatus): 'green' | 'yellow' | 'red' {
  if (status === 'ok') return 'green';
  if (status === 'warn') return 'yellow';
  return 'red';
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'ok') return <CheckCircle2 size={17} className="text-emerald-400" />;
  if (status === 'warn') return <AlertTriangle size={17} className="text-yellow-400" />;
  return <XCircle size={17} className="text-red-400" />;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 truncate text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export function SetupSummary({ checks, apiOrigin }: { checks: SetupCheck[]; apiOrigin: string }) {
  const { t } = useLocale();
  const okCount = checks.filter((check) => check.status === 'ok').length;
  const warnCount = checks.filter((check) => check.status === 'warn').length;
  const failCount = checks.filter((check) => check.status === 'fail').length;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Metric
        label={t('checksOk')}
        value={String(okCount)}
        icon={<CheckCircle2 size={17} className="text-emerald-400" />}
      />
      <Metric
        label={t('warnings')}
        value={String(warnCount)}
        icon={<AlertTriangle size={17} className="text-yellow-400" />}
      />
      <Metric
        label={t('failures')}
        value={String(failCount)}
        icon={<XCircle size={17} className="text-red-400" />}
      />
      <Metric
        label={t('apiOrigin')}
        value={apiOrigin}
        icon={<ShieldCheck size={17} className="text-brand-400" />}
      />
    </div>
  );
}

export function SetupCheckList({ checks }: { checks: SetupCheck[] }) {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      {checks.map((check) => (
        <div
          key={check.title}
          className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-5 py-4 last:border-0"
        >
          <StatusIcon status={check.status} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-slate-100">{check.title}</h3>
              <Badge variant={statusVariant(check.status)}>
                {t(
                  check.status === 'ok'
                    ? 'statusOk'
                    : check.status === 'warn'
                      ? 'statusWarn'
                      : 'statusFail'
                )}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{check.detail}</p>
          </div>
          {check.actionTo && check.actionLabel && (
            <Link
              to={check.actionTo}
              className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-600"
            >
              {check.actionLabel}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
