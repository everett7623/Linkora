import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Edit2, Flag, Folder, Plus, RefreshCw, Tags, Trash2 } from 'lucide-react';
import type { LinkGroup, LinkGroupType } from '@linkora/shared';
import {
  createGroup,
  deleteGroup,
  listGroups,
  updateGroup,
  type GroupPayload,
} from '../api/groups';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import type { MessageKey } from '../i18n/messages';

interface GroupForm {
  type: LinkGroupType;
  name: string;
  color: string;
  description: string;
}

const DEFAULT_COLORS: Record<LinkGroupType, string> = {
  campaign: '#38bdf8',
  project: '#a78bfa',
};

const EMPTY_FORM: GroupForm = {
  type: 'campaign',
  name: '',
  color: DEFAULT_COLORS.campaign,
  description: '',
};

const TYPE_OPTIONS: Array<{ value: LinkGroupType; labelKey: MessageKey }> = [
  { value: 'campaign', labelKey: 'campaigns' },
  { value: 'project', labelKey: 'projects' },
];

function toForm(group?: LinkGroup | null): GroupForm {
  return {
    type: group?.type ?? 'campaign',
    name: group?.name ?? '',
    color: group?.color ?? DEFAULT_COLORS[group?.type ?? 'campaign'],
    description: group?.description ?? '',
  };
}

function toPayload(form: GroupForm): GroupPayload {
  return {
    type: form.type,
    name: form.name.trim(),
    color: form.color || null,
    description: form.description.trim() || null,
  };
}

function linksPath(group: LinkGroup): string {
  return `/links?tag=${encodeURIComponent(group.tagName)}`;
}

function formatLastClicked(group: LinkGroup, formatter: Intl.DateTimeFormat): string {
  return group.lastClickedAt ? formatter.format(new Date(group.lastClickedAt)) : '-';
}

function GroupIcon({ type }: { type: LinkGroupType }) {
  return type === 'campaign' ? (
    <Flag size={15} className="text-sky-400" />
  ) : (
    <Folder size={15} className="text-violet-400" />
  );
}

