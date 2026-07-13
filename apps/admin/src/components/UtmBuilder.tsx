import React, { useEffect, useState } from 'react';
import { LinkIcon, Save, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { useLocale } from '../contexts/LocaleContext';
import { createUtmTemplate, deleteUtmTemplate, listUtmTemplates, type UtmTemplate } from '../api/utmTemplates';
import { useToast } from './ui/Toast';

const TEMPLATES: Record<string, { source: string; medium: string; campaign: string }> = {
  newsletter: { source: 'newsletter', medium: 'email', campaign: '' },
  social: { source: 'social', medium: 'social', campaign: '' },
  ads: { source: 'google', medium: 'cpc', campaign: '' },
  affiliate: { source: 'affiliate', medium: 'referral', campaign: '' },
};

function appendUtmParams(url: string, values: Record<string, string>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    if (trimmed) parsed.searchParams.set(key, trimmed);
  }
  return parsed.toString();
}

export function UtmBuilder({
  longUrl,
  onApply,
  disabled,
}: {
  longUrl: string;
  onApply: (url: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const { success, error: toastError } = useToast();
  const [template, setTemplate] = useState('');
  const [utm, setUtm] = useState({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<UtmTemplate[]>([]);
  const [savedId, setSavedId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { listUtmTemplates().then((result) => setSaved(result.items)).catch(() => toastError(t('utmTemplatesLoadFailed'))); }, []);

  const set = (key: keyof typeof utm, value: string) => {
    setUtm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const applyTemplate = (value: string) => {
    setTemplate(value);
    const next = TEMPLATES[value];
    if (!next) return;
    setUtm((current) => ({
      ...current,
      source: next.source,
      medium: next.medium,
      campaign: next.campaign,
    }));
    setError('');
  };

  const applySaved = (id: string) => { setSavedId(id); const item=saved.find((entry)=>entry.id===id); if(item){setTemplate('');setUtm(item.values);setError('');} };
  const saveCurrent = async () => { setBusy(true); try { const item=await createUtmTemplate(name,utm);setSaved((items)=>[...items,item]);setSavedId(item.id);setName('');success(t('utmTemplateSaved')); } catch(e){toastError(String(e));} finally{setBusy(false);} };
  const removeSaved = async () => { if(!savedId)return;setBusy(true);try{await deleteUtmTemplate(savedId);setSaved((items)=>items.filter((item)=>item.id!==savedId));setSavedId('');success(t('utmTemplateDeleted'));}catch(e){toastError(String(e));}finally{setBusy(false);} };

  const apply = () => {
    try {
      if (!/^https?:\/\//i.test(longUrl.trim())) {
        setError(t('validDestinationFirst'));
        return;
      }

      const nextUrl = appendUtmParams(longUrl.trim(), {
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        utm_term: utm.term,
        utm_content: utm.content,
      });
      onApply(nextUrl);
      setError('');
    } catch {
      setError(t('validDestinationFirst'));
    }
  };

  return (
    <div className="space-y-3 border-t border-slate-800 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">{t('utmTemplate')}</h2>
          <p className="text-xs text-slate-500">{t('utmHint')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<LinkIcon size={14} />}
          onClick={apply}
          disabled={disabled}
        >
          {t('apply')}
        </Button>
      </div>

      <Select
        label={t('template')}
        value={template}
        onChange={(e) => applyTemplate(e.target.value)}
        disabled={disabled}
      >
        <option value="">{t('custom')}</option>
        <option value="newsletter">{t('newsletter')}</option>
        <option value="social">{t('social')}</option>
        <option value="ads">{t('paidAds')}</option>
        <option value="affiliate">{t('affiliate')}</option>
      </Select>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={savedId} onChange={(e) => applySaved(e.target.value)} disabled={disabled}><option value="">{t('savedUtmTemplates')}</option>{saved.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Button type="button" variant="danger" size="sm" icon={<Trash2 size={14}/>} disabled={disabled||!savedId} loading={busy} onClick={removeSaved}>{t('deleteTemplate')}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="utm_source"
          value={utm.source}
          onChange={(e) => set('source', e.target.value)}
          disabled={disabled}
        />
        <Input
          label="utm_medium"
          value={utm.medium}
          onChange={(e) => set('medium', e.target.value)}
          disabled={disabled}
        />
        <Input
          label="utm_campaign"
          value={utm.campaign}
          onChange={(e) => set('campaign', e.target.value)}
          disabled={disabled}
        />
        <Input
          label="utm_term"
          value={utm.term}
          onChange={(e) => set('term', e.target.value)}
          disabled={disabled}
        />
      </div>

      <Input
        label="utm_content"
        value={utm.content}
        onChange={(e) => set('content', e.target.value)}
        disabled={disabled}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input placeholder={t('utmTemplateName')} maxLength={50} value={name} onChange={(e)=>setName(e.target.value)} disabled={disabled}/>
        <Button type="button" variant="secondary" size="sm" icon={<Save size={14}/>} disabled={disabled||!name.trim()||saved.length>=20} loading={busy} onClick={saveCurrent}>{t('saveTemplate')}</Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
