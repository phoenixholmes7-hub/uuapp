import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PortalSheet } from '@/components/portal-sheet';
import { StartupScreen } from '@/components/startup-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { PrefsProvider, usePrefs } from '@/state/prefs';
import { type AuthStatus, SessionProvider, useSession } from '@/state/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PrefsProvider>
          <SessionProvider>
            <StatusBar style="auto" />
            <Shell />
          </SessionProvider>
        </PrefsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The navigator and the page pane sit side by side in a row. On phones the
 * pane overlays everything; on wide or unfolded screens it docks on the right.
 */
function Shell() {
  const { status } = useSession();
  const prefs = usePrefs();
  const theme = useTheme();
  const loading = status === 'loading' || !prefs.ready;

  // The startup screen covers the app until the saved session is restored,
  // so someone already signed in never sees a flash of the login screen.
  return (
    <View style={[styles.shell, { backgroundColor: theme.background }]}>
      {!loading && <App status={status} />}
      <StartupScreen ready={!loading} />
    </View>
  );
}

function App({ status }: { status: AuthStatus }) {
  return (
    <>
      <View style={styles.main}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'locked'}>
            <Stack.Screen name="locked" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      </View>
      <PortalSheet />
    </>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },
});
