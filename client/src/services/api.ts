const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: body.error || 'Request failed',
        code: body.code || 'INTERNAL_ERROR',
      };
    }

    return {
      ok: true,
      data: body as T,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error — please check your connection',
      code: 'NETWORK_ERROR',
    };
  }
}
