import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Search, Tags as TagsIcon, Trash2 } from 'lucide-react';
import type { Tag as TagType } from '@linkora/shared';
import { createTag, deleteTag, listTags, updateTag, type TagPayload } from '../api/tags';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';

const DEFAULT_COLOR = '#38bdf8';

interface TagForm {
  name: string;
  color: string;
  description: string;
}

function toForm(tag?: TagType | null): TagForm {
  return {
    name: tag?.name ?? '',
    color: tag?.color ?? DEFAULT_COLOR,
    description: tag?.description ?? '',
  };
}

function toPayload(form: TagForm): TagPayload {
  return {
    name: form.name.trim(),
    color: form.color || null,
    description: form.description.trim() || null,
  };
}

export function Tags() {
  const { success, error } = useToast();
  const { locale, t } = useLocale();
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TagType | null>(null);
  const [form, setForm] = useState<TagForm>(() => toForm());
  const [deleteTarget, setDeleteTarget] = useState<TagType | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTags(await listTags());
    } catch {
      error(t('tagsLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(q) || (tag.description ?? '').toLowerCase().includes(q)
    );
  }, [query, tags]);

  const openCreate = () => {
    setEditing(null);
    setForm(toForm());
    setModalOpen(true);
  };

  const openEdit = (tag: TagType) => {
    setEditing(tag);
    setForm(toForm(tag));
    setModalOpen(true);
  };

  const setField = (key: keyof TagForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(form);
    if (!payload.name) {
      error(t('tagNameRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateTag(editing.id, payload);
        success(t('tagUpdated'));
      } else {
        await createTag(payload);
        success(t('tagCreated'));
      }
      setModalOpen(false);
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
      await deleteTag(deleteTarget.id);
      success(t('tagDeleted'));
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('tags')}</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {t('tagsCount', { count: tags.length.toLocaleString(locale) })}
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          {t('createTag')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchTags')}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
            <TagsIcon size={26} className="text-slate-600" />
            <p className="text-sm">{t('noTagsFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-left">{t('tag')}</th>
                  <th className="px-4 py-3 text-left">{t('description')}</th>
                  <th className="px-4 py-3 text-left">{t('updated')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="transition-colors hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-white/10"
                          style={{ backgroundColor: tag.color ?? DEFAULT_COLOR }}
                        />
                        <span className="font-medium text-slate-100">{tag.name}</span>
                      </div>
                    </td>
                    <td className="max-w-xl px-4 py-3 text-slate-400">
                      <span className="line-clamp-1">{tag.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(tag.updated_at).toLocaleDateString(locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(tag)}
                          title={t('edit')}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tag)}
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
        onClose={() => setModalOpen(false)}
        title={t(editing ? 'editTag' : 'createTag')}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={t('name')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            maxLength={50}
            autoFocus
          />

          <div className="grid grid-cols-[44px_1fr] items-end gap-3">
            <label className="flex h-10 w-11 cursor-pointer overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                className="h-14 w-14 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent p-0"
                aria-label={t('tagColor')}
              />
            </label>
            <Input
              label={t('color')}
              value={form.color}
              onChange={(e) => setField('color', e.target.value)}
              placeholder="#38bdf8"
              maxLength={7}
            />
          </div>

          <Textarea
            label={t('description')}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            maxLength={200}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
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
        title={t('deleteTag')}
        message={deleteTarget ? t('deleteTagConfirm', { name: deleteTarget.name }) : ''}
        confirmLabel={t('delete')}
        confirmVariant="danger"
        loading={saving}
      />
    </div>
  );
}
