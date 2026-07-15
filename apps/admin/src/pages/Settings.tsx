import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { getSettings, updateSettings } from '../api/settings';
import { ResetSettingsPanel } from '../components/settings/ResetSettingsPanel';
import { WebhookSettingsPanel } from '../components/settings/WebhookSettingsPanel';
import { NotificationSettingsPanel } from '../components/settings/NotificationSettingsPanel';
import { AdminModePanel } from '../components/settings/AdminModePanel';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAdminMode } from '../contexts/AdminModeContext';
import { useLocale } from '../contexts/LocaleContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Settings() {
  const { success, error } = useToast();
  const { isAdvanced } = useAdminMode();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name: 'Linketry',
    default_redirect_type: '302',
    default_domain: '',
    analytics_retention_days: '0',
    backup_retention_days: '30',
    public_page_404_message: '',
    public_page_disabled_message: '',
    public_page_expired_message: '',
    public_page_warning_message: '',
  });

  useEffect(() => {
    getSettings()
      .then((s) => {
        setForm({
          site_name: s.site_name ?? 'Linketry',
          default_redirect_type: s.default_redirect_type ?? '302',
          default_domain: s.default_domain ?? '',
          analytics_retention_days: s.analytics_retention_days ?? '0',
          backup_retention_days: s.backup_retention_days ?? '30',
          public_page_404_message: s.public_page_404_message ?? '',
          public_page_disabled_message: s.public_page_disabled_message ?? '',
          public_page_expired_message: s.public_page_expired_message ?? '',
          public_page_warning_message: s.public_page_warning_message ?? '',
        });
      })
      .catch(() => error(t('loadSettingsFailed')))
      .finally(() => setLoading(false));
  }, [error, t]);

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      success(t('settingsSaved'));
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('settings')}</h1>
        <p className="mt-0.5 text-sm text-slate-400">{t('configureInstance')}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
      >
        <h2 className="border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('general')}
        </h2>

        <Input
          label={t('siteName')}
          value={form.site_name}
          onChange={(e) => set('site_name', e.target.value)}
          hint={t('siteNameHint')}
        />

        <Input
          label={t('defaultDomain')}
          placeholder="go.example.com"
          value={form.default_domain}
          onChange={(e) => set('default_domain', e.target.value)}
          hint={t('defaultDomainHint')}
        />

        <Select
          label={t('redirectType')}
          value={form.default_redirect_type}
          onChange={(e) => set('default_redirect_type', e.target.value)}
        >
          <option value="302">302 {t('temporary')}</option>
          <option value="301">301 {t('permanent')}</option>
        </Select>

        {isAdvanced && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('retentionDays')}
              type="number"
              min="0"
              max="3650"
              value={form.analytics_retention_days}
              onChange={(e) => set('analytics_retention_days', e.target.value)}
              hint={t('retentionHint')}
            />
            <Input
              label={t('backupRetentionDays')}
              type="number"
              min="1"
              max="3650"
              value={form.backup_retention_days}
              onChange={(e) => set('backup_retention_days', e.target.value)}
              hint={t('backupRetentionHint')}
            />
          </div>
        )}

        {isAdvanced && (
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">{t('publicPageTemplates')}</h2>
              <p className="mt-1 text-xs text-slate-500">{t('publicPageTemplatesHint')}</p>
            </div>
            <Textarea
              label={t('notFoundPageMessage')}
              maxLength={500}
              rows={2}
              value={form.public_page_404_message}
              onChange={(e) => set('public_page_404_message', e.target.value)}
            />
            <Textarea
              label={t('disabledPageMessage')}
              maxLength={500}
              rows={2}
              value={form.public_page_disabled_message}
              onChange={(e) => set('public_page_disabled_message', e.target.value)}
            />
            <Textarea
              label={t('expiredPageMessage')}
              maxLength={500}
              rows={2}
              value={form.public_page_expired_message}
              onChange={(e) => set('public_page_expired_message', e.target.value)}
            />
            <Textarea
              label={t('warningPageMessage')}
              maxLength={500}
              rows={2}
              value={form.public_page_warning_message}
              onChange={(e) => set('public_page_warning_message', e.target.value)}
            />
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" icon={<Save size={15} />} loading={saving}>
            {t('saveSettings')}
          </Button>
        </div>
      </form>

      <AdminModePanel />

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('language')}
        </h2>
        <div className="max-w-xs">
          <LanguageSwitcher />
        </div>
      </section>

      {isAdvanced && <WebhookSettingsPanel />}

      {isAdvanced && (
        <div id="notifications" className="scroll-mt-8">
          <NotificationSettingsPanel />
        </div>
      )}

      {isAdvanced && <ResetSettingsPanel />}

      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('about')}
        </h2>
        <div className="space-y-1 text-sm text-slate-400">
          <p>
            {t('version')}: <span className="font-mono text-slate-200">{LINKETRY_VERSION}</span>
          </p>
          <p>
            {t('platform')}: <span className="text-slate-200">Cloudflare Workers + D1 + KV</span>
          </p>
          <p>
            {t('documentation')}:{' '}
            <a
              href="https://github.com/everett7623/Linketry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
