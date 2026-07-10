import React, { useCallback, useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { listAuditLogs } from '../api/audit';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import type { AuditLog, PaginatedResult } from '@linkora/shared';
import { useLocale } from '../contexts/LocaleContext';
import type { MessageKey } from '../i18n/messages';

const PAGE_SIZE = 50;
const ACTION_OPTIONS: Array<{ value: string; label: MessageKey }> = [
  { value: 'link.create', label: 'auditActionLinkCreate' },
  { value: 'link.update', label: 'auditActionLinkUpdate' },
  { value: 'link.delete', label: 'auditActionLinkDelete' },
  { value: 'import.confirm', label: 'auditActionImportConfirm' },
  { value: 'import.shlink_api.fetch', label: 'auditActionShlinkFetch' },
  { value: 'backup.create', label: 'auditActionBackupCreate' },
  { value: 'api_token.create', label: 'auditActionApiTokenCreate' },
  { value: 'api_token.revoke', label: 'auditActionApiTokenRevoke' },
];

function formatDetail(detail?: string | null): string {
  if (!detail) return '-';
  try {
    return JSON.stringify(JSON.parse(detail), null, 0);
  } catch {
    return detail;
  }
}

export function AuditLogs() {
  const { error } = useToast();
  const { locale, t } = useLocale();
  const [result, setResult] = useState<PaginatedResult<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAuditLogs({ keyword, action, page, pageSize: PAGE_SIZE });
      setResult(data);
    } catch {
      error(t('auditLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [keyword, action, page, error, t]);

  useEffect(() => {
    load();
  }, [load]);

  const updateKeyword = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const updateAction = (value: string) => {
    setAction(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('auditLogs')}</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {result ? t('eventsCount', { count: result.total.toLocaleString(locale) }) : '-'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('searchAudit')}
            value={keyword}
            onChange={(e) => updateKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Select value={action} onChange={(e) => updateAction(e.target.value)} className="min-w-48">
          <option value="">{t('allActions')}</option>
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </Select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : result?.items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            {t('noAuditEvents')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">{t('time')}</th>
                  <th className="text-left px-4 py-3">{t('action')}</th>
                  <th className="text-left px-4 py-3">{t('target')}</th>
                  <th className="text-left px-4 py-3">{t('detail')}</th>
                  <th className="text-left px-4 py-3">{t('userAgent')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result?.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {dateFormatter.format(new Date(item.created_at))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-400">{item.action}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {item.target_type ?? '-'}
                      {item.target_id ? ` / ${item.target_id}` : ''}
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p
                        className="truncate font-mono text-xs text-slate-400"
                        title={formatDetail(item.detail)}
                      >
                        {formatDetail(item.detail)}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-xs text-slate-500" title={item.user_agent ?? ''}>
                        {item.user_agent ?? '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {t('pageOf', {
              page: page.toLocaleString(locale),
              total: result.totalPages.toLocaleString(locale),
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={14} />}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('previous')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= result.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('next')} <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
