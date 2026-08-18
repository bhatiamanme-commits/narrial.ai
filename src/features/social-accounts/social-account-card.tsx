import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { SocialPlatform } from './social-accounts';

const LIME = '#A8FF00';

export function PlatformIcon({ id, name }: Pick<SocialPlatform, 'id' | 'name'>) {
  const icon = (() => {
    switch (id) {
      case 'instagram':
        return <Svg width={48} height={48} viewBox="0 0 48 48"><Defs><LinearGradient id="ig" x1="4" y1="44" x2="44" y2="4"><Stop offset="0" stopColor="#FFD600"/><Stop offset=".35" stopColor="#FF3A5E"/><Stop offset=".7" stopColor="#C42CA8"/><Stop offset="1" stopColor="#7638FA"/></LinearGradient></Defs><Rect x="3" y="3" width="42" height="42" rx="12" fill="url(#ig)"/><Rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#FFF" strokeWidth="3.4"/><Circle cx="24" cy="24" r="6.5" fill="none" stroke="#FFF" strokeWidth="3.4"/><Circle cx="33.5" cy="14.7" r="2.1" fill="#FFF"/></Svg>;
      case 'tiktok':
        return <Svg width={48} height={48} viewBox="0 0 48 48"><Path d="M27 7v23.2a7.8 7.8 0 1 1-6.6-7.7" fill="none" stroke="#25F4EE" strokeWidth="7" strokeLinecap="round"/><Path d="M30 7c1 6 4.8 9.2 10 9.8" fill="none" stroke="#FE2C55" strokeWidth="7"/><Path d="M29 7v22.2a7.8 7.8 0 1 1-6.6-7.7M29 7c1 6 4.8 9.2 10 9.8" fill="none" stroke="#FFF" strokeWidth="5" strokeLinecap="round"/></Svg>;
      case 'youtube':
        return <Svg width={52} height={40} viewBox="0 0 52 40"><Rect x="1" y="4" width="50" height="32" rx="9" fill="#FF0000"/><Path d="m22 14 13 6-13 7z" fill="#FFF"/></Svg>;
      case 'facebook':
        return <Svg width={56} height={56} viewBox="0 0 56 56"><Circle cx="28" cy="28" r="27" fill="#1877F2"/><Path d="M31.8 48V30.2h6l.9-7h-6.9v-4.5c0-2  .6-3.4 3.5-3.4H39V9a50 50 0 0 0-5.4-.3c-5.3 0-8.9 3.2-8.9 9.2v5.2h-6v7h6V48z" fill="#FFF"/></Svg>;
      case 'x':
        return <Svg width={48} height={48} viewBox="0 0 48 48"><Path d="M8 7h9.7l8.7 11.6L36.5 7H41L28.5 21.7 42 41H32.3l-9.2-12.2L12.6 41H8l13-15.3zM15.4 11l19 26h2.3l-19-26z" fill="#FFF"/></Svg>;
      case 'linkedin':
        return <Svg width={56} height={56} viewBox="0 0 56 56"><Circle cx="28" cy="28" r="27" fill="#0A66C2"/><G fill="#FFF"><Circle cx="17" cy="18" r="3.2"/><Path d="M14 24h6v19h-6zM24 24h5.8v2.6h.1c1.5-2.4 3.7-3.4 6.4-3.4 6.1 0 7.2 4 7.2 9.2V43h-6V33.6c0-2.3 0-5.1-3.1-5.1-3.2 0-3.7 2.4-3.7 5V43h-6z"/></G></Svg>;
    }
  })();

  return <View accessibilityLabel={`${name} logo`} style={[styles.iconShell, id === 'facebook' || id === 'linkedin' ? styles.iconShellBare : null]}>{icon}</View>;
}

function ConnectedStatus({ compact }: { compact: boolean }) {
  return <View accessibilityLabel="Connected" style={[styles.status, compact && styles.statusCompact]}><View style={[styles.checkCircle, compact && styles.checkCircleCompact]}><Svg width={20} height={20} viewBox="0 0 24 24"><Path d="m5 12 4 4L19 6" fill="none" stroke="#080808" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/></Svg></View><Text style={[styles.statusText, compact && styles.statusTextCompact]}>Connected</Text></View>;
}

type Props = {
  platform: SocialPlatform;
  connecting: boolean;
  compact?: boolean;
  onConnect: (platform: SocialPlatform) => void;
};

export function SocialAccountCard({ platform, connecting, compact = false, onConnect }: Props) {
  return <View style={[styles.card, compact && styles.cardCompact]}><View style={compact && styles.compactIcon}><PlatformIcon id={platform.id} name={platform.name}/></View><Text numberOfLines={1} style={[styles.name, compact && styles.nameCompact]}>{platform.name}</Text>{platform.connected && platform.verified ? <ConnectedStatus compact={compact}/> : <Pressable accessibilityRole="button" accessibilityLabel={`Connect ${platform.name}`} accessibilityState={{ busy: connecting, disabled: connecting }} disabled={connecting} onPress={() => onConnect(platform)} style={({ pressed }) => [styles.connectButton, compact && styles.connectButtonCompact, pressed && styles.pressed, connecting && styles.disabled]}>{connecting ? <><ActivityIndicator size="small" color={LIME}/><Text style={[styles.connectText, compact && styles.connectTextCompact]}>Connecting</Text></> : <Text style={[styles.connectText, compact && styles.connectTextCompact]}>Connect</Text>}</Pressable>}</View>;
}

const styles = StyleSheet.create({
  card: { minHeight: 94, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: '#111211', borderWidth: 1, borderColor: '#202120', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  cardCompact: { minHeight: 82, paddingHorizontal: 10, paddingVertical: 9 },
  iconShell: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#030303', borderWidth: 1, borderColor: '#343434' },
  iconShellBare: { borderWidth: 0, backgroundColor: 'transparent' },
  compactIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 26, transform: [{ scale: 0.84 }] },
  name: { flex: 1, marginLeft: 18, color: '#F8F8F8', fontSize: 22, lineHeight: 28, fontWeight: '500' },
  nameCompact: { marginLeft: 10, fontSize: 18, lineHeight: 23 },
  status: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusCompact: { minHeight: 44, gap: 6 },
  checkCircle: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: LIME },
  checkCircleCompact: { width: 25, height: 25, borderRadius: 13 },
  statusText: { color: LIME, fontSize: 16, fontWeight: '700' },
  statusTextCompact: { fontSize: 14 },
  connectButton: { minWidth: 108, minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: LIME },
  connectButtonCompact: { minWidth: 96, minHeight: 44, gap: 5, paddingHorizontal: 10 },
  connectText: { color: LIME, fontSize: 16, fontWeight: '700' },
  connectTextCompact: { fontSize: 14 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.65 },
});
