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
  /** True while the Microsoft sign-in page is up for the user. */
  signingIn: boolean;
  signIn: (remember: boolean) => void;
  signOut: () => Promise<void>;
  unlock: () => Promise<boolean>;
  setBiometricLock: (on: boolean) => Promise<boolean>;
  openPage: (url: string, title: string, findLink?: string) => void;
  /** Show the sign-in page so the user can finish (MFA, changed password…). */
  resumeSignIn: () => void;
  closeSheet: () => void;
};

type PortalBridge = {
  /** Whether the web view should be mounted at all. */
  active: boolean;
  /** Credentials autofill may use right now (null after a rejection). */
  autofill: Credentials | null;
  /** Remember what the user signs in with, and keep Microsoft signed in. */
  remember: boolean;
  startUrl: string;
  onMessage: (msg: PageMessage) => void;
  register: (c: PortalController | null) => void;
};

const SessionContext = createContext<SessionValue | null>(null);
const PortalContext = createContext<PortalBridge | null>(null);

/** How long a silent sign-in may take before we ask the user to look. */
const ATTENTION_AFTER_MS = 15000;

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
  /** What the user typed into the sign-in form this session (if remembering). */
  const captured = useRef<Partial<Credentials>>({});
  const attentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAttentionTimer = () => {
    if (attentionTimer.current) clearTimeout(attentionTimer.current);
    attentionTimer.current = null;
  };

  // Restore the saved account on launch. The user goes straight to Home and
  // the web session reconnects behind the scenes — via Microsoft's long-lived
  // "stay signed in" cookie, or the saved password if that has expired.
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

  // A silent reconnect that stalls (MFA prompt, new password) needs the user.
  useEffect(() => {
    if (status !== 'signedIn' || portal !== 'connecting') return;
    attentionTimer.current = setTimeout(() => setPortal('attention'), ATTENTION_AFTER_MS);
    return clearAttentionTimer;
  }, [status, portal]);

  const onSignedIn = useCallback(async () => {
    clearAttentionTimer();
    setPortal('ready');
    setAutofillOn(true);
    const typed = captured.current;
    captured.current = {};
    if (!signingIn && !typed.password) return;

    const next: Credentials = {
      username: typed.username || creds?.username || '',
      password: typed.password || creds?.password || '',
    };
    setCreds(next);
    // signIn() set `remembered` to the user's choice before opening the page.
    if (remembered) await saveAccount({ ...next, remember: true, biometricLock });
    if (signingIn) {
      setSigningIn(false);
      setSheet((s) => ({ ...s, open: false }));
      setStatus('signedIn');
    }
  }, [signingIn, creds, remembered, biometricLock]);

  const onMessage = useCallback(
    (msg: PageMessage) => {
      switch (msg.type) {
        case 'captured':
          captured.current = {
            username: msg.username ?? captured.current.username,
            password: msg.password ?? captured.current.password,
          };
          return;
        case 'loginError':
          // Saved password was rejected: stop autofilling, let the user retype.
          if (!signingIn) {
            setAutofillOn(false);
            setPortal('error');
          }
          return;
        case 'page':
          if (isSignedInPage(msg, SELF_SERVICE_ORIGIN)) onSignedIn();
          else if (msg.hasPassword) setPortal((p) => (p === 'ready' ? 'connecting' : p));
          return;
      }
    },
    [signingIn, onSignedIn],
  );

  const signIn = useCallback((remember: boolean) => {
    setRemembered(remember);
    if (Platform.OS === 'web') {
      // The web preview can't host Microsoft's page; open it and trust it.
      window.open(SELF_SERVICE_HOME, '_blank', 'noopener');
      setStatus('signedIn');
      return;
    }
    captured.current = {};
    setSigningIn(true);
    setPortal('connecting');
    controller.current?.navigate(SELF_SERVICE_HOME);
    setSheet({ open: true, title: 'Sign in with Microsoft', url: SELF_SERVICE_HOME });
  }, []);

  const resumeSignIn = useCallback(() => {
    setSheet({ open: true, title: 'Sign in', url: SELF_SERVICE_HOME });
    controller.current?.navigate(SELF_SERVICE_HOME);
  }, []);

  const signOut = useCallback(async () => {
    controller.current?.logout();
    await clearAccount();
    setCreds(null);
    setRemembered(false);
    setBiometricLockState(false);
    setSigningIn(false);
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

  const closeSheet = useCallback(() => {
    setSheet((s) => ({ ...s, open: false }));
    setSigningIn(false);
  }, []);

  const register = useCallback((c: PortalController | null) => {
    controller.current = c;
  }, []);

  const session = useMemo<SessionValue>(
    () => ({
      status,
      username: creds?.username || null,
      remembered,
      biometricLock,
      biometricAvailable,
      portal,
      sheet,
      signingIn,
      signIn,
      signOut,
      unlock,
      setBiometricLock,
      openPage,
      resumeSignIn,
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
      signingIn,
      signIn,
      signOut,
      unlock,
      setBiometricLock,
      openPage,
      resumeSignIn,
      closeSheet,
    ],
  );

  const bridge = useMemo<PortalBridge>(
    () => ({
      // Mounted on the login screen too, so Microsoft's page is ready to show
      // instantly and sign-out can finish logging off.
      active: status === 'signedIn' || status === 'signedOut',
      autofill: autofillOn && !signingIn ? creds : null,
      remember: remembered,
      startUrl: SELF_SERVICE_HOME,
      onMessage,
      register,
    }),
    [status, autofillOn, signingIn, creds, remembered, onMessage, register],
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
