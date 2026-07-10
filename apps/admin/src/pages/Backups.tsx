import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Cloud,
  Download,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { createBackup, downloadBackup, listBackups, type BackupsList } from '../api/backups';
import { Button } from '../components/ui/Button';
import { RestoreBackupModal } from '../components/backups/RestoreBackupModal';
import { useToast } from '../components/ui/Toast';
import type { Backup } from '@linkora/shared';
import dayjs from 'dayjs';
import { useLocale } from '../contexts/LocaleContext';

function formatBytes(size?: number | null): string {
  if (!size) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function StatusPill({ status }: { status: Backup['status'] }) {
  const classes =
    status === 'completed'
      ? 'bg-emerald-500/15 text-emerald-400'
      : status === 'failed'
        ? 'bg-red-500/15 text-red-400'
        : 'bg-yellow-500/15 text-yellow-400';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
}

export function Backups() {
  const { success, error } = useToast();
  const { locale, t } = useLocale();
  const [data, setData] = useState<BackupsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listBackups());
    } catch {
      error(t('backupsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = useMemo(
    () => data?.items.filter((item) => item.status === 'completed').length ?? 0,
    [data]
  );

  const totalSize = useMemo(
    () =>
      data?.items.reduce(
        (sum, item) => sum + (item.status === 'completed' ? (item.size ?? 0) : 0),
        0
      ) ?? 0,
    [data]
  );

  const latestBackup = data?.items.find((item) => item.status === 'completed');

  const handleCreate = async () => {
    setCreating(true);
    try {
      const backup = await createBackup();
      success(t('backupCreated', { name: backup.filename.split('/').pop() ?? backup.filename }));
      await load();
    } catch (e) {
      error(String(e));
      await load();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('backups')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {data ? t('backupRecordsCount', { count: data.total.toLocaleString(locale) }) : '-'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={load}
            disabled={loading || creating}
          >
            {t('refresh')}
          </Button>
          <Button icon={<Archive size={15} />} onClick={handleCreate} loading={creating}>
            {t('createBackup')}
          </Button>
        </div>
      </div>

      {data && !data.r2Configured && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          <AlertTriangle size={17} className="shrink-0" />
          <span>{t('r2NotConfigured')}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('completed')}</span>
            <CheckCircle size={17} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {completedCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('storedSize')}</span>
            <Cloud size={17} className="text-brand-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">{formatBytes(totalSize)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('latest')}</span>
            <Archive size={17} className="text-slate-400" />
          </div>
          <div className="mt-3 text-lg font-semibold text-slate-100">
            {latestBackup ? dayjs(latestBackup.created_at).format('MMM D HH:mm') : '-'}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            {t('noBackups')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">{t('created')}</th>
                  <th className="text-left px-4 py-3">{t('file')}</th>
                  <th className="text-left px-4 py-3">{t('storage')}</th>
                  <th className="text-right px-4 py-3">{t('size')}</th>
                  <th className="text-left px-4 py-3">{t('status')}</th>
                  <th className="text-right px-4 py-3">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.items.map((backup) => (
                  <tr key={backup.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {dayjs(backup.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="max-w-md truncate font-mono text-xs text-slate-300"
                        title={backup.filename}
                      >
                        {backup.filename}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase text-slate-500">{backup.storage}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={backup.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<RotateCcw size={14} />}
                          disabled={backup.status !== 'completed'}
                          onClick={() => setRestoreTarget(backup)}
                        >
                          {t('restoreAction')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Download size={14} />}
                          disabled={backup.status !== 'completed'}
                          onClick={() => downloadBackup(backup).catch((e) => error(String(e)))}
                        >
                          {t('download')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RestoreBackupModal
        backup={restoreTarget}
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onRestored={load}
      />
    </div>
  );
}
