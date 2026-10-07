import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname, type Href } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { ToastProvider } from '@/components/toast';
import { C } from '@/constants/tokens';
import { peek, subscribe, take } from '@/lib/deep-link';
import { useShake } from '@/lib/use-shake';
import { useVault, VaultProvider } from '@/lib/vault-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  usePreventScreenCapture(); // FLAG_SECURE: no screenshots, blank in recents.
  const [fonts] = useFonts({
    BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold,
    JetBrainsMono_400Regular, JetBrainsMono_600SemiBold,
  });
  return (
    <VaultProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <Nav fontsReady={fonts} />
      </ToastProvider>
    </VaultProvider>
  );
}

const ADD_FROM_SHAKE: Href = { pathname: '/add', params: { source: 'shake' } };

function Nav({ fontsReady }: { fontsReady: boolean }) {
  const v = useVault();
  const path = usePathname();
  const ready = fontsReady && v.status !== 'loading';
  const open = v.status === 'unlocked' && !v.onboarding;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useShake(v.settings?.shake, open || v.status === 'locked', () => {
    if (v.status === 'locked') v.setAfterUnlock('/add?source=shake');
    else if (path !== '/add') router.push(ADD_FROM_SHAKE);
  });

  // Tile and shortcut links, parked by +native-intent. They go through the same "after unlock" slot as shake.
  const parked = useSyncExternalStore(subscribe, peek);
  const { status, onboarding, setAfterUnlock } = v;
  useEffect(() => {
    if (!parked || status === 'loading' || status === 'new' || onboarding) return;
    setAfterUnlock(take());
  }, [parked, status, onboarding, setAfterUnlock]);

  // Finish what a shake, tile or shortcut started once the vault opens.
  useEffect(() => {
    if (!open || !v.afterUnlock) return;
    const next = v.afterUnlock;
    v.setAfterUnlock(null);
    if (next.startsWith('/add') && path === '/add') return;
    // Search re-targets the vault screen; Add opens on top of whatever is showing.
    setTimeout(() => (next.startsWith('/add') ? router.push(next as Href) : router.navigate(next as Href)), 0);
  }, [open, v, path]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'fade_from_bottom' }}>
      <Stack.Protected guard={v.status === 'new' || v.onboarding}>
        <Stack.Screen name="setup/index" />
        <Stack.Screen name="setup/password" />
        <Stack.Screen name="setup/biometrics" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={v.status === 'locked'}>
        <Stack.Screen name="unlock" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={open}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen
          name="add"
          // The screen animates itself (sheet slides, backdrop fades): see useSheet.
          options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen name="pending" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/backup" />
        <Stack.Screen name="settings/autofill" />
        <Stack.Screen name="settings/help" />
      </Stack.Protected>
    </Stack>
  );
}
