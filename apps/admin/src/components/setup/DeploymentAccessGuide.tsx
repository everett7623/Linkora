import React from 'react';
import { ExternalLink, KeyRound, LayoutDashboard, Server } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';

interface DeploymentAccessGuideProps {
  apiOrigin: string;
  compact?: boolean;
}

export function DeploymentAccessGuide({ apiOrigin, compact = false }: DeploymentAccessGuideProps) {
  const { t } = useLocale();
  const adminOrigin =
    typeof window === 'undefined' ? 'https://linketry-admin.pages.dev' : window.location.origin;
  const resolvedApiOrigin = apiOrigin || 'https://go.example.com';

  return (
    <div
      className={`border border-slate-800 bg-slate-950/60 ${compact ? 'rounded-lg p-3' : 'p-5'}`}
    >
      <div className="flex items-start gap-3">
        <KeyRound size={18} className="mt-0.5 shrink-0 text-brand-400" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-200">{t('deploymentAccessTitle')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('deploymentAccessDescription')}</p>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
          <dt className="flex items-center gap-1.5 text-slate-500">
            <LayoutDashboard size={13} /> {t('adminUrlLabel')}
          </dt>
          <dd className="mt-1 truncate font-mono text-slate-300" title={adminOrigin}>
            {adminOrigin}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
          <dt className="flex items-center gap-1.5 text-slate-500">
            <Server size={13} /> {t('workerApiUrlLabel')}
          </dt>
          <dd className="mt-1 truncate font-mono text-slate-300" title={resolvedApiOrigin}>
            {resolvedApiOrigin}
          </dd>
        </div>
      </dl>

      <div className="mt-3 text-xs text-slate-400">
        <div className="font-medium text-slate-300">{t('tokenHowToTitle')}</div>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-slate-500">
          <li>{t('tokenExistingHint')}</li>
          <li>{t('tokenGeneratedHint')}</li>
          <li>{t('tokenSaveHint')}</li>
        </ol>
        <a
          href="https://github.com/everett7623/Linketry/blob/main/docs/SELF_HOSTING.md#9-first-login"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
        >
          {t('openTokenGuide')} <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
