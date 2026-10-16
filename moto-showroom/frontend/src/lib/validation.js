/**
 * Declarative client-side validation. The backend validates again – these
 * rules exist for instant feedback.
 *
 * rules: { field: [rule, rule...] } where rule = (value, values) => error | ''
 */
export const PK_MOBILE = /^(?:\+92|0092|0)?3\d{9}$/;

export const rules = {
  required: (label = 'This field') => (v) =>
    v === undefined || v === null || String(v).trim() === '' || (Array.isArray(v) && !v.length)
      ? `${label} is required`
      : '',
  minLen: (n, label = 'This field') => (v) => (v && String(v).trim().length < n ? `${label} must be at least ${n} characters` : ''),
  maxLen: (n, label = 'This field') => (v) => (v && String(v).length > n ? `${label} must be at most ${n} characters` : ''),
  phone: () => (v) =>
    v && !PK_MOBILE.test(String(v).replace(/[\s\-()]/g, '')) ? 'Enter a valid Pakistani mobile number, e.g. 0300-1234567' : '',
  email: () => (v) => (v && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(v).trim()) ? 'Enter a valid email address' : ''),
  number: (label = 'Value', { min, max, integer = true } = {}) => (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (Number.isNaN(n)) return `${label} must be a number`;
    if (integer && !Number.isInteger(n)) return `${label} must be a whole number`;
    if (min !== undefined && n < min) return `${label} must be at least ${min.toLocaleString()}`;
    if (max !== undefined && n > max) return `${label} must be at most ${max.toLocaleString()}`;
    return '';
  },
  notPastDate: () => (v) => {
    if (!v) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${v}T00:00:00`) < today ? 'Date cannot be in the past' : '';
  },
  notFutureDate: () => (v) => {
    if (!v) return '';
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return new Date(`${v}T00:00:00`) > today ? 'Date cannot be in the future' : '';
  },
  url: () => (v) => (v && !/^(https?:\/\/|\/)/i.test(String(v).trim()) ? 'Enter a full URL starting with https:// or a site path starting with /' : ''),
  custom: (fn) => fn,
};

export function validate(values, schema) {
  const errors = {};
  Object.entries(schema).forEach(([field, fieldRules]) => {
    for (const rule of fieldRules) {
      const msg = rule(values[field], values);
      if (msg) {
        errors[field] = msg;
        break;
      }
    }
  });
  return errors;
}
