import { useAppStore } from '@/store/useAppStore';

import { API_URL } from '@/lib/env';

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, opts: { status: number; code?: string; retryAfterSeconds?: number }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function buildHeaders(options?: RequestInit): Record<string, string> {
  const token = useAppStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge any custom headers from options
  if (options?.headers) {
    const incoming = options.headers;
    if (incoming instanceof Headers) {
      incoming.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(incoming)) {
      incoming.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, incoming);
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function readJsonSafely(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function parseRetryAfterSeconds(res: Response): number | undefined {
  const raw = res.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;
  return undefined;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers = buildHeaders(options);

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  if (!options?.method || options.method === 'GET') {
    defaultOptions.cache = 'no-store';
  }

  const res = await fetch(`${API_URL}${endpoint}`, defaultOptions);

  const data = await readJsonSafely(res);

  if (!res.ok) {
    const retryAfterSeconds = res.status === 429 ? parseRetryAfterSeconds(res) : undefined;
    const code = data?.error || data?.code;
    const message =
      data?.message ||
      (res.status === 429 ? 'Too many requests. Please try again shortly.' : null) ||
      'An error occurred while fetching data';

    throw new ApiError(message, { status: res.status, code, retryAfterSeconds });
  }

  return data.data; // Our backend wraps responses in { success, data, message }
}

export async function fetchPaginatedApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const headers = buildHeaders(options);

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  if (!options?.method || options.method === 'GET') {
    defaultOptions.cache = 'no-store';
  }

  const res = await fetch(`${API_URL}${endpoint}`, defaultOptions);

  const data = await readJsonSafely(res);

  if (!res.ok) {
    const retryAfterSeconds = res.status === 429 ? parseRetryAfterSeconds(res) : undefined;
    const code = data?.error || data?.code;
    const message =
      data?.message ||
      (res.status === 429 ? 'Too many requests. Please try again shortly.' : null) ||
      'An error occurred while fetching data';

    throw new ApiError(message, { status: res.status, code, retryAfterSeconds });
  }

  return { data: data.data, meta: data.meta };
}
