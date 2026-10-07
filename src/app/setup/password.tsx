import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Button, Field, Icon, IconButton, s, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { strengthOf } from '@/lib/password';
import { useVault } from '@/lib/vault-context';

const LABELS = ['Too short', 'Getting there', 'Good', 'Strong', 'Rock solid'];
const TIPS = ['Try a short sentence', 'Longer is stronger', 'A few more words?', 'Nice and sturdy', 'Rock solid'];
const TEXT = [C.danger, C.danger, C.rust, C.okInk, C.okInk];
const BAR = [C.dangerLine, C.dangerLine, C.ember, C.ok, C.ok];

export default function CreateMaster() {
  const v = useVault();
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const st = strengthOf(pw);
  const can = st >= 2 && pw === pw2;
  const mismatch = !!pw2 && pw2 !== pw && pw2.length >= Math.min(pw.length, 3);

  const submit = async () => {
    // Came back here with Android's back button after the vault was already made.
    if (v.status === 'unlocked') return router.replace('/setup/biometrics');
    if (!can) return toast.flash(pw !== pw2 && st >= 2 ? 'Those two need to match' : 'A little longer, please', 'info');
    setBusy(true);
    try {
      await v.create(pw);
      router.replace('/setup/biometrics');
    } catch {
      setBusy(false);
      toast.flash('Something went wrong. Try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <IconButton name="arrow_back" label="Back" onPress={() => router.back()} style={{ marginLeft: -12 }} />
          <Text style={s.mono}>STEP 1 OF 2</Text>
          <Title style={{ marginTop: 8 }}>One password to open all the others.</Title>

          <View style={{ marginTop: 22 }}>
            <Field
              label="Master password"
              value={pw}
              onChangeText={setPw}
              secureTextEntry={!show}
              placeholder="A short sentence works great"
              autoFocus
              trailing={<IconButton name={show ? 'visibility_off' : 'visibility'} label={show ? 'Hide' : 'Show'} color={C.muted} size={22} onPress={() => setShow(!show)} style={{ width: 44, height: 44 }} />}
            />
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < st ? BAR[st] : C.line }} />
            ))}
          </View>
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 13, color: pw ? TEXT[st] : C.muted }}>{pw ? LABELS[st] : 'At least 8 characters'}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{pw ? TIPS[st] : ''}</Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <Field
              label="Type it once more"
              value={pw2}
              onChangeText={setPw2}
              secureTextEntry={!show}
              placeholder="Same again"
              error={mismatch ? "Those two don't match yet." : undefined}
              onSubmitEditing={submit}
            />
          </View>

          <View style={{ marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: C.sand, flexDirection: 'row', gap: 12 }}>
            <Icon name="edit_note" size={22} color={C.rust} />
            <Text style={{ flex: 1, fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.ink }}>
              <Text style={{ fontFamily: F.bold }}>Write it down somewhere safe.</Text> No one can reset it, not even us. If it’s lost, so is what’s inside.
            </Text>
          </View>

          <View style={{ flex: 1, minHeight: 16 }} />
          <Button title={busy ? 'Locking it up…' : 'Set master password'} kind={can && !busy ? 'ink' : 'off'} onPress={busy ? undefined : submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
