import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Body, Button, Icon, IconButton, Pebble, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { useVault } from '@/lib/vault-context';

import Autofill from '../../../modules/kip-autofill';

const STEPS: [string, string, string][] = [
  ['Tap the button below. Android opens ', 'Autofill service', '.'],
  ['Pick ', 'Kip', ' from the list.'],
  ['Android asks if you trust Kip. Tap ', 'OK', '. That warning is standard, and Kip can’t go online anyway.'],
];

export default function AutofillGuide() {
  const v = useVault();
  const toast = useToast();
  const [on, setOn] = useState(Autofill.isEnabled());
  const [err, setErr] = useState('');

  const open = async () => {
    try {
      await v.away(() =>
        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.REQUEST_SET_AUTOFILL_SERVICE, {
          data: `package:${Constants.expoConfig?.android?.package}`,
        }),
      );
    } catch {
      return toast.flash('Couldn’t open that screen. Find it under Settings › Passwords.', 'info');
    }
    const enabled = Autofill.isEnabled();
    setOn(enabled);
    setErr(enabled ? '' : 'Kip isn’t switched on yet. Pick Kip from the list, then tap OK.');
  };

  if (on) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 24 }}>
          <Pebble w={110} h={92} color={C.ok}>
            <Icon name="check" size={48} color="#FFFFFF" />
          </Pebble>
          <Title size={36} style={{ marginTop: 28 }}>Autofill is on. Nice work.</Title>
          <Body style={{ marginTop: 12 }}>
            Next time you sign in somewhere, look for <Text style={{ fontFamily: F.bold }}>Unlock Kip</Text> on the login field.
          </Body>
          <View style={{ flex: 1 }} />
          <Button title="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
        <IconButton name="arrow_back" label="Back" onPress={() => router.back()} style={{ marginLeft: -12 }} />
        <Title>Let Kip fill in logins for you</Title>
        <Body style={{ marginTop: 10 }}>Android hides this switch a little. Here’s the whole trip. It takes about 20 seconds.</Body>
        {!!err && (
          <View style={{ marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: C.dangerBg, flexDirection: 'row', gap: 10 }}>
            <Icon name="error" size={20} color={C.danger} />
            <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.ink }}>{err}</Text>
          </View>
        )}
        <View style={{ marginTop: 18, gap: 10 }}>
          {STEPS.map(([a, b, c], i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: C.card }}>
              <Pebble w={32} h={28}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>{i + 1}</Text>
              </Pebble>
              <Text style={{ flex: 1, fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.ink }}>
                {a}
                <Text style={{ fontFamily: F.bold }}>{b}</Text>
                {c}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <Button title="Open Android settings" iconAfter="open_in_new" onPress={open} />
      </View>
    </SafeAreaView>
  );
}
