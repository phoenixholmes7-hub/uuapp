import type { ReactNode } from 'react';
import { type ScrollViewProps, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useContentWidth } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

/**
 * Scrolling page with a large title. Content is centred and capped in width,
 * and follows the list pane's width when a page is docked beside it.
 */
export function Screen({
  title,
  subtitle,
  right,
  children,
  ...scroll
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
} & ScrollViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.ScrollView
      {...scroll}
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.six },
      ]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </Animated.ScrollView>
  );
}

/** Usable inner width of a Screen, for laying out grids. */
export function useScreenInnerWidth() {
  const { sheet } = useSession();
  const width = useContentWidth(sheet.open);
  return Math.min(width, MaxContentWidth) - Spacing.three * 2;
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
        {children.toUpperCase()}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: Spacing.one },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
});
