import { normalizeApiBase } from '../utils/apiBase';
import {
  readBrowserSetting,
  removeBrowserSetting,
  writeBrowserSetting,
} from '../utils/browserStorage';
import { IS_PUBLIC_DEMO } from '../config/demo';
import { DEMO_READ_ONLY_ERROR, isReadOnlyRequest } from '../utils/demoMode';

export { normalizeApiBase } from '../utils/apiBase';

const BUILD_API_BASE = normalizeApiBase(
  import.meta.env.VITE_LINKETRY_API_URL ?? import.meta.env.VITE_API_URL ?? ''
);
const API_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiBaseOverride(): string {
  if (IS_PUBLIC_DEMO) return '';
  try {
    return normalizeApiBase(readBrowserSetting('apiBase') ?? '');
  } catch {
    return '';
  }
}

export function getBuildApiBase(): string {
  return BUILD_API_BASE;
}

export function getApiBase(): string {
  return IS_PUBLIC_DEMO ? BUILD_API_BASE : getApiBaseOverride() || BUILD_API_BASE;
}

export function setApiBaseOverride(value: string): string {
  if (IS_PUBLIC_DEMO) return BUILD_API_BASE;
  const normalized = normalizeApiBase(value);
  try {
    if (normalized) {
      writeBrowserSetting('apiBase', normalized);
    } else {
      removeBrowserSetting('apiBase');
    }
  } catch {
    // Ignore storage failures so login can still attempt the build-time API URL.
  }
  return normalized;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  apiBase = getApiBase(),
  timeoutMs = API_TIMEOUT_MS
): Promise<T> {
  if (IS_PUBLIC_DEMO && !isReadOnlyRequest(options.method)) {
    throw new ApiError(403, DEMO_READ_ONLY_ERROR);
  }

  const token = readBrowserSetting('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token && !IS_PUBLIC_DEMO) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(`${apiBase}${path}`, { ...options, headers }, timeoutMs);

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, options: RequestInit = {}): Promise<T> {
  const result = await apiFetch<{ success: boolean; data: T }>(path, {
    cache: 'no-store',
    ...options,
  });
  return result.data;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  timeoutMs = API_TIMEOUT_MS
): Promise<T> {
  const result = await apiFetch<{ success: boolean; data: T }>(
    path,
    {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    getApiBase(),
    timeoutMs
  );
  return result.data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const result = await apiFetch<{ success: boolean; data: T }>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return result.data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const result = await apiFetch<{ success: boolean; data: T }>(path, {
    method: 'DELETE',
  });
  return result.data;
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = readBrowserSetting('token');
  const headers: Record<string, string> = {};
  if (token && !IS_PUBLIC_DEMO) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${getApiBase()}${path}`, { headers });
  if (!res.ok) throw new ApiError(res.status, `Download failed: HTTP ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
