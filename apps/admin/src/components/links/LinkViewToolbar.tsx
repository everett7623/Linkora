import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import type { LinkView } from '../../utils/linkView';

interface LinkViewToolbarProps {
  view: LinkView;
  showSelectAll: boolean;
  allVisibleSelected: boolean;
  onChange: (view: LinkView) => void;
  onToggleAllVisible: () => void;
}

export function LinkViewToolbar({
  view,
  showSelectAll,
  allVisibleSelected,
  onChange,
  onToggleAllVisible,
}: LinkViewToolbarProps) {
  const { t } = useLocale();
  const buttonClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'bg-brand-500/15 text-brand-400'
        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
    }`;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showSelectAll && (
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleAllVisible}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
          />
          {t('selectAllVisibleLinks')}
        </label>
      )}
      <div
        className="flex rounded-lg border border-slate-800 bg-slate-900 p-1"
        role="group"
        aria-label={t('linkView')}
      >
        <button
          type="button"
          onClick={() => onChange('table')}
          aria-pressed={view === 'table'}
          className={buttonClass(view === 'table')}
        >
          <List size={14} aria-hidden="true" />
          {t('linkTableView')}
        </button>
        <button
          type="button"
          onClick={() => onChange('cards')}
          aria-pressed={view === 'cards'}
          className={buttonClass(view === 'cards')}
        >
          <LayoutGrid size={14} aria-hidden="true" />
          {t('linkCardView')}
        </button>
      </div>
    </div>
  );
}
