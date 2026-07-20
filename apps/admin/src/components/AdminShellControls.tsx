import { Eye, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminMode } from '../contexts/AdminModeContext';
import { useLocale } from '../contexts/LocaleContext';
import { IS_PUBLIC_DEMO } from '../config/demo';

export function AdminModeControl({ compact = false }: { compact?: boolean }) {
  const { isAdvanced, mode, setMode } = useAdminMode();
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setMode(isAdvanced ? 'simple' : 'advanced')}
      className={clsx(
        'mb-1 flex w-full items-center rounded-lg py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        compact ? 'justify-center px-2' : 'justify-between px-3'
      )}
      aria-label={`${t('interfaceMode')}: ${t(mode)}`}
      title={compact ? `${t('interfaceMode')}: ${t(mode)}` : undefined}
    >
      {compact ? (
        <SlidersHorizontal size={17} aria-hidden="true" />
      ) : (
        <>
          <span>{t('interfaceMode')}</span>
          <span className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase text-brand-400">
            {t(mode)}
          </span>
        </>
      )}
    </button>
  );
}

export function DemoReadOnlyStatus({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  if (!IS_PUBLIC_DEMO) return null;

  return (
    <div
      className={clsx(
        'flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-amber-300',
        compact ? 'justify-center px-2' : 'gap-3 px-3'
      )}
      title={compact ? t('demoReadOnlyLabel') : undefined}
    >
      <Eye size={18} aria-hidden="true" />
      {!compact && t('demoReadOnlyLabel')}
    </div>
  );
}
