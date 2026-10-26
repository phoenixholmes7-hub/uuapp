import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, cancelSignIn, portal } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInputInstance>(null);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const submit = async () => {
    if (!username.trim() || !password || busy) return;
    setError('');
    setBusy(true);
    const result = await signIn({ username: username.trim(), password }, remember);
    setBusy(false);
    if (!result.ok && result.message) {
      setError(result.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      shake.set(
        withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-6, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        ),
      );
    }
  };

  const field = [styles.field, { backgroundColor: theme.surface, borderColor: theme.border }];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + Spacing.six, paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <Ionicons name="school" size={30} color={theme.primaryText} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Union Hub</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in with your Union University account
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={[styles.form, shakeStyle]}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username or email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!busy}
            style={[field, { color: theme.text }]}
          />
          <View style={field}>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              editable={!busy}
              style={[styles.passwordInput, { color: theme.text }]}
            />
            <Pressable
              hitSlop={10}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.remember}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rememberLabel, { color: theme.text }]}>Keep me signed in</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                Signs you back in automatically. Stored in the device keychain.
              </Text>
            </View>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ true: theme.primary }}
            />
          </View>

          {error ? (
            <Animated.Text entering={FadeIn} style={[styles.error, { color: theme.accent }]}>
              {error}
            </Animated.Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.primary,
                opacity: pressed || !username || !password ? 0.75 : 1,
              },
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>Sign in</Text>
            )}
          </Pressable>

          {busy && (
            <Animated.View entering={FadeIn} style={styles.waiting}>
              <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                {portal === 'attention'
                  ? 'Finish signing in on the Union page that just opened.'
                  : 'Connecting to Self-Service…'}
              </Text>
              <Pressable onPress={cancelSignIn} hitSlop={8}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center' },
  form: { gap: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  passwordInput: { flex: 1, fontSize: 16, height: '100%', outlineWidth: 0 },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rememberLabel: { fontSize: 16, fontWeight: '600' },
  error: { fontSize: 14, lineHeight: 19 },
  button: { height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, fontWeight: '700' },
  waiting: { alignItems: 'center', gap: Spacing.two },
});
