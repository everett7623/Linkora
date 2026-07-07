import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getSettings, updateSettings } from '../api/settings';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export function Settings() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name: 'Linkora',
    default_redirect_type: '302',
    default_domain: '',
  });

  useEffect(() => {
    getSettings()
      .then((s) => {
        setForm({
          site_name: s.site_name ?? 'Linkora',
          default_redirect_type: s.default_redirect_type ?? '302',
          default_domain: s.default_domain ?? '',
        });
      })
      .catch(() => error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      success('Settings saved');
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configure your Linkora instance</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">General</h2>

        <Input
          label="Site Name"
          value={form.site_name}
          onChange={(e) => set('site_name', e.target.value)}
          hint="Displayed in the admin panel title"
        />

        <Input
          label="Default Domain"
          placeholder="go.example.com"
          value={form.default_domain}
          onChange={(e) => set('default_domain', e.target.value)}
          hint="Used to construct short_url. Leave blank to use request hostname."
        />

        <Select
          label="Default Redirect Type"
          value={form.default_redirect_type}
          onChange={(e) => set('default_redirect_type', e.target.value)}
        >
          <option value="302">302 — Temporary (recommended)</option>
          <option value="301">301 — Permanent (cached by browser)</option>
        </Select>

        <div className="pt-2">
          <Button type="submit" icon={<Save size={15} />} loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">About</h2>
        <div className="text-sm text-slate-400 space-y-1">
          <p>Version: <span className="text-slate-200 font-mono">0.1.0</span></p>
          <p>Platform: <span className="text-slate-200">Cloudflare Workers + D1 + KV</span></p>
          <p>
            Documentation:{' '}
            <a href="https://github.com/everett7623/Linkora" target="_blank" rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300">
              GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
