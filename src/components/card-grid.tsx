import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useScreenInnerWidth } from '@/components/screen';
import { ServiceCard } from '@/components/service-card';
import type { Service } from '@/config/services';
import { Radius, Spacing } from '@/constants/theme';
import { columnsFor } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

const GAP = 12;
const layout = LinearTransition.springify().damping(22).stiffness(220);

/**
 * Grid or list of cards. Column count follows the available width, so a
 * foldable gets more columns the moment it's opened, and items glide to
 * their new places when the list is filtered, pinned or re-sorted.
 */
export function CardGrid({
  services,
  variant,
  empty,
}: {
  services: Service[];
  variant: 'grid' | 'list';
  empty?: string;
}) {
  const theme = useTheme();
  const inner = useScreenInnerWidth();

  if (services.length === 0 && empty) {
    return (
      <View style={[styles.empty, { borderColor: theme.border }]}>
        <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>{empty}</Text>
      </View>
    );
  }

  const columns = variant === 'grid' ? columnsFor(inner) : inner >= 640 ? 2 : 1;
  const itemWidth = Math.floor((inner - GAP * (columns - 1)) / columns);

  return (
    <View style={styles.wrap}>
      {services.map((s) => (
        <Animated.View
          key={s.id}
          layout={layout}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}>
          <ServiceCard
            service={s}
            variant={variant === 'grid' ? 'tile' : 'row'}
            width={itemWidth}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  empty: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
});
