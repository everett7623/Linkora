import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Globe2, Plus, Star, Trash2 } from 'lucide-react';
import {
  createDomain,
  deleteDomain,
  listDomains,
  setDefaultDomain,
  updateDomain,
} from '../api/domains';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import type { Domain } from '@linkora/shared';
import { useLocale } from '../contexts/LocaleContext';

interface DomainForm {
  domain: string;
  is_default: boolean;
  status: Domain['status'];
}

const EMPTY_FORM: DomainForm = {
  domain: '',
  is_default: false,
  status: 'active',
};

export function Domains() {
  const { success, error } = useToast();
  const { locale, t } = useLocale();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);
  const [form, setForm] = useState<DomainForm>(EMPTY_FORM);
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
      setDomains(await listDomains());
    } catch {
      error(t('domainsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [error, t]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = domains.filter((domain) => domain.status === 'active').length;
  const defaultDomain = domains.find((domain) => domain.is_default === 1);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (domain: Domain) => {
    setEditing(domain);
    setForm({
      domain: domain.domain,
      is_default: domain.is_default === 1,
      status: domain.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const domain = form.domain.trim();
    if (!domain) {
      error(t('domainRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateDomain(editing.id, {
          domain,
          is_default: form.is_default,
          status: form.status,
        });
        success(t('domainUpdated'));
      } else {
        await createDomain({
          domain,
          is_default: form.is_default,
          status: form.status,
        });
        success(t('domainCreated'));
      }
      closeModal();
      await load();
    } catch (e) {
      error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (domain: Domain) => {
    setSaving(true);
    try {
      await setDefaultDomain(domain.id);
      success(t('defaultDomainUpdated'));
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
      await deleteDomain(deleteTarget.id);
      success(t('domainDeleted'));
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
          <h1 className="text-2xl font-bold text-slate-100">{t('domains')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {t('activeDomainSummary', { count: activeCount.toLocaleString(locale) })}
            {defaultDomain ? ` · ${t('defaultLabel')} ${defaultDomain.domain}` : ''}
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openCreate}>
          {t('addDomain')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('registered')}</span>
            <Globe2 size={17} className="text-brand-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {domains.length.toLocaleString(locale)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('activeStatus')}</span>
            <Globe2 size={17} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {activeCount.toLocaleString(locale)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('defaultLabel')}</span>
            <Star size={17} className="text-yellow-400" />
          </div>
          <div className="mt-3 truncate text-lg font-semibold text-slate-100">
            {defaultDomain?.domain ?? '-'}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-slate-400">{t('noDomains')}</p>
            <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
              {t('addDomain')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">{t('domain')}</th>
                  <th className="text-left px-4 py-3">{t('defaultLabel')}</th>
                  <th className="text-left px-4 py-3">{t('status')}</th>
                  <th className="text-left px-4 py-3">{t('created')}</th>
                  <th className="text-right px-4 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe2 size={15} className="text-slate-500" />
                        <span className="font-medium text-slate-200">{domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {domain.is_default === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-300">
                          <Star size={12} /> {t('defaultLabel')}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Star size={13} />}
                          disabled={saving}
                          onClick={() => handleSetDefault(domain)}
                        >
                          {t('setDefault')}
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          domain.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {domain.status === 'active' ? t('activeStatus') : t('disabledStatus')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {dateFormatter.format(new Date(domain.created_at))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(domain)}
                          title={t('edit')}
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(domain)}
                          title={t('delete')}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
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
        title={t(editing ? 'editDomain' : 'addDomain')}
        size="md"
      >
        <div className="space-y-5">
          <Input
            label={t('domain')}
            placeholder="go.example.com"
            value={form.domain}
            onChange={(e) => setForm((current) => ({ ...current, domain: e.target.value }))}
          />

          <Select
            label={t('status')}
            value={form.status}
            onChange={(e) =>
              setForm((current) => ({ ...current, status: e.target.value as Domain['status'] }))
            }
          >
            <option value="active">{t('activeStatus')}</option>
            <option value="disabled">{t('disabledStatus')}</option>
          </Select>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((current) => ({ ...current, is_default: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
            {t('useDefaultDomain')}
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? t('save') : t('create')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteDomain')}
        message={t('deleteDomainConfirm', { domain: deleteTarget?.domain ?? '' })}
        confirmLabel={t('delete')}
        loading={saving}
      />
    </div>
  );
}
