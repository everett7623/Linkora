import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  previewImport, confirmImport, listImportJobs,
  exportLinksCSV, exportLinksJSON, exportBackup,
  downloadImportReport,
} from '../api/importExport';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import type { ImportJob } from '@linkora/shared';
import dayjs from 'dayjs';

export function ImportExport() {
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [filename, setFilename] = useState('');
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewImport>> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const hasImportableLinks = (preview?.valid ?? 0) > 0;

  const loadJobs = () => {
    listImportJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string ?? '');
    reader.readAsText(file);
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!content.trim()) { error('Please select a file or paste content'); return; }
    setPreviewing(true);
    try {
      const result = await previewImport(content, source || undefined);
      setPreview(result);
      setShowPreview(true);
    } catch (e) {
      error(String(e));
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    if (!hasImportableLinks) {
      error('No importable links found. Existing slugs are skipped by default.');
      return;
    }
    setConfirming(true);
    try {
      const result = await confirmImport(content, source || undefined, filename || undefined);
      success(`Import complete: ${result.success} imported, ${result.skipped} skipped, ${result.failed} failed`);
      setPreview(null);
      setContent('');
      setFilename('');
      if (fileRef.current) fileRef.current.value = '';
      loadJobs();
    } catch (e) {
      error(String(e));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Import / Export</h1>
        <p className="text-sm text-slate-400 mt-0.5">Import links from Shlink or CSV/JSON files, export your data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Upload size={16} className="text-brand-400" /> Import Links
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Source Format (optional)</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Auto-detect</option>
              <option value="shlink">Shlink (JSON / JSONL / CSV)</option>
              <option value="generic_csv">Generic CSV</option>
              <option value="generic_json">Generic JSON</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Upload File</label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-brand-500 transition-colors bg-slate-950">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <FileText size={24} />
                <span className="text-sm">{filename || 'Click to upload .json, .csv, .jsonl'}</span>
              </div>
              <input ref={fileRef} type="file" accept=".json,.csv,.jsonl,.txt" className="hidden" onChange={onFileChange} />
            </label>
          </div>

          {content && (
            <p className="text-xs text-slate-500">{content.length.toLocaleString()} chars loaded from {filename || 'input'}</p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePreview} loading={previewing} disabled={!content}>
              Preview
            </Button>
            {preview && (
              <Button onClick={handleConfirm} loading={confirming} disabled={!hasImportableLinks}>
                {hasImportableLinks ? `Import ${preview.valid} Links` : 'No Links to Import'}
              </Button>
            )}
          </div>

          {/* Preview Summary */}
          {preview && (
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 text-sm font-medium text-slate-200"
              >
                <span>Preview: {preview.total} items found</span>
                {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showPreview && (
                <div className="p-3 space-y-1.5 text-xs max-h-60 overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-700 text-slate-400">
                    <span>✅ Valid: {preview.valid}</span>
                    <span>⚠️ Conflicts: {preview.conflicts}</span>
                    <span>❌ Invalid: {preview.invalid}</span>
                  </div>
                  {!hasImportableLinks && (
                    <p className="py-1 text-slate-400">
                      No links will be imported. Conflicting slugs already exist and are skipped by default.
                    </p>
                  )}
                  {preview.preview.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 py-1 ${item._valid && !item._conflict ? 'text-slate-300' : 'text-red-400'}`}>
                      {item._valid && !item._conflict ? <CheckCircle size={12} className="text-emerald-500 shrink-0" /> : <AlertCircle size={12} className="shrink-0" />}
                      <span className="font-mono">/{item.slug}</span>
                      {item._conflict && <span className="text-yellow-500">(conflict)</span>}
                      {item._errors.length > 0 && <span className="text-red-400">— {item._errors[0]}</span>}
                    </div>
                  ))}
                  {preview.total > 200 && <p className="text-slate-500 pt-1">… and {preview.total - 200} more</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Download size={16} className="text-emerald-400" /> Export Data
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-200">Links CSV</p>
                <p className="text-xs text-slate-500">All links in CSV format</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportLinksCSV().catch((e) => error(String(e)))}>
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-200">Links JSON</p>
                <p className="text-xs text-slate-500">All links in JSON format</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportLinksJSON().catch((e) => error(String(e)))}>
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-200">Full Backup</p>
                <p className="text-xs text-slate-500">Links + tags + settings in JSON</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportBackup().catch((e) => error(String(e)))}>
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Import History</h2>
        {jobsLoading ? (
          <div className="flex justify-center py-6"><div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" /></div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No imports yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Source</th>
                  <th className="text-left px-3 py-2">File</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-right px-3 py-2">Success</th>
                  <th className="text-right px-3 py-2">Skipped</th>
                  <th className="text-right px-3 py-2">Failed</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {jobs.map((job) => (
                  <tr key={job.id} className="text-slate-300">
                    <td className="px-3 py-2 text-xs text-slate-500">{dayjs(job.created_at).format('MMM D HH:mm')}</td>
                    <td className="px-3 py-2">{job.source}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 truncate max-w-32">{job.filename ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{job.total_count}</td>
                    <td className="px-3 py-2 text-right text-emerald-400">{job.success_count}</td>
                    <td className="px-3 py-2 text-right text-yellow-400">{job.skipped_count}</td>
                    <td className="px-3 py-2 text-right text-red-400">{job.failed_count}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {job.report && (
                        <button
                          onClick={() => downloadImportReport(job.id, job.created_at.slice(0, 10)).catch((e) => error(String(e)))}
                          className="text-xs text-brand-400 hover:text-brand-300"
                        >
                          CSV
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
