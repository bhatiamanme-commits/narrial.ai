import { useAuth, useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

type IconName = 'back' | 'user' | 'mail' | 'crown' | 'zap' | 'support' | 'bulb' | 'star' | 'globe' | 'logout';
const paths: Record<IconName, string> = {
  back: '<path d="m15 18-6-6 6-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.9 1.9 0 0 1-2.06 0L2 7"/>',
  crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  support: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="M18 19c0 1.7-1.3 3-3 3h-3"/><path d="M4 14v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2zm16 0v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2z"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M8.5 14.5A7 7 0 1 1 15.5 14.5C14.5 15.3 14 16 14 18h-4c0-2-.5-2.7-1.5-3.5z"/>',
  star: '<path d="m12 2 3 6 7 .9-5 4.8 1.3 7-6.3-3.3-6.3 3.3 1.3-7-5-4.8L9 8l3-6z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
};

function Icon({ name, color = '#FFFFFF', size = 26 }: { name: IconName; color?: string; size?: number }) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

function SettingsRow({ icon, label, value, onPress, danger = false, compact = false }: { icon: IconName; label: string; value?: string; onPress?: () => void; danger?: boolean; compact?: boolean }) {
  const content = <><Icon name={icon} color={danger ? '#FF6464' : '#FFFFFF'} size={compact ? 24 : 26} /><View style={styles.rowCopy}><Text style={[styles.rowLabel, compact && styles.rowLabelCompact, danger && styles.danger]}>{label}</Text>{value ? <Text numberOfLines={1} style={[styles.rowValue, compact && styles.rowValueCompact]}>{value}</Text> : null}</View></>;
  if (!onPress) return <View style={[styles.row, compact && styles.rowCompact]}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, compact && styles.rowCompact, pressed && styles.pressed]}>{content}</Pressable>;
}

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width <= 500;
  const name = user?.fullName ?? user?.firstName ?? 'Your profile';
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Email unavailable';
  const unavailable = (title: string) => Alert.alert(title, 'This option will be available when the service is connected.');
  const confirmSignOut = () => Alert.alert('Sign out?', 'You will need to sign in again to use Narrial.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
  ]);

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[styles.header, compact && styles.headerCompact]}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/generator')} style={({ pressed }) => [styles.backButton, compact && styles.backButtonCompact, pressed && styles.pressed]}><Icon name="back" size={compact ? 21 : 26} /></Pressable><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Settings</Text></View>
    <View style={[styles.card, compact && styles.cardCompact]}>
      <SettingsRow compact={compact} icon="user" label="Profile" value={name} onPress={() => unavailable('Edit profile')} />
      <SettingsRow compact={compact} icon="mail" label="Email" value={email} />
      <SettingsRow compact={compact} icon="crown" label="Subscription" value="View plans" onPress={() => router.push('/subscription?source=settings')} />
      <SettingsRow compact={compact} icon="zap" label="Credits" value="—" onPress={() => unavailable('Credits')} />
    </View>

    <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Support & feedback</Text>
    <View style={[styles.card, compact && styles.cardCompact]}>
      <SettingsRow compact={compact} icon="support" label="Get Support" onPress={() => unavailable('Support')} />
      <SettingsRow compact={compact} icon="bulb" label="Request a Feature" onPress={() => unavailable('Feature request')} />
      <SettingsRow compact={compact} icon="star" label="Rate Narrial" onPress={() => unavailable('Rate Narrial')} />
    </View>

    <View style={[styles.card, styles.singleCard, compact && styles.singleCardCompact]}><SettingsRow compact={compact} icon="globe" label="Narrial Website" onPress={() => unavailable('Narrial Website')} /></View>
    <View style={[styles.card, styles.singleCard, compact && styles.singleCardCompact]}><SettingsRow compact={compact} icon="logout" label="Sign Out" onPress={confirmSignOut} danger /></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080908' }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 48 }, contentCompact: { flexGrow: 1, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 30 }, headerCompact: { marginBottom: 12 }, backButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#343434', alignItems: 'center', justifyContent: 'center' }, backButtonCompact: { width: 44, height: 44, borderRadius: 22 }, title: { color: '#FFFFFF', fontSize: 40, lineHeight: 48, fontWeight: '800', letterSpacing: -1 }, titleCompact: { fontSize: 34, lineHeight: 40 },
  sectionTitle: { marginLeft: 4, marginBottom: 10, color: '#B8B8B8', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }, sectionTitleCompact: { marginBottom: 5, fontSize: 12 }, card: { overflow: 'hidden', marginBottom: 28, borderRadius: 24, borderWidth: 1, borderColor: '#282A29', backgroundColor: '#191B1A' }, cardCompact: { width: '100%', marginBottom: 9, borderRadius: 22 }, singleCard: { marginBottom: 18 }, singleCardCompact: { width: '100%', marginBottom: 7, borderRadius: 22 },
  row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#343635' }, rowCompact: { minHeight: 64, gap: 15, paddingHorizontal: 18 }, rowCopy: { flex: 1, minWidth: 0 }, rowLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' }, rowLabelCompact: { fontSize: 16 }, rowValue: { marginTop: 4, color: '#9B9D9C', fontSize: 15 }, rowValueCompact: { marginTop: 2, fontSize: 13 }, danger: { color: '#FF6464' }, pressed: { opacity: 0.72 },
});
