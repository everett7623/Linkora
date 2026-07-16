import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useDisplayPreferences } from '../contexts/DisplayPreferencesContext';
import { UpdateBanner } from './UpdateBanner';
import { DemoModeBanner } from './DemoModeBanner';
import { useLocale } from '../contexts/LocaleContext';

export function Layout() {
  const { sidebarDensity, tableDensity } = useDisplayPreferences();
  const { t } = useLocale();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileSidebarOpen]);

  return (
    <div
      className="relative flex h-full min-w-0 overflow-hidden"
      data-sidebar-density={sidebarDensity}
      data-table-density={tableDensity}
    >
      <div className="hidden h-full lg:block">
        <Sidebar />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label={t('closeNavigation')}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar
            mobile
            onClose={() => setMobileSidebarOpen(false)}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-950">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label={t('openNavigation')}
            title={t('openNavigation')}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="truncate text-sm font-semibold text-slate-100">Linketry</span>
        </div>
        <DemoModeBanner />
        <UpdateBanner />
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
