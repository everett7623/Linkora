import React from 'react';
import { Globe2, KeyRound, ShieldAlert } from 'lucide-react';
import type { Link as LinkType } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { buildShortUrl } from '../../utils/shortUrl';
import {
  getEffectiveLinkStatus,
  hasMaxClicks,
  isLinkExpiredByClicks,
  isLinkExpiredByTime,
  parseLinkTags,
} from '../../utils/linkPresentation';
import { StatusBadge } from '../ui/Badge';
import { LinkCardActions, type LinkCardAction } from './LinkCardActions';

interface LinkCardGridProps {
  links: LinkType[];
  defaultDomain: string;
  isAdvanced: boolean;
  selectedIds: ReadonlySet<string>;
  onToggleSelected: (id: string) => void;
  onCopy: (link: LinkType) => void;
  onShowQr: (link: LinkType) => void;
  onConfirmAction: (action: LinkCardAction, link: LinkType) => void;
}

export function LinkCardGrid({
  links,
  defaultDomain,
  isAdvanced,
  selectedIds,
  onToggleSelected,
  onCopy,
  onShowQr,
  onConfirmAction,
}: LinkCardGridProps) {
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

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3" data-link-view="cards">
      {links.map((link) => {
        const tags = parseLinkTags(link.tags);
        const shortUrl = buildShortUrl(link, defaultDomain);
        const expiredByTime = isLinkExpiredByTime(link);
        const expiredByClicks = isLinkExpiredByClicks(link);
        return (
          <article
            key={link.id}
            aria-label={t('linkCardAria', { slug: link.slug })}
            className="flex min-w-0 flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
          >
            <div className="flex items-start gap-3">
              {isAdvanced && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(link.id)}
                  onChange={() => onToggleSelected(link.id)}
                  aria-label={t('selectLinkAria', { slug: link.slug })}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-600 focus:ring-brand-500"
                />
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-500">
                <Globe2 size={17} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-mono text-sm text-brand-400">/{link.slug}</span>
                  <StatusBadge status={getEffectiveLinkStatus(link)} />
                  {link.password_protected && (
                    <KeyRound size={13} aria-label={t('passwordProtected')} />
                  )}
                  {link.warning_enabled === 1 && (
                    <ShieldAlert
                      size={13}
                      className="text-yellow-500"
                      aria-label={t('safetyWarningEnabled')}
                    />
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-slate-600" title={shortUrl}>
                  {shortUrl}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {link.title && (
                <p className="truncate text-sm font-medium text-slate-200">{link.title}</p>
              )}
              <p className="truncate text-sm text-slate-400" title={link.long_url}>
                {link.long_url}
              </p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 border-y border-slate-800 py-3 text-xs">
              <div>
                <dt className="text-slate-600">{t('clicks')}</dt>
                <dd className="mt-0.5 font-medium text-slate-300">
                  {link.clicks.toLocaleString(locale)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600">{t('created')}</dt>
                <dd className="mt-0.5 text-slate-400">
                  {createdDateFormatter.format(new Date(link.created_at))}
                </dd>
              </div>
              {isAdvanced && (link.expires_at || hasMaxClicks(link)) && (
                <div className="col-span-2">
                  <dt className="text-slate-600">{t('limitsLabel')}</dt>
                  <dd
                    className={
                      expiredByTime || expiredByClicks
                        ? 'mt-0.5 text-yellow-400'
                        : 'mt-0.5 text-slate-400'
                    }
                  >
                    {link.expires_at
                      ? t('until', { date: limitDateFormatter.format(new Date(link.expires_at)) })
                      : ''}
                    {link.expires_at && hasMaxClicks(link) ? ' · ' : ''}
                    {hasMaxClicks(link)
                      ? `${link.clicks.toLocaleString(locale)} / ${Number(link.max_clicks).toLocaleString(locale)}`
                      : ''}
                  </dd>
                </div>
              )}
            </dl>

            <LinkCardActions
              link={link}
              shortUrl={shortUrl}
              isAdvanced={isAdvanced}
              onCopy={onCopy}
              onShowQr={onShowQr}
              onConfirmAction={onConfirmAction}
            />
          </article>
        );
      })}
    </div>
  );
}
