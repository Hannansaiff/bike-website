/** Formatting helpers and shared label/colour maps. */

export const cn = (...classes) => classes.filter(Boolean).join(' ');

const pkr = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** Consistent PKR formatting everywhere: "PKR 1,150,000" */
export function formatPKR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `PKR ${pkr.format(Math.round(Number(value)))}`;
}

/** Compact PKR for charts/cards: "PKR 1.15M", "PKR 850K" */
export function formatPKRShort(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1e7) return `PKR ${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e6) return `PKR ${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `PKR ${Math.round(n / 1e3)}K`;
  return `PKR ${n}`;
}

export function formatNumber(n) {
  return pkr.format(Number(n) || 0);
}

export function formatDate(value, opts = {}) {
  if (!value) return '—';
  const d = typeof value === 'string' && value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${formatDate(value)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatTime(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} d ago`;
  return formatDate(value);
}

export function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

export const humanize = (s) => (s ? String(s).replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');

/* Status vocabularies → label + tone. Tones map to badge colours. */
export const STATUS = {
  availability: {
    available: ['Available', 'green'],
    reserved: ['Reserved', 'amber'],
    sold: ['Sold out', 'red'],
    out_of_stock: ['Out of stock', 'zinc'],
    discontinued: ['Discontinued', 'zinc'],
    upcoming: ['Upcoming', 'blue'],
  },
  booking: {
    pending: ['Pending', 'amber'],
    confirmed: ['Confirmed', 'blue'],
    contacted: ['Contacted', 'violet'],
    completed: ['Completed', 'green'],
    rejected: ['Rejected', 'red'],
    cancelled: ['Cancelled', 'zinc'],
  },
  payment: {
    unpaid: ['Unpaid', 'red'],
    partially_paid: ['Partially paid', 'amber'],
    paid: ['Paid', 'green'],
    refunded: ['Refunded', 'zinc'],
  },
  delivery: {
    pending: ['Delivery pending', 'amber'],
    ready: ['Ready for delivery', 'blue'],
    delivered: ['Delivered', 'green'],
  },
  unit: {
    in_stock: ['In stock', 'green'],
    reserved: ['Reserved', 'amber'],
    sold: ['Sold', 'red'],
  },
  offer: {
    active: ['Active', 'green'],
    scheduled: ['Scheduled', 'blue'],
    expired: ['Expired', 'zinc'],
    inactive: ['Inactive', 'zinc'],
  },
  enquiry: {
    new: ['New', 'amber'],
    in_progress: ['In progress', 'blue'],
    resolved: ['Resolved', 'green'],
  },
  sale: {
    completed: ['Completed', 'green'],
    reversed: ['Reversed', 'red'],
  },
  listing: {
    active: ['Active', 'green'],
    upcoming: ['Upcoming', 'blue'],
    discontinued: ['Discontinued', 'zinc'],
  },
};

export const BOOKING_TYPES = {
  test_ride: 'Test ride',
  showroom_visit: 'Showroom visit',
  purchase_enquiry: 'Purchase enquiry',
};

export const PAYMENT_METHODS = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  card: 'Card (simulated)',
  installment: 'Installment',
  cheque: 'Cheque',
};

export const ROLE_LABELS = {
  owner: 'Owner / Admin',
  manager: 'Manager',
  sales: 'Sales Representative',
  inventory: 'Inventory Manager',
};

export const FALLBACK_IMAGE = '/images/fallback-bike.svg';
