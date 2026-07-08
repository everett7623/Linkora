import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { getLink, updateLink } from '../api/links';
import { listDomains } from '../api/domains';
import { fetchLinkSuggestions, fetchPageTitle } from '../api/metadata';
import { listTags } from '../api/tags';
import { LinkSuggestionsPanel } from '../components/LinkSuggestionsPanel';
import { TagSuggestions } from '../components/TagSuggestions';
import { UtmBuilder } from '../components/UtmBuilder';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import type { Domain, Link, LinkSuggestionResult, Tag } from '@linkora/shared';

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function EditLink() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestionResult | null>(null);
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [form, setForm] = useState({
    long_url: '',
    slug: '',
    domain: '',
    title: '',
    description: '',
    tags: '',
    redirect_type: '302' as '301' | '302',
    status: 'active',
    expires_at: '',
    max_clicks: '',
    password: '',
    clear_password: false,
    warning_enabled: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    getLink(id)
      .then((l) => {
        setLink(l);
        const tags = l.tags ? (JSON.parse(l.tags) as string[]).join(', ') : '';
        setForm({
          long_url: l.long_url,
          slug: l.slug,
          domain: l.domain ?? '',
          title: l.title ?? '',
          description: l.description ?? '',
          tags,
          redirect_type: l.redirect_type === 301 ? '301' : '302',
          status: l.status,
          expires_at: toDatetimeLocal(l.expires_at),
          max_clicks: l.max_clicks ? String(l.max_clicks) : '',
          password: '',
          clear_password: false,
          warning_enabled: l.warning_enabled === 1,
        });
      })
      .catch(() => error('Failed to load link'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    listTags()
      .then(setTagCatalog)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    listDomains()
      .then(setDomains)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.long_url.trim()) errs.long_url = 'Destination URL is required';
    else if (!/^https?:\/\//i.test(form.long_url.trim())) errs.long_url = 'URL must start with http:// or https://';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.slug)) errs.slug = 'Slug can only contain letters, numbers, _ and -';
    if (form.description.length > 240) errs.description = 'Description must be 240 characters or less';
    if (form.expires_at && Number.isNaN(new Date(form.expires_at).getTime())) errs.expires_at = 'Enter a valid date and time';
    if (form.max_clicks) {
      const maxClicks = Number(form.max_clicks);
      if (!Number.isInteger(maxClicks) || maxClicks < 1) errs.max_clicks = 'Max clicks must be a positive integer';
    }
    if (!form.clear_password && form.password && form.password.trim().length < 4) {
      errs.password = 'Password must be at least 4 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFetchTitle = async () => {
    const url = form.long_url.trim();
    if (!url) {
      setErrors((e) => ({ ...e, long_url: 'Destination URL is required' }));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setErrors((e) => ({ ...e, long_url: 'URL must start with http:// or https://' }));
      return;
    }

    setTitleLoading(true);
    try {
      const result = await fetchPageTitle(url);
      set('title', result.title);
      success('Title fetched');
    } catch (e) {
      error(String(e));
    } finally {
      setTitleLoading(false);
    }
  };

  const handleSuggest = async () => {
    const url = form.long_url.trim();
    if (!url) {
      setErrors((e) => ({ ...e, long_url: 'Destination URL is required' }));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setErrors((e) => ({ ...e, long_url: 'URL must start with http:// or https://' }));
      return;
    }

    setSuggestionLoading(true);
    try {
      const result = await fetchLinkSuggestions(url);
      setSuggestions(result);
      success('Suggestions ready');
    } catch (e) {
      error(String(e));
    } finally {
      setSuggestionLoading(false);
    }
  };

  const mergeTags = (incoming: string[]) => {
    const current = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const merged = [...current];
    for (const tag of incoming) {
      if (!merged.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        merged.push(tag);
      }
    }
    set('tags', merged.join(', '));
  };

  const applyAllSuggestions = () => {
    if (!suggestions) return;
    if (suggestions.title) set('title', suggestions.title);
    if (suggestions.description) set('description', suggestions.description);
    mergeTags(suggestions.tags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;
    setSaving(true);
    try {
      const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : null;
      const maxClicks = form.max_clicks ? Number(form.max_clicks) : null;
      const payload = {
        long_url: form.long_url.trim(),
        slug: form.slug.trim(),
        domain: form.domain || undefined,
        title: form.title.trim() || undefined,
        description: form.description.trim() || null,
        tags: tags.length ? tags : [],
        redirect_type: form.redirect_type === '301' ? 301 : 302,
        status: form.status,
        expires_at: expiresAt,
        max_clicks: maxClicks,
        warning_enabled: form.warning_enabled ? 1 : 0,
      } as const;
      await updateLink(id, {
        ...payload,
        password: form.clear_password ? null : form.password.trim() || undefined,
      });
      success('Link updated!');
      navigate('/links');
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

  if (!link) {
    return <div className="text-slate-400">Link not found.</div>;
  }

  const activeDomains = domains.filter((domain) => domain.status === 'active');
  const domainOptions = form.domain && !activeDomains.some((domain) => domain.domain === form.domain)
    ? [
        ...activeDomains,
        {
          id: form.domain,
          domain: form.domain,
          is_default: 0,
          status: 'active' as const,
          created_at: '',
          updated_at: '',
        },
      ]
    : activeDomains;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Edit Link</h1>
          <p className="text-sm font-mono text-brand-400 mt-0.5">/{link.slug}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <Input
          label="Destination URL *"
          placeholder="https://example.com/long/path"
          value={form.long_url}
          onChange={(e) => set('long_url', e.target.value)}
          error={errors.long_url}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSuggest}
            loading={suggestionLoading}
            disabled={saving}
            icon={<Sparkles size={14} />}
          >
            Suggest
          </Button>
        </div>
        <LinkSuggestionsPanel
          suggestions={suggestions}
          onApplySlug={(slug) => set('slug', slug)}
          onApplyTitle={(title) => set('title', title)}
          onApplyDescription={(description) => set('description', description)}
          onApplyTags={mergeTags}
          onApplyAll={applyAllSuggestions}
        />
        <Input
          label="Slug *"
          placeholder="my-link"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          error={errors.slug}
        />
        <Select
          label="Short Domain"
          value={form.domain}
          onChange={(e) => set('domain', e.target.value)}
        >
          <option value="">API host</option>
          {domainOptions.map((domain) => (
            <option key={domain.id} value={domain.domain}>
              {domain.domain}{domain.is_default === 1 ? ' (default)' : ''}
            </option>
          ))}
        </Select>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="Title (optional)"
            placeholder="My awesome link"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleFetchTitle}
            loading={titleLoading}
            disabled={saving}
            icon={<RefreshCw size={14} />}
            className="sm:mb-0.5"
          >
            Fetch Title
          </Button>
        </div>
        <Textarea
          label="Description (optional)"
          placeholder="Short internal note or page summary"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          rows={3}
          maxLength={240}
        />
        <Input
          label="Tags (optional)"
          placeholder="marketing, campaign"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          hint="Comma-separated tags. Existing catalog tags are available below."
        />
        <TagSuggestions
          tags={tagCatalog}
          value={form.tags}
          onChange={(value) => set('tags', value)}
        />
        <Select
          label="Redirect Type"
          value={form.redirect_type}
          onChange={(e) => set('redirect_type', e.target.value as '301' | '302')}
        >
          <option value="302">302 — Temporary</option>
          <option value="301">301 — Permanent</option>
        </Select>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Expires At (optional)"
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => set('expires_at', e.target.value)}
            error={errors.expires_at}
          />
          <Input
            label="Max Clicks (optional)"
            type="number"
            min={1}
            step={1}
            placeholder="1000"
            value={form.max_clicks}
            onChange={(e) => set('max_clicks', e.target.value)}
            error={errors.max_clicks}
          />
        </div>
        <div className="space-y-4 border-t border-slate-800 pt-5">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.warning_enabled}
              onChange={(e) => set('warning_enabled', e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
            Show safety warning before redirect
          </label>

          <Input
            label={link.password_protected ? 'New Password (optional)' : 'Password (optional)'}
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            hint={link.password_protected ? 'Leave blank to keep the current password.' : 'Visitors must enter this password before opening the destination.'}
            disabled={form.clear_password}
          />

          {link.password_protected && (
            <label className="flex items-center gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={form.clear_password}
                onChange={(e) => set('clear_password', e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
              />
              Clear existing password
            </label>
          )}
        </div>
        <UtmBuilder
          longUrl={form.long_url}
          onApply={(url) => set('long_url', url)}
          disabled={saving}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="expired">Expired</option>
        </Select>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/links')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
