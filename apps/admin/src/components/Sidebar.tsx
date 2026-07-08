import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Link2, PlusCircle, ArrowLeftRight, BarChart3,
  Tags, Settings, LogOut, Zap, ClipboardList, Archive,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
  { to: '/links', icon: <Link2 size={18} />, label: 'Links' },
  { to: '/links/create', icon: <PlusCircle size={18} />, label: 'Create Link' },
  { to: '/links/bulk-create', icon: <PlusCircle size={18} />, label: 'Bulk Create' },
  { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { to: '/tags', icon: <Tags size={18} />, label: 'Tags' },
  { to: '/import-export', icon: <ArrowLeftRight size={18} />, label: 'Import / Export' },
  { to: '/backups', icon: <Archive size={18} />, label: 'Backups' },
  { to: '/audit-logs', icon: <ClipboardList size={18} />, label: 'Audit Logs' },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export function Sidebar() {
  const { logout } = useAuth();

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
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
