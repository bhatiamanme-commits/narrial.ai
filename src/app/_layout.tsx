import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

void SystemUI.setBackgroundColorAsync('#000000');

const narrialTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.local, then restart the dev server.');
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} telemetry={false} tokenCache={tokenCache}>
      <ThemeProvider value={narrialTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
            contentStyle: { backgroundColor: '#000000' },
          }}
        />
      </ThemeProvider>
    </ClerkProvider>
  );
}
