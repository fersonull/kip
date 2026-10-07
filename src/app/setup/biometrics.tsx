import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Body, Button, Icon, Pebble, s, Title } from '@/components/ui';
import { C } from '@/constants/tokens';
import { canUseBio } from '@/lib/keys';
import { useVault } from '@/lib/vault-context';

export default function Biometrics() {
  const v = useVault();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const pick = async (yes: boolean) => {
    setBusy(true);
    try {
      await v.finishOnboarding(yes);
      if (!yes) toast.flash('No problem. Turn it on any time in Settings.', 'info');
      else if (canUseBio()) toast.flash('Fingerprint on. You’re all set.');
      else toast.flash('No fingerprint set up on this phone yet. Add one, then turn it on in Settings.', 'info');
    } catch {
      setBusy(false);
      toast.flash('Fingerprint didn’t go through. You can turn it on in Settings.', 'info');
      await v.finishOnboarding(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 28 }}>
        <Text style={s.mono}>STEP 2 OF 2</Text>
        <Title size={36} style={{ marginTop: 8 }}>Skip the typing next time?</Title>
        <Body style={{ marginTop: 12 }}>Open Kip with your fingerprint or face. Your master password still works whenever you need it.</Body>
        <View style={{ flex: 1 }} />
        <Pebble w={140} h={118} style={{ alignSelf: 'center' }}>
          <Icon name="fingerprint" size={60} />
        </Pebble>
        <View style={{ flex: 1 }} />
        <Button title="Use fingerprint" onPress={() => pick(true)} disabled={busy} />
        <Button title="Not now" kind="ghost" height={48} style={{ marginTop: 8 }} onPress={() => pick(false)} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}
