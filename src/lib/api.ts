import { useAppStore } from '@/store/useAppStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

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

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers = buildHeaders(options);

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  // Add ISR revalidation (60s) for GET requests by default, unless explicitly overridden
  if (!options?.method || options.method === 'GET') {
    (defaultOptions as any).next = { revalidate: 60, ...(options as any)?.next };
  }

  const res = await fetch(`${API_URL}${endpoint}`, defaultOptions);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'An error occurred while fetching data');
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
    (defaultOptions as any).next = { revalidate: 60, ...(options as any)?.next };
  }

  const res = await fetch(`${API_URL}${endpoint}`, defaultOptions);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'An error occurred while fetching data');
  }

  return { data: data.data, meta: data.meta };
}
