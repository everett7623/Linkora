import React from 'react';
import { CheckCircle2, CircleDashed, ExternalLink } from 'lucide-react';
import type { DeploymentCapabilities } from '@linkora/shared';
import { enabledAdvancedCapabilityCount } from '../../utils/capabilities';
import { useLocale } from '../../contexts/LocaleContext';

interface CapabilityItem {
  label: string;
  enabled: boolean;
  detail: string;
}

export function AdvancedCapabilitiesPanel({
  capabilities,
}: {
  capabilities: DeploymentCapabilities;
}) {
  const { locale, t } = useLocale();
  const items: CapabilityItem[] = [
    { label: t('coreStorage'), enabled: true, detail: t('coreStorageReady') },
    {
      label: t('r2Backups'),
      enabled: capabilities.advanced.r2Backups,
      detail: capabilities.advanced.r2Backups ? t('scheduledBackupReady') : t('addR2'),
    },
    {
      label: t('visitQueue'),
      enabled: capabilities.advanced.visitQueue,
      detail: capabilities.advanced.visitQueue ? t('queueReady') : t('addQueue'),
    },
    {
      label: t('multipleDomains'),
      enabled: capabilities.advanced.multipleDomains,
      detail: t('configuredDomains', {
        count: capabilities.advanced.configuredDomains.toLocaleString(locale),
      }),
    },
  ];
  const enabledCount = enabledAdvancedCapabilityCount(capabilities);

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('advancedCapabilities')}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {t('optionalEnabled', { count: enabledCount })}
          </p>
        </div>
        <span className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase text-brand-400">
          {t('profile', { value: t(capabilities.profile) })}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4"
          >
            {item.enabled ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <CircleDashed size={17} className="mt-0.5 shrink-0 text-slate-600" />
            )}
            <div>
              <div className="text-sm font-medium text-slate-200">{item.label}</div>
              <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <a
        href="https://github.com/everett7623/Linkora/blob/main/docs/SELF_HOSTING.md"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300"
      >
        {t('configureAdvanced')} <ExternalLink size={13} />
      </a>
    </section>
  );
}
