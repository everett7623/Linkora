import React from 'react';
import { LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { IS_PUBLIC_DEMO } from '../../config/demo';
import { AdminModeControl, DemoReadOnlyStatus } from '../AdminShellControls';
import { SidebarUtilityActions } from './SidebarUtilityActions';
import { SidebarVersionStatus } from './SidebarVersionStatus';

export function SidebarFooter({
  collapsed,
  compact,
  mobile,
}: {
  collapsed: boolean;
  compact: boolean;
  mobile: boolean;
}) {
  const { logout } = useAuth();
  const { t } = useLocale();

  return (
    <div
      className={clsx(
        'border-t border-slate-800',
        collapsed ? 'px-2 py-3' : 'px-3',
        compact ? 'py-2.5' : 'py-4'
      )}
    >
      <SidebarVersionStatus collapsed={collapsed && !mobile} />
      {mobile ? (
        <div className="mt-2 space-y-2">
          <SidebarUtilityActions />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <AdminModeControl />
            <DemoReadOnlyStatus compact />
          </div>
        </div>
      ) : !IS_PUBLIC_DEMO ? (
        <button
          type="button"
          onClick={logout}
          className={clsx(
            'mt-1 flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400',
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          )}
          aria-label={t('logout')}
          title={collapsed ? t('logout') : undefined}
        >
          <LogOut size={18} aria-hidden="true" />
          {!collapsed && t('logout')}
        </button>
      ) : null}
    </div>
  );
}
