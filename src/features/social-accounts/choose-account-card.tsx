import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PlatformIcon } from './social-account-card';
import { isSocialAccountValid, type SocialAccount } from './social-accounts';

const LIME = '#A8FF00';

type Props = {
  account: SocialAccount;
  selected: boolean;
  disabled?: boolean;
  onToggle: (account: SocialAccount) => void;
};

export function ChooseAccountCard({ account, selected, disabled = false, onToggle }: Props) {
  const expired = !isSocialAccountValid(account);
  return <Pressable
    accessibilityRole="checkbox"
    accessibilityLabel={`${account.displayName}, ${account.username}${expired ? ', reconnect required' : ''}`}
    accessibilityState={{ checked: selected, disabled }}
    disabled={disabled}
    onPress={() => onToggle(account)}
    style={({ pressed }) => [styles.card, selected && styles.cardSelected, expired && styles.cardExpired, pressed && styles.pressed]}
  >
    <View style={styles.avatar}>{account.platform === 'youtube' && account.avatarUrl
      ? <Image accessibilityLabel={`${account.displayName} channel logo`} source={{ uri: account.avatarUrl }} style={styles.channelAvatar}/>
      : <PlatformIcon id={account.platform} name={account.displayName}/>}</View>
    <View style={styles.copy}><Text numberOfLines={1} style={styles.name}>{account.displayName}</Text><Text numberOfLines={1} style={[styles.username, expired && styles.expiredText]}>{expired ? 'Reconnect required' : account.username}</Text></View>
    <View style={[styles.selection, selected && styles.selectionSelected]}>{selected ? <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="m5 12 4 4L19 6" fill="none" stroke="#050505" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></Svg> : null}</View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { minHeight: 92, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderWidth: 1, borderColor: '#202120', backgroundColor: '#111211' },
  cardSelected: { borderColor: '#5C8A13', backgroundColor: '#151A10' }, cardExpired: { opacity: 0.72 },
  avatar: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  channelAvatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#232323' },
  copy: { flex: 1, minWidth: 0, marginLeft: 18 }, name: { color: '#F7F7F7', fontSize: 20, lineHeight: 26, fontWeight: '600' }, username: { marginTop: 4, color: '#AAAAAA', fontSize: 16, lineHeight: 21 }, expiredText: { color: '#FF8A8A' },
  selection: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: LIME, backgroundColor: '#070707' }, selectionSelected: { backgroundColor: LIME },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
