import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useAdminMode } from '../contexts/AdminModeContext';
import { isFeatureVisible } from '../utils/adminMode';
import { useLocale } from '../contexts/LocaleContext';
import { useDisplayPreferences } from '../contexts/DisplayPreferencesContext';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { SidebarVersionStatus } from './sidebar/SidebarVersionStatus';
import { NAV_GROUPS } from './sidebar/sidebarNavigation';
import { BrandMark } from './BrandMark';

interface SidebarProps {
  collapsed?: boolean;
  mobile?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, mobile = false, onClose, onNavigate }: SidebarProps) {
  const { mode } = useAdminMode();
  const { sidebarDensity, loadingVisibility, moduleIsVisible } = useDisplayPreferences();
  const { t } = useLocale();
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => isFeatureVisible(mode, item.advanced) && moduleIsVisible(item.module)
    ),
  })).filter((group) => group.items.length > 0);
  const compact = sidebarDensity === 'compact';

  return (
    <aside
      className={clsx(
        'flex h-full shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-[width]',
        mobile
          ? 'relative z-10 w-60 max-w-[calc(100vw-3rem)] shadow-2xl'
          : collapsed
            ? 'w-20'
            : compact
              ? 'w-52'
              : 'w-60'
      )}
    >
      <div data-testid="sidebar-header" className="border-b border-slate-800">
        <div
          data-testid="sidebar-brand"
          className={clsx(
            'flex h-16 items-center gap-2.5',
            collapsed && !mobile ? 'justify-center px-2' : compact ? 'px-4' : 'px-5'
          )}
        >
          <div
            className={clsx(
              'flex min-w-0 items-center gap-2.5',
              collapsed && !mobile && 'justify-center'
            )}
          >
            <BrandMark size="sm" />
            {!collapsed && (
              <span className="truncate text-lg font-bold leading-5 text-slate-100">Linketry</span>
            )}
          </div>
          {mobile && (
            <button
              type="button"
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              aria-label={t('closeNavigation')}
              title={t('closeNavigation')}
              onClick={onClose}
            >
              <X size={19} aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          data-testid="sidebar-version-slot"
          className={clsx(collapsed && !mobile ? 'px-2 pb-3' : compact ? 'px-2 pb-2' : 'px-3 pb-3')}
        >
          <SidebarVersionStatus collapsed={collapsed && !mobile} mobile={mobile} />
        </div>
      </div>

      {/* Nav */}
      <nav
        className={clsx(
          'scrollbar-thin flex-1 overflow-y-auto',
          collapsed ? 'px-2 py-3' : compact ? 'px-2 py-2' : 'px-3 py-3'
        )}
        aria-busy={loadingVisibility}
      >
        {visibleGroups.map((group, groupIndex) => (
          <section
            key={group.label}
            className={clsx(groupIndex > 0 && (collapsed ? 'mt-3' : compact ? 'mt-2.5' : 'mt-4'))}
          >
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {t(group.label)}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center rounded-lg text-sm font-medium transition-colors',
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3',
                      !collapsed && (compact ? 'py-1.5' : 'py-2'),
                      isActive
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    )
                  }
                  aria-label={t(item.label)}
                  title={collapsed ? t(item.label) : undefined}
                >
                  {item.icon}
                  {!collapsed && <span className="truncate">{t(item.label)}</span>}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <SidebarFooter collapsed={collapsed} compact={compact} mobile={mobile} />
    </aside>
  );
}
