import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, RefreshCw, Shuffle, Trash2 } from 'lucide-react';
import type {
  Link as LinkType,
  RedirectRule,
  RedirectRuleConfig,
  RedirectRuleTarget,
  RedirectRuleType,
} from '@linkora/shared';
import { listLinks } from '../api/links';
import {
  createRedirectRule,
  deleteRedirectRule,
  listRedirectRules,
  updateRedirectRule,
  type RedirectRulePayload,
} from '../api/redirectRules';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';

interface RuleForm {
  link_id: string;
  rule_type: RedirectRuleType;
  priority: string;
  enabled: boolean;
  values: string;
  targetUrl: string;
  targetsText: string;
}

const EMPTY_FORM: RuleForm = {
  link_id: '',
  rule_type: 'country',
  priority: '100',
  enabled: true,
  values: '',
  targetUrl: '',
  targetsText: '',
};

const RULE_TYPES = [
  { value: 'country', labelKey: 'countryRule' },
  { value: 'device', labelKey: 'deviceRule' },
  { value: 'browser', labelKey: 'browserRule' },
  { value: 'referer', labelKey: 'refererRule' },
  { value: 'language', labelKey: 'languageRule' },
  { value: 'weighted', labelKey: 'weightedRule' },
] as const satisfies ReadonlyArray<{ value: RedirectRuleType; labelKey: string }>;

const TYPE_BADGES: Record<RedirectRuleType, 'blue' | 'green' | 'gray' | 'purple' | 'yellow'> = {
  country: 'blue',
  device: 'purple',
  browser: 'green',
  referer: 'yellow',
  language: 'gray',
  weighted: 'blue',
};

