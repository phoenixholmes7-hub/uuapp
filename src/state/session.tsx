import * as LocalAuthentication from 'expo-local-authentication';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { SELF_SERVICE_HOME, SELF_SERVICE_ORIGIN } from '@/config/services';
import { isSignedInPage, type PageMessage } from '@/lib/autofill';
import { clearAccount, type Credentials, loadAccount, saveAccount } from '@/lib/secure';

export type AuthStatus = 'loading' | 'locked' | 'signedOut' | 'signedIn';

/** State of the background Self-Service web session. */
export type PortalState = 'idle' | 'connecting' | 'ready' | 'attention' | 'error';

export type SignInResult = { ok: true } | { ok: false; message: string };

export type PortalController = {
  navigate: (url: string) => void;
  logout: () => void;
};

type SheetState = { open: boolean; title: string; url: string; findLink?: string };

type SessionValue = {
  status: AuthStatus;
  username: string | null;
  remembered: boolean;
  biometricLock: boolean;
  biometricAvailable: boolean;
  portal: PortalState;
  sheet: SheetState;
  signIn: (creds: Credentials, remember: boolean) => Promise<SignInResult>;
  cancelSignIn: () => void;
  signOut: () => Promise<void>;
  unlock: () => Promise<boolean>;
  setBiometricLock: (on: boolean) => Promise<boolean>;
  openPage: (url: string, title: string, findLink?: string) => void;
  closeSheet: () => void;
};

type PortalBridge = {
  /** Whether the hidden web view should be mounted at all. */
  active: boolean;
  /** Credentials autofill may use right now (null after a rejection). */
  autofill: Credentials | null;
  startUrl: string;
  onMessage: (msg: PageMessage) => void;
  register: (c: PortalController | null) => void;
};

const SessionContext = createContext<SessionValue | null>(null);
const PortalContext = createContext<PortalBridge | null>(null);

/** How long to wait for a silent sign-in before showing the page (MFA etc.). */
const ATTENTION_AFTER_MS = 20000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [autofillOn, setAutofillOn] = useState(true);
  const [remembered, setRemembered] = useState(false);
  const [biometricLock, setBiometricLockState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [portal, setPortal] = useState<PortalState>('idle');
  const [signingIn, setSigningIn] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ open: false, title: '', url: '' });

  const controller = useRef<PortalController | null>(null);
  const pending = useRef<((r: SignInResult) => void) | null>(null);
  const attentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = useCallback((result: SignInResult) => {
    if (attentionTimer.current) clearTimeout(attentionTimer.current);
    attentionTimer.current = null;
    const resolve = pending.current;
    pending.current = null;
    resolve?.(result);
  }, []);

  // Restore the saved account on launch. With a saved password the user goes
  // straight to Home and the web session signs in behind the scenes.
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const [hasHardware, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        setBiometricAvailable(hasHardware && enrolled);
      }
      const saved = await loadAccount();
      if (!saved) return setStatus('signedOut');
      setCreds({ username: saved.username, password: saved.password });
      setRemembered(saved.remember);
      setBiometricLockState(saved.biometricLock);
      setPortal('connecting');
      setStatus(saved.biometricLock ? 'locked' : 'signedIn');
    })();
  }, []);

  const onMessage = useCallback(
    (msg: PageMessage) => {
      if (msg.type === 'loginError') {
        setAutofillOn(false);
        setPortal('error');
        settle({ ok: false, message: msg.message });
        return;
      }
      if (msg.type !== 'page') return;
      if (isSignedInPage(msg, SELF_SERVICE_ORIGIN)) {
        setPortal('ready');
        if (pending.current) {
          setSheet((s) => ({ ...s, open: false }));
          settle({ ok: true });
        }
      } else if (msg.hasPassword) {
        setPortal((p) => (p === 'ready' ? 'connecting' : p));
      }
    },
    [settle],
  );

  const signIn = useCallback(
    (next: Credentials, remember: boolean) =>
      new Promise<SignInResult>((resolve) => {
        const finish = async (result: SignInResult) => {
          setSigningIn(false);
          if (result.ok) {
            setRemembered(remember);
            if (remember) await saveAccount({ ...next, remember, biometricLock: false });
            setStatus('signedIn');
          }
          resolve(result);
        };

        setCreds(next);
        setAutofillOn(true);
        setSigningIn(true);

        // The web build can't observe a cross-origin login, so it trusts the form.
        if (Platform.OS === 'web') return finish({ ok: true });

        pending.current = finish;
        setPortal('connecting');
        controller.current?.navigate(SELF_SERVICE_HOME);
        attentionTimer.current = setTimeout(() => {
          // Probably MFA or an unfamiliar login page: let the user finish it.
          setPortal('attention');
          setSheet({ open: true, title: 'Finish signing in', url: SELF_SERVICE_HOME });
        }, ATTENTION_AFTER_MS);
      }),
    [],
  );

  const cancelSignIn = useCallback(() => {
    settle({ ok: false, message: '' });
    setSheet((s) => ({ ...s, open: false }));
  }, [settle]);

  const signOut = useCallback(async () => {
    controller.current?.logout();
    await clearAccount();
    setCreds(null);
    setRemembered(false);
    setBiometricLockState(false);
    setPortal('idle');
    setSheet({ open: false, title: '', url: '' });
    setStatus('signedOut');
  }, []);

  const unlock = useCallback(async () => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Union Hub',
    });
    if (res.success) setStatus('signedIn');
    return res.success;
  }, []);

  const setBiometricLock = useCallback(
    async (on: boolean) => {
      if (!creds || !remembered) return false;
      if (on) {
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm to turn on app lock',
        });
        if (!res.success) return false;
      }
      await saveAccount({ ...creds, remember: true, biometricLock: on });
      setBiometricLockState(on);
      return true;
    },
    [creds, remembered],
  );

  const openPage = useCallback((url: string, title: string, findLink?: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener');
      return;
    }
    controller.current?.navigate(url);
    setSheet({ open: true, title, url, findLink });
  }, []);

  const closeSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  const register = useCallback((c: PortalController | null) => {
    controller.current = c;
  }, []);

  const session = useMemo<SessionValue>(
    () => ({
      status,
      username: creds?.username ?? null,
      remembered,
      biometricLock,
      biometricAvailable,
      portal,
      sheet,
      signIn,
      cancelSignIn,
      signOut,
      unlock,
      setBiometricLock,
      openPage,
      closeSheet,
    }),
    [
      status,
      creds,
      remembered,
      biometricLock,
      biometricAvailable,
      portal,
      sheet,
      signIn,
      cancelSignIn,
      signOut,
      unlock,
      setBiometricLock,
      openPage,
      closeSheet,
    ],
  );

  const bridge = useMemo<PortalBridge>(
    () => ({
      active: status === 'signedIn' || signingIn,
      autofill: autofillOn ? creds : null,
      startUrl: SELF_SERVICE_HOME,
      onMessage,
      register,
    }),
    [status, signingIn, autofillOn, creds, onMessage, register],
  );

  return (
    <SessionContext.Provider value={session}>
      <PortalContext.Provider value={bridge}>{children}</PortalContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

export function usePortalBridge() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortalBridge must be used inside SessionProvider');
  return ctx;
}
