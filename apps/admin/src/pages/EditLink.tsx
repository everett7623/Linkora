import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getLink, updateLink } from '../api/links';
import { fetchPageTitle } from '../api/metadata';
import { listTags } from '../api/tags';
import { TagSuggestions } from '../components/TagSuggestions';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import type { Link, Tag } from '@linkora/shared';

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
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([]);
  const [form, setForm] = useState({
    long_url: '',
    slug: '',
    title: '',
    tags: '',
    redirect_type: '302' as '301' | '302',
    status: 'active',
    expires_at: '',
    max_clicks: '',
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
          title: l.title ?? '',
          tags,
          redirect_type: l.redirect_type === 301 ? '301' : '302',
          status: l.status,
          expires_at: toDatetimeLocal(l.expires_at),
          max_clicks: l.max_clicks ? String(l.max_clicks) : '',
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

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.long_url.trim()) errs.long_url = 'Destination URL is required';
    else if (!/^https?:\/\//i.test(form.long_url.trim())) errs.long_url = 'URL must start with http:// or https://';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.slug)) errs.slug = 'Slug can only contain letters, numbers, _ and -';
    if (form.expires_at && Number.isNaN(new Date(form.expires_at).getTime())) errs.expires_at = 'Enter a valid date and time';
    if (form.max_clicks) {
      const maxClicks = Number(form.max_clicks);
      if (!Number.isInteger(maxClicks) || maxClicks < 1) errs.max_clicks = 'Max clicks must be a positive integer';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;
    setSaving(true);
    try {
      const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : null;
      const maxClicks = form.max_clicks ? Number(form.max_clicks) : null;
      await updateLink(id, {
        long_url: form.long_url.trim(),
        slug: form.slug.trim(),
        title: form.title.trim() || undefined,
        tags: tags.length ? tags : [],
        redirect_type: form.redirect_type === '301' ? 301 : 302,
        status: form.status,
        expires_at: expiresAt,
        max_clicks: maxClicks,
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
        <Input
          label="Slug *"
          placeholder="my-link"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          error={errors.slug}
        />
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
          onChange={(e) => set('redirect_type', e.target.value)}
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
