import React from 'react';
import { Eye, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminMode } from '../../contexts/AdminModeContext';
import { useLocale } from '../../contexts/LocaleContext';
import { SidebarUtilityActions } from './SidebarUtilityActions';
import { IS_PUBLIC_DEMO } from '../../config/demo';

export function SidebarFooter({ compact }: { compact: boolean }) {
  const { logout } = useAuth();
  const { isAdvanced, mode, setMode } = useAdminMode();
  const { t } = useLocale();

  return (
    <div className={clsx('border-t border-slate-800 px-3', compact ? 'py-2.5' : 'py-4')}>
      <div className="mb-2 px-3">
        <SidebarUtilityActions />
      </div>
      <button
        type="button"
        onClick={() => setMode(isAdvanced ? 'simple' : 'advanced')}
        className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
      >
        <span>{t('interfaceMode')}</span>
        <span className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase text-brand-400">
          {t(mode)}
        </span>
      </button>
      {IS_PUBLIC_DEMO ? (
        <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-300">
          <Eye size={18} aria-hidden="true" />
          {t('demoReadOnlyLabel')}
        </div>
      ) : (
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut size={18} aria-hidden="true" />
          {t('logout')}
        </button>
      )}
    </div>
  );
}
