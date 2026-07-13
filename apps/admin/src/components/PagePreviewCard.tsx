import React from 'react';
import type { PagePreviewResult } from '../api/metadata';
import { Eye } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
export function PagePreviewCard({ preview }: { preview: PagePreviewResult | null }) { const { t } = useLocale(); if (!preview) return null; return <div className="overflow-hidden border border-slate-800 bg-slate-950"><div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400"><Eye size={14}/>{t('openGraphPreview')}</div>{preview.image && <img src={preview.image} alt="" className="h-40 w-full object-cover" loading="lazy" referrerPolicy="no-referrer"/>}<div className="space-y-1 p-4"><p className="font-semibold text-slate-100">{preview.title || t('noPreviewTitle')}</p>{preview.description && <p className="line-clamp-3 text-sm text-slate-400">{preview.description}</p>}<p className="truncate text-xs text-slate-600">{preview.final_url}</p></div></div>; }
