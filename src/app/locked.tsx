import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

export default function LockedScreen() {
  const theme = useTheme();
  const { unlock, signOut } = useSession();

  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Ionicons name="lock-closed" size={44} color={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>Union Hub is locked</Text>
      <Pressable
        onPress={unlock}
        accessibilityRole="button"
        style={[styles.button, { backgroundColor: theme.primary }]}>
        <Text style={{ color: theme.primaryText, fontWeight: '700', fontSize: 16 }}>Unlock</Text>
      </Pressable>
      <Pressable onPress={signOut} hitSlop={8}>
        <Text style={{ color: theme.textSecondary }}>Sign in with a different account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  title: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.two },
  button: {
    paddingHorizontal: Spacing.five,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
});
