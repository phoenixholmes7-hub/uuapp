import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

/** Matches the native splash background in app.json, so the hand-off is invisible. */
export const STARTUP_BACKGROUND = '#FFFFFF';
const MIN_DURATION_MS = 2000;
const launchedAt = Date.now();

/**
 * Branded startup screen, shown for 2 seconds from launch (longer only if the
 * saved session is still loading). It takes over from the native splash
 * with the same logo and background, then fades away to reveal the app,
 * which has been loading and signing in underneath the whole time.
 */
export function StartupScreen({ ready }: { ready: boolean }) {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
    const t = setTimeout(
      () => setElapsed(true),
      Math.max(0, MIN_DURATION_MS - (Date.now() - launchedAt)),
    );
    return () => clearTimeout(t);
  }, []);

  if (ready && elapsed) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(350)}
      style={[StyleSheet.absoluteFill, styles.container]}
      accessibilityLabel="Union Hub is starting">
      <Animated.View entering={ZoomIn.springify().damping(14).stiffness(120)}>
        <Image
          source={require('@/assets/images/startup-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: STARTUP_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  logo: { width: 180, height: 180 },
});
