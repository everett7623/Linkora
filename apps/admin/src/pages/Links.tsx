import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, Copy, Pencil, Trash2, PowerOff, Power,
  Archive, RotateCcw, ExternalLink, ChevronLeft, ChevronRight,
  QrCode, Download, Tag, KeyRound, ShieldAlert, SlidersHorizontal,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  listLinks,
  deleteLink,
  disableLink,
  enableLink,
  archiveLink,
  restoreLink,
  bulkLinkAction,
  bulkTagLinks,
  type BulkLinkAction,
  type BulkTagMode,
} from '../api/links';
import { getSettings } from '../api/settings';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { buildShortUrl } from '../utils/shortUrl';
import { downloadDataUrl } from '../utils/download';
import type { Link as LinkType, PaginatedResult } from '@linkora/shared';
import dayjs from 'dayjs';

const PAGE_SIZE = 20;

function hasMaxClicks(link: LinkType): boolean {
  return link.max_clicks !== null && link.max_clicks !== undefined;
}

function isExpiredByLimits(link: LinkType): boolean {
  const expiredByTime = !!link.expires_at && dayjs(link.expires_at).isBefore(dayjs());
  const expiredByClicks = hasMaxClicks(link) && link.clicks >= Number(link.max_clicks);
  return expiredByTime || expiredByClicks;
}

function getEffectiveStatus(link: LinkType): string {
  if (link.status === 'active' && isExpiredByLimits(link)) return 'expired';
  return link.status;
}

