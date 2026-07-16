import React from 'react';
import { Eye } from 'lucide-react';
import { IS_PUBLIC_DEMO } from '../config/demo';
import { useLocale } from '../contexts/LocaleContext';

export function DemoModeBanner() {
  const { t } = useLocale();
  if (!IS_PUBLIC_DEMO) return null;

  return (
    <div className="border-b border-amber-400/30 bg-amber-400/10 px-6 py-3 text-amber-100">
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <Eye className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{t('demoReadOnlyTitle')}</p>
          <p className="mt-0.5 text-xs text-amber-100/75">{t('demoReadOnlyDescription')}</p>
        </div>
      </div>
    </div>
  );
}
