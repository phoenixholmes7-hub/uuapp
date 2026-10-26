import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CardGrid } from '@/components/card-grid';
import { Screen, SectionTitle } from '@/components/screen';
import { findService, type Service } from '@/config/services';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ViewMode } from '@/lib/prefs';
import { usePrefs } from '@/state/prefs';
import { type PortalState, useSession } from '@/state/session';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function resolve(ids: string[]) {
  return ids.map(findService).filter((s): s is Service => !!s);
}

export default function HomeScreen() {
  const { username, portal, signOut } = useSession();
  const { favorites, recent, homeView, update } = usePrefs();
  const theme = useTheme();

  const pinned = useMemo(() => resolve(favorites), [favorites]);
  const recents = useMemo(
    () => resolve(recent.filter((id) => !favorites.includes(id))).slice(0, 4),
    [recent, favorites],
  );
  const firstName = username?.split(/[@.\s]/)[0];

  return (
    <Screen
      title={firstName ? `${greeting()}, ${capitalise(firstName)}` : greeting()}
      right={Platform.OS === 'web' ? undefined : <StatusPill state={portal} />}>
      {portal === 'error' && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.banner, { backgroundColor: theme.tint, borderColor: theme.accent }]}>
          <Ionicons name="alert-circle" size={20} color={theme.accent} />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Self-Service rejected your saved password. Sign in again to update it.
          </Text>
          <Pressable onPress={signOut} hitSlop={8}>
            <Text style={[styles.bannerAction, { color: theme.primary }]}>Update</Text>
          </Pressable>
        </Animated.View>
      )}

      <SectionTitle
        right={<ViewToggle value={homeView} onChange={(v) => update({ homeView: v })} />}>
        Pinned
      </SectionTitle>
      <CardGrid
        services={pinned}
        variant={homeView}
        empty="Tap the bookmark on any card in Discover to pin it here."
      />

      {recents.length > 0 && (
        <>
          <SectionTitle>Recent</SectionTitle>
          <CardGrid services={recents} variant="list" />
        </>
      )}
    </Screen>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const STATUS: Record<
  PortalState,
  { label: string; color: 'success' | 'warning' | 'accent' | 'textSecondary' }
> = {
  idle: { label: 'Offline', color: 'textSecondary' },
  connecting: { label: 'Connecting', color: 'warning' },
  ready: { label: 'Connected', color: 'success' },
  attention: { label: 'Needs you', color: 'warning' },
  error: { label: 'Sign-in failed', color: 'accent' },
};

function StatusPill({ state }: { state: PortalState }) {
  const theme = useTheme();
  const { label, color } = STATUS[state];
  return (
    <View
      accessibilityLabel={`Self-Service: ${label}`}
      style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.dot, { backgroundColor: theme[color] }]} />
      <Text style={[styles.pillText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const theme = useTheme();
  const option = (mode: ViewMode, icon: keyof typeof Ionicons.glyphMap, label: string) => {
    const on = value === mode;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: on }}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onChange(mode);
        }}
        style={[styles.toggleBtn, on && { backgroundColor: theme.surface }]}>
        <Ionicons name={icon} size={16} color={on ? theme.text : theme.textSecondary} />
      </Pressable>
    );
  };
  return (
    <View style={[styles.toggle, { backgroundColor: theme.surfaceMuted }]}>
      {option('grid', 'grid-outline', 'Grid view')}
      {option('list', 'list-outline', 'List view')}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 19 },
  bannerAction: { fontWeight: '700', fontSize: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '600' },
  toggle: { flexDirection: 'row', borderRadius: Radius.sm, padding: 3, gap: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
});