export function Links() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<LinkType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultDomain, setDefaultDomain] = useState('');
  const [confirm, setConfirm] = useState<{ type: string; link: LinkType } | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<BulkLinkAction | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagMode, setTagMode] = useState<BulkTagMode>('add');
  const [tagInput, setTagInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qr, setQr] = useState<{ link: LinkType; url: string; dataUrl: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { success, error } = useToast();

  const keyword = searchParams.get('keyword') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const status = searchParams.get('status') ?? '';
  const source = searchParams.get('source') ?? '';
  const domain = searchParams.get('domain') ?? '';
  const createdFrom = searchParams.get('createdFrom') ?? '';
  const createdTo = searchParams.get('createdTo') ?? '';
  const hasPassword = searchParams.get('hasPassword') ?? '';
  const warning = searchParams.get('warning') ?? '';
  const limits = searchParams.get('limits') ?? '';
  const sort = searchParams.get('sort') ?? 'created_at_desc';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLinks({
        keyword,
        tag,
        status,
        source,
        domain,
        createdFrom,
        createdTo,
        hasPassword,
        warning,
        limits,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch {
      error('Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [keyword, tag, status, source, domain, createdFrom, createdTo, hasPassword, warning, limits, sort, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [keyword, tag, status, source, domain, createdFrom, createdTo, hasPassword, warning, limits, sort, page]);

  useEffect(() => {
    getSettings()
      .then((s) => setDefaultDomain(s.default_domain ?? ''))
      .catch(() => undefined);
  }, []);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.delete('page');
    setSearchParams(p);
  };

  const clearFilters = () => {
    const p = new URLSearchParams();
    if (sort) p.set('sort', sort);
    setSearchParams(p);
  };

  const copyLink = (link: LinkType) => {
    navigator.clipboard.writeText(buildShortUrl(link, defaultDomain));
    success('Copied!');
  };

  const showQr = async (link: LinkType) => {
    const url = buildShortUrl(link, defaultDomain);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });
      setQr({ link, url, dataUrl });
    } catch {
      error('Failed to generate QR code');
    }
  };

  const downloadQr = () => {
    if (!qr) return;
    downloadDataUrl(qr.dataUrl, `linkora-qr-${qr.link.slug}.png`);
    success('QR code downloaded');
  };

  const runAction = async (type: string, link: LinkType) => {
    setActionLoading(true);
    try {
      if (type === 'delete') { await deleteLink(link.id); success('Link deleted'); }
      else if (type === 'disable') { await disableLink(link.id); success('Link disabled'); }
      else if (type === 'enable') { await enableLink(link.id); success('Link enabled'); }
      else if (type === 'archive') { await archiveLink(link.id); success('Link archived'); }
      else if (type === 'restore') { await restoreLink(link.id); success('Link restored'); }
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const confirmAction = (type: string, link: LinkType) => {
    if (type === 'disable' || type === 'archive') {
      setConfirm({ type, link });
    } else if (type === 'delete') {
      setConfirm({ type, link });
    } else {
      runAction(type, link);
    }
  };

  const visibleIds = result?.items.map((link) => link.id) ?? [];
  const selectedCount = selectedIds.size;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const runBulkAction = async (action: BulkLinkAction) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setActionLoading(true);
    try {
      const result = await bulkLinkAction(ids, action);
      success(`Bulk ${action}: ${result.success} updated`);
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setActionLoading(false);
      setBulkConfirm(null);
    }
  };

  const requestBulkAction = (action: BulkLinkAction) => {
    if (selectedCount === 0) return;
    if (action === 'delete' || action === 'archive' || action === 'disable') {
      setBulkConfirm(action);
      return;
    }
    runBulkAction(action);
  };

  const openTagModal = () => {
    if (selectedCount === 0) return;
    setTagMode('add');
    setTagInput('');
    setTagModalOpen(true);
  };

  const runBulkTagAction = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    const tags = tagInput.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (tagMode !== 'clear' && tags.length === 0) {
      error('Enter at least one tag');
      return;
    }

    setActionLoading(true);
    try {
      const result = await bulkTagLinks(ids, tags, tagMode);
      success(`Tags updated on ${result.success} links`);
      setSelectedIds(new Set());
      setTagModalOpen(false);
      setTagInput('');
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Links</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {result ? `${result.total.toLocaleString()} links` : '—'}
          </p>
        </div>
        <Link to="/links/create">
          <Button icon={<Plus size={16} />}>Create Link</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search slug, URL, title…"
            value={keyword}
            onChange={(e) => setParam('keyword', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="created_at_desc">Newest First</option>
          <option value="created_at_asc">Oldest First</option>
          <option value="clicks_desc">Most Clicks</option>
          <option value="last_clicked_at_desc">Recently Clicked</option>
          <option value="last_clicked_at_asc">Least Recently Clicked</option>
          <option value="updated_at_desc">Recently Updated</option>
          <option value="updated_at_asc">Oldest Updated</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <SlidersHorizontal size={15} className="text-brand-400" />
            Advanced Filters
          </div>
          <button type="button" onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-300">
            Clear
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input
            type="text"
            placeholder="Tag"
            value={tag}
            onChange={(e) => setParam('tag', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="Source"
            value={source}
            onChange={(e) => setParam('source', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="Domain"
            value={domain}
            onChange={(e) => setParam('domain', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={hasPassword}
            onChange={(e) => setParam('hasPassword', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any Password</option>
            <option value="yes">Password Protected</option>
            <option value="no">No Password</option>
          </select>
          <select
            value={warning}
            onChange={(e) => setParam('warning', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any Warning</option>
            <option value="yes">Warning Enabled</option>
            <option value="no">Warning Disabled</option>
          </select>
          <select
            value={limits}
            onChange={(e) => setParam('limits', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any Limits</option>
            <option value="yes">Has Limits</option>
            <option value="no">No Limits</option>
          </select>
          <input
            type="date"
            value={createdFrom}
            onChange={(e) => setParam('createdFrom', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="date"
            value={createdTo}
            onChange={(e) => setParam('createdTo', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <span className="text-sm text-slate-300">{selectedCount} selected</span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<PowerOff size={14} />} onClick={() => requestBulkAction('disable')} loading={actionLoading}>
              Disable
            </Button>
            <Button size="sm" variant="secondary" icon={<Power size={14} />} onClick={() => requestBulkAction('enable')} loading={actionLoading}>
              Enable
            </Button>
            <Button size="sm" variant="secondary" icon={<Archive size={14} />} onClick={() => requestBulkAction('archive')} loading={actionLoading}>
              Archive
            </Button>
            <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => requestBulkAction('restore')} loading={actionLoading}>
              Restore
            </Button>
            <Button size="sm" variant="secondary" icon={<Tag size={14} />} onClick={openTagModal} loading={actionLoading}>
              Tags
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => requestBulkAction('delete')} loading={actionLoading}>
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : result?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-slate-400">No links found</p>
            <Link to="/links/create"><Button size="sm" icon={<Plus size={14} />}>Create your first link</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all visible links"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3">Short Link</th>
                  <th className="text-left px-4 py-3">Destination</th>
                  <th className="text-left px-4 py-3">Tags</th>
                  <th className="text-right px-4 py-3">Clicks</th>
                  <th className="text-left px-4 py-3">Limits</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result?.items.map((link) => {
                  const tags = link.tags ? (JSON.parse(link.tags) as string[]) : [];
                  const effectiveStatus = getEffectiveStatus(link);
                  const expiredByTime = !!link.expires_at && dayjs(link.expires_at).isBefore(dayjs());
                  const expiredByClicks = hasMaxClicks(link) && link.clicks >= Number(link.max_clicks);
                  return (
                    <tr key={link.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(link.id)}
                          onChange={() => toggleSelected(link.id)}
                          aria-label={`Select /${link.slug}`}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-brand-400">/{link.slug}</span>
                          {link.source && (
                            <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">{link.source}</span>
                          )}
                          {link.password_protected && (
                            <span title="Password protected" className="inline-flex text-slate-500"><KeyRound size={13} /></span>
                          )}
                          {link.warning_enabled === 1 && (
                            <span title="Safety warning enabled" className="inline-flex text-yellow-500"><ShieldAlert size={13} /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-slate-300" title={link.long_url}>{link.long_url}</p>
                        {link.title && <p className="text-xs text-slate-500 truncate">{link.title}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-medium">{link.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs">
                        {link.expires_at || hasMaxClicks(link) ? (
                          <div className="space-y-1">
                            {link.expires_at && (
                              <div className={expiredByTime ? 'text-yellow-400' : 'text-slate-500'}>
                                Until {dayjs(link.expires_at).format('MMM D, YYYY HH:mm')}
                              </div>
                            )}
                            {hasMaxClicks(link) && (
                              <div className={expiredByClicks ? 'text-yellow-400' : 'text-slate-500'}>
                                {link.clicks.toLocaleString()} / {Number(link.max_clicks).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={effectiveStatus} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{dayjs(link.created_at).format('MMM D, YYYY')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => copyLink(link)} title="Copy" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"><Copy size={14} /></button>
                          <a href={buildShortUrl(link, defaultDomain)} target="_blank" rel="noopener noreferrer" title="Open" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"><ExternalLink size={14} /></a>
                          <button onClick={() => showQr(link)} title="QR Code" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"><QrCode size={14} /></button>
                          <Link to={`/links/${link.id}/edit`} title="Edit" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"><Pencil size={14} /></Link>
                          {link.status === 'active'
                            ? <button onClick={() => confirmAction('disable', link)} title="Disable" className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-slate-700 rounded transition-colors"><PowerOff size={14} /></button>
                            : link.status === 'disabled'
                            ? <button onClick={() => confirmAction('enable', link)} title="Enable" className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"><Power size={14} /></button>
                            : null
                          }
                          {link.archived === 0
                            ? <button onClick={() => confirmAction('archive', link)} title="Archive" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"><Archive size={14} /></button>
                            : <button onClick={() => confirmAction('restore', link)} title="Restore" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"><RotateCcw size={14} /></button>
                          }
                          <button onClick={() => confirmAction('delete', link)} title="Delete" className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page} of {result.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<ChevronLeft size={14} />} disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}>Prev</Button>
            <Button variant="secondary" size="sm" disabled={page >= result.totalPages}
              onClick={() => setParam('page', String(page + 1))}>Next <ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm.type, confirm.link)}
        title={confirm?.type === 'delete' ? 'Delete Link' : confirm?.type === 'disable' ? 'Disable Link' : 'Archive Link'}
        message={
          confirm?.type === 'delete'
            ? `Are you sure you want to permanently delete "/${confirm.link.slug}"? This cannot be undone.`
            : confirm?.type === 'disable'
            ? `Disable "/${confirm?.link.slug}"? The short link will stop working.`
            : `Archive "/${confirm?.link.slug}"?`
        }
        confirmLabel={confirm?.type === 'delete' ? 'Delete' : confirm?.type === 'disable' ? 'Disable' : 'Archive'}
        confirmVariant={confirm?.type === 'delete' ? 'danger' : 'primary'}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => bulkConfirm && runBulkAction(bulkConfirm)}
        title={bulkConfirm === 'delete' ? 'Delete Links' : bulkConfirm === 'disable' ? 'Disable Links' : 'Archive Links'}
        message={
          bulkConfirm === 'delete'
            ? `Delete ${selectedCount} selected links? This cannot be undone.`
            : bulkConfirm === 'disable'
            ? `Disable ${selectedCount} selected links? They will stop redirecting.`
            : `Archive ${selectedCount} selected links?`
        }
        confirmLabel={bulkConfirm === 'delete' ? 'Delete' : bulkConfirm === 'disable' ? 'Disable' : 'Archive'}
        confirmVariant={bulkConfirm === 'delete' ? 'danger' : 'primary'}
        loading={actionLoading}
      />

      <Modal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        title="Bulk Edit Tags"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Mode"
            value={tagMode}
            onChange={(e) => setTagMode(e.target.value as BulkTagMode)}
          >
            <option value="add">Add to existing tags</option>
            <option value="replace">Replace existing tags</option>
            <option value="remove">Remove matching tags</option>
            <option value="clear">Clear all tags</option>
          </Select>

          <Input
            label="Tags"
            placeholder="vpn, card, campaign"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            disabled={tagMode === 'clear'}
            hint={tagMode === 'clear' ? `${selectedCount} selected links will have all tags removed` : 'Comma-separated tags'}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setTagModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={runBulkTagAction} loading={actionLoading}>
              Apply Tags
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!qr}
        onClose={() => setQr(null)}
        title={qr ? `QR Code /${qr.link.slug}` : 'QR Code'}
        size="sm"
      >
        {qr && (
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4">
              <img src={qr.dataUrl} alt={`QR code for ${qr.url}`} className="h-auto w-full" />
            </div>
            <p className="break-all font-mono text-xs text-slate-400">{qr.url}</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => copyLink(qr.link)} icon={<Copy size={14} />}>
                Copy Link
              </Button>
              <Button size="sm" onClick={downloadQr} icon={<Download size={14} />}>
                Download PNG
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
