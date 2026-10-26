import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen, SectionTitle } from '@/components/screen';
import { SELF_SERVICE_HOME } from '@/config/services';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

export default function AccountScreen() {
  const theme = useTheme();
  const {
    username,
    remembered,
    biometricLock,
    biometricAvailable,
    setBiometricLock,
    openPage,
    signOut,
  } = useSession();

  const confirmSignOut = () => {
    const go = () => signOut();
    if (Platform.OS === 'web') return go();
    Alert.alert('Sign out?', 'Your saved password will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: go },
    ]);
  };

  return (
    <Screen title="Account">
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.primaryText }]}>
            {(username ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {username}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            {remembered ? 'Stays signed in on this device' : 'Signed in until the app closes'}
          </Text>
        </View>
      </View>

      <SectionTitle>Security</SectionTitle>
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Row
          icon="finger-print"
          label="Require Face ID / fingerprint"
          detail={
            !remembered
              ? 'Available when "Keep me signed in" is on'
              : !biometricAvailable
                ? 'Not set up on this device'
                : 'Ask before opening the app'
          }
          right={
            <Switch
              value={biometricLock}
              disabled={!remembered || !biometricAvailable}
              onValueChange={(on) => {
                setBiometricLock(on);
              }}
              trackColor={{ true: theme.primary }}
            />
          }
        />
      </View>

      <SectionTitle>Self-Service</SectionTitle>
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Row
          icon="globe-outline"
          label="Open full Self-Service"
          onPress={() => openPage(SELF_SERVICE_HOME, 'Self-Service')}
        />
        <Divider />
        <Row icon="log-out-outline" label="Sign out" destructive onPress={confirmSignOut} />
      </View>

      <Text style={[styles.footnote, { color: theme.textSecondary }]}>
        Union Hub is an unofficial client for Union University Self-Service. Your password is stored
        only in this device&apos;s secure keystore and is only ever entered on uu.edu and Microsoft
        sign-in pages.
      </Text>
    </Screen>
  );
}

function Row({
  icon,
  label,
  detail,
  right,
  destructive,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  right?: React.ReactNode;
  destructive?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const color = destructive ? theme.accent : theme.text;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
        {detail ? <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{detail}</Text> : null}
      </View>
      {right ??
        (onPress && !destructive ? (
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        ) : null)}
    </Pressable>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: 52 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700' },
  group: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  footnote: { fontSize: 12, lineHeight: 17, marginTop: Spacing.two },
});
