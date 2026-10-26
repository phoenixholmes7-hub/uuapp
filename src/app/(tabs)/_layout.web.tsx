import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, Tabs, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, type PressableProps, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Web preview: a plain bottom bar standing in for the native tab bar. */
export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            paddingBottom: insets.bottom,
          },
        ]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="home">Home</TabButton>
        </TabTrigger>
        <TabTrigger name="discover" href="/discover" asChild>
          <TabButton icon="search">Discover</TabButton>
        </TabTrigger>
        <TabTrigger name="account" href="/account" asChild>
          <TabButton icon="person-circle">Account</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.primary : theme.textSecondary;
  return (
    <Pressable {...(props as PressableProps)} style={styles.button}>
      <Ionicons name={isFocused ? icon : (`${icon}-outline` as IconName)} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  button: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },
  label: { fontSize: 11, fontWeight: '600' },
});
