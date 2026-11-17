const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

let authToken = null;

export function setAuthToken(token) {
  authToken = typeof token === 'string' && token.trim() ? token : null;
}

export function clearAuthToken() {
  authToken = null;
}

export function getAuthToken() {
  return authToken;
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API URL is not configured. Set VITE_API_BASE_URL in your environment.');
  }

  const { headers = {}, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  const hasBody = requestOptions.body !== undefined && requestOptions.body !== null;
  if (hasBody && !(requestOptions.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (authToken) requestHeaders.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...requestOptions,
    headers: requestHeaders,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const message = body && typeof body === 'object' && body.error
      ? body.error
      : `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, {
    ...options,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  }),
  put: (path, body, options) => apiRequest(path, {
    ...options,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
