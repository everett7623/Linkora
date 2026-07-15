import React from 'react';
import { clsx } from 'clsx';
import type { MessageKey } from '../../i18n/messages';
import type { DisplayDensity } from '../../utils/displayPreferences';

const DENSITIES: DisplayDensity[] = ['comfortable', 'compact'];

interface DensitySelectorProps {
  label: string;
  value: DisplayDensity;
  onChange: (density: DisplayDensity) => void;
  translate: (key: MessageKey) => string;
}

export function DensitySelector({ label, value, onChange, translate }: DensitySelectorProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-300">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {DENSITIES.map((density) => (
          <button
            key={density}
            type="button"
            onClick={() => onChange(density)}
            aria-label={`${label}: ${translate(density)}`}
            aria-pressed={value === density}
            className={clsx(
              'rounded-lg border px-3 py-2 text-sm transition-colors',
              value === density
                ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
            )}
          >
            {translate(density)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
