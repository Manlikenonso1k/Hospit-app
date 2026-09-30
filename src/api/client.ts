import { config } from '@/config';
import { useAuthStore } from '@/store/authStore';

export class ApiError extends Error {
  status: number;
  /** Laravel validation bag: { field: [messages] }. */
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** First human-readable validation message, if any. */
  firstError(): string | undefined {
    if (!this.errors) return undefined;
    const first = Object.values(this.errors)[0];
    return Array.isArray(first) ? first[0] : undefined;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip attaching the bearer token (login, health). */
  public?: boolean;
};

/**
 * Single entry point for every API call. Attaches the Sanctum bearer token,
 * sends/parses JSON, and normalises Laravel's 422 validation bag and 401 into a
 * typed ApiError. A 401 clears the stored token so the app falls back to Welcome.
 */
export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, public: isPublic = false } = options;
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!isPublic && token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, 'Network unreachable. Check your connection and the API address.');
  }

  if (response.status === 401 && !isPublic) {
    await useAuthStore.getState().clear();
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && (payload.message as string)) ??
      `Request failed (${response.status}).`;
    throw new ApiError(response.status, message, payload?.errors);
  }

  return payload as T;
}
