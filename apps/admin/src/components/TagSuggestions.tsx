import React from 'react';
import type { Tag } from '@linkora/shared';

function parseTags(value: string): string[] {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function addTagToValue(value: string, tagName: string): string {
  const tags = parseTags(value);
  if (tags.includes(tagName)) return value;
  return [...tags, tagName].join(', ');
}

export function TagSuggestions({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (tags.length === 0) return null;

  const selected = new Set(parseTags(value));

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 24).map((tag) => {
        const active = selected.has(tag.name);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onChange(addTagToValue(value, tag.name))}
            disabled={active}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-brand-500 hover:text-slate-100 disabled:cursor-default disabled:border-brand-500/40 disabled:bg-brand-500/10 disabled:text-brand-300"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tag.color ?? '#38bdf8' }}
            />
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
