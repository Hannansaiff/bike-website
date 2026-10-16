import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { storage } from '../lib/storage';
import { authApi } from '../lib/services';

/**
 * DEMO authentication for admins and customers.
 * Sessions are kept in localStorage; route guards are UX only. Real security
 * must be enforced by the FastAPI backend (see README).
 */
const AuthContext = createContext(null);
const ADMIN_KEY = 'rz_admin_session';
const CUSTOMER_KEY = 'rz_customer_session';

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => storage.get(ADMIN_KEY));
  const [customer, setCustomer] = useState(() => storage.get(CUSTOMER_KEY));

  const adminLogin = useCallback(async (email, password) => {
    const { data } = await authApi.adminLogin({ email, password });
    storage.set(ADMIN_KEY, data);
    setAdmin(data);
    return data;
  }, []);

  const adminLogout = useCallback(() => {
    storage.remove(ADMIN_KEY);
    setAdmin(null);
  }, []);

  const saveCustomer = useCallback((data) => {
    storage.set(CUSTOMER_KEY, data);
    setCustomer(data);
  }, []);

  const customerLogin = useCallback(
    async (email, password) => {
      const { data } = await authApi.customerLogin({ email, password });
      saveCustomer(data);
      return data;
    },
    [saveCustomer]
  );

  const customerRegister = useCallback(
    async (body) => {
      const { data } = await authApi.customerRegister(body);
      saveCustomer(data);
      return data;
    },
    [saveCustomer]
  );

  const customerLogout = useCallback(() => {
    storage.remove(CUSTOMER_KEY);
    setCustomer(null);
  }, []);

  /** Frontend-only module check used to shape the admin UI per demo role. */
  const canAccess = useCallback(
    (module) => {
      const modules = admin?.user?.modules || [];
      return modules.includes('*') || modules.includes(module);
    },
    [admin]
  );

  const value = useMemo(
    () => ({ admin, adminLogin, adminLogout, canAccess, customer, customerLogin, customerRegister, customerLogout, saveCustomer }),
    [admin, adminLogin, adminLogout, canAccess, customer, customerLogin, customerRegister, customerLogout, saveCustomer]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
