import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api/client';
import type { Link } from '@linkora/shared';

export default function CreateLinkPage() {
  const navigate = useNavigate();
  const [longUrl, setLongUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [redirectType, setRedirectType] = useState<number>(302);
  const [status, setStatus] = useState<string>('active');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [password, setPassword] = useState('');
  const [warningEnabled, setWarningEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await apiPost<Link>('/api/links', {
        long_url: longUrl,
        slug: slug || undefined,
        title: title || undefined,
        tags: tagsArr.length > 0 ? tagsArr : undefined,
        redirect_type: redirectType,
        status,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        max_clicks: maxClicks ? parseInt(maxClicks, 10) : undefined,
        password: password || undefined,
        warning_enabled: warningEnabled,
      });
      navigate('/links');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-white">Create Link</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-300">Long URL *</label>
          <input
            type="url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="https://example.com/your-long-url"
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Custom Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Leave empty for auto-generated"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">Only letters, numbers, hyphens, and underscores</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">Comma separated</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Redirect Type</label>
            <select
              value={redirectType}
              onChange={(e) => setRedirectType(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value={302}>302 (Temporary)</option>
              <option value={301}>301 (Permanent)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Expires At</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none [color-scheme:dark]"
            />
            <p className="mt-1 text-xs text-slate-500">Leave empty for no expiration</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Max Clicks</label>
            <input
              type="number"
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="Unlimited"
              min="1"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Leave empty for unlimited</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Password Protection</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for no password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Visitors must enter password to access</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Warning Page</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={warningEnabled}
                onChange={(e) => setWarningEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-400">Show warning before redirect</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Displays destination URL before redirecting</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/links')}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Link'}
          </button>
        </div>
      </form>
    </div>
  );
}
