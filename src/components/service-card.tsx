import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { type Service, serviceUrl } from '@/config/services';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePrefs } from '@/state/prefs';
import { useSession } from '@/state/session';

type Props = { service: Service; variant: 'tile' | 'row'; width?: number };

export const ServiceCard = memo(function ServiceCard({ service, variant, width }: Props) {
  const theme = useTheme();
  const { openPage, sheet } = useSession();
  const { favorites, toggleFavorite, markRecent } = usePrefs();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const url = serviceUrl(service);
  const favorite = favorites.includes(service.id);
  const current = sheet.open && sheet.url === url;

  const open = () => {
    markRecent(service.id);
    openPage(url, service.title, service.findLink);
  };
  const star = () => {
    Haptics.selectionAsync().catch(() => {});
    toggleFavorite(service.id);
  };

  const icon = (
    <View style={[styles.icon, { backgroundColor: theme.tint }]}>
      <Ionicons name={service.icon} size={20} color={theme.primary} />
    </View>
  );
  const bookmark = (
    <Pressable
      hitSlop={10}
      onPress={star}
      accessibilityRole="button"
      accessibilityLabel={favorite ? `Unpin ${service.title}` : `Pin ${service.title}`}>
      <Ionicons
        name={favorite ? 'bookmark' : 'bookmark-outline'}
        size={18}
        color={favorite ? theme.accent : theme.textSecondary}
      />
    </Pressable>
  );

  return (
    <Animated.View style={[pressStyle, width ? { width } : null]}>
      <Pressable
        onPress={open}
        onPressIn={() => (scale.value = withSpring(0.96, { damping: 20, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 300 }))}
        accessibilityRole="button"
        accessibilityLabel={service.title}
        accessibilityHint={service.subtitle}
        style={[
          variant === 'tile' ? styles.tile : styles.row,
          {
            backgroundColor: theme.surface,
            borderColor: current ? theme.primary : theme.border,
          },
        ]}>
        {variant === 'tile' ? (
          <>
            <View style={styles.tileTop}>
              {icon}
              {bookmark}
            </View>
            <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
              {service.title}
            </Text>
            <Text numberOfLines={2} style={[styles.subtitle, { color: theme.textSecondary }]}>
              {service.subtitle}
            </Text>
          </>
        ) : (
          <>
            {icon}
            <View style={styles.rowText}>
              <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
                {service.title}
              </Text>
              <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
                {service.subtitle}
              </Text>
            </View>
            {bookmark}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  tile: {
    minHeight: 132,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  rowText: { flex: 1, gap: 2 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, lineHeight: 17 },
});
