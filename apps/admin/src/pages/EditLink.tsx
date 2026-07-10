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
import { useAdminMode } from '../contexts/AdminModeContext';
import { useLocale } from '../contexts/LocaleContext';

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
  const { isAdvanced } = useAdminMode();
  const { t } = useLocale();
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
      .catch(() => error(t('linkLoadFailed')))
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
    if (!form.long_url.trim()) errs.long_url = t('destinationRequired');
    else if (!/^https?:\/\//i.test(form.long_url.trim())) errs.long_url = t('invalidHttpUrl');
    if (!form.slug.trim()) errs.slug = t('slugRequired');
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.slug)) errs.slug = t('invalidSlug');
    if (form.description.length > 240) errs.description = t('descriptionTooLong');
    if (form.expires_at && Number.isNaN(new Date(form.expires_at).getTime()))
      errs.expires_at = t('invalidDateTime');
    if (form.max_clicks) {
      const maxClicks = Number(form.max_clicks);
      if (!Number.isInteger(maxClicks) || maxClicks < 1) errs.max_clicks = t('invalidMaxClicks');
    }
    if (!form.clear_password && form.password && form.password.trim().length < 4) {
      errs.password = t('shortPassword');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFetchTitle = async () => {
    const url = form.long_url.trim();
    if (!url) {
      setErrors((e) => ({ ...e, long_url: t('destinationRequired') }));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setErrors((e) => ({ ...e, long_url: t('invalidHttpUrl') }));
      return;
    }

    setTitleLoading(true);
    try {
      const result = await fetchPageTitle(url);
      set('title', result.title);
      success(t('titleFetched'));
    } catch (e) {
      error(String(e));
    } finally {
      setTitleLoading(false);
    }
  };

  const handleSuggest = async () => {
    const url = form.long_url.trim();
    if (!url) {
      setErrors((e) => ({ ...e, long_url: t('destinationRequired') }));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setErrors((e) => ({ ...e, long_url: t('invalidHttpUrl') }));
      return;
    }

    setSuggestionLoading(true);
    try {
      const result = await fetchLinkSuggestions(url);
      setSuggestions(result);
      success(t('suggestionsReady'));
    } catch (e) {
      error(String(e));
    } finally {
      setSuggestionLoading(false);
    }
  };

  const mergeTags = (incoming: string[]) => {
    const current = form.tags
      ? form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
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
      const tags = form.tags
        ? form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
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
      success(t('linkUpdated'));
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
    return <div className="text-slate-400">{t('linkNotFound')}</div>;
  }

  const activeDomains = domains.filter((domain) => domain.status === 'active');
  const domainOptions =
    form.domain && !activeDomains.some((domain) => domain.domain === form.domain)
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
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('editLink')}</h1>
          <p className="text-sm font-mono text-brand-400 mt-0.5">/{link.slug}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
      >
        <Input
          label={t('destinationUrl')}
          placeholder="https://example.com/long/path"
          value={form.long_url}
          onChange={(e) => set('long_url', e.target.value)}
          error={errors.long_url}
        />
        {isAdvanced && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSuggest}
              loading={suggestionLoading}
              disabled={saving}
              icon={<Sparkles size={14} />}
            >
              {t('suggest')}
            </Button>
          </div>
        )}
        {isAdvanced && (
          <LinkSuggestionsPanel
            suggestions={suggestions}
            onApplySlug={(slug) => set('slug', slug)}
            onApplyTitle={(title) => set('title', title)}
            onApplyDescription={(description) => set('description', description)}
            onApplyTags={mergeTags}
            onApplyAll={applyAllSuggestions}
          />
        )}
        <Input
          label={t('slugLabel')}
          placeholder="my-link"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          error={errors.slug}
        />
        {isAdvanced && (
          <Select
            label={t('shortDomain')}
            value={form.domain}
            onChange={(e) => set('domain', e.target.value)}
          >
            <option value="">{t('apiHost')}</option>
            {domainOptions.map((domain) => (
              <option key={domain.id} value={domain.domain}>
                {domain.domain}
                {domain.is_default === 1 ? ` (${t('defaultOption')})` : ''}
              </option>
            ))}
          </Select>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label={t('titleOptional')}
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
            {t('fetchTitle')}
          </Button>
        </div>
        {isAdvanced && (
          <Textarea
            label={t('descriptionOptional')}
            placeholder="Short internal note or page summary"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            error={errors.description}
            rows={3}
            maxLength={240}
          />
        )}
        <Input
          label={t('tagsOptional')}
          placeholder="marketing, campaign"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          hint={t('tagsHint')}
        />
        <TagSuggestions
          tags={tagCatalog}
          value={form.tags}
          onChange={(value) => set('tags', value)}
        />
        <Select
          label={t('redirectTypeLabel')}
          value={form.redirect_type}
          onChange={(e) => set('redirect_type', e.target.value as '301' | '302')}
        >
          <option value="302">{t('redirect302')}</option>
          <option value="301">{t('redirect301')}</option>
        </Select>
        {isAdvanced && (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('expiresAt')}
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => set('expires_at', e.target.value)}
              error={errors.expires_at}
            />
            <Input
              label={t('maxClicks')}
              type="number"
              min={1}
              step={1}
              placeholder="1000"
              value={form.max_clicks}
              onChange={(e) => set('max_clicks', e.target.value)}
              error={errors.max_clicks}
            />
          </div>
        )}
        {isAdvanced && (
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.warning_enabled}
                onChange={(e) => set('warning_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
              />
              {t('showWarning')}
            </label>

            <Input
              label={t(link.password_protected ? 'newPasswordOptional' : 'passwordOptional')}
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
              hint={t(link.password_protected ? 'keepPasswordHint' : 'passwordHint')}
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
                {t('clearPassword')}
              </label>
            )}
          </div>
        )}
        {isAdvanced && (
          <UtmBuilder
            longUrl={form.long_url}
            onApply={(url) => set('long_url', url)}
            disabled={saving}
          />
        )}
        <Select
          label={t('status')}
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="active">{t('activeStatus')}</option>
          <option value="disabled">{t('disabledStatus')}</option>
          <option value="expired">{t('expiredStatus')}</option>
        </Select>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving}>
            {t('saveChanges')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/links')}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
