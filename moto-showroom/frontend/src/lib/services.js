/**
 * API service layer – the only place that knows endpoint paths.
 * Components call these functions; swapping the backend later only touches here.
 */
import { api } from './api';

const collection = (base) => ({
  list: (params) => api.get(base, params),
  get: (id) => api.get(`${base}/${id}`),
  create: (body) => api.post(base, body),
  update: (id, body) => api.put(`${base}/${id}`, body),
  remove: (id) => api.del(`${base}/${id}`),
  reorder: (ids) => api.post(`${base}/reorder`, { ids }),
});

export const bikesApi = {
  ...collection('/bikes'),
  get: (idOrSlug, admin = false) => api.get(`/bikes/${idOrSlug}`, admin ? { admin: true } : undefined),
  related: (idOrSlug, limit = 4) => api.get(`/bikes/${idOrSlug}/related`, { limit }),
  compare: (ids) => api.get('/bikes/compare', { ids }),
  filters: () => api.get('/bikes/meta/filters'),
  view: (id) => api.post(`/bikes/${id}/view`),
};

export const categoriesApi = collection('/categories');
export const brandsApi = collection('/brands');
export const galleryApi = collection('/gallery');
export const bannersApi = collection('/banners');
export const testimonialsApi = collection('/testimonials');
export const faqsApi = collection('/faqs');
export const offersApi = collection('/offers');
export const customersApi = collection('/customers');

export const staffApi = {
  ...collection('/staff'),
  roles: () => api.get('/staff/roles'),
};

export const enquiriesApi = collection('/enquiries');

export const bookingsApi = {
  ...collection('/bookings'),
  meta: () => api.get('/bookings/meta'),
  track: (reference, phone) => api.get('/bookings/track', { reference, phone }),
  setStatus: (id, status, note = '') => api.post(`/bookings/${id}/status`, { status, note }),
  addNote: (id, text) => api.post(`/bookings/${id}/notes`, { text }),
  history: (params) => api.get('/bookings/history', params),
};

export const inventoryApi = {
  summary: (params) => api.get('/inventory/summary', params),
  units: (params) => api.get('/inventory/units', params),
  addStock: (body) => api.post('/inventory/units', body),
  updateUnit: (id, body) => api.put(`/inventory/units/${id}`, body),
  setStatus: (id, body) => api.post(`/inventory/units/${id}/status`, body),
  removeUnit: (id) => api.del(`/inventory/units/${id}`),
  history: (params) => api.get('/inventory/history', params),
};

export const salesApi = {
  list: (params) => api.get('/sales', params),
  get: (id) => api.get(`/sales/${id}`),
  meta: () => api.get('/sales/meta'),
  create: (body) => api.post('/sales', body),
  update: (id, body) => api.put(`/sales/${id}`, body),
  invoice: (id) => api.get(`/sales/${id}/invoice`),
  addPayment: (id, body) => api.post(`/sales/${id}/payments`, body),
  reverse: (id, reason) => api.post(`/sales/${id}/reverse`, { reason }),
};

export const contentApi = {
  get: () => api.get('/content'),
  updateSection: (section, value) => api.put(`/content/${section}`, value),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (body) => api.put('/settings', body),
};

export const analyticsApi = {
  dashboard: (params) => api.get('/dashboard/stats', params),
  report: (kind, params) => api.get(`/reports/${kind}`, params),
  activity: (params) => api.get('/activity-logs', params),
};

export const authApi = {
  adminLogin: (body) => api.post('/auth/admin/login', body),
  customerLogin: (body) => api.post('/auth/customer/login', body),
  customerRegister: (body) => api.post('/auth/customer/register', body),
  accountOverview: () => api.get('/account/overview'),
  updateProfile: (body) => api.put('/account/profile', body),
};

export const systemApi = {
  health: () => api.get('/health'),
  resetDemo: () => api.post('/demo/reset'),
};
