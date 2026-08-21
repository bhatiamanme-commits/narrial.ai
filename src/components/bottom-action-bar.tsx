import { useState } from 'react';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

type BottomActionBarProps = {
  onOpenSocialConnections: () => void;
  onOpenPublishing: () => void;
  onOpenVideoLibrary: () => void;
  disabled?: boolean;
};

type Action = {
  label: string;
  icon: string;
  onPress: () => void;
};

const ICONS = {
  social: '<path d="M11 7.3 7.1 14m5.8-6.7 3.9 6.7M9 17h6" stroke="#9DFF00"/><circle cx="12" cy="5" r="3"/><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/>',
  publishing: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18"/><circle cx="15.5" cy="15.5" r="2.5"/><path d="M15.5 14v1.7l1.1.7"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
} as const;

const supportsNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

function ActionIcon({ path }: { path: string }) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  return <SvgXml xml={xml} width={28} height={28} />;
}

function ActionButton({ action, disabled }: { action: Action; disabled: boolean }) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={action.onPress}
      style={({ pressed, hovered }) => [
        styles.action,
        (hovered || focused) && styles.actionHighlighted,
        pressed && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}>
      <ActionIcon path={action.icon} />
    </Pressable>
  );
}

export function BottomActionBar({
  onOpenSocialConnections,
  onOpenPublishing,
  onOpenVideoLibrary,
  disabled = false,
}: BottomActionBarProps) {
  const actions: Action[] = [
    { label: 'Connect social media', icon: ICONS.social, onPress: onOpenSocialConnections },
    { label: 'Published and scheduled posts', icon: ICONS.publishing, onPress: onOpenPublishing },
    { label: 'Discover viral videos', icon: ICONS.library, onPress: onOpenVideoLibrary },
  ];

  const content = (
    <>
      <View pointerEvents="none" style={styles.glassHighlight} />
      {actions.map((action, index) => (
        <View key={action.label} style={styles.actionSlot}>
          {index > 0 ? <View pointerEvents="none" style={styles.divider} /> : null}
          <ActionButton action={action} disabled={disabled} />
        </View>
      ))}
    </>
  );

  if (supportsNativeGlass) {
    return (
      <GlassView
        accessibilityRole="toolbar"
        accessibilityLabel="Publishing actions"
        colorScheme="dark"
        glassEffectStyle="clear"
        tintColor="rgba(157,255,0,0.12)"
        style={styles.container}>
        {content}
      </GlassView>
    );
  }

  return (
    <View accessibilityRole="toolbar" accessibilityLabel="Publishing actions" style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 68,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(177,255,69,0.58)',
    backgroundColor: 'rgba(157,255,0,0.075)',
  },
  glassHighlight: {
    position: 'absolute',
    top: 1,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  actionSlot: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  divider: {
    position: 'absolute',
    left: 0,
    width: StyleSheet.hairlineWidth,
    height: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(205,255,138,0.28)',
  },
  action: {
    minWidth: 44,
    minHeight: 56,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionHighlighted: {
    borderColor: 'rgba(205,255,138,0.48)',
    backgroundColor: 'rgba(157,255,0,0.1)',
  },
  actionPressed: {
    opacity: 0.78,
    backgroundColor: 'rgba(157,255,0,0.16)',
  },
  actionDisabled: {
    opacity: 0.38,
  },
});
