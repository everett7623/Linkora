import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Copy,
  Pencil,
  Trash2,
  PowerOff,
  Power,
  Archive,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Download,
  Tag,
  KeyRound,
  ShieldAlert,
  SlidersHorizontal,
  BarChart3,
  Replace,
  Globe2,
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
  previewBulkUrlReplace,
  confirmBulkUrlReplace,
  type BulkUrlPreviewItem,
  previewDomainMigration,
  confirmDomainMigration,
  type DomainMigrationPreview,
} from '../api/links';
import { getSettings } from '../api/settings';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { buildShortUrl } from '../utils/shortUrl';
import { downloadDataUrl } from '../utils/download';
import type { Link as LinkType, PaginatedResult } from '@linketry/shared';
import { useAdminMode } from '../contexts/AdminModeContext';
import { stripAdvancedLinkFilters } from '../utils/linkFilters';
import { useLocale } from '../contexts/LocaleContext';
import { BulkUtmTool } from '../components/links/BulkUtmTool';
import { LinkCardGrid } from '../components/links/LinkCardGrid';
import { LinkViewToolbar } from '../components/links/LinkViewToolbar';
import {
  getEffectiveLinkStatus,
  hasMaxClicks,
  isLinkExpiredByClicks,
  isLinkExpiredByTime,
  parseLinkTags,
} from '../utils/linkPresentation';
import { readLinkViewPreference, writeLinkViewPreference, type LinkView } from '../utils/linkView';

