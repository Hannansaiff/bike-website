import { useCallback, useState } from 'react';
import { validate } from '../lib/validation';

/**
 * Controlled form state with client validation and server error mapping.
 * schema can be an object or a function (values) => object.
 */
export function useForm(initialValues, schema = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const resolveSchema = useCallback((v) => (typeof schema === 'function' ? schema(v) : schema), [schema]);

  const setField = useCallback(
    (name, value) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        setErrors((errs) => {
          if (!errs[name]) return errs;
          const fieldRules = resolveSchema(next)[name];
          const msg = fieldRules ? validate(next, { [name]: fieldRules })[name] : '';
          return { ...errs, [name]: msg || undefined };
        });
        return next;
      });
    },
    [resolveSchema]
  );

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setField(name, type === 'checkbox' ? checked : value);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    const fieldRules = resolveSchema(values)[name];
    if (fieldRules) {
      const msg = validate(values, { [name]: fieldRules })[name];
      setErrors((errs) => ({ ...errs, [name]: msg || undefined }));
    }
  };

  const runValidation = () => {
    const errs = validate(values, resolveSchema(values));
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Wrap a submit handler: validates, toggles submitting, maps API field errors. */
  const submit = (fn) => async (e) => {
    e?.preventDefault?.();
    setFormError('');
    if (!runValidation()) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      await fn(values);
    } catch (err) {
      if (err?.fields && Object.keys(err.fields).length) {
        setErrors((prev) => ({ ...prev, ...err.fields }));
      }
      setFormError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = (next = initialValues) => {
    setValues(next);
    setErrors({});
    setTouched({});
    setFormError('');
  };

  return { values, setValues, setField, errors, setErrors, touched, handleChange, handleBlur, submit, submitting, formError, setFormError, reset };
}
