import React, { useEffect, useState } from 'react';
import { BellRing, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSettings, updateSettings } from '../../api/settings';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface MonitoringForm {
  health_monitoring_enabled: string;
  health_monitoring_limit: string;
  health_failure_threshold: string;
  health_alert_suppression_minutes: string;
}

const DEFAULT_FORM: MonitoringForm = {
  health_monitoring_enabled: 'false',
  health_monitoring_limit: '20',
  health_failure_threshold: '2',
  health_alert_suppression_minutes: '1440',
};

export function HealthMonitoringSettingsPanel() {
  const { t } = useLocale();
  const { success, error } = useToast();
  const [form, setForm] = useState<MonitoringForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setForm({
          health_monitoring_enabled:
            settings.health_monitoring_enabled ?? DEFAULT_FORM.health_monitoring_enabled,
          health_monitoring_limit:
            settings.health_monitoring_limit ?? DEFAULT_FORM.health_monitoring_limit,
          health_failure_threshold:
            settings.health_failure_threshold ?? DEFAULT_FORM.health_failure_threshold,
          health_alert_suppression_minutes:
            settings.health_alert_suppression_minutes ??
            DEFAULT_FORM.health_alert_suppression_minutes,
        });
      })
      .catch(() => error(t('loadSettingsFailed')))
      .finally(() => setLoading(false));
  }, [error, t]);

  const set = (key: keyof MonitoringForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings({ ...form });
      success(t('monitoringSettingsSaved'));
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const enabled = form.health_monitoring_enabled === 'true';

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('scheduledTargetMonitoring')}</h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-500">{t('healthMonitoringHint')}</p>
        </div>
        <Link
          to="/settings#notifications"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-600/10 hover:text-brand-300"
        >
          <BellRing size={15} />
          {t('manageNotificationChannels')}
        </Link>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => set('health_monitoring_enabled', String(e.target.checked))}
          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-600 focus:ring-brand-500"
        />
        {t('enableHealthMonitoring')}
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          label={t('healthMonitoringLimit')}
          type="number"
          min="1"
          max="50"
          disabled={!enabled}
          value={form.health_monitoring_limit}
          onChange={(e) => set('health_monitoring_limit', e.target.value)}
        />
        <Input
          label={t('healthFailureThreshold')}
          type="number"
          min="1"
          max="10"
          disabled={!enabled}
          value={form.health_failure_threshold}
          onChange={(e) => set('health_failure_threshold', e.target.value)}
        />
        <Input
          label={t('healthSuppressionMinutes')}
          type="number"
          min="0"
          max="10080"
          disabled={!enabled}
          value={form.health_alert_suppression_minutes}
          onChange={(e) => set('health_alert_suppression_minutes', e.target.value)}
        />
      </div>

      <Button type="button" icon={<Save size={15} />} loading={saving} onClick={save}>
        {t('saveMonitoringSettings')}
      </Button>
    </section>
  );
}
