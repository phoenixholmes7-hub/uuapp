import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_PREFS, loadPrefs, type Prefs, savePrefs } from '@/lib/prefs';

type PrefsValue = Prefs & {
  ready: boolean;
  toggleFavorite: (id: string) => void;
  markRecent: (id: string) => void;
  update: (patch: Partial<Prefs>) => void;
};

const PrefsContext = createContext<PrefsValue | null>(null);

const MAX_RECENT = 6;

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPrefs().then((p) => {
      setPrefs(p);
      setReady(true);
    });
  }, []);

  const apply = useCallback((fn: (p: Prefs) => Prefs) => {
    setPrefs((prev) => {
      const next = fn(prev);
      savePrefs(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (id: string) =>
      apply((p) => ({
        ...p,
        favorites: p.favorites.includes(id)
          ? p.favorites.filter((f) => f !== id)
          : [...p.favorites, id],
      })),
    [apply],
  );

  const markRecent = useCallback(
    (id: string) =>
      apply((p) => ({
        ...p,
        recent: [id, ...p.recent.filter((r) => r !== id)].slice(0, MAX_RECENT),
      })),
    [apply],
  );

  const update = useCallback(
    (patch: Partial<Prefs>) => apply((p) => ({ ...p, ...patch })),
    [apply],
  );

  const value = useMemo(
    () => ({ ...prefs, ready, toggleFavorite, markRecent, update }),
    [prefs, ready, toggleFavorite, markRecent, update],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
