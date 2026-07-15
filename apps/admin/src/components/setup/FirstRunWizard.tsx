import React from 'react';
import { CheckCircle2, Circle, ExternalLink, Rocket, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { getSetupWizardState } from '../../utils/setupWizard';
import { DeploymentAccessGuide } from './DeploymentAccessGuide';

interface FirstRunWizardProps {
  apiReady: boolean;
  defaultDomain: string;
  totalLinks: number;
  isAdvanced: boolean;
  apiOrigin: string;
}

export function FirstRunWizard({
  apiReady,
  defaultDomain,
  totalLinks,
  isAdvanced,
  apiOrigin,
}: FirstRunWizardProps) {
  const { t } = useLocale();
  const state = getSetupWizardState(apiReady, defaultDomain, totalLinks);
  const steps = [
    {
      title: t('wizardApiTitle'),
      detail: t(apiReady ? 'wizardApiReady' : 'wizardApiPending'),
      complete: state.apiReady,
    },
    {
      title: t('wizardDomainTitle'),
      detail: defaultDomain || t('wizardDomainPending'),
      complete: state.domainReady,
      action: t('openSettings'),
      to: '/settings',
    },
    {
      title: t('wizardLinkTitle'),
      detail: totalLinks > 0 ? t('wizardLinkReady', { count: totalLinks }) : t('wizardLinkPending'),
      complete: state.linkReady,
      action: t(totalLinks > 0 ? 'openLinks' : 'createLink'),
      to: totalLinks > 0 ? '/links' : '/links/create',
    },
  ];

  const firstIncomplete = steps.find((step) => !step.complete);

  return (
    <section className="overflow-hidden rounded-xl border border-brand-500/40 bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 p-5">
        <div className="flex gap-3">
          <div className="rounded-lg bg-brand-500/10 p-2 text-brand-400">
            <Rocket size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">{t('wizardTitle')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {state.ready ? t('wizardComplete') : t('wizardDescription')}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {t('wizardProgress', { completed: state.completed, total: steps.length })}
        </span>
      </div>

      <div className="divide-y divide-slate-800">
        {steps.map((step, index) => {
          const isNext = firstIncomplete === step;
          return (
            <div
              key={step.title}
              className={`flex flex-wrap items-center gap-3 px-5 py-4 ${
                isNext ? 'bg-brand-500/5' : ''
              }`}
            >
              {step.complete ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : (
                <Circle size={18} className={isNext ? 'text-brand-400' : 'text-slate-600'} />
              )}
              <span className="w-5 text-xs font-medium text-slate-500">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-200">{step.title}</div>
                <div className={`mt-0.5 text-xs ${isNext ? 'text-brand-300' : 'text-slate-500'}`}>
                  {step.detail}
                </div>
              </div>
              {step.to && step.action && (
                <Link
                  to={step.to}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isNext
                      ? 'bg-brand-600 text-white hover:bg-brand-500'
                      : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                  }`}
                >
                  {step.action}
                  {isNext && <ArrowRight size={12} />}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <DeploymentAccessGuide apiOrigin={apiOrigin} />

      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 px-5 py-3 text-xs text-slate-500">
        <span>{t('wizardOneDomain')}</span>
        {isAdvanced && (
          <a
            href="https://github.com/everett7623/Linketry/blob/main/docs/SELF_HOSTING.md#advanced-deployment"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
          >
            {t('wizardAdvancedOptional')} <ExternalLink size={12} />
          </a>
        )}
      </div>
    </section>
  );
}