const PAGE_SIZE = 20;

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
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replacePreview, setReplacePreview] = useState<BulkUrlPreviewItem[]>([]);
  const [domainMigrationOpen, setDomainMigrationOpen] = useState(false);
  const [sourceDomain, setSourceDomain] = useState('');
  const [targetDomain, setTargetDomain] = useState('');
  const [domainMigrationPreview, setDomainMigrationPreview] = useState<DomainMigrationPreview | null>(null);
  const [linkView, setLinkView] = useState<LinkView>(readLinkViewPreference);
  const { success, error } = useToast();
  const { isAdvanced } = useAdminMode();
  const { locale, t } = useLocale();
  const createdDateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const limitDateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const changeLinkView = (view: LinkView) => {
    setLinkView(view);
    writeLinkViewPreference(view);
  };

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
      error(t('linksLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [
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
    t,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
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
  ]);

  useEffect(() => {
    getSettings()
      .then((s) => setDefaultDomain(s.default_domain ?? ''))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isAdvanced) return;
    const next = stripAdvancedLinkFilters(searchParams);
    if (next) setSearchParams(next, { replace: true });
  }, [isAdvanced, searchParams, setSearchParams]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
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
    success(t('copied'));
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
      error(t('qrFailed'));
    }
  };

  const downloadQr = () => {
    if (!qr) return;
    downloadDataUrl(qr.dataUrl, `linketry-qr-${qr.link.slug}.png`);
    success(t('qrDownloaded'));
  };

  const runAction = async (type: string, link: LinkType) => {
    setActionLoading(true);
    try {
      if (type === 'delete') {
        await deleteLink(link.id);
        success(t('linkDeleted'));
      } else if (type === 'disable') {
        await disableLink(link.id);
        success(t('linkDisabled'));
      } else if (type === 'enable') {
        await enableLink(link.id);
        success(t('linkEnabled'));
      } else if (type === 'archive') {
        await archiveLink(link.id);
        success(t('linkArchived'));
      } else if (type === 'restore') {
        await restoreLink(link.id);
        success(t('linkRestored'));
      }
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      success(t('bulkUpdated', { action: t(action), count: result.success }));
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

    const tags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tagMode !== 'clear' && tags.length === 0) {
      error(t('enterTag'));
      return;
    }

    setActionLoading(true);
    try {
      const result = await bulkTagLinks(ids, tags, tagMode);
      success(t('tagsUpdated', { count: result.success }));
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
  const runUrlPreview = async () => { setActionLoading(true); try { const result=await previewBulkUrlReplace([...selectedIds],findText,replaceText);setReplacePreview(result.items); } catch(e){error(String(e));} finally{setActionLoading(false);} };
  const confirmUrlReplace = async () => { setActionLoading(true); try { const result=await confirmBulkUrlReplace(replacePreview); const blob=new Blob([result.rollback_csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`linketry-url-rollback-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);success(t('bulkUrlsUpdated',{count:result.changed}));setReplaceOpen(false);setReplacePreview([]);setSelectedIds(new Set());await load(); } catch(e){error(String(e));} finally{setActionLoading(false);} };

  const openDomainMigration = () => {
    setSourceDomain(domain);
    setTargetDomain(defaultDomain);
    setDomainMigrationPreview(null);
    setDomainMigrationOpen(true);
  };

  const runDomainMigrationPreview = async () => {
    setActionLoading(true);
    try {
      setDomainMigrationPreview(await previewDomainMigration(sourceDomain, targetDomain));
    } catch (e) {
      error(String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const runDomainMigration = async () => {
    if (!domainMigrationPreview) return;
    setActionLoading(true);
    try {
      const result = await confirmDomainMigration(domainMigrationPreview);
      const blob = new Blob([result.rollback_csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `linketry-domain-migration-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      success(t('domainMigrationComplete', { count: result.changed }));
      setDomainMigrationOpen(false);
      setDomainMigrationPreview(null);
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
          <h1 className="text-2xl font-bold text-slate-100">{t('links')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {result ? t('linksCount', { count: result.total.toLocaleString(locale) }) : '—'}
          </p>
        </div>
        <Link to="/links/create">
          <Button icon={<Plus size={16} />}>{t('createLink')}</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('searchLinks')}
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
          <option value="">{t('allStatus')}</option>
          <option value="active">{t('activeStatus')}</option>
          <option value="disabled">{t('disabledStatus')}</option>
          <option value="expired">{t('expiredStatus')}</option>
          <option value="archived">{t('archivedStatus')}</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="created_at_desc">{t('newestFirst')}</option>
          <option value="created_at_asc">{t('oldestFirst')}</option>
          <option value="clicks_desc">{t('mostClicks')}</option>
          <option value="last_clicked_at_desc">{t('recentlyClicked')}</option>
          <option value="last_clicked_at_asc">{t('leastRecentlyClicked')}</option>
          <option value="updated_at_desc">{t('recentlyUpdated')}</option>
          <option value="updated_at_asc">{t('oldestUpdated')}</option>
        </select>
      </div>

      {isAdvanced && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <SlidersHorizontal size={15} className="text-brand-400" />
              {t('advancedFilters')}
            </div>
            <div className="flex items-center gap-3">
              <BulkUtmTool
                selectedIds={[...selectedIds]}
                filteredCount={result?.total ?? 0}
                searchParams={searchParams}
                onCompleted={async () => { setSelectedIds(new Set()); await load(); }}
              />
              <button
                type="button"
                onClick={openDomainMigration}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
              >
                <Globe2 size={13} />
                {t('migrateShortDomain')}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                {t('clear')}
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input
              type="text"
              placeholder={t('tag')}
              value={tag}
              onChange={(e) => setParam('tag', e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder={t('sourcePlaceholder')}
              value={source}
              onChange={(e) => setParam('source', e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder={t('domain')}
              value={domain}
              onChange={(e) => setParam('domain', e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={hasPassword}
              onChange={(e) => setParam('hasPassword', e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{t('anyPassword')}</option>
              <option value="yes">{t('passwordProtected')}</option>
              <option value="no">{t('noPassword')}</option>
            </select>
            <select
              value={warning}
              onChange={(e) => setParam('warning', e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{t('anyWarning')}</option>
              <option value="yes">{t('warningEnabled')}</option>
              <option value="no">{t('warningDisabled')}</option>
            </select>
            <select
              value={limits}
              onChange={(e) => setParam('limits', e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{t('anyLimits')}</option>
              <option value="yes">{t('hasLimits')}</option>
              <option value="no">{t('noLimits')}</option>
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
      )}

      {isAdvanced && selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <span className="text-sm text-slate-300">
            {t('selectedCount', { count: selectedCount })}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<PowerOff size={14} />}
              onClick={() => requestBulkAction('disable')}
              loading={actionLoading}
            >
              {t('disable')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Power size={14} />}
              onClick={() => requestBulkAction('enable')}
              loading={actionLoading}
            >
              {t('enable')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Archive size={14} />}
              onClick={() => requestBulkAction('archive')}
              loading={actionLoading}
            >
              {t('archive')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCcw size={14} />}
              onClick={() => requestBulkAction('restore')}
              loading={actionLoading}
            >
              {t('restore')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Tag size={14} />}
              onClick={openTagModal}
              loading={actionLoading}
            >
              {t('tags')}
            </Button>
            <Button size="sm" variant="secondary" icon={<Replace size={14}/>} onClick={()=>setReplaceOpen(true)} loading={actionLoading}>{t('replaceUrls')}</Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => requestBulkAction('delete')}
              loading={actionLoading}
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      )}

      <LinkViewToolbar
        view={linkView}
        showSelectAll={isAdvanced && linkView === 'cards' && visibleIds.length > 0}
        allVisibleSelected={allVisibleSelected}
        onChange={changeLinkView}
        onToggleAllVisible={toggleAllVisible}
      />

      {/* Link results */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : result?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-slate-400">{t('noLinksFound')}</p>
            <Link to="/links/create">
              <Button size="sm" icon={<Plus size={14} />}>
                {t('createFirstLink')}
              </Button>
            </Link>
          </div>
        ) : linkView === 'cards' ? (
          <LinkCardGrid
            links={result?.items ?? []}
            defaultDomain={defaultDomain}
            isAdvanced={isAdvanced}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onCopy={copyLink}
            onShowQr={showQr}
            onConfirmAction={confirmAction}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  {isAdvanced && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label={t('selectAllVisibleLinks')}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3">{t('shortLink')}</th>
                  <th className="text-left px-4 py-3">{t('destination')}</th>
                  <th className="text-left px-4 py-3">{t('tags')}</th>
                  <th className="text-right px-4 py-3">{t('clicks')}</th>
                  {isAdvanced && <th className="text-left px-4 py-3">{t('limitsLabel')}</th>}
                  <th className="text-left px-4 py-3">{t('status')}</th>
                  <th className="text-left px-4 py-3">{t('created')}</th>
                  <th className="text-right px-4 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result?.items.map((link) => {
                  const tags = parseLinkTags(link.tags);
                  const effectiveStatus = getEffectiveLinkStatus(link);
                  const expiredByTime = isLinkExpiredByTime(link);
                  const expiredByClicks = isLinkExpiredByClicks(link);
                  return (
                    <tr key={link.id} className="hover:bg-slate-800/50 transition-colors">
                      {isAdvanced && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(link.id)}
                            onChange={() => toggleSelected(link.id)}
                            aria-label={t('selectLinkAria', { slug: link.slug })}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-brand-400">/{link.slug}</span>
                          {link.source && (
                            <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                              {link.source}
                            </span>
                          )}
                          {link.password_protected && (
                            <span
                              title={t('passwordProtected')}
                              className="inline-flex text-slate-500"
                            >
                              <KeyRound size={13} />
                            </span>
                          )}
                          {link.warning_enabled === 1 && (
                            <span
                              title={t('safetyWarningEnabled')}
                              className="inline-flex text-yellow-500"
                            >
                              <ShieldAlert size={13} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-slate-300" title={link.long_url}>
                          {link.long_url}
                        </p>
                        {link.title && (
                          <p className="text-xs text-slate-500 truncate">{link.title}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-medium">
                        {link.clicks.toLocaleString(locale)}
                      </td>
                      {isAdvanced && (
                        <td className="px-4 py-3 text-xs">
                          {link.expires_at || hasMaxClicks(link) ? (
                            <div className="space-y-1">
                              {link.expires_at && (
                                <div
                                  className={expiredByTime ? 'text-yellow-400' : 'text-slate-500'}
                                >
                                  {t('until', {
                                    date: limitDateFormatter.format(new Date(link.expires_at)),
                                  })}
                                </div>
                              )}
                              {hasMaxClicks(link) && (
                                <div
                                  className={expiredByClicks ? 'text-yellow-400' : 'text-slate-500'}
                                >
                                  {link.clicks.toLocaleString(locale)} /{' '}
                                  {Number(link.max_clicks).toLocaleString(locale)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">{t('none')}</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <StatusBadge status={effectiveStatus} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {createdDateFormatter.format(new Date(link.created_at))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyLink(link)}
                            title={t('copy')}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                          <a
                            href={buildShortUrl(link, defaultDomain)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('open')}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => showQr(link)}
                            title={t('qrCode')}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                          >
                            <QrCode size={14} />
                          </button>
                          {isAdvanced && (
                            <Link
                              to={`/analytics/links/${link.id}`}
                              title={t('analytics')}
                              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                            >
                              <BarChart3 size={14} />
                            </Link>
                          )}
                          <Link
                            to={`/links/${link.id}/edit`}
                            title={t('edit')}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                          >
                            <Pencil size={14} />
                          </Link>
                          {link.status === 'active' ? (
                            <button
                              onClick={() => confirmAction('disable', link)}
                              title={t('disable')}
                              className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-slate-700 rounded transition-colors"
                            >
                              <PowerOff size={14} />
                            </button>
                          ) : link.status === 'disabled' ? (
                            <button
                              onClick={() => confirmAction('enable', link)}
                              title={t('enable')}
                              className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                            >
                              <Power size={14} />
                            </button>
                          ) : null}
                          {isAdvanced &&
                            (link.archived === 0 ? (
                              <button
                                onClick={() => confirmAction('archive', link)}
                                title={t('archive')}
                                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                              >
                                <Archive size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => confirmAction('restore', link)}
                                title={t('restore')}
                                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                              >
                                <RotateCcw size={14} />
                              </button>
                            ))}
                          <button
                            onClick={() => confirmAction('delete', link)}
                            title={t('delete')}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
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
          <span className="text-slate-500">{t('pageOf', { page, total: result.totalPages })}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={14} />}
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              {t('previous')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= result.totalPages}
              onClick={() => setParam('page', String(page + 1))}
            >
              {t('next')} <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm.type, confirm.link)}
        title={t(
          confirm?.type === 'delete'
            ? 'deleteLink'
            : confirm?.type === 'disable'
              ? 'disableLink'
              : 'archiveLink'
        )}
        message={
          confirm?.type === 'delete'
            ? t('deleteLinkConfirm', { slug: confirm.link.slug })
            : confirm?.type === 'disable'
              ? t('disableLinkConfirm', { slug: confirm?.link.slug ?? '' })
              : t('archiveLinkConfirm', { slug: confirm?.link.slug ?? '' })
        }
        confirmLabel={t(
          confirm?.type === 'delete'
            ? 'delete'
            : confirm?.type === 'disable'
              ? 'disable'
              : 'archive'
        )}
        confirmVariant={confirm?.type === 'delete' ? 'danger' : 'primary'}
        loading={actionLoading}
      />

      {isAdvanced && (
        <ConfirmDialog
          open={!!bulkConfirm}
          onClose={() => setBulkConfirm(null)}
          onConfirm={() => bulkConfirm && runBulkAction(bulkConfirm)}
          title={t(
            bulkConfirm === 'delete'
              ? 'deleteLinks'
              : bulkConfirm === 'disable'
                ? 'disableLinks'
                : 'archiveLinks'
          )}
          message={
            bulkConfirm === 'delete'
              ? t('deleteLinksConfirm', { count: selectedCount })
              : bulkConfirm === 'disable'
                ? t('disableLinksConfirm', { count: selectedCount })
                : t('archiveLinksConfirm', { count: selectedCount })
          }
          confirmLabel={t(
            bulkConfirm === 'delete' ? 'delete' : bulkConfirm === 'disable' ? 'disable' : 'archive'
          )}
          confirmVariant={bulkConfirm === 'delete' ? 'danger' : 'primary'}
          loading={actionLoading}
        />
      )}

      {isAdvanced && (
        <Modal
          open={tagModalOpen}
          onClose={() => setTagModalOpen(false)}
          title={t('bulkEditTags')}
          size="md"
        >
          <div className="space-y-4">
            <Select
              label={t('mode')}
              value={tagMode}
              onChange={(e) => setTagMode(e.target.value as BulkTagMode)}
            >
              <option value="add">{t('addTagsMode')}</option>
              <option value="replace">{t('replaceTagsMode')}</option>
              <option value="remove">{t('removeTagsMode')}</option>
              <option value="clear">{t('clearTagsMode')}</option>
            </Select>

            <Input
              label={t('tags')}
              placeholder="vpn, card, campaign"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              disabled={tagMode === 'clear'}
              hint={
                tagMode === 'clear' ? t('clearTagsHint', { count: selectedCount }) : t('commaTags')
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTagModalOpen(false)}
                disabled={actionLoading}
              >
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={runBulkTagAction} loading={actionLoading}>
                {t('applyTags')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {isAdvanced && <Modal open={replaceOpen} onClose={()=>setReplaceOpen(false)} title={t('replaceUrls')} size="xl"><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Input label={t('findText')} value={findText} onChange={(e)=>{setFindText(e.target.value);setReplacePreview([])}}/><Input label={t('replaceWith')} value={replaceText} onChange={(e)=>{setReplaceText(e.target.value);setReplacePreview([])}}/></div><p className="text-xs text-yellow-300">{t('replaceUrlGuidance')}</p>{replacePreview.length>0&&<div className="max-h-72 overflow-auto border border-slate-800"><table className="w-full text-xs"><tbody className="divide-y divide-slate-800">{replacePreview.map((item)=><tr key={item.id}><td className="px-3 py-2 font-mono text-slate-400">/{item.slug}</td><td className="max-w-xs truncate px-3 py-2 text-slate-500">{item.next_url}</td><td className="px-3 py-2 text-right">{t(item.status==='ready'?'readyStatus':item.status==='invalid'?'invalidStatus':'unchangedStatus')}</td></tr>)}</tbody></table></div>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={runUrlPreview} disabled={!findText} loading={actionLoading}>{t('previewChanges')}</Button><Button onClick={confirmUrlReplace} disabled={!replacePreview.some((item)=>item.status==='ready')} loading={actionLoading}>{t('confirmReplace')}</Button></div></div></Modal>}

      {isAdvanced && (
        <Modal
          open={domainMigrationOpen}
          onClose={() => setDomainMigrationOpen(false)}
          title={t('migrateShortDomain')}
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t('sourceShortDomain')}
                value={sourceDomain}
                placeholder="s.y8o.de"
                onChange={(event) => { setSourceDomain(event.target.value); setDomainMigrationPreview(null); }}
              />
              <Input
                label={t('targetShortDomain')}
                value={targetDomain}
                placeholder="go.uukk.de"
                onChange={(event) => { setTargetDomain(event.target.value); setDomainMigrationPreview(null); }}
              />
            </div>
            <p className="text-xs text-yellow-300">{t('domainMigrationGuidance')}</p>
            {domainMigrationPreview && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                  {t('domainMigrationCount', { count: domainMigrationPreview.total })}
                </div>
                {!domainMigrationPreview.target_registered && (
                  <p className="text-xs text-orange-300">{t('targetDomainNotRegistered')}</p>
                )}
                {domainMigrationPreview.items.length > 0 && (
                  <div className="max-h-72 overflow-auto rounded-lg border border-slate-800">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-slate-800">
                        {domainMigrationPreview.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 font-mono text-slate-400">/{item.slug}</td>
                            <td className="max-w-sm truncate px-3 py-2 text-slate-500">{item.next_short_url}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={runDomainMigrationPreview}
                disabled={!sourceDomain.trim() || !targetDomain.trim()}
                loading={actionLoading}
              >
                {t('previewMigration')}
              </Button>
              <Button
                onClick={runDomainMigration}
                disabled={!domainMigrationPreview || domainMigrationPreview.total < 1}
                loading={actionLoading}
              >
                {t('confirmDomainMigration')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={!!qr}
        onClose={() => setQr(null)}
        title={qr ? t('qrCodeTitle', { slug: qr.link.slug }) : t('qrCode')}
        size="sm"
      >
        {qr && (
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4">
              <img src={qr.dataUrl} alt={t('qrCodeFor', { url: qr.url })} className="h-auto w-full" />
            </div>
            <p className="break-all font-mono text-xs text-slate-400">{qr.url}</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyLink(qr.link)}
                icon={<Copy size={14} />}
              >
                {t('copyLink')}
              </Button>
              <Button size="sm" onClick={downloadQr} icon={<Download size={14} />}>
                {t('downloadPng')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
