import { StatusBar } from 'expo-status-bar';
import { GlassView } from 'expo-glass-effect';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { getConnectedSocialAccounts } from '@/features/social-accounts/social-accounts';

const GENERATED_VIDEO = require('../../assets/videos/chihuahua-bully-crocodile.mp4');
const arrowIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 7l5 5-5 5"/></svg>';
const regenerateIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></svg>';

export default function GeneratedVideoScreen() {
  const { height } = useWindowDimensions();
  const [checkingAccounts, setCheckingAccounts] = useState(false);
  const player = useVideoPlayer(GENERATED_VIDEO, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.play();
  });

  const continueToPublishing = async () => {
    if (checkingAccounts) return;
    setCheckingAccounts(true);
    try {
      const accounts = await getConnectedSocialAccounts();
      const hasValidAccount = accounts.some((account) => account.connectionStatus === 'connected' && account.tokenStatus === 'valid');
      router.push(hasValidAccount ? '/choose-accounts' : { pathname: '/onboarding', params: { returnTo: '/choose-accounts' } });
    } catch {
      Alert.alert('Couldn’t check accounts', 'Check your internet connection and try again.');
    } finally { setCheckingAccounts(false); }
  };

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <View style={[styles.frame, { width: height * 9 / 16, height }]}>
        <VideoView
          accessibilityLabel="AI-generated video playing full screen with sound"
          contentFit="cover"
          nativeControls={false}
          player={player}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.actionRow, { bottom: Math.max(36, height * 0.055), height: Math.min(88, height * 0.095) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Replay video" onPress={() => player.replay()} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
          <GlassView colorScheme="dark" glassEffectStyle="clear" isInteractive pointerEvents="none" style={styles.glassSurface} tintColor="rgba(255,255,255,0.06)">
            <View pointerEvents="none" style={styles.glassHighlight} />
            <SvgXml xml={regenerateIcon} width={31} height={31} />
          </GlassView>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Continue to choose publishing accounts" accessibilityState={{ busy: checkingAccounts, disabled: checkingAccounts }} disabled={checkingAccounts} onPress={continueToPublishing} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
          <GlassView colorScheme="dark" glassEffectStyle="clear" isInteractive pointerEvents="none" style={styles.glassSurface} tintColor="rgba(255,255,255,0.06)">
            <View pointerEvents="none" style={styles.glassHighlight} />
            {checkingAccounts ? <ActivityIndicator accessibilityLabel="Checking connected accounts" color="#FFFFFF"/> : <SvgXml xml={arrowIcon} width={34} height={34} />}
          </GlassView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#000000' },
  frame: { position: 'relative', flexShrink: 0, overflow: 'hidden', backgroundColor: '#000000' },
  actionRow: { position: 'absolute', left: '5%', width: '90%', flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, borderRadius: 999, shadowColor: '#FFFFFF', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  glassSurface: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)', backgroundColor: 'rgba(255,255,255,0.10)' },
  glassHighlight: { position: 'absolute', top: 4, left: '16%', right: '16%', height: 1.5, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.72)' },
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.965 }] },
});
