import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthDivider, AuthIcon, FieldInput, FormField, SocialAuthButton, TermsCheckbox } from '@/components/auth-components';

type FieldName = 'fullName' | 'email' | 'password';
type Errors = Partial<Record<FieldName | 'terms', string>>;
type RegistrationDetails = { fullName: string; email: string; password: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const unavailableMessage = 'Account creation is not available yet. Please try again when authentication is connected.';

async function registerWithEmail(_details: RegistrationDetails): Promise<void> {
  throw new Error(unavailableMessage);
}

async function registerWithProvider(_provider: 'google' | 'apple'): Promise<void> {
  throw new Error(unavailableMessage);
}

export default function SignUpScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 820;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState<FieldName | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = 'Enter your full name.';
    if (!emailPattern.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (!agreed) next.terms = 'Accept the Terms and Privacy Policy to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const createAccount = async () => {
    setMessage('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await registerWithEmail({ fullName: fullName.trim(), email: email.trim(), password });
      router.replace('/onboarding');
    } catch {
      setMessage('We couldn’t create your account. Account creation is not available yet; please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const continueWith = async (provider: 'google' | 'apple') => {
    setMessage('');
    if (!agreed) {
      setErrors((current) => ({ ...current, terms: 'Accept the Terms and Privacy Policy to continue.' }));
      return;
    }
    setSubmitting(true);
    try {
      await registerWithProvider(provider);
      router.replace('/onboarding');
    } catch {
      setMessage(`${provider === 'google' ? 'Google' : 'Apple'} sign-up is not available yet. Please try again later.`);
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (field: FieldName) => setErrors((current) => ({ ...current, [field]: undefined }));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, compact && styles.contentCompact]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <AuthIcon name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>

            <View style={[styles.header, compact && styles.headerCompact]}>
              <Text accessibilityRole="header" style={styles.supporting}>Create your account and start automating your content in just <Text style={styles.lime}>a few steps.</Text></Text>
            </View>

            <View style={[styles.socialGroup, compact && styles.socialGroupCompact]}>
              <SocialAuthButton provider="Google" compact={compact} disabled={submitting} onPress={() => continueWith('google')} />
              <SocialAuthButton provider="Apple" compact={compact} disabled={submitting} onPress={() => continueWith('apple')} />
            </View>

            <AuthDivider />

            <View style={[styles.form, compact && styles.formCompact]}>
              <FormField label="Full Name" icon={<AuthIcon name="user" />} compact={compact} error={errors.fullName} focused={focused === 'fullName'}>
                <FieldInput accessibilityLabel="Full Name" autoCapitalize="words" autoComplete="name" editable={!submitting} placeholder="Enter your full name" returnKeyType="next" value={fullName} onBlur={() => setFocused(null)} onChangeText={(value) => { setFullName(value); clearError('fullName'); }} onFocus={() => setFocused('fullName')} />
              </FormField>
              <FormField label="Email" icon={<AuthIcon name="mail" />} compact={compact} error={errors.email} focused={focused === 'email'}>
                <FieldInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" editable={!submitting} inputMode="email" keyboardType="email-address" placeholder="Enter your email address" returnKeyType="next" value={email} onBlur={() => setFocused(null)} onChangeText={(value) => { setEmail(value); clearError('email'); }} onFocus={() => setFocused('email')} />
              </FormField>
              <FormField label="Password" icon={<AuthIcon name="lock" />} compact={compact} error={errors.password} focused={focused === 'password'}>
                <FieldInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="new-password" editable={!submitting} placeholder="Create a strong password" returnKeyType="done" secureTextEntry={!passwordVisible} value={password} onBlur={() => setFocused(null)} onChangeText={(value) => { setPassword(value); clearError('password'); }} onFocus={() => setFocused('password')} onSubmitEditing={createAccount} />
                <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setPasswordVisible((visible) => !visible)}>
                  <AuthIcon name={passwordVisible ? 'eye-off' : 'eye'} size={25} />
                </Pressable>
              </FormField>

              <View>
                <View style={styles.termsRow}>
                  <TermsCheckbox checked={agreed} disabled={submitting} onPress={() => { setAgreed((value) => !value); setErrors((current) => ({ ...current, terms: undefined })); }} />
                  <Text style={styles.termsText}>By creating an account, you agree to{`\n`}our <Text accessibilityRole="link" onPress={() => Linking.openURL('https://narrial.ai/terms')} style={styles.lime}>Terms</Text> &amp; <Text accessibilityRole="link" onPress={() => Linking.openURL('https://narrial.ai/privacy')} style={styles.lime}>Privacy Policy</Text></Text>
                </View>
                {!!errors.terms && <Text accessibilityLiveRegion="polite" style={styles.termsError}>{errors.terms}</Text>}
              </View>

              {!!message && <Text accessibilityLiveRegion="assertive" style={styles.submitError}>{message}</Text>}

              <Pressable accessibilityRole="button" accessibilityLabel="Create Account" accessibilityState={{ busy: submitting, disabled: submitting }} disabled={submitting} onPress={createAccount} style={({ pressed }) => [styles.cta, compact && styles.ctaCompact, pressed && styles.pressed, submitting && styles.disabled]}>
                {submitting ? <View style={styles.loading}><ActivityIndicator color="#000000" /><Text style={styles.ctaText}>Creating Account...</Text></View> : <Text style={styles.ctaText}>Create Account</Text>}
              </Pressable>
            </View>

            <View style={[styles.footer, compact && styles.footerCompact]}><Text style={styles.footerText}>Already have an account? </Text><Pressable accessibilityRole="link" onPress={() => router.push('/login')}><Text style={styles.loginLink}>Log In</Text></Pressable></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, screen: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1 }, content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 14, paddingBottom: 24 }, contentCompact: { paddingTop: 8, paddingBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#141414' },
  header: { marginTop: 22, marginBottom: 20 }, headerCompact: { marginTop: 12, marginBottom: 14 },
  supporting: { color: '#E5E5E5', fontSize: 17, lineHeight: 24, fontWeight: '500' }, lime: { color: '#9DFF00' },
  socialGroup: { gap: 14, marginBottom: 22 }, socialGroupCompact: { gap: 10, marginBottom: 16 }, form: { gap: 16, marginTop: 22 }, formCompact: { gap: 11, marginTop: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  termsText: { flex: 1, color: '#FFFFFF', fontSize: 15, lineHeight: 24 }, termsError: { color: '#EF4444', fontSize: 13, lineHeight: 18, marginTop: 7, marginLeft: 35 },
  submitError: { color: '#EF4444', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: -5 },
  cta: { height: 58, borderRadius: 18, backgroundColor: '#9DFF00', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }, ctaCompact: { height: 54, borderRadius: 16 },
  ctaText: { color: '#000000', fontSize: 18, lineHeight: 24, fontWeight: '800' }, loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 }, footerCompact: { marginTop: 16 }, footerText: { color: '#FFFFFF', fontSize: 15 }, loginLink: { color: '#9DFF00', fontSize: 15 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.5 },
});
