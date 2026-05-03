const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'An error occurred while fetching data');
  }

  return data.data; // Our backend wraps responses in { success, data, message }
}

export async function fetchPaginatedApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'An error occurred while fetching data');
  }

  return { data: data.data, meta: data.meta };
}
