import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

const colors = { lime: '#9DFF00', white: '#FFFFFF', muted: '#8E8E93', surface: '#090909', border: '#292929', error: '#EF4444' };
const svgUri = (svg: string) => svg;

const logos = {
  Google: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6 29.2 4 24 4 14.6 4 6.5 9.4 2.6 17.2l6.6 5.1C10.8 16.4 16.1 12 24 12z"/><path fill="#FF3D00" d="M2.6 17.2 9.2 22.3C10.8 16.4 16.1 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6 29.2 4 24 4 14.6 4 6.5 9.4 2.6 17.2z"/><path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13.1-5.1l-6.1-5.2A11.8 11.8 0 0 1 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C10 39.5 16.5 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3a12 12 0 0 1-4.3 5.7l6.1 5.2C41 35.3 44 29.9 44 24c0-1.4-.1-2.7-.4-4z"/></svg>`),
  Apple: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 39"><path fill="#fff" d="M26.9 20.2c0-5 4.1-7.4 4.3-7.5a9.2 9.2 0 0 0-7.2-3.9c-3-.3-6 1.8-7.5 1.8-1.6 0-4-1.8-6.5-1.7A9.6 9.6 0 0 0 2 13.8c-3.5 6-.9 14.9 2.5 19.7 1.7 2.4 3.6 5 6.2 4.9 2.5-.1 3.5-1.6 6.5-1.6s3.9 1.6 6.6 1.5c2.7 0 4.4-2.4 6-4.8a21 21 0 0 0 2.8-5.7 8.6 8.6 0 0 1-5.7-7.6zM22 5.7A8.7 8.7 0 0 0 24 0a8.9 8.9 0 0 0-5.8 2.8A8.2 8.2 0 0 0 16 8.3 7.4 7.4 0 0 0 22 5.7z"/></svg>`),
};

export type AuthIconName = 'user' | 'mail' | 'lock' | 'eye' | 'eye-off' | 'chevron-left' | 'sparkle';
const iconPaths: Record<AuthIconName, string> = {
  user: '<circle cx="12" cy="7" r="4"/><path d="M4.5 21v-2.5A5.5 5.5 0 0 1 10 13h4a5.5 5.5 0 0 1 5.5 5.5V21z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3"/><path d="M12 15v3"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="m3 3 18 18"/><path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3 3.8M6.2 6.3C3.5 8 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  sparkle: '<path fill="currentColor" stroke="none" d="M12 1c.8 6.7 4.3 10.2 11 11-6.7.8-10.2 4.3-11 11C11.2 16.3 7.7 12.8 1 12 7.7 11.2 11.2 7.7 12 1z"/>',
};

export function AuthIcon({ name, size = 24, color = colors.lime }: { name: AuthIconName; size?: number; color?: string }) {
  const fill = name === 'sparkle' ? `fill="${color}"` : 'fill="none"';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${fill} stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name].replace('currentColor', color)}</svg>`;
  return <SvgXml xml={svg} width={size} height={size} />;
}

export function SocialAuthButton({ provider, onPress, disabled, compact }: { provider: 'Google' | 'Apple'; onPress: () => void; disabled?: boolean; compact?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Continue with ${provider}`} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.socialButton, compact && styles.socialButtonCompact, pressed && styles.pressed, disabled && styles.disabled]}><View style={styles.socialContent}><View style={[styles.providerLogo, provider === 'Apple' && styles.appleLogo]}><SvgXml xml={logos[provider]} width="100%" height="100%" /></View><Text style={styles.socialLabel}>Continue with {provider}</Text></View></Pressable>;
}

export function AuthDivider() { return <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>OR</Text><View style={styles.divider} /></View>; }

export function FormField({ label, icon, error, focused, compact, children }: { label: string; icon: ReactNode; error?: string; focused: boolean; compact?: boolean; children: ReactNode }) {
  return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><View style={[styles.inputShell, compact && styles.inputShellCompact, focused && styles.inputFocused, !!error && styles.inputError]}><View aria-hidden style={styles.fieldIcon}>{icon}</View>{children}</View>{!!error && <Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text>}</View>;
}

export function FieldInput(props: React.ComponentProps<typeof TextInput>) { return <TextInput placeholderTextColor={colors.muted} selectionColor={colors.lime} style={styles.input} {...props} />; }

export function TermsCheckbox({ checked, onPress, disabled }: { checked: boolean; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel="Agree to the Terms and Privacy Policy" accessibilityState={{ checked, disabled }} disabled={disabled} hitSlop={10} onPress={onPress} style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked && <Text style={styles.checkmark}>✓</Text>}</Pressable>;
}

const styles = StyleSheet.create({
  socialButton: { height: 58, borderWidth: 1.4, borderColor: colors.lime, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }, socialButtonCompact: { height: 52, borderRadius: 16 },
  socialContent: { minWidth: 244, flexDirection: 'row', alignItems: 'center' }, providerLogo: { width: 27, height: 27, marginRight: 22 }, appleLogo: { width: 25, height: 29 }, socialLabel: { color: colors.white, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] }, disabled: { opacity: 0.45 }, dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 18 }, divider: { height: 1, flex: 1, backgroundColor: colors.border }, dividerText: { color: '#A5A5AA', fontSize: 14, lineHeight: 18, fontWeight: '600' },
  fieldGroup: { gap: 6 }, fieldLabel: { color: colors.white, fontSize: 15, lineHeight: 20, fontWeight: '500' }, inputShell: { height: 58, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16 }, inputShellCompact: { height: 52, borderRadius: 16 }, inputFocused: { borderColor: colors.lime }, inputError: { borderColor: colors.error }, fieldIcon: { width: 36, alignItems: 'flex-start' }, input: { height: '100%', flex: 1, paddingVertical: 0, color: colors.white, fontSize: 16 }, errorText: { color: colors.error, fontSize: 12, lineHeight: 15 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: colors.lime, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 1 }, checkboxChecked: { backgroundColor: '#101900' }, checkmark: { color: colors.lime, fontSize: 15, lineHeight: 17, fontWeight: '800' },
});
