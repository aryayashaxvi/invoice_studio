const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let token = localStorage.getItem('invoice_token');
export const setToken = (value) => { token = value; value ? localStorage.setItem('invoice_token', value) : localStorage.removeItem('invoice_token'); };
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed.');
  return body;
}
async function download(path, filename) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Download failed.'); }
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
export const api = { login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }), me: () => request('/auth/me'), companies: (all = false) => request(`/companies${all ? '?includeInactive=true' : ''}`), createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }), updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }), deactivateCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }), organizationSettings: () => request('/organization-settings'), updateOrganizationSettings: (data) => request('/organization-settings', { method: 'PUT', body: JSON.stringify(data) }), invoices: () => request('/invoices'), createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }), downloadInvoice: (invoice) => download(`/invoices/${invoice._id}/download`, invoice.generatedFile), users: () => request('/auth/users'), createUser: (data) => request('/auth/users', { method: 'POST', body: JSON.stringify(data) }), updateUserStatus: (id, isActive) => request(`/auth/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }) };
