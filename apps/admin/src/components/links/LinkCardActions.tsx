import React from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Copy,
  ExternalLink,
  Pencil,
  Power,
  PowerOff,
  QrCode,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Link as LinkType } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';

export type LinkCardAction = 'archive' | 'delete' | 'disable' | 'enable' | 'restore';

interface LinkCardActionsProps {
  link: LinkType;
  shortUrl: string;
  isAdvanced: boolean;
  onCopy: (link: LinkType) => void;
  onShowQr: (link: LinkType) => void;
  onConfirmAction: (action: LinkCardAction, link: LinkType) => void;
}

const actionClass =
  'rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200';

function IconButton({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${actionClass} ${danger ? 'hover:text-red-400' : ''}`}
    >
      {children}
    </button>
  );
}

export function LinkCardActions({
  link,
  shortUrl,
  isAdvanced,
  onCopy,
  onShowQr,
  onConfirmAction,
}: LinkCardActionsProps) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <IconButton label={t('copy')} onClick={() => onCopy(link)}>
        <Copy size={14} />
      </IconButton>
      <a
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('open')}
        title={t('open')}
        className={actionClass}
      >
        <ExternalLink size={14} />
      </a>
      <IconButton label={t('qrCode')} onClick={() => onShowQr(link)}>
        <QrCode size={14} />
      </IconButton>
      {isAdvanced && (
        <Link
          to={`/analytics/links/${link.id}`}
          aria-label={t('analytics')}
          title={t('analytics')}
          className={actionClass}
        >
          <BarChart3 size={14} />
        </Link>
      )}
      <Link
        to={`/links/${link.id}/edit`}
        aria-label={t('edit')}
        title={t('edit')}
        className={actionClass}
      >
        <Pencil size={14} />
      </Link>
      {link.status === 'active' && (
        <IconButton label={t('disable')} onClick={() => onConfirmAction('disable', link)}>
          <PowerOff size={14} />
        </IconButton>
      )}
      {link.status === 'disabled' && (
        <IconButton label={t('enable')} onClick={() => onConfirmAction('enable', link)}>
          <Power size={14} />
        </IconButton>
      )}
      {isAdvanced &&
        (link.archived === 0 ? (
          <IconButton label={t('archive')} onClick={() => onConfirmAction('archive', link)}>
            <Archive size={14} />
          </IconButton>
        ) : (
          <IconButton label={t('restore')} onClick={() => onConfirmAction('restore', link)}>
            <RotateCcw size={14} />
          </IconButton>
        ))}
      <IconButton label={t('delete')} onClick={() => onConfirmAction('delete', link)} danger>
        <Trash2 size={14} />
      </IconButton>
    </div>
  );
}
