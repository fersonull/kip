import { useEffect, useState } from 'react';
import { AppState, KeyboardAvoidingView, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Field, Icon, OfflineLine, Pebble, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { useVault } from '@/lib/vault-context';

const MAX_TRIES = 5;
const COOLDOWN_MS = 30_000;

export default function Unlock() {
  const v = useVault();
  const [mode, setMode] = useState<'bio' | 'pw'>(v.settings.bio ? 'bio' : 'pw');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [tries, setTries] = useState(MAX_TRIES);
  const [busy, setBusy] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);

  const bio = () => v.unlockBio();

  useEffect(() => {
    if (!v.settings.bio) return;
    // Prompt once Kip is actually in front (a shake can open it while the phone is still unlocking).
    if (AppState.currentState === 'active') return void bio();
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      sub.remove();
      bio();
    });
    return () => sub.remove();
    // Prompt once on arrival; the pebble retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (busy || !pw) return;
    if (Date.now() < waitUntil) return setErr('Too many tries. Take a breath, then try again in 30 seconds.');
    setBusy(true);
    let ok = false;
    try {
      ok = await v.unlockPassword(pw);
    } catch {
      setBusy(false);
      return setErr('Kip couldn’t open its vault file. Try again, or restore a backup.');
    }
    if (ok) return;
    setBusy(false);
    setPw('');
    const left = tries - 1;
    if (left > 0) {
      setTries(left);
      setErr(`That's not it. ${left} ${left === 1 ? 'try' : 'tries'} left before a short break.`);
    } else {
      setTries(MAX_TRIES);
      setWaitUntil(Date.now() + COOLDOWN_MS);
      setErr('Too many tries. Take a breath, then try again in 30 seconds.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 24 }}>
        <Title size={44}>{'Hey, it’s\nyou.'}</Title>
        <Body style={{ marginTop: 12 }}>
          {v.afterUnlock?.startsWith('/add') ? 'Unlock to finish adding your login.' : 'Your logins napped while you were gone. Wake them with a tap.'}
        </Body>
        <View style={{ flex: 1 }} />

        {mode === 'bio' ? (
          <>
            <Pressable onPress={bio} accessibilityRole="button" accessibilityLabel="Unlock with fingerprint" style={({ pressed }) => ({ alignSelf: 'center', transform: [{ scale: pressed ? 0.96 : 1 }] })}>
              <Pebble w={136} h={114}>
                <Icon name="fingerprint" size={56} />
              </Pebble>
            </Pressable>
            <Text style={{ alignSelf: 'center', marginTop: 10, fontFamily: F.body, fontSize: 13, color: C.muted }}>Tap the pebble to try again</Text>
            <Button title="Type master password" kind="sand" height={48} style={{ alignSelf: 'center', marginTop: 18 }} onPress={() => setMode('pw')} />
          </>
        ) : (
          <>
            <Field
              value={pw}
              onChangeText={(t) => {
                setPw(t);
                setErr('');
              }}
              secureTextEntry
              placeholder="Master password"
              autoFocus
              error={err}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
            <Text style={{ marginTop: 8, fontFamily: F.body, fontSize: 12, color: C.faint }}>
              Forgot it? It can’t be reset, but a backup file can bring everything back.
            </Text>
            <Button title={busy ? 'Opening…' : 'Open Kip'} style={{ marginTop: 14 }} onPress={submit} disabled={busy} />
            {v.settings.bio && (
              <Button title="Use fingerprint instead" kind="ghost" icon="fingerprint" height={48} style={{ marginTop: 4 }} onPress={() => {
                setMode('bio');
                bio();
              }} />
            )}
          </>
        )}

        <View style={{ marginTop: 18 }}>
          <OfflineLine />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
