import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green:  'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  red:    'bg-red-500/15 text-red-400 ring-red-500/20',
  yellow: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/20',
  blue:   'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  gray:   'bg-slate-500/15 text-slate-400 ring-slate-500/20',
  purple: 'bg-purple-500/15 text-purple-400 ring-purple-500/20',
};

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'green',
    disabled: 'red',
    expired: 'yellow',
    archived: 'gray',
  };
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>;
}
