import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

/**
 * Union signs students in with Microsoft (with MFA), so the app doesn't ask
 * for a password itself: it shows Microsoft's real sign-in page and watches
 * for the moment Self-Service opens. With "Keep me signed in" on, the app
 * says yes to Microsoft's "Stay signed in?" and remembers what was typed
 * there, so later sign-ins happen on their own.
 */
export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signingIn } = useSession();
  const [remember, setRemember] = useState(true);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + Spacing.six, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.brand}>
        <Image
          source={require('@/assets/images/startup-logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <Text style={[styles.title, { color: theme.text }]}>Union Hub</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Sign in with your Union University Microsoft account
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.form}>
        <Pressable
          onPress={() => signIn(remember)}
          disabled={signingIn}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Microsoft"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}>
          {signingIn ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <>
              <Ionicons name="logo-microsoft" size={20} color={theme.primaryText} />
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                Sign in with Microsoft
              </Text>
            </>
          )}
        </Pressable>

        <View
          style={[styles.remember, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rememberLabel, { color: theme.text }]}>Keep me signed in</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18 }}>
              Stays signed in to Microsoft and saves your sign-in in this device&apos;s secure
              keychain, so you won&apos;t have to log in again.
            </Text>
          </View>
          <Switch
            value={remember}
            onValueChange={setRemember}
            trackColor={{ true: theme.primary }}
          />
        </View>

        {signingIn && (
          <Animated.Text
            entering={FadeIn}
            style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Finish signing in on the Microsoft page. Approve the request in Authenticator if asked.
          </Animated.Text>
        )}

        <Text style={[styles.note, { color: theme.textSecondary }]}>
          Use your full Union email (for example name@my.uu.edu). Your password goes only to
          Microsoft and uu.edu.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brand: { alignItems: 'center', gap: Spacing.two },
  logo: { width: 120, height: 120, marginBottom: Spacing.two },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center' },
  form: { gap: Spacing.three },
  button: {
    height: 54,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  rememberLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  note: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
