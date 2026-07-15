import React, { useEffect, useState } from 'react';
import { LayoutPanelTop, Save } from 'lucide-react';
import { useDisplayPreferences } from '../../contexts/DisplayPreferencesContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import type { MessageKey } from '../../i18n/messages';
import type { OptionalModule } from '../../utils/displayPreferences';
import { DensitySelector } from './DensitySelector';

const MODULE_OPTIONS: Array<{ module: OptionalModule; label: MessageKey }> = [
  { module: 'bulk-create', label: 'bulkCreate' },
  { module: 'analytics', label: 'analytics' },
  { module: 'domains', label: 'domains' },
  { module: 'groups', label: 'groups' },
  { module: 'redirect-rules', label: 'redirectRules' },
  { module: 'health-checks', label: 'healthChecks' },
  { module: 'operations', label: 'operationsDashboard' },
  { module: 'backups', label: 'backups' },
  { module: 'api-tokens', label: 'apiTokens' },
  { module: 'audit-logs', label: 'auditLogs' },
];

export function DisplayPreferencesPanel() {
  const {
    sidebarDensity,
    tableDensity,
    hiddenModules,
    loadingVisibility,
    setSidebarDensity,
    setTableDensity,
    saveHiddenModules,
  } = useDisplayPreferences();
  const { t } = useLocale();
  const { success, error } = useToast();
  const [draftHiddenModules, setDraftHiddenModules] = useState<OptionalModule[]>(hiddenModules);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraftHiddenModules(hiddenModules), [hiddenModules]);

  const toggleModule = (module: OptionalModule) => {
    setDraftHiddenModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveHiddenModules(draftHiddenModules);
      success(t('displayPreferencesSaved'));
    } catch (cause) {
      error(String(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start gap-3">
        <LayoutPanelTop size={20} className="mt-0.5 text-brand-400" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('displayPreferences')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t('displayPreferencesHelp')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DensitySelector
          label={t('sidebarDensity')}
          value={sidebarDensity}
          onChange={setSidebarDensity}
          translate={t}
        />
        <DensitySelector
          label={t('tableDensity')}
          value={tableDensity}
          onChange={setTableDensity}
          translate={t}
        />
      </div>
      <p className="text-xs text-slate-500">{t('densityBrowserHint')}</p>

      <fieldset className="space-y-3 border-t border-slate-800 pt-5" disabled={loadingVisibility}>
        <legend className="text-sm font-medium text-slate-300">{t('optionalModules')}</legend>
        <p className="text-xs leading-5 text-slate-500">{t('optionalModulesHint')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULE_OPTIONS.map(({ module, label }) => {
            const visible = !draftHiddenModules.includes(module);
            return (
              <label
                key={module}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleModule(module)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-500 focus:ring-brand-500"
                />
                <span>{t(label)}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs leading-5 text-slate-500">{t('moduleVisibilityInstanceHint')}</p>
      </fieldset>

      <Button
        type="button"
        icon={<Save size={15} />}
        loading={saving || loadingVisibility}
        onClick={handleSave}
      >
        {t('saveDisplayPreferences')}
      </Button>
    </section>
  );
}
