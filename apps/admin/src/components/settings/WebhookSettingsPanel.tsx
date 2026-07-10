import React, { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { getWebhookConfig, testWebhook, updateWebhookConfig } from '../../api/webhooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useLocale } from '../../contexts/LocaleContext';

function eventLabel(event: string): string {
  return event
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function WebhookSettingsPanel() {
  const { success, error } = useToast();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhook, setWebhook] = useState({
    enabled: false,
    url: '',
    secret: '',
    has_secret: false,
    events: [] as string[],
    available_events: [] as string[],
  });

  useEffect(() => {
    getWebhookConfig()
      .then((config) => {
        setWebhook({
          enabled: config.enabled,
          url: config.url,
          secret: '',
          has_secret: config.has_secret,
          events: config.events,
          available_events: config.available_events,
        });
      })
      .catch(() => error(t('webhookLoadFailed')))
      .finally(() => setLoading(false));
  }, []);

  const setField = <K extends keyof typeof webhook>(key: K, value: (typeof webhook)[K]) => {
    setWebhook((current) => ({ ...current, [key]: value }));
  };

  const toggleEvent = (event: string) => {
    setWebhook((current) => ({
      ...current,
      events: current.events.includes(event)
        ? current.events.filter((item) => item !== event)
        : [...current.events, event],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateWebhookConfig({
        enabled: webhook.enabled,
        url: webhook.url.trim(),
        events: webhook.events,
        ...(webhook.secret.trim() ? { secret: webhook.secret.trim() } : {}),
      });
      setWebhook({
        enabled: updated.enabled,
        url: updated.url,
        secret: '',
        has_secret: updated.has_secret,
        events: updated.events,
        available_events: updated.available_events,
      });
      success(t('webhookSaved'));
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await testWebhook();
      success(t('webhookDelivered'));
    } catch (e) {
      error(String(e));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      <h2 className="border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {t('webhooks')}
      </h2>

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={webhook.enabled}
          onChange={(e) => setField('enabled', e.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
        />
        {t('enableWebhook')}
      </label>

      <Input
        label={t('webhookUrl')}
        placeholder="https://example.com/linkora/webhook"
        value={webhook.url}
        onChange={(e) => setField('url', e.target.value)}
      />

      <Input
        label={t('signingSecret')}
        type="password"
        placeholder={webhook.has_secret ? t('secretConfigured') : t('optional')}
        value={webhook.secret}
        onChange={(e) => setField('secret', e.target.value)}
        hint={webhook.has_secret ? t('keepSecret') : undefined}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">{t('webhookEvents')}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {webhook.available_events.map((event) => (
            <label
              key={event}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300"
            >
              <input
                type="checkbox"
                checked={webhook.events.includes(event)}
                onChange={() => toggleEvent(event)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-600 focus:ring-brand-500"
              />
              {eventLabel(event)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" icon={<Save size={15} />} loading={saving}>
          {t('saveWebhook')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          icon={<Send size={15} />}
          loading={testing}
          disabled={!webhook.url.trim() || saving}
          onClick={handleTest}
        >
          {t('sendTest')}
        </Button>
      </div>
    </form>
  );
}
