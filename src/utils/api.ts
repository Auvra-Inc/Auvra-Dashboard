const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

async function fetchJson(path: string, options: RequestInit = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err: any = new Error(data?.message || res.statusText || 'API error');
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// Authentication
export const auth = {
  login: (payload: { email: string; password: string }) => fetchJson('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  verify2fa: (payload: { token: string; otp: string }) => fetchJson('/api/v1/auth/verify-2fa', { method: 'POST', body: JSON.stringify(payload) }),
  refreshToken: () => fetchJson('/api/v1/auth/refresh-token', { method: 'POST' }),
  logout: () => fetchJson('/api/v1/auth/logout', { method: 'POST' }),
};

// Users
export const users = {
  list: (query = '') => fetchJson(`/api/v1/users${query ? `?${query}` : ''}`),
  get: (id: string) => fetchJson(`/api/v1/users/${id}`),
  updateRole: (id: string, body: any) => fetchJson(`/api/v1/users/${id}/role`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => fetchJson(`/api/v1/users/${id}`, { method: 'DELETE' }),
};

// Invitations
export const invitations = {
  create: (body: any) => fetchJson('/api/v1/invitations', { method: 'POST', body: JSON.stringify(body) }),
  list: () => fetchJson('/api/v1/invitations'),
  verify: (token: string) => fetchJson(`/api/v1/invitations/verify/${token}`),
  accept: (body: any) => fetchJson('/api/v1/invitations/accept', { method: 'POST', body: JSON.stringify(body) }),
  revoke: (id: string) => fetchJson(`/api/v1/invitations/${id}`, { method: 'DELETE' }),
};

// RBAC
export const roles = {
  list: () => fetchJson('/api/v1/roles'),
  create: (body: any) => fetchJson('/api/v1/roles', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => fetchJson(`/api/v1/roles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => fetchJson(`/api/v1/roles/${id}`, { method: 'DELETE' }),
};

// Audit
export const audit = {
  list: (query = '') => fetchJson(`/api/v1/audit-logs${query ? `?${query}` : ''}`),
  get: (id: string) => fetchJson(`/api/v1/audit-logs/${id}`),
};

// Settings
export const settings = {
  get: () => fetchJson('/api/v1/settings'),
  update: (body: any) => fetchJson('/api/v1/settings', { method: 'PUT', body: JSON.stringify(body) }),
};

// Dashboard / Third-party aggregates
export const dashboard = {
  metrics: () => fetchJson('/api/v1/dashboard/metrics'),
  revenue: () => fetchJson('/api/v1/dashboard/revenue'),
  transactions: () => fetchJson('/api/v1/dashboard/transactions'),
  kyc: () => fetchJson('/api/v1/dashboard/kyc'),
};

export default { fetchJson, auth, users, invitations, roles, audit, settings, dashboard };
