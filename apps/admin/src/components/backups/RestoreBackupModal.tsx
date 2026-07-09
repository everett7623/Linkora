import { RotateCcw, ShieldAlert } from 'lucide-react';
import type { Backup } from '@linkora/shared';
import {
  previewBackupRestore,
  restoreBackup,
  type BackupRestorePreview,
  type RestoreConflictStrategy,
} from '../../api/backups';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useEffect, useState } from 'react';

interface RestoreBackupModalProps {
  backup: Backup | null;
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}

function fileName(filename: string): string {
  const parts = filename.split('/');
  return parts[parts.length - 1] || filename;
}

function SummaryItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export function RestoreBackupModal({ backup, open, onClose, onRestored }: RestoreBackupModalProps) {
  const { success, error } = useToast();
  const [strategy, setStrategy] = useState<RestoreConflictStrategy>('skip');
  const [preview, setPreview] = useState<BackupRestorePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!open || !backup) return;
    setPreview(null);
    setLoadingPreview(true);
    previewBackupRestore(backup, strategy)
      .then(setPreview)
      .catch((e) => error(String(e)))
      .finally(() => setLoadingPreview(false));
  }, [backup?.id, open, strategy]);

  const runRestore = async () => {
    if (!backup || !preview) return;
    setRestoring(true);
    try {
      const result = await restoreBackup(backup, strategy);
      success(`Restore complete: ${result.created} created, ${result.overwritten} overwritten, ${result.renamed} renamed`);
      onRestored();
      onClose();
    } catch (e) {
      error(String(e));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal open={open && !!backup} onClose={onClose} title="Restore Backup" size="xl">
      {backup && (
        <div className="space-y-5">
          <div>
            <p className="font-mono text-xs text-slate-300">{fileName(backup.filename)}</p>
            <p className="mt-1 text-sm text-slate-500">Preview the restore plan before applying changes.</p>
          </div>

          <Select
            label="Conflict Strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as RestoreConflictStrategy)}
            disabled={loadingPreview || restoring}
          >
            <option value="skip">Skip existing slugs</option>
            <option value="rename">Rename conflicting slugs</option>
            <option value="overwrite">Overwrite existing slugs</option>
          </Select>

          {strategy === 'overwrite' && (
            <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <ShieldAlert size={17} className="mt-0.5 shrink-0" />
              <span>Overwrite will mutate existing links. Linkora creates a pre-restore R2 backup before applying changes.</span>
            </div>
          )}

          {loadingPreview ? (
            <div className="flex h-36 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : preview && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryItem label="Create" value={preview.willCreate} />
                <SummaryItem label="Overwrite" value={preview.willOverwrite} />
                <SummaryItem label="Rename" value={preview.willRename} />
                <SummaryItem label="Skip" value={preview.willSkip} />
                <SummaryItem label="Invalid" value={preview.invalid} />
                <SummaryItem label="Rules" value={preview.redirectRulesToRestore} />
              </div>

              <div className="max-h-56 overflow-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Slug</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {preview.preview.slice(0, 20).map((item) => (
                      <tr key={`${item.slug}-${item.action}-${item.nextSlug ?? ''}`}>
                        <td className="px-3 py-2 font-mono text-slate-300">{item.slug}</td>
                        <td className="px-3 py-2 text-slate-300">{item.nextSlug ? `${item.action} -> ${item.nextSlug}` : item.action}</td>
                        <td className="max-w-sm truncate px-3 py-2 text-slate-500" title={item.longUrl}>{item.longUrl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={restoring}>Cancel</Button>
            <Button
              variant={strategy === 'overwrite' ? 'danger' : 'primary'}
              icon={<RotateCcw size={15} />}
              onClick={runRestore}
              loading={restoring}
              disabled={!preview || preview.total === 0}
            >
              Restore
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
