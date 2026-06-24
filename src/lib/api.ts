// Helper for authenticated fetch calls
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function apiGet(url: string): Promise<Response> {
  return apiFetch(url, { method: 'GET' });
}

export async function apiPost(url: string, data?: unknown): Promise<Response> {
  return apiFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut(url: string, data?: unknown): Promise<Response> {
  return apiFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete(url: string): Promise<Response> {
  return apiFetch(url, { method: 'DELETE' });
}
