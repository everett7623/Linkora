import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { bulkCreateLinks, type CreateLinkPayload } from '../api/links';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === ',' && !quoted) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  parts.push(current.trim());
  return parts;
}

function parseLine(line: string): CreateLinkPayload | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = parseCsvLine(trimmed);
  const [longUrl, slug, title, tags] = parts;
  if (!longUrl) return null;

  return {
    long_url: longUrl,
    slug: slug || undefined,
    title: title || undefined,
    tags: tags ? tags.split(/[|;]/).map((tag) => tag.trim()).filter(Boolean) : undefined,
  };
}

export function BulkCreateLinks() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof bulkCreateLinks>> | null>(null);

  const rows = useMemo(() => content.split('\n').map(parseLine).filter((row): row is CreateLinkPayload => row !== null), [content]);

  const handleSubmit = async () => {
    if (rows.length === 0) {
      error('Enter at least one link');
      return;
    }

    setLoading(true);
    try {
      const response = await bulkCreateLinks(rows);
      setResult(response);
      success(`Created ${response.success} links`);
    } catch (e) {
      error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Bulk Create Links</h1>
          <p className="text-sm text-slate-400 mt-0.5">Create up to 100 links from pasted rows</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <Textarea
          label="Rows"
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'https://example.com/page,my-slug,Title,tag1|tag2\nhttps://example.com/another,,Another title,marketing'}
          hint="CSV-style rows: long_url, slug, title, tags. Slug is optional; tags use | or ; between names."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{rows.length} parsed rows</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/links')}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} loading={loading} icon={<PlusCircle size={16} />}>
              Create Links
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-slate-300">Total: {result.total}</span>
            <span className="text-emerald-400">Created: {result.success}</span>
            <span className="text-red-400">Failed: {result.failed}</span>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-slate-800">
            {result.results.map((row) => (
              <div key={row.index} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-mono text-slate-500">#{row.index + 1}</span>
                {row.status === 'created' ? (
                  <span className="flex-1 text-brand-400">/{row.slug}</span>
                ) : (
                  <span className="flex-1 text-red-400">{row.error}</span>
                )}
                <span className={row.status === 'created' ? 'text-emerald-400' : 'text-red-400'}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
