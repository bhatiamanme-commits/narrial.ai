import { Pressable, StyleSheet, Text } from 'react-native';

type NarrialButtonProps = { label: string; onPress: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean };

export function NarrialButton({ label, onPress, variant = 'primary', disabled = false }: NarrialButtonProps) {
  const secondary = variant === 'secondary';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary ? styles.secondary : styles.primary, pressed && styles.pressed, disabled && styles.disabled]}><Text style={[styles.label, secondary ? styles.secondaryLabel : styles.primaryLabel]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 2 }, primary: { backgroundColor: '#A8FF00', borderColor: '#A8FF00' }, secondary: { backgroundColor: 'transparent', borderColor: '#A8FF00' }, label: { fontSize: 16, fontWeight: '700' }, primaryLabel: { color: '#000000' }, secondaryLabel: { color: '#A8FF00' }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.45 },
});
