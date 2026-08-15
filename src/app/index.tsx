import { Image, ImageBackground } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { AuthIcon } from '@/components/auth-components';

const lime = '#9DFF00';
const svgUri = (svg: string) => svg;
const narrialLogo = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48 C139 48 78 129 78 256 C78 382 149 464 256 464 C363 464 434 382 434 256 C434 129 373 48 256 48 Z" fill="#ffffff"/><path d="M126 247 C126 142 183 91 256 91 C329 91 386 142 386 247" fill="none" stroke="#000000" stroke-width="29" stroke-linecap="round"/><path d="M166 292 C166 204 202 151 256 151 C310 151 346 204 346 292" fill="none" stroke="#000000" stroke-width="29" stroke-linecap="round"/><path d="M210 342 C210 277 225 227 256 227 C287 227 302 277 302 342 C302 365 292 381 278 381 C262 381 253 369 253 351 C253 337 259 325 270 321" fill="none" stroke="#000000" stroke-width="29" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
const googleLogo = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6 29.2 4 24 4 14.6 4 6.5 9.4 2.6 17.2l6.6 5.1C10.8 16.4 16.1 12 24 12z"/><path fill="#FF3D00" d="M2.6 17.2 9.2 22.3C10.8 16.4 16.1 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6 29.2 4 24 4 14.6 4 6.5 9.4 2.6 17.2z"/><path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13.1-5.1l-6.1-5.2A11.8 11.8 0 0 1 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C10 39.5 16.5 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3a12 12 0 0 1-4.3 5.7l6.1 5.2C41 35.3 44 29.9 44 24c0-1.4-.1-2.7-.4-4z"/></svg>`);

export default function WelcomeScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 760;

  return (
    <View style={styles.screen}>
      <ImageBackground source={require('../../assets/images/welcome-creator-collage-bordered.png')} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} />
      <View style={styles.shade} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={[styles.hero, compact && styles.heroCompact]}>
            <SvgXml accessibilityLabel="Narrial logo" xml={narrialLogo} width={96} height={96} />
            <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Welcome to{`\n`}<Text style={styles.lime}>Narrial!</Text></Text>
            <Text style={styles.subtitle}>#1 <Text style={styles.lime}>Autolearning</Text> platform</Text>
          </View>

          <View style={styles.bottom}>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" onPress={() => router.push('/signup')} style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}>
                <View style={styles.buttonContent}><View style={styles.googleLogo}><SvgXml xml={googleLogo} width="100%" height="100%" /></View><Text style={styles.googleText}>Continue with Google</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Continue with email" onPress={() => router.push('/signup')} style={({ pressed }) => [styles.button, styles.emailButton, pressed && styles.pressed]}>
                <View style={styles.buttonContent}><View style={styles.emailIcon}><AuthIcon name="mail" size={27} color="#FFFFFF" /></View><Text style={styles.emailText}>Continue with email</Text></View>
              </Pressable>
            </View>

            <Text style={styles.legal}>By continuing, you agree to Narrial&apos;s <Text accessibilityRole="link" onPress={() => Linking.openURL('https://narrial.ai/terms')} style={styles.legalLink}>Terms of Service</Text>.{`\n`}Read our <Text accessibilityRole="link" onPress={() => Linking.openURL('https://narrial.ai/privacy')} style={styles.legalLink}>Privacy Policy</Text>.</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  safeArea: { flex: 1 },
  shade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.22)' },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: 220, paddingBottom: 28 },
  contentCompact: { paddingTop: 145, paddingBottom: 18 },
  hero: { alignItems: 'center' }, heroCompact: { transform: [{ scale: 0.9 }] },
  logo: { width: 96, height: 96 },
  title: { marginTop: 22, color: '#FFFFFF', fontSize: 40, lineHeight: 45, fontWeight: '900', textAlign: 'center', letterSpacing: -1.2 },
  titleCompact: { marginTop: 14, fontSize: 36, lineHeight: 40 }, lime: { color: lime },
  subtitle: { marginTop: 12, color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  bottom: { width: '100%' }, actions: { gap: 14 },
  button: { height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  googleButton: { backgroundColor: lime }, emailButton: { backgroundColor: 'rgba(20,20,20,0.92)', borderWidth: 1, borderColor: '#343434' },
  buttonContent: { width: 272, flexDirection: 'row', alignItems: 'center' }, googleLogo: { width: 29, height: 29, marginRight: 24 }, emailIcon: { width: 29, marginRight: 24 },
  googleText: { color: '#000000', fontSize: 18, lineHeight: 24, fontWeight: '700' }, emailText: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '700' },
  legal: { marginTop: 30, color: '#FFFFFF', fontSize: 13, lineHeight: 21, textAlign: 'center' }, legalLink: { color: lime, textDecorationLine: 'underline' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
