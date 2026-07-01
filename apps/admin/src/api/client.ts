const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('linkora_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { error?: string };
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const result = await apiFetch<{ success: boolean; data: T }>(path);
  return result.data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const result = await apiFetch<{ success: boolean; data: T }>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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
  const token = localStorage.getItem('linkora_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
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
