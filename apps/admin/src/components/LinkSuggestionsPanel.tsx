import React from 'react';
import { AlertTriangle, Check, Sparkles } from 'lucide-react';
import type { LinkSuggestionResult } from '@linkora/shared';
import { Button } from './ui/Button';

interface LinkSuggestionsPanelProps {
  suggestions: LinkSuggestionResult | null;
  onApplySlug: (slug: string) => void;
  onApplyTitle: (title: string) => void;
  onApplyDescription: (description: string) => void;
  onApplyTags: (tags: string[]) => void;
  onApplyAll: () => void;
}

export function LinkSuggestionsPanel({
  suggestions,
  onApplySlug,
  onApplyTitle,
  onApplyDescription,
  onApplyTags,
  onApplyAll,
}: LinkSuggestionsPanelProps) {
  if (!suggestions) return null;

  const hasContent = Boolean(
    suggestions.title ||
    suggestions.description ||
    suggestions.slugs.length > 0 ||
    suggestions.tags.length > 0
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles size={15} className="text-brand-400" />
          Suggestions
        </div>
        <Button size="sm" variant="secondary" icon={<Check size={14} />} onClick={onApplyAll} disabled={!hasContent}>
          Apply All
        </Button>
      </div>

      {suggestions.error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{suggestions.error}</span>
        </div>
      )}

      <div className="space-y-4">
        {suggestions.slugs.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Slugs</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slugs.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => onApplySlug(slug)}
                  className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200 transition-colors hover:border-brand-400 hover:bg-brand-500/20"
                >
                  {slug}
                </button>
              ))}
            </div>
          </div>
        )}

        {suggestions.title && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Title</p>
            <button
              type="button"
              onClick={() => onApplyTitle(suggestions.title!)}
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-slate-600"
            >
              {suggestions.title}
            </button>
          </div>
        )}

        {suggestions.description && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Description</p>
            <button
              type="button"
              onClick={() => onApplyDescription(suggestions.description!)}
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:border-slate-600"
            >
              {suggestions.description}
            </button>
          </div>
        )}

        {suggestions.tags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Tags</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onApplyTags([tag])}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600"
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onApplyTags(suggestions.tags)}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600"
              >
                Add all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
