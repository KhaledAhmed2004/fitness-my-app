/**
 * MENTOR: Single HTTP gateway for the app.
 * - Parses backend envelope { success, statusCode, message, data, errorMessages }
 * - Timeout via AbortController
 * - Single-flight refresh on 401 for authenticated calls
 */

import { ENV } from '@/constants/env';
import { ApiError, type ApiFieldError } from '@/lib/api-error';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/services/token-storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiEnvelope<T> = {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  errorMessages?: ApiFieldError[];
};

type RequestOptions = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  /** Attach Bearer access token */
  auth?: boolean;
  /** Skip 401→refresh retry (used by refresh itself) */
  skipRefresh?: boolean;
  timeoutMs?: number;
};

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${ENV.apiBaseUrl}${normalized}`;
}

function toFieldErrors(raw: unknown): ApiFieldError[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const message = typeof row.message === 'string' ? row.message : null;
      if (!message) return null;
      return {
        path: typeof row.path === 'string' ? row.path : '',
        message,
      };
    })
    .filter((x): x is ApiFieldError => !!x);
}

function detectPending(message: string, statusCode: number) {
  const lower = message.toLowerCase();
  if (lower.includes('pending verification') || lower.includes('verify your email')) {
    return true;
  }
  return statusCode === 403 && lower.includes('verify');
}

async function parseJson(res: Response): Promise<ApiEnvelope<unknown> | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const data = await apiRequest<{ accessToken?: string; refreshToken?: string }>({
        method: 'POST',
        path: '/api/v1/auth/refresh-token',
        body: { refreshToken },
        skipRefresh: true,
      });

      if (!data?.accessToken) return false;
      await saveTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return true;
    } catch {
      await clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>({
  method = 'GET',
  path,
  body,
  auth = false,
  skipRefresh = false,
  timeoutMs = 15000,
}: RequestOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (auth) {
      const accessToken = await getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    let res: Response;
    try {
      console.log(`\n[API REQUEST] 🚀 ${method.toUpperCase()} ${buildUrl(path)}`);
      if (body !== undefined) {
        console.log(`[API BODY] 📦`, JSON.stringify(body, null, 2));
      }

      res = await fetch(buildUrl(path), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      console.log(`[API STATUS] ✅ ${res.status}`);
    } catch (err: any) {
      const errMsg = err?.message || String(err || '');
      const isAbort =
        err?.name === 'AbortError' ||
        errMsg.toLowerCase().includes('cancel') ||
        errMsg.toLowerCase().includes('abort');

      if (isAbort) {
        console.log(`[API CANCELED] ⏹️ ${method} ${path}`);
        throw new ApiError({
          message: 'Request timed out or was canceled.',
          statusCode: 499,
        });
      }

      console.warn(`[API NETWORK WARN] ⚠️ ${method} ${path}: ${errMsg}`);
      throw new ApiError({
        message: 'Unable to reach the server. Is the API running?',
        statusCode: 0,
      });
    }

    if (res.status === 401 && auth && !skipRefresh) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequest<T>({
          method,
          path,
          body,
          auth,
          skipRefresh: true,
          timeoutMs,
        });
      }
    }

    const envelope = await parseJson(res);
    
    // Log the actual response payload from backend
    console.log(`[API RESPONSE] 📄`, JSON.stringify(envelope, null, 2));

    const message =
      envelope?.message ||
      (res.ok ? 'Success' : `Request failed (${res.status})`);
    const fieldErrors = toFieldErrors(envelope?.errorMessages);
    const statusCode = envelope?.statusCode ?? res.status;

    if (!res.ok || envelope?.success === false) {
      throw new ApiError({
        message,
        statusCode,
        fieldErrors,
        code: detectPending(message, statusCode) ? 'PENDING_VERIFICATION' : undefined,
      });
    }

    return (envelope?.data as T) ?? (undefined as T);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Standard ApiClient Class for intuitive method chaining
 */
class ApiClient {
  public get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return apiRequest<T>({ method: 'GET', path, ...options });
  }

  public post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T> {
    return apiRequest<T>({ method: 'POST', path, body, ...options });
  }

  public put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T> {
    return apiRequest<T>({ method: 'PUT', path, body, ...options });
  }

  public patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'path' | 'body'>): Promise<T> {
    return apiRequest<T>({ method: 'PATCH', path, body, ...options });
  }

  public delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'path'>): Promise<T> {
    return apiRequest<T>({ method: 'DELETE', path, ...options });
  }
}

export const api = new ApiClient();
export default api;

