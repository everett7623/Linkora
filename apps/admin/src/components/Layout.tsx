import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useDisplayPreferences } from '../contexts/DisplayPreferencesContext';
import { UpdateBanner } from './UpdateBanner';

export function Layout() {
  const { sidebarDensity, tableDensity } = useDisplayPreferences();

  return (
    <div
      className="flex h-full"
      data-sidebar-density={sidebarDensity}
      data-table-density={tableDensity}
    >
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <UpdateBanner />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
