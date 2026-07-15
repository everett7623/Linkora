import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  PlusCircle,
  ArrowLeftRight,
  BarChart3,
  Tags,
  Settings,
  LogOut,
  ClipboardList,
  Archive,
  KeyRound,
  Globe2,
  Shuffle,
  Folder,
  Activity,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useAdminMode } from '../contexts/AdminModeContext';
import { isFeatureVisible } from '../utils/adminMode';
import { useLocale } from '../contexts/LocaleContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { MessageKey } from '../i18n/messages';
import { useDisplayPreferences } from '../contexts/DisplayPreferencesContext';
import type { OptionalModule } from '../utils/displayPreferences';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: MessageKey;
  advanced?: boolean;
  module?: OptionalModule;
}

interface NavGroup {
  label: MessageKey;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'navDaily',
    items: [
      { to: '/overview', icon: <LayoutDashboard size={18} />, label: 'overview' },
      { to: '/links', icon: <Link2 size={18} />, label: 'links' },
      { to: '/links/create', icon: <PlusCircle size={18} />, label: 'createLink' },
      {
        to: '/links/bulk-create',
        icon: <PlusCircle size={18} />,
        label: 'bulkCreate',
        advanced: true,
        module: 'bulk-create',
      },
      {
        to: '/domains',
        icon: <Globe2 size={18} />,
        label: 'domains',
        advanced: true,
        module: 'domains',
      },
      {
        to: '/groups',
        icon: <Folder size={18} />,
        label: 'groups',
        advanced: true,
        module: 'groups',
      },
      { to: '/tags', icon: <Tags size={18} />, label: 'tags' },
      { to: '/import-export', icon: <ArrowLeftRight size={18} />, label: 'importExport' },
    ],
  },
  {
    label: 'navInsightsAutomation',
    items: [
      {
        to: '/analytics',
        icon: <BarChart3 size={18} />,
        label: 'analytics',
        advanced: true,
        module: 'analytics',
      },
      {
        to: '/redirect-rules',
        icon: <Shuffle size={18} />,
        label: 'redirectRules',
        advanced: true,
        module: 'redirect-rules',
      },
      {
        to: '/health-checks',
        icon: <Activity size={18} />,
        label: 'healthChecks',
        advanced: true,
        module: 'health-checks',
      },
    ],
  },
  {
    label: 'navOperations',
    items: [
      {
        to: '/operations',
        icon: <Gauge size={18} />,
        label: 'operationsDashboard',
        advanced: true,
        module: 'operations',
      },
      {
        to: '/backups',
        icon: <Archive size={18} />,
        label: 'backups',
        advanced: true,
        module: 'backups',
      },
      {
        to: '/api-tokens',
        icon: <KeyRound size={18} />,
        label: 'apiTokens',
        advanced: true,
        module: 'api-tokens',
      },
      {
        to: '/audit-logs',
        icon: <ClipboardList size={18} />,
        label: 'auditLogs',
        advanced: true,
        module: 'audit-logs',
      },
    ],
  },
  {
    label: 'navSystem',
    items: [
      { to: '/setup', icon: <ShieldCheck size={18} />, label: 'setup' },
      { to: '/settings', icon: <Settings size={18} />, label: 'settings' },
    ],
  },
];

export function Sidebar() {
  const { logout } = useAuth();
  const { isAdvanced, mode, setMode } = useAdminMode();
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
        compact ? 'w-52' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center gap-2.5 border-b border-slate-800',
          compact ? 'px-4 py-3.5' : 'px-5 py-5'
        )}
      >
        <div
          className="relative h-7 w-11 shrink-0 overflow-hidden rounded-md bg-white"
          aria-hidden="true"
        >
          <img
            src="/linketry-logo.png"
            alt=""
            className="absolute -left-3 -top-[53px] w-[132px] max-w-none"
          />
        </div>
        <span className="font-bold text-lg text-slate-100 tracking-tight">Linketry</span>
      </div>

      {/* Nav */}
      <nav
        className={clsx(
          'scrollbar-thin flex-1 overflow-y-auto',
          compact ? 'px-2 py-2' : 'px-3 py-3'
        )}
        aria-busy={loadingVisibility}
      >
        {visibleGroups.map((group, groupIndex) => (
          <section
            key={group.label}
            className={clsx(groupIndex > 0 && (compact ? 'mt-2.5' : 'mt-4'))}
          >
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {t(group.label)}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      compact ? 'py-1.5' : 'py-2',
                      isActive
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    )
                  }
                >
                  {item.icon}
                  {t(item.label)}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      {/* Footer */}
      <div className={clsx('border-t border-slate-800 px-3', compact ? 'py-2.5' : 'py-4')}>
        <div className="mb-2 px-3">
          <LanguageSwitcher compact />
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
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
