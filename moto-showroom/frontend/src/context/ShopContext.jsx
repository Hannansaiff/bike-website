import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../lib/storage';

/**
 * Favourites and the comparison list. Stored in this browser only (demo).
 * Items are stored as lightweight snapshots { id, slug, name, image }.
 */
const ShopContext = createContext(null);
const FAV_KEY = 'rz_favourites';
const CMP_KEY = 'rz_compare';
export const MAX_COMPARE = 3;

const snapshot = (bike) => ({ id: bike.id, slug: bike.slug, name: bike.name, image: bike.image || bike.images?.[0] || '' });

export function ShopProvider({ children }) {
  const [favourites, setFavourites] = useState(() => storage.get(FAV_KEY, []));
  const [compare, setCompare] = useState(() => storage.get(CMP_KEY, []));

  useEffect(() => storage.set(FAV_KEY, favourites), [favourites]);
  useEffect(() => storage.set(CMP_KEY, compare), [compare]);

  const isFavourite = useCallback((id) => favourites.some((f) => f.id === id), [favourites]);
  /** Returns true when added, false when removed. */
  const toggleFavourite = useCallback(
    (bike) => {
      if (favourites.some((f) => f.id === bike.id)) {
        setFavourites((list) => list.filter((f) => f.id !== bike.id));
        return false;
      }
      setFavourites((list) => [snapshot(bike), ...list.filter((f) => f.id !== bike.id)]);
      return true;
    },
    [favourites]
  );

  const inCompare = useCallback((id) => compare.some((c) => c.id === id), [compare]);
  /** Returns 'added' | 'removed' | 'full' */
  const toggleCompare = useCallback(
    (bike) => {
      if (compare.some((c) => c.id === bike.id)) {
        setCompare((l) => l.filter((c) => c.id !== bike.id));
        return 'removed';
      }
      if (compare.length >= MAX_COMPARE) return 'full';
      setCompare((l) => [...l, snapshot(bike)]);
      return 'added';
    },
    [compare]
  );
  const clearCompare = useCallback(() => setCompare([]), []);
  const removeCompare = useCallback((id) => setCompare((l) => l.filter((c) => c.id !== id)), []);

  const value = useMemo(
    () => ({ favourites, isFavourite, toggleFavourite, compare, inCompare, toggleCompare, clearCompare, removeCompare }),
    [favourites, isFavourite, toggleFavourite, compare, inCompare, toggleCompare, clearCompare, removeCompare]
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
