import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import type { Link } from '@linkora/shared';
import { X, Download } from 'lucide-react';

interface Props {
  link: Link;
  onClose: () => void;
}

export default function QRCodeDialog({ link, onClose }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(256);

  useEffect(() => {
    setLoading(true);
    apiFetch<string>(`/api/links/${link.id}/qr?size=${size}&format=json`, {
      method: 'GET',
    })
      .then(() => {
        // The response is wrapped in { success, data: { url, svg } }
      })
      .catch(() => {});

    // Fetch SVG directly
    const token = localStorage.getItem('linkora_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/links/${link.id}/qr?size=${size}`, { headers })
      .then((res) => res.text())
      .then((text) => {
        setSvg(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [link.id, size]);

  function handleDownload() {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${link.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">QR Code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 px-5 py-6">
          <p className="text-sm text-slate-400">/{link.slug}</p>
          {loading ? (
            <div className="flex h-64 w-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : svg ? (
            <div
              className="rounded-lg bg-white p-4"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="text-sm text-red-400">Failed to generate QR code</p>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Size:</label>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value={128}>128px</option>
              <option value={256}>256px</option>
              <option value={512}>512px</option>
            </select>
            <button
              onClick={handleDownload}
              disabled={!svg}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Download SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
