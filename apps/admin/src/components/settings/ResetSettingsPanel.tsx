import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { getResetPreview, resetInstance, type InstanceResetPreview } from '../../api/maintenance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useLocale } from '../../contexts/LocaleContext';

const RESET_PHRASE = 'RESET LINKORA';

function formatCount(value: number): string {
  return value.toLocaleString();
}

function TopTableRows({
  preview,
  emptyLabel,
}: {
  preview: InstanceResetPreview;
  emptyLabel: string;
}) {
  const rows = Object.entries(preview.tables)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (rows.length === 0) return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map(([table, count]) => (
        <div
          key={table}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
        >
          <span className="font-mono text-xs text-slate-400">{table}</span>
          <span className="text-sm font-semibold text-slate-100">{formatCount(count)}</span>
        </div>
      ))}
    </div>
  );
}

export function ResetSettingsPanel() {
  const { success, error } = useToast();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<InstanceResetPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [createBackup, setCreateBackup] = useState(true);

  const openModal = async () => {
    setOpen(true);
    setConfirmation('');
    setPreview(null);
    setLoadingPreview(true);
    try {
      setPreview(await getResetPreview());
    } catch (e) {
      error(String(e));
    } finally {
      setLoadingPreview(false);
    }
  };

  const runReset = async () => {
    setResetting(true);
    try {
      const result = await resetInstance({ confirmation, createBackup });
      success(
        t('resetComplete', {
          rows: formatCount(result.totalRows),
          keys: formatCount(result.kvDeleted),
        })
      );
      setOpen(false);
    } catch (e) {
      error(String(e));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-400" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-300">
            {t('dangerZone')}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{t('resetHelp')}</p>
        </div>
      </div>
      <Button variant="danger" icon={<RefreshCcw size={15} />} onClick={openModal}>
        {t('resetInstance')}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('resetInstance')} size="xl">
        <div className="space-y-5">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {t('resetWarning')}
          </div>

          {loadingPreview ? (
            <div className="flex h-28 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            preview && (
              <>
                <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                  <div className="text-xs text-slate-500">{t('rowsToRemove')}</div>
                  <div className="mt-1 text-2xl font-bold text-slate-100">
                    {formatCount(preview.totalRows)}
                  </div>
                </div>
                <TopTableRows preview={preview} emptyLabel={t('noRowsDelete')} />
              </>
            )
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={createBackup}
              onChange={(e) => setCreateBackup(e.target.checked)}
              disabled={resetting}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
            />
            {t('preResetBackup')}
          </label>

          <Input
            label={t('resetConfirm', { phrase: RESET_PHRASE })}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={resetting}
          />

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={resetting}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              icon={<RefreshCcw size={15} />}
              onClick={runReset}
              loading={resetting}
              disabled={!preview || confirmation !== RESET_PHRASE}
            >
              {t('resetInstance')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
