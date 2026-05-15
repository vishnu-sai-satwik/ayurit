import { getAccessToken, clearSession } from './session';
import { logger } from './logger';

const API_BASE_CACHE_KEY = 'ayurit.apiBaseUrl';
const DEV_API_PORTS = [4000, 4001, 4002, 4003, 4004, 4005, 5000];
const DEV_API_TIMEOUT_MS = 800;

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

let resolvedApiBasePromise = null;

const normalizeBaseUrl = (value) => String(value || '').replace(/\/$/, '');

const normalizeApiRoot = (value) => {
  const baseUrl = normalizeBaseUrl(value);
  if (!baseUrl) {
    return '/api';
  }

  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const toHealthProbeBase = (baseUrl) => {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  if (!normalizedBase) {
    return '';
  }

  return normalizedBase.endsWith('/api')
    ? normalizedBase.slice(0, -4)
    : normalizedBase;
};

const pingApi = async (baseUrl) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEV_API_TIMEOUT_MS);
  const healthProbeBase = toHealthProbeBase(baseUrl);

  try {
    const response = await fetch(`${healthProbeBase}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const resolveApiBaseUrl = async () => {
  if (import.meta.env.VITE_API_URL) {
    return normalizeApiRoot(import.meta.env.VITE_API_URL);
  }

  if (typeof window === 'undefined') {
    return normalizeApiRoot(API_BASE);
  }

  const cached = window.localStorage.getItem(API_BASE_CACHE_KEY);
  if (cached && (await pingApi(cached))) {
    return normalizeApiRoot(cached);
  }

  if (!resolvedApiBasePromise) {
    resolvedApiBasePromise = (async () => {
      if (!import.meta.env.DEV) {
        return normalizeBaseUrl(API_BASE);
      }

      const browserHost = window.location.hostname;
      const browserProtocol = window.location.protocol;

      for (const port of DEV_API_PORTS) {
        const candidate = `${browserProtocol}//${browserHost}:${port}`;
        if (await pingApi(candidate)) {
          window.localStorage.setItem(API_BASE_CACHE_KEY, candidate);
          logger.debug('API', 'Resolved dev backend base', { baseUrl: candidate });
          return normalizeApiRoot(candidate);
        }
      }

      return normalizeApiRoot(API_BASE);
    })();
  }

  return resolvedApiBasePromise;
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const emitToast = (type, message) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ayurit:toast', { detail: { type, message } }));
};

const isRetryableStatus = (status) => status >= 500 || status === 408 || status === 429;

export async function apiRequest(path, options = {}) {
  const retries = Number.isInteger(options.retries) ? Math.max(0, options.retries) : 1;
  const retryDelay = Number.isFinite(options.retryDelay) ? Math.max(0, options.retryDelay) : 350;
    const suppressToast = Boolean(options.suppressToast);
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = null;
  const isDev = import.meta.env.DEV;
  const baseUrl = await resolveApiBaseUrl();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (isDev && attempt > 0) {
        logger.debug('API', `Retry attempt ${attempt}`, { path, attempt });
      }
      
      // Avoid passing internal flags like `suppressToast` to fetch
      const fetchOptions = { ...options };
      delete fetchOptions.suppressToast;

      const response = await fetch(`${baseUrl}${path}`, {
        ...fetchOptions,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        const error = new Error(data?.message || 'Request failed');
        error.status = response.status;
        error.data = data;

        if (response.status === 401) {
          clearSession();
            if (!suppressToast) emitToast('error', 'Your session expired. Please login again.');
          throw error;
        }

        if (attempt < retries && isRetryableStatus(response.status)) {
          lastError = error;
          if (isDev) {
            logger.debug('API', `Retryable error, will retry`, { path, status: response.status, attempt });
          }
          await wait(retryDelay * (attempt + 1));
          continue;
        }

        if (!suppressToast) emitToast('error', data?.message || 'Request failed');
        throw error;
      }

      return data;
    } catch (err) {
      lastError = err;

      if (attempt < retries && (!err?.status || isRetryableStatus(err.status))) {
        await wait(retryDelay * (attempt + 1));
        continue;
      }

      if (!err?.status) {
          if (!suppressToast) {
           emitToast('error', err?.message || 'Network error');
          }
      }

      throw err;
    }
  }

  throw lastError || new Error('Request failed');
}
