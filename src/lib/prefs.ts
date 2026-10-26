import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_FAVORITES } from '@/config/services';

const KEY = 'uu.prefs.v1';

export type ViewMode = 'grid' | 'list';
export type SortMode = 'recommended' | 'az';

export type Prefs = {
  favorites: string[];
  recent: string[];
  homeView: ViewMode;
  sort: SortMode;
};

export const DEFAULT_PREFS: Prefs = {
  favorites: DEFAULT_FAVORITES,
  recent: [],
  homeView: 'grid',
  sort: 'recommended',
};

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs) {
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
}