export function Groups() {
  const { success, error } = useToast();
  const { locale, t } = useLocale();
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [filterType, setFilterType] = useState<LinkGroupType | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LinkGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LinkGroup | null>(null);
  const [form, setForm] = useState<GroupForm>(EMPTY_FORM);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listGroups(filterType);
      setGroups(result.items);
    } catch {
      error(t('groupsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [error, filterType, t]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(
    () => ({
      campaigns: groups.filter((group) => group.type === 'campaign').length,
      projects: groups.filter((group) => group.type === 'project').length,
      links: groups.reduce((sum, group) => sum + group.linkCount, 0),
      clicks: groups.reduce((sum, group) => sum + group.totalClicks, 0),
    }),
    [groups]
  );

  const openCreate = (type: LinkGroupType = 'campaign') => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, type, color: DEFAULT_COLORS[type] });
    setModalOpen(true);
  };

  const openEdit = (group: LinkGroup) => {
    setEditing(group);
    setForm(toForm(group));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const setField = <K extends keyof GroupForm>(key: K, value: GroupForm[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'type' && !editing ? { color: DEFAULT_COLORS[value as LinkGroupType] } : {}),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(form);
    if (!payload.name) {
      error(t('nameRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateGroup(editing.id, payload);
        success(t('groupUpdated'));
      } else {
        await createGroup(payload);
        success(t('groupCreated'));
      }
      closeModal();
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteGroup(deleteTarget.id);
      success(t('groupDeleted'));
      setDeleteTarget(null);
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('groups')}</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {t('groupsSummary', { count: groups.length.toLocaleString(locale) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={load}
            disabled={loading || saving}
          >
            {t('refresh')}
          </Button>
          <Button
            variant="secondary"
            icon={<Folder size={15} />}
            onClick={() => openCreate('project')}
          >
            {t('addProject')}
          </Button>
          <Button icon={<Plus size={15} />} onClick={() => openCreate('campaign')}>
            {t('addCampaign')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('campaigns')}</span>
            <Flag size={17} className="text-sky-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {summary.campaigns.toLocaleString(locale)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('projects')}</span>
            <Folder size={17} className="text-violet-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {summary.projects.toLocaleString(locale)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('groupedLinks')}</span>
            <Tags size={17} className="text-brand-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {summary.links.toLocaleString(locale)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('clicks')}</span>
            <Tags size={17} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {summary.clicks.toLocaleString(locale)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="max-w-xs">
          <Select
            label={t('type')}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as LinkGroupType | '')}
          >
            <option value="">{t('allGroups')}</option>
            <option value="campaign">{t('campaigns')}</option>
            <option value="project">{t('projects')}</option>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
            <Tags size={26} className="text-slate-600" />
            <p className="text-sm">{t('noGroups')}</p>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => openCreate('campaign')}>
              {t('addCampaign')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-left">{t('group')}</th>
                  <th className="px-4 py-3 text-left">{t('tag')}</th>
                  <th className="px-4 py-3 text-right">{t('links')}</th>
                  <th className="px-4 py-3 text-right">{t('activeStatus')}</th>
                  <th className="px-4 py-3 text-right">{t('clicks')}</th>
                  <th className="px-4 py-3 text-left">{t('lastClicked')}</th>
                  <th className="px-4 py-3 text-left">{t('updated')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {groups.map((group) => (
                  <tr key={group.id} className="transition-colors hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-white/10"
                          style={{ backgroundColor: group.color ?? DEFAULT_COLORS[group.type] }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <GroupIcon type={group.type} />
                            <span className="font-medium text-slate-100">{group.name}</span>
                          </div>
                          {group.description && (
                            <p
                              className="mt-0.5 max-w-xs truncate text-xs text-slate-500"
                              title={group.description}
                            >
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={group.type === 'campaign' ? 'blue' : 'purple'}>
                        {group.tagName}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      <Link
                        to={linksPath(group)}
                        className="font-medium text-brand-400 hover:text-brand-300"
                      >
                        {group.linkCount.toLocaleString(locale)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {group.activeLinkCount.toLocaleString(locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {group.totalClicks.toLocaleString(locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {formatLastClicked(group, dateFormatter)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {dateFormatter.format(new Date(group.updated_at))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={linksPath(group)}
                          title={t('viewLinks')}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
                        >
                          <Tags size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(group)}
                          title={t('edit')}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(group)}
                          title={t('delete')}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={t(editing ? 'editGroup' : 'createGroup')}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label={t('type')}
            value={form.type}
            onChange={(e) => setField('type', e.target.value as LinkGroupType)}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>

          <Input
            label={t('name')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            maxLength={40}
            autoFocus
          />

          <div className="grid grid-cols-[44px_1fr] items-end gap-3">
            <label className="flex h-10 w-11 cursor-pointer overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                className="h-14 w-14 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent p-0"
                aria-label={t('groupColor')}
              />
            </label>
            <Input
              label={t('color')}
              value={form.color}
              onChange={(e) => setField('color', e.target.value)}
              placeholder={DEFAULT_COLORS[form.type]}
              maxLength={7}
            />
          </div>

          <Textarea
            label={t('description')}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            maxLength={200}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeModal}
              disabled={saving}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" size="sm" loading={saving} icon={<Check size={14} />}>
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteGroup')}
        message={
          deleteTarget
            ? t('deleteGroupConfirm', {
                type: t(deleteTarget.type === 'campaign' ? 'campaigns' : 'projects'),
                name: deleteTarget.name,
                tag: deleteTarget.tagName,
                count: deleteTarget.linkCount,
              })
            : ''
        }
        confirmLabel={t('delete')}
        confirmVariant="danger"
        loading={saving}
      />
    </div>
  );
}
