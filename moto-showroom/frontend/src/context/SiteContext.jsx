import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { brandsApi, categoriesApi, contentApi, settingsApi } from '../lib/services';

/**
 * Website content, showroom settings and active categories/brands, loaded once
 * from the API and shared by the public site. Admin pages call `refresh()`
 * after saving so changes appear immediately in the same session.
 */
const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [state, setState] = useState({ content: null, settings: null, categories: [], brands: [], loading: true, error: null });

  const refresh = useCallback(async () => {
    try {
      const [content, settings, categories, brands] = await Promise.all([
        contentApi.get(),
        settingsApi.get(),
        categoriesApi.list({ public: true }),
        brandsApi.list({ public: true }),
      ]);
      setState({
        content: content.data,
        settings: settings.data,
        categories: categories.data,
        brands: brands.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
