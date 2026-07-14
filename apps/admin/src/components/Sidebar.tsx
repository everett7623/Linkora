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
  Zap,
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

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: MessageKey;
  advanced?: boolean;
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
      },
      { to: '/domains', icon: <Globe2 size={18} />, label: 'domains', advanced: true },
      { to: '/groups', icon: <Folder size={18} />, label: 'groups', advanced: true },
      { to: '/tags', icon: <Tags size={18} />, label: 'tags' },
      { to: '/import-export', icon: <ArrowLeftRight size={18} />, label: 'importExport' },
    ],
  },
  {
    label: 'navInsightsAutomation',
    items: [
      { to: '/analytics', icon: <BarChart3 size={18} />, label: 'analytics', advanced: true },
      {
        to: '/redirect-rules',
        icon: <Shuffle size={18} />,
        label: 'redirectRules',
        advanced: true,
      },
      { to: '/health-checks', icon: <Activity size={18} />, label: 'healthChecks', advanced: true },
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
      },
      { to: '/backups', icon: <Archive size={18} />, label: 'backups', advanced: true },
      { to: '/api-tokens', icon: <KeyRound size={18} />, label: 'apiTokens', advanced: true },
      { to: '/audit-logs', icon: <ClipboardList size={18} />, label: 'auditLogs', advanced: true },
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
  const { t } = useLocale();
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isFeatureVisible(mode, item.advanced)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-slate-900 border-r border-slate-800 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg text-slate-100 tracking-tight">Linkora</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {visibleGroups.map((group, groupIndex) => (
          <section key={group.label} className={clsx(groupIndex > 0 && 'mt-4')}>
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
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
      <div className="px-3 py-4 border-t border-slate-800">
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
