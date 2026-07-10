import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <Languages size={compact ? 15 : 16} />
      {!compact && <span>{t('language')}</span>}
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as 'en' | 'zh-CN')}
        aria-label={t('language')}
        className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
      >
        <option value="en">{t('english')}</option>
        <option value="zh-CN">{t('chinese')}</option>
      </select>
    </label>
  );
}