function parseConfig(rule: RedirectRule): RedirectRuleConfig {
  try {
    const parsed = JSON.parse(rule.rule_config) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as RedirectRuleConfig) : {};
  } catch {
    return {};
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function splitValues(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function parseTargetsText(value: string): RedirectRuleTarget[] | null {
  const targets: RedirectRuleTarget[] = [];
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const delimiter = line.includes('|') ? '|' : ',';
    const [urlPart, weightPart] = line.split(delimiter).map((part) => part.trim());
    if (!urlPart || !isHttpUrl(urlPart)) return null;

    const weight = weightPart ? Number(weightPart) : 1;
    if (!Number.isFinite(weight) || weight <= 0) return null;
    targets.push({ url: urlPart, weight });
  }

  return targets.length > 0 ? targets : null;
}

function formatLink(link: LinkType | undefined, fallback: string): string {
  if (!link) return fallback;
  return `${link.domain ? `${link.domain}/` : '/'}${link.slug}`;
}

function formatTargets(targets: RedirectRuleTarget[] | undefined): string {
  if (!targets || targets.length === 0) return '-';
  return targets.map((target) => `${target.weight ?? 1} -> ${target.url}`).join(' | ');
}

function valuesText(config: RedirectRuleConfig): string {
  return config.values?.length ? config.values.join(', ') : '-';
}

export function RedirectRules() {
  const { success, error } = useToast();
  const { locale, t } = useLocale();
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RedirectRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RedirectRule | null>(null);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const linkById = useMemo(() => new Map(links.map((link) => [link.id, link])), [links]);
  const formatRuleType = (type: RedirectRuleType) => {
    const ruleType = RULE_TYPES.find((item) => item.value === type);
    return ruleType ? t(ruleType.labelKey) : type;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [linksResult, rulesResult] = await Promise.all([
        listLinks({ page: 1, pageSize: 100, sort: 'created_at_desc' }),
        listRedirectRules(selectedLinkId || undefined),
      ]);
      setLinks(linksResult.items);
      setRules(rulesResult.items);
    } catch {
      error(t('rulesLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [error, selectedLinkId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const enabledCount = rules.filter((rule) => parseConfig(rule).enabled !== false).length;
  const weightedCount = rules.filter((rule) => rule.rule_type === 'weighted').length;
  const ruleTypesInUse = new Set(rules.map((rule) => rule.rule_type)).size;

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      link_id: selectedLinkId || links[0]?.id || '',
    });
    setModalOpen(true);
  };

  const openEdit = (rule: RedirectRule) => {
    const config = parseConfig(rule);
    setEditing(rule);
    setForm({
      link_id: rule.link_id,
      rule_type: rule.rule_type,
      priority: String(rule.priority),
      enabled: config.enabled !== false,
      values: config.values?.join(', ') ?? '',
      targetUrl: config.targetUrl ?? '',
      targetsText: (config.targets ?? [])
        .map((target) => `${target.url} | ${target.weight ?? 1}`)
        .join('\n'),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const buildPayload = (): RedirectRulePayload | null => {
    if (!form.link_id) {
      error(t('linkRequired'));
      return null;
    }

    const priority = Number(form.priority);
    if (!Number.isInteger(priority) || priority < 0) {
      error(t('invalidPriority'));
      return null;
    }

    if (form.rule_type === 'weighted') {
      const targets = parseTargetsText(form.targetsText);
      if (!targets) {
        error(t('invalidTargets'));
        return null;
      }
      return {
        link_id: form.link_id,
        rule_type: form.rule_type,
        priority,
        enabled: form.enabled,
        targets,
      };
    }

    const values = splitValues(form.values);
    if (values.length === 0) {
      error(t('matchRequired'));
      return null;
    }
    if (!isHttpUrl(form.targetUrl.trim())) {
      error(t('invalidTargetUrl'));
      return null;
    }

    return {
      link_id: form.link_id,
      rule_type: form.rule_type,
      priority,
      enabled: form.enabled,
      values,
      targetUrl: form.targetUrl.trim(),
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      if (editing) {
        await updateRedirectRule(editing.id, payload);
        success(t('ruleUpdated'));
      } else {
        await createRedirectRule(payload);
        success(t('ruleCreated'));
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
      await deleteRedirectRule(deleteTarget.id);
      success(t('ruleDeleted'));
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
          <h1 className="text-2xl font-bold text-slate-100">{t('redirectRules')}</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {t('rulesSummary', {
              total: rules.length.toLocaleString(locale),
              enabled: enabledCount.toLocaleString(locale),
            })}
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
          <Button icon={<Plus size={15} />} onClick={openCreate} disabled={links.length === 0}>
            {t('addRule')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('enabled')}</span>
            <Shuffle size={17} className="text-brand-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {enabledCount.toLocaleString(locale)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('weighted')}</span>
            <Shuffle size={17} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {weightedCount.toLocaleString(locale)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('types')}</span>
            <Shuffle size={17} className="text-yellow-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-100">
            {ruleTypesInUse.toLocaleString(locale)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="max-w-xl">
          <Select
            label={t('links')}
            value={selectedLinkId}
            onChange={(e) => setSelectedLinkId(e.target.value)}
          >
            <option value="">{t('allLinks')}</option>
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {formatLink(link, t('unknownLink'))}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : rules.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <p className="text-slate-400">{t('noRules')}</p>
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={openCreate}
              disabled={links.length === 0}
            >
              {t('addRule')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-left">{t('links')}</th>
                  <th className="px-4 py-3 text-left">{t('type')}</th>
                  <th className="px-4 py-3 text-left">{t('match')}</th>
                  <th className="px-4 py-3 text-left">{t('target')}</th>
                  <th className="px-4 py-3 text-right">{t('priority')}</th>
                  <th className="px-4 py-3 text-left">{t('status')}</th>
                  <th className="px-4 py-3 text-left">{t('updated')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rules.map((rule) => {
                  const config = parseConfig(rule);
                  const enabled = config.enabled !== false;
                  return (
                    <tr key={rule.id} className="transition-colors hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono text-brand-400">
                          {formatLink(linkById.get(rule.link_id), t('unknownLink'))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={TYPE_BADGES[rule.rule_type]}>
                          {formatRuleType(rule.rule_type)}
                        </Badge>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p
                          className="truncate text-slate-300"
                          title={rule.rule_type === 'weighted' ? t('weighted') : valuesText(config)}
                        >
                          {rule.rule_type === 'weighted' ? t('weighted') : valuesText(config)}
                        </p>
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <p
                          className="truncate text-slate-400"
                          title={
                            rule.rule_type === 'weighted'
                              ? formatTargets(config.targets)
                              : (config.targetUrl ?? '-')
                          }
                        >
                          {rule.rule_type === 'weighted'
                            ? formatTargets(config.targets)
                            : (config.targetUrl ?? '-')}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-300">
                        {rule.priority}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={enabled ? 'green' : 'gray'}>
                          {enabled ? t('enabled') : t('disabledStatus')}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {dateFormatter.format(new Date(rule.updated_at))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={t('edit')}
                            onClick={() => openEdit(rule)}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            title={t('delete')}
                            onClick={() => setDeleteTarget(rule)}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-red-400"
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={t(editing ? 'editRule' : 'addRedirectRule')}
        size="xl"
      >
        <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
          <Select
            label={t('links')}
            value={form.link_id}
            disabled={!!editing}
            onChange={(e) => setForm((current) => ({ ...current, link_id: e.target.value }))}
          >
            <option value="">{t('selectLink')}</option>
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {formatLink(link, t('unknownLink'))}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('ruleType')}
              value={form.rule_type}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  rule_type: e.target.value as RedirectRuleType,
                }))
              }
            >
              {RULE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(type.labelKey)}
                </option>
              ))}
            </Select>
            <Input
              label={t('priority')}
              type="number"
              min={0}
              step={1}
              value={form.priority}
              onChange={(e) => setForm((current) => ({ ...current, priority: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((current) => ({ ...current, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
            {t('enabled')}
          </label>

          {form.rule_type === 'weighted' ? (
            <Textarea
              label={t('targets')}
              rows={6}
              placeholder={'https://example.com/a | 70\nhttps://example.com/b | 30'}
              value={form.targetsText}
              onChange={(e) => setForm((current) => ({ ...current, targetsText: e.target.value }))}
              hint={t('targetsHint')}
            />
          ) : (
            <>
              <Textarea
                label={t('matchValues')}
                rows={3}
                placeholder={
                  form.rule_type === 'country'
                    ? 'us, de, jp'
                    : form.rule_type === 'device'
                      ? 'mobile, desktop'
                      : form.rule_type === 'browser'
                        ? 'chrome, firefox'
                        : form.rule_type === 'language'
                          ? 'en, zh-cn'
                          : 'example.com, newsletter'
                }
                value={form.values}
                onChange={(e) => setForm((current) => ({ ...current, values: e.target.value }))}
                hint={t('commaNewline')}
              />
              <Input
                label={t('targetUrl')}
                placeholder="https://example.com/landing"
                value={form.targetUrl}
                onChange={(e) => setForm((current) => ({ ...current, targetUrl: e.target.value }))}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
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
        title={t('deleteRule')}
        message={t('deleteRuleConfirm', {
          type: deleteTarget ? formatRuleType(deleteTarget.rule_type) : '',
        })}
        confirmLabel={t('delete')}
        loading={saving}
      />
    </div>
  );
}
