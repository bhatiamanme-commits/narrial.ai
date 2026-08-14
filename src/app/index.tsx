import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NarrialButton } from '@/components/narrial-button';
import { NeuralOrb } from '@/components/neural-orb';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Text accessibilityRole="header" style={styles.wordmark}>NARRIAL</Text>
          <Text style={styles.subtitle}><Text style={styles.lime}>AI</Text> Content Automation</Text>
        </View>
        <View accessible accessibilityLabel="Narrial AI neural intelligence visual" style={styles.visualArea}><NeuralOrb /></View>
        <View style={styles.footer}>
          <Text style={styles.tagline}>Let <Text style={styles.lime}>AI</Text> handle your content.{`\n`}You focus on growth.</Text>
          <View style={styles.actions}>
            <NarrialButton label="Get Started" onPress={() => router.push('/onboarding')} />
            <NarrialButton label="Log In" variant="secondary" onPress={() => router.push('/login')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 28, paddingVertical: 20 },
  brand: { alignItems: 'center' },
  wordmark: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 6 },
  subtitle: { marginTop: 8, color: '#FFFFFF', fontSize: 14, fontWeight: '500', letterSpacing: 0.2 },
  lime: { color: '#A8FF00' }, visualArea: { flex: 1, minHeight: 250, justifyContent: 'center', alignItems: 'center' },
  footer: { alignItems: 'center' }, tagline: { color: '#FFFFFF', fontSize: 19, fontWeight: '500', lineHeight: 29, textAlign: 'center' }, actions: { width: '100%', marginTop: 30, gap: 14 },
});
