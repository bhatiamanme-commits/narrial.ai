import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const LIME = '#A8FF00';

export default function YouTubeConnectionReturnPage() {
  const { result } = useLocalSearchParams<{ result?: string }>();

  useEffect(() => {
    router.replace({
      pathname: '/onboarding',
      params: { youtubeResult: result ?? 'failed' },
    });
  }, [result]);

  return <View accessibilityLiveRegion="polite" style={styles.screen}>
    <ActivityIndicator color={LIME}/>
    <Text style={styles.message}>Completing YouTube connection…</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 24 },
  message: { marginTop: 12, color: '#F8F8F8', fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
