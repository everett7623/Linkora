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
  const footerCollapsed = collapsed && !mobile;

  return (
    <div
      className={clsx(
        'border-t border-slate-800',
        collapsed ? 'px-2 py-3' : 'px-3',
        compact ? 'py-2.5' : 'py-4'
      )}
    >
      <div className={clsx('mb-2', !footerCollapsed && 'px-3')}>
        <SidebarUtilityActions collapsed={footerCollapsed} />
      </div>
      <AdminModeControl compact={footerCollapsed} />
      <SidebarVersionStatus collapsed={footerCollapsed} />
      {IS_PUBLIC_DEMO ? (
        <DemoReadOnlyStatus compact={footerCollapsed} />
      ) : (
        <button
          type="button"
          onClick={logout}
          className={clsx(
            'mt-1 flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400',
            footerCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
          )}
          aria-label={t('logout')}
          title={footerCollapsed ? t('logout') : undefined}
        >
          <LogOut size={18} aria-hidden="true" />
          {!footerCollapsed && t('logout')}
        </button>
      )}
    </div>
  );
}
