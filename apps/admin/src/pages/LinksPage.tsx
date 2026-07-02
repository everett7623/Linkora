import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../api/client';
import type { Link as LinkType, PaginatedResult } from '@linkora/shared';
import {
  Search, Plus, Copy, Pencil, Trash2, Ban, CheckCircle,
  Archive, ArchiveRestore, ExternalLink, ChevronLeft, ChevronRight,
  Tags, XCircle, QrCode,
} from 'lucide-react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import EditLinkDialog from '../components/EditLinkDialog';
import QRCodeDialog from '../components/QRCodeDialog';

const STATUS_OPTIONS = ['', 'active', 'disabled', 'expired', 'archived'];
const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest first' },
  { value: 'created_at_asc', label: 'Oldest first' },
  { value: 'clicks_desc', label: 'Most clicks' },
  { value: 'clicks_asc', label: 'Least clicks' },
  { value: 'last_clicked_at_desc', label: 'Last clicked' },
];

export default function LinksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [qrLink, setQrLink] = useState<LinkType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [showBulkTagInput, setShowBulkTagInput] = useState(false);

  const keyword = searchParams.get('keyword') ?? '';
  const status = searchParams.get('status') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const sort = searchParams.get('sort') ?? 'created_at_desc';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (status) params.set('status', status);
      if (tag) params.set('tag', tag);
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('pageSize', '20');

      const data = await apiGet<PaginatedResult<LinkType>>(`/api/links?${params}`);
      setLinks(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, status, tag, sort, page]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);
  useEffect(() => { setSelectedIds(new Set()); }, [links]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  async function handleAction(id: string, action: string) {
    try {
      if (action === 'delete') {
        if (!confirm('Delete this link permanently?')) return;
        await apiDelete(`/api/links/${id}`);
      } else {
        await apiPost(`/api/links/${id}/${action}`);
      }
      fetchLinks();
    } catch {
      alert('Action failed');
    }
  }

  function copyShortUrl(link: LinkType) {
    const url = link.short_url ?? `/${link.slug}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map((l) => l.id)));
    }
  }

  async function handleBulkAction(action: string) {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    if (action === 'bulk-delete') {
      if (!confirm(`Delete ${ids.length} link(s) permanently?`)) return;
    }

    setBulkLoading(true);
    try {
      await apiPost(`/api/links/${action}`, { ids });
      setSelectedIds(new Set());
      fetchLinks();
    } catch {
      alert('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkTag() {
    if (selectedIds.size === 0 || !bulkTagInput.trim()) return;
    const ids = Array.from(selectedIds);
    const tags = bulkTagInput.split(',').map((t) => t.trim()).filter(Boolean);

    setBulkLoading(true);
    try {
      await apiPost('/api/links/bulk-tag', { ids, tags, mode: 'add' });
      setSelectedIds(new Set());
      setShowBulkTagInput(false);
      setBulkTagInput('');
      fetchLinks();
    } catch {
      alert('Bulk tag failed');
    } finally {
      setBulkLoading(false);
    }
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Links</h1>
        <Link
          to="/links/create"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create Link
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search slug, URL, title, tags..."
            defaultValue={keyword}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('keyword', (e.target as HTMLInputElement).value);
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions Toolbar */}
      {hasSelection && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-600/30 bg-brand-600/10 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-300">{selectedIds.size} selected</span>
          <div className="mx-2 h-4 w-px bg-slate-700" />
          <BulkBtn
            icon={<Ban className="h-3.5 w-3.5" />}
            label="Disable"
            onClick={() => handleBulkAction('bulk-disable')}
            disabled={bulkLoading}
          />
          <BulkBtn
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            label="Enable"
            onClick={() => handleBulkAction('bulk-enable')}
            disabled={bulkLoading}
          />
          <BulkBtn
            icon={<Archive className="h-3.5 w-3.5" />}
            label="Archive"
            onClick={() => handleBulkAction('bulk-archive')}
            disabled={bulkLoading}
          />
          <BulkBtn
            icon={<Tags className="h-3.5 w-3.5" />}
            label="Tag"
            onClick={() => setShowBulkTagInput(!showBulkTagInput)}
            disabled={bulkLoading}
          />
          <BulkBtn
            icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
            label="Delete"
            onClick={() => handleBulkAction('bulk-delete')}
            disabled={bulkLoading}
            className="text-red-400 hover:bg-red-500/20"
          />
          <BulkBtn
            icon={<XCircle className="h-3.5 w-3.5" />}
            label="Clear"
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkLoading}
          />
          {showBulkTagInput && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="text"
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                placeholder="tag1, tag2"
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') handleBulkTag(); }}
              />
              <button
                onClick={handleBulkTag}
                disabled={bulkLoading || !bulkTagInput.trim()}
                className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : links.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No links found</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium uppercase text-slate-500">
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === links.length && links.length > 0}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3">Short URL</th>
                <th className="px-4 py-3">Long URL</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {links.map((link) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  selected={selectedIds.has(link.id)}
                  onToggleSelect={() => toggleSelect(link.id)}
                  onCopy={() => copyShortUrl(link)}
                  onAction={(a) => handleAction(link.id, a)}
                  onEdit={() => setEditingLink(link)}
                  onQR={() => setQrLink(link)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{total} links total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setParam('page', String(page + 1))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSaved={() => { setEditingLink(null); fetchLinks(); }}
        />
      )}

      {/* QR Code Dialog */}
      {qrLink && (
        <QRCodeDialog
          link={qrLink}
          onClose={() => setQrLink(null)}
        />
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  disabled: 'bg-red-500/20 text-red-400',
  expired: 'bg-amber-500/20 text-amber-400',
  archived: 'bg-slate-500/20 text-slate-400',
};

function LinkRow({
  link,
  selected,
  onToggleSelect,
  onCopy,
  onAction,
  onEdit,
  onQR,
}: {
  link: LinkType;
  selected: boolean;
  onToggleSelect: () => void;
  onCopy: () => void;
  onAction: (action: string) => void;
  onEdit: () => void;
  onQR: () => void;
}) {
  const tags = parseTags(link.tags);

  return (
    <tr className={clsx('hover:bg-slate-800/50', selected && 'bg-brand-600/5')}>
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-brand-600 focus:ring-brand-500"
        />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-brand-400">/{link.slug}</span>
          {link.short_url && (
            <a href={link.short_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 text-slate-500 hover:text-slate-300" />
            </a>
          )}
        </div>
      </td>
      <td className="max-w-[200px] truncate px-4 py-3 text-slate-300" title={link.long_url}>
        {link.long_url}
      </td>
      <td className="max-w-[120px] truncate px-4 py-3 text-slate-400">
        {link.title ?? '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">{t}</span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-200">
        {link.clicks.toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[link.status] ?? 'text-slate-400')}>
          {link.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{link.source ?? '-'}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
        {dayjs(link.created_at).format('YYYY-MM-DD HH:mm')}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <ActionBtn icon={<Copy className="h-3.5 w-3.5" />} title="Copy short URL" onClick={onCopy} />
          <ActionBtn icon={<QrCode className="h-3.5 w-3.5" />} title="QR Code" onClick={onQR} />
          <ActionBtn icon={<Pencil className="h-3.5 w-3.5" />} title="Edit" onClick={onEdit} />
          {link.status === 'active' ? (
            <ActionBtn icon={<Ban className="h-3.5 w-3.5" />} title="Disable" onClick={() => onAction('disable')} />
          ) : link.status === 'disabled' ? (
            <ActionBtn icon={<CheckCircle className="h-3.5 w-3.5" />} title="Enable" onClick={() => onAction('enable')} />
          ) : null}
          {link.archived === 0 ? (
            <ActionBtn icon={<Archive className="h-3.5 w-3.5" />} title="Archive" onClick={() => onAction('archive')} />
          ) : (
            <ActionBtn icon={<ArchiveRestore className="h-3.5 w-3.5" />} title="Restore" onClick={() => onAction('restore')} />
          )}
          <ActionBtn icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />} title="Delete" onClick={() => onAction('delete')} />
        </div>
      </td>
    </tr>
  );
}

function BulkBtn({
  icon,
  label,
  onClick,
  disabled,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700/50 disabled:opacity-50',
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
    >
      {icon}
    </button>
  );
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
