import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Credentials live in the iOS Keychain / Android Keystore via SecureStore.
 * The web build is a preview only, so it falls back to sessionStorage and
 * never keeps a password beyond the tab.
 */

const KEY = 'uu.credentials.v1';

export type Credentials = { username: string; password: string };

export type StoredAccount = Credentials & {
  remember: boolean;
  biometricLock: boolean;
};

const web = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {}
  },
  del: (k: string) => {
    try {
      sessionStorage.removeItem(k);
    } catch {}
  },
};

export async function loadAccount(): Promise<StoredAccount | null> {
  const raw = Platform.OS === 'web' ? web.get(KEY) : await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAccount;
  } catch {
    return null;
  }
}

export async function saveAccount(account: StoredAccount) {
  const raw = JSON.stringify(account);
  if (Platform.OS === 'web') return web.set(KEY, raw);
  await SecureStore.setItemAsync(KEY, raw, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function clearAccount() {
  if (Platform.OS === 'web') return web.del(KEY);
  await SecureStore.deleteItemAsync(KEY);
}
