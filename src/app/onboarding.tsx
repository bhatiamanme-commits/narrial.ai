import { useAuth } from '@clerk/expo';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NarrialButton } from '@/components/narrial-button';

export default function OnboardingScreen() {
  const { signOut } = useAuth();

  const returnToWelcome = async () => {
    await signOut();
    router.replace('/');
  };

  return <SafeAreaView style={styles.screen}><View style={styles.content}><Text accessibilityRole="header" style={styles.title}>Let&apos;s build your{`\n`}content system.</Text><Text style={styles.copy}>Your personalized Narrial setup starts here.</Text><NarrialButton label="Back to welcome" variant="secondary" onPress={returnToWelcome} /></View></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 28 }, content: { width: '100%', maxWidth: 500, alignSelf: 'center', gap: 22 }, title: { color: '#fff', fontSize: 32, lineHeight: 40, fontWeight: '800' }, copy: { color: '#A3A3A3', fontSize: 17, lineHeight: 25 } });
