import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { SocialAccountCard } from '@/features/social-accounts/social-account-card';
import { connectSocialAccount, disconnectAllSocialAccounts, getConnectedSocialAccounts, INITIAL_SOCIAL_PLATFORMS, type SocialPlatform, type SocialPlatformId } from '@/features/social-accounts/social-accounts';

const LIME = '#A8FF00';

function BackIcon() { return <Svg width={27} height={27} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6M9 12h10" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>; }
function MoreIcon() { return <Svg width={28} height={28} viewBox="0 0 24 24"><Circle cx="5" cy="12" r="1.8" fill="#FFF"/><Circle cx="12" cy="12" r="1.8" fill="#FFF"/><Circle cx="19" cy="12" r="1.8" fill="#FFF"/></Svg>; }
function CloseIcon() { return <Svg width={27} height={27} viewBox="0 0 24 24"><Path d="M6 6l12 12M18 6 6 18" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round"/></Svg>; }
function ArrowIcon() { return <Svg width={27} height={27} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6M15 12H4" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>; }

type CircularIconButtonProps = { label: string; icon: React.ReactNode; onPress: () => void; expanded?: boolean };
function CircularIconButton({ label, icon, onPress, expanded }: CircularIconButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={expanded === undefined ? undefined : { expanded }} onPress={onPress} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>{icon}</Pressable>;
}

export default function ConnectSocialAccountsPage() {
  const { height, width } = useWindowDimensions();
  const compact = height < 780 || width < 360;
  const [platforms, setPlatforms] = useState(INITIAL_SOCIAL_PLATFORMS);
  const [connectingId, setConnectingId] = useState<SocialPlatformId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void getConnectedSocialAccounts().then((accounts) => {
      const connectedPlatforms = new Set(accounts.filter((account) => account.connectionStatus === 'connected' && account.tokenStatus === 'valid').map((account) => account.platform));
      setPlatforms((current) => current.map((platform) => ({ ...platform, connected: connectedPlatforms.has(platform.id), verified: connectedPlatforms.has(platform.id) })));
    }).catch(() => setMessage('Could not refresh connected accounts.'));
  }, []);

  const handleConnect = async (platform: SocialPlatform) => {
    if (connectingId) return;
    setConnectingId(platform.id);
    setMessage(`Connecting ${platform.name}.`);
    try {
      const connection = await connectSocialAccount(platform.id);
      if (!connection.connected || !connection.verified) {
        setMessage(`${platform.name} connection is not available yet.`);
        return;
      }
      setPlatforms((current) => current.map((item) => item.id === platform.id ? { ...item, connected: connection.connected, verified: connection.verified } : item));
      setMessage(`${platform.name} connected successfully.`);
      await new Promise((resolve) => setTimeout(resolve, 350));
      router.replace('/choose-accounts');
    } catch {
      setMessage(`Could not connect ${platform.name}. Please try again.`);
    } finally {
      setConnectingId(null);
    }
  };

  const disconnectAll = () => {
    setMenuOpen(false);
    Alert.alert('Disconnect all accounts?', 'You will need to reconnect an account before publishing.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect all', style: 'destructive', onPress: () => { void disconnectAllSocialAccounts().then(() => { setPlatforms((current) => current.map((item) => ({ ...item, connected: false, verified: false }))); setMessage('All social accounts disconnected.'); }); } },
    ]);
  };

  const handleContinue = async () => {
    if (continuing) return;
    const connected = platforms.some((platform) => platform.connected && platform.verified);
    if (!connected) { setMessage('Connect at least one social account to continue.'); return; }
    setContinuing(true);
    setMessage('Opening account selection.');
    await new Promise((resolve) => setTimeout(resolve, 250));
    router.replace('/choose-accounts');
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><View style={styles.page}>
    <View style={styles.topBar}><CircularIconButton label="Go back" icon={<BackIcon/>} onPress={() => router.back()}/><View style={styles.topActions}><CircularIconButton label="More options" icon={<MoreIcon/>} expanded={menuOpen} onPress={() => setMenuOpen(true)}/><CircularIconButton label="Cancel account connection" icon={<CloseIcon/>} onPress={() => router.back()}/></View></View>
    <ScrollView contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.headingBlock}><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Connect Social Accounts</Text><Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Connect your accounts so Narrial can publish your generated videos.</Text></View>
      <View style={[styles.list, compact && styles.listCompact]}>{platforms.map((platform) => <SocialAccountCard key={platform.id} platform={platform} connecting={connectingId === platform.id} compact={compact} onConnect={handleConnect}/>)}</View>
    </ScrollView>
    <View accessibilityLiveRegion="polite" style={styles.liveRegion}><Text style={[styles.liveText, !message && styles.hiddenText]}>{message || 'Ready'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Continue" accessibilityState={{ busy: continuing, disabled: continuing }} disabled={continuing} onPress={handleContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed, continuing && styles.continueDisabled]}>{continuing ? <ActivityIndicator color="#050505"/> : <Text style={styles.continueText}>Continue</Text>}<View style={styles.arrowCircle}><ArrowIcon/></View></Pressable>
  </View>
  <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}><Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}><View accessibilityRole="menu" style={styles.menu} onStartShouldSetResponder={() => true}><Pressable accessibilityRole="menuitem" onPress={() => { setMenuOpen(false); Alert.alert('Help', 'Social account connections let Narrial publish approved videos on your behalf.'); }} style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}><Text style={styles.menuText}>Help</Text></Pressable><View style={styles.menuDivider}/><Pressable accessibilityRole="menuitem" onPress={disconnectAll} style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}><Text style={styles.disconnectText}>Disconnect all</Text></Pressable></View></Pressable></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' }, page: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, topActions: { flexDirection: 'row', gap: 10 }, circleButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', borderWidth: 1, borderColor: LIME },
  scrollContent: { paddingTop: 22, paddingBottom: 14 }, scrollContentCompact: { paddingTop: 12 }, headingBlock: { marginBottom: 30 }, title: { color: '#F8F8F8', fontSize: 36, lineHeight: 43, fontWeight: '800', letterSpacing: -0.8 }, titleCompact: { fontSize: 30, lineHeight: 36 }, subtitle: { maxWidth: 510, marginTop: 12, color: '#B5B5B5', fontSize: 19, lineHeight: 28 }, subtitleCompact: { fontSize: 16, lineHeight: 23 }, list: { gap: 14 }, listCompact: { gap: 10 },
  liveRegion: { minHeight: 22, justifyContent: 'center' }, liveText: { color: '#B5B5B5', fontSize: 13, lineHeight: 18, textAlign: 'center' }, hiddenText: { opacity: 0 },
  continueButton: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: LIME, paddingHorizontal: 12 }, continueText: { color: '#050505', fontSize: 22, fontWeight: '800' }, arrowCircle: { position: 'absolute', right: 9, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' }, continueDisabled: { opacity: 0.68 }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  menuBackdrop: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 24, paddingTop: 82 }, menu: { width: '100%', maxWidth: 570, alignSelf: 'center', backgroundColor: '#181918', borderRadius: 16, borderWidth: 1, borderColor: '#333', overflow: 'hidden' }, menuItem: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 18 }, menuItemPressed: { backgroundColor: '#242524' }, menuDivider: { height: 1, backgroundColor: '#303130' }, menuText: { color: '#FFF', fontSize: 16, fontWeight: '600' }, disconnectText: { color: LIME, fontSize: 16, fontWeight: '600' },
});
