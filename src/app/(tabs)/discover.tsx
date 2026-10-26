import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CardGrid } from '@/components/card-grid';
import { Screen } from '@/components/screen';
import { type Category, CATEGORIES, SERVICES } from '@/config/services';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePrefs } from '@/state/prefs';

export default function DiscoverScreen() {
  const theme = useTheme();
  const { favorites, recent, sort, update } = usePrefs();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const q = useDeferredValue(query.trim().toLowerCase());

  const results = useMemo(() => {
    const matches = SERVICES.filter(
      (s) =>
        (!category || s.category === category) &&
        (!q ||
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q))),
    );
    if (sort === 'az') return [...matches].sort((a, b) => a.title.localeCompare(b.title));
    // Recommended: pinned first, then recently used, then catalogue order.
    const rank = (id: string) =>
      favorites.includes(id) ? 0 : recent.includes(id) ? 1 + recent.indexOf(id) / 10 : 2;
    return [...matches].sort((a, b) => rank(a.id) - rank(b.id));
  }, [q, category, sort, favorites, recent]);

  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={[
        styles.chip,
        {
          borderColor: on ? theme.primary : theme.border,
          backgroundColor: on ? theme.primary : theme.surface,
        },
      ]}>
      <Text style={[styles.chipText, { color: on ? theme.primaryText : theme.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen title="Discover" subtitle={`${SERVICES.length} Self-Service tools`}>
      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find grades, aid, registration…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {chip('All', !category, () => setCategory(null))}
        {CATEGORIES.map((c) =>
          chip(c, category === c, () => setCategory(category === c ? null : c)),
        )}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>SORT BY</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => update({ sort: sort === 'az' ? 'recommended' : 'az' })}
          style={styles.sortBtn}>
          <Text style={[styles.sortValue, { color: theme.text }]}>
            {sort === 'az' ? 'A–Z' : 'Recommended'}
          </Text>
          <Ionicons name="swap-vertical" size={14} color={theme.textSecondary} />
        </Pressable>
      </View>

      <CardGrid services={results} variant="list" empty={`Nothing matches “${query}”.`} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    height: 48,
  },
  input: { flex: 1, fontSize: 16, height: '100%', outlineWidth: 0 },
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sortLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortValue: { fontSize: 14, fontWeight: '600' },
});
