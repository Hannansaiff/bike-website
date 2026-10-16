/**
 * Thin fetch wrapper around the FastAPI backend.
 * Every response is the envelope { success, data, meta, message }.
 * Errors are normalised into ApiError with optional per-field messages.
 */
import { storage } from './storage';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error', fields = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function buildQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qs.append(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request(method, path, { params, body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // Demo-only identity hints (see README – not real security)
  const admin = storage.get('rz_admin_session');
  if (admin?.user?.name) headers['X-Demo-Actor'] = admin.user.name;
  const customer = storage.get('rz_customer_session');
  if (customer?.token) headers.Authorization = `Bearer ${customer.token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(
      'Cannot reach the showroom server. Make sure the FastAPI backend is running on port 8000.',
      { code: 'network_error' }
    );
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || json?.success === false) {
    const e = json?.error || {};
    throw new ApiError(e.message || `Request failed (${res.status})`, {
      status: res.status,
      code: e.code,
      fields: e.details?.fields || {},
    });
  }
  return { data: json?.data, meta: json?.meta || null, message: json?.message || '' };
}

export const api = {
  get: (path, params, opts) => request('GET', path, { params, ...opts }),
  post: (path, body, params) => request('POST', path, { body, params }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
};
