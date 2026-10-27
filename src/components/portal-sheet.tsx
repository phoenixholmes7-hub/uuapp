import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import {
  type ComponentType,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewNavigation, type WebViewProps } from 'react-native-webview';

import { MICROSOFT_LOGOUT, SELF_SERVICE_LOGOUT, SELF_SERVICE_ORIGIN } from '@/config/services';
import { Radius, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import {
  buildFollowLinkScript,
  buildPageScript,
  isSignedInPage,
  type PageMessage,
} from '@/lib/autofill';
import { usePortalBridge, useSession } from '@/state/session';

// react-native-webview still ships class-component typings, which React 19's
// JSX types reject; re-type it as a regular component taking a ref.
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebView> }>;

/**
 * One web view, created once and kept alive for the whole session. Screens
 * never mount their own browser: they ask this sheet to navigate and show
 * itself, so cookies, scroll position and the signed-in session are never lost.
 *
 * On phones it slides up over the app. On unfolded foldables, tablets and
 * wide windows it docks as the right-hand pane next to the card list, and
 * switches between the two live as the device folds — without reloading.
 */
export function PortalSheet() {
  const { active } = usePortalBridge();
  if (!active) return null;
  return <Portal />;
}

function Portal() {
  const bridge = usePortalBridge();
  const { sheet, closeSheet, portal } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height, twoPane, pageWidth } = useLayout();

  const web = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [onLoginPage, setOnLoginPage] = useState(false);
  const progress = useSharedValue(0);
  const shown = useSharedValue(0);

  const script = useMemo(
    () => buildPageScript(bridge.autofill, { remember: bridge.remember }),
    [bridge.autofill, bridge.remember],
  );
  const followLink = useRef<string | undefined>(undefined);
  useEffect(() => {
    followLink.current = sheet.findLink;
  }, [sheet]);

  const scriptRef = useRef(script);
  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

  useEffect(() => {
    bridge.register({
      navigate: (url) =>
        web.current?.injectJavaScript(`location.assign(${JSON.stringify(url)}); true;`),
      // Log off Self-Service, then Microsoft, so the next sign-in can pick
      // a different account instead of silently reusing this one.
      logout: () => {
        web.current?.injectJavaScript(
          `location.assign(${JSON.stringify(SELF_SERVICE_LOGOUT)}); true;`,
        );
        setTimeout(
          () =>
            web.current?.injectJavaScript(
              `location.assign(${JSON.stringify(MICROSOFT_LOGOUT)}); true;`,
            ),
          2500,
        );
      },
    });
    return () => bridge.register(null);
  }, [bridge]);

  useEffect(() => {
    shown.value = sheet.open
      ? withSpring(1, { damping: 26, stiffness: 260, mass: 0.9, overshootClamping: true })
      : withTiming(0, { duration: 240, easing: Easing.in(Easing.cubic) });
    if (sheet.open) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [sheet.open, shown]);

  // Android back button: go back inside the page first, then close the sheet.
  useEffect(() => {
    if (!sheet.open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) web.current?.goBack();
      else closeSheet();
      return true;
    });
    return () => sub.remove();
  }, [sheet.open, canGoBack, closeSheet]);

  const onMessage = useCallback(
    (raw: string) => {
      let msg: PageMessage;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.type === 'page') {
        setOnLoginPage(msg.hasPassword);
        // Once the starting page is up (after any sign-in), follow its link.
        if (followLink.current && isSignedInPage(msg, SELF_SERVICE_ORIGIN)) {
          web.current?.injectJavaScript(buildFollowLinkScript(followLink.current));
          followLink.current = undefined;
        }
      }
      bridge.onMessage(msg);
    },
    [bridge],
  );

  const onShouldStart = useCallback((req: WebViewNavigation) => {
    const { url } = req;
    if (!/^https?:/i.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    // Android's WebView can't render PDFs (transcripts, 1098-Ts).
    if (Platform.OS === 'android' && /\.pdf($|\?)/i.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  const sheetStyle = useAnimatedStyle(() =>
    twoPane
      ? { width: shown.value * pageWidth, transform: [{ translateY: 0 }] }
      : { width: '100%', transform: [{ translateY: (1 - shown.value) * height }] },
  );
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    opacity: progress.value >= 1 ? withTiming(0, { duration: 300 }) : 1,
  }));

  const signingIn = onLoginPage && !!bridge.autofill && portal !== 'attention';

  return (
    <Animated.View
      pointerEvents={sheet.open ? 'auto' : 'none'}
      style={[
        twoPane
          ? [styles.pane, { borderColor: theme.border }]
          : [StyleSheet.absoluteFill, styles.sheet],
        { backgroundColor: theme.surface },
        sheetStyle,
      ]}>
      {/* Fixed inner width so the page doesn't reflow while the pane animates. */}
      <View style={[styles.inner, { paddingTop: insets.top }, twoPane && { width: pageWidth }]}>
        <View style={[styles.header, { borderColor: theme.border }]}>
          <IconButton
            name={twoPane ? 'close' : 'chevron-down'}
            label="Close"
            onPress={closeSheet}
          />
          {canGoBack ? (
            <IconButton name="arrow-back" label="Back" onPress={() => web.current?.goBack()} />
          ) : (
            <View style={styles.iconSpacer} />
          )}
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {sheet.title}
          </Text>
          <IconButton name="refresh" label="Reload" onPress={() => web.current?.reload()} />
          <IconButton
            name="open-outline"
            label="Open in browser"
            onPress={() => sheet.url && Linking.openURL(sheet.url)}
          />
        </View>
        <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
          <Animated.View style={[styles.bar, { backgroundColor: theme.primary }, barStyle]} />
        </View>

        <View style={styles.body}>
          <Web
            ref={web}
            source={{ uri: bridge.startUrl }}
            onLoadStart={() => {
              progress.value = 0.05;
            }}
            onLoadProgress={({ nativeEvent }) => {
              progress.value = withTiming(nativeEvent.progress, { duration: 150 });
            }}
            onLoadEnd={() => web.current?.injectJavaScript(scriptRef.current)}
            onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
            onMessage={(e) => onMessage(e.nativeEvent.data)}
            onShouldStartLoadWithRequest={onShouldStart}
            injectedJavaScript={script}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            cacheEnabled
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            allowsInlineMediaPlayback
            decelerationRate="normal"
            style={{ backgroundColor: theme.surface }}
          />
          {signingIn && (
            <View
              style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: theme.surface }]}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.coverText, { color: theme.textSecondary }]}>
                Signing you in…
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function IconButton({
  name,
  label,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { backgroundColor: theme.surfaceMuted },
      ]}>
      <Ionicons name={name} size={22} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    zIndex: 100,
    elevation: 24,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',
  },
  pane: {
    height: '100%',
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: { width: 40 },
  track: { height: 2 },
  bar: { height: 2 },
  body: { flex: 1 },
  cover: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  coverText: { fontSize: 15 },
});
