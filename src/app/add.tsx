import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPicker } from '@/components/app-picker';
import { GeneratorSheet } from '@/components/generator-sheet';
import { useToast } from '@/components/toast';
import { Button, Field, Icon, IconButton, Pebble, s, Title } from '@/components/ui';
import { useSheet } from '@/components/use-sheet';
import { C, F, tintFor } from '@/constants/tokens';
import { useAppNames } from '@/lib/apps';
import type { CredInput } from '@/lib/vault';
import { useVault } from '@/lib/vault-context';

type Params = { id?: string; pendingId?: string; source?: 'shake' | 'tile' | 'shortcut' };

const BLANK: CredInput = { title: '', username: '', password: '', url: '', notes: '', custom: [] };

export default function Add() {
  const { id, pendingId, source } = useLocalSearchParams<Params>();
  const v = useVault();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Every way out (close, back, save) slides the sheet down first, then leaves.
  const sheet = useSheet();
  const [leaving, setLeaving] = useState(false);
  usePreventRemove(!leaving, ({ data }) => {
    setLeaving(true);
    sheet.close(() => navigation.dispatch(data.action));
  });

  const editing = id ? v.items.find((i) => i.id === Number(id)) : undefined;
  const pend = pendingId ? v.pending.find((p) => p.id === Number(pendingId)) : undefined;

  const [f, setF] = useState<CredInput>(() =>
    editing
      ? { title: editing.title, username: editing.username, password: editing.password, url: editing.url, notes: editing.notes, custom: editing.custom }
      : pend
        ? { ...BLANK, title: pend.title, username: pend.username, password: pend.password, url: pend.url || pend.source }
        : BLANK,
  );
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [gen, setGen] = useState(false);
  const [picking, setPicking] = useState(false);
  const appNames = useAppNames();
  const appName = appNames?.get(f.url.trim());
  const [busy, setBusy] = useState(false);

  const set = (k: keyof CredInput) => (t: string) => {
    setF((x) => ({ ...x, [k]: t }));
    if (k === 'title') setErr('');
  };
  const setCustom = (i: number, patch: Partial<CredInput['custom'][number]>) =>
    setF((x) => ({ ...x, custom: x.custom.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const chip: [string, Parameters<typeof Icon>[0]['name']] | null =
    source === 'shake' ? ['You shook, Kip listened', 'vibration']
      : source === 'tile' ? ['From Quick Settings', 'splitscreen_top']
        : source === 'shortcut' ? ['From the app icon', 'touch_app']
        : pend ? [`Caught from ${pend.source}`, 'download']
          : null;

  const save = async () => {
    if (!f.title.trim()) return setErr('Give it a name so you can find it later.');
    setBusy(true);
    try {
      await v.save({ ...f, title: f.title.trim(), custom: f.custom.filter((c) => c.k || c.v) }, editing?.id);
      if (pend) await v.dropPending(pend.id);
      router.back();
      toast.flash(editing ? 'Changes saved' : 'Saved. It’s in your pocket.');
    } catch {
      setBusy(false);
      toast.flash('Couldn’t save that. Try again.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,36,32,.25)' }, sheet.backdropStyle]} />
      <Animated.View style={[{ flex: 1 }, sheet.sheetStyle]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.handle }} />
        </View>
        <View style={{ paddingTop: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
          <IconButton name="close" label="Close" onPress={() => router.back()} />
          <Title size={22} style={{ flex: 1 }}>{editing ? 'Edit login' : pend ? 'Finish saving' : 'New login'}</Title>
        </View>
        {chip && (
          <View style={{ marginTop: 2, marginBottom: 4, marginHorizontal: 20, alignSelf: 'flex-start', height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.sand, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={chip[1]} size={16} color={C.rust} />
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.ink }}>{chip[0]}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom, gap: 12 }} keyboardShouldPersistTaps="handled">
          <Field label="Name" value={f.title} onChangeText={set('title')} placeholder="e.g. Ember Bank" error={err} autoCapitalize="words" autoFocus={!editing && !pend} />
          <Field label="Username or email" value={f.username} onChangeText={set('username')} placeholder="you@example.com" keyboardType="email-address" />
          <Field
            label="Password"
            value={f.password}
            onChangeText={set('password')}
            placeholder="Type or generate"
            secureTextEntry={!showPw}
            mono
            trailing={
              <>
                <IconButton name={showPw ? 'visibility_off' : 'visibility'} label={showPw ? 'Hide password' : 'Show password'} color={C.muted} size={22} onPress={() => setShowPw(!showPw)} style={{ width: 44, height: 44 }} />
                <Pressable onPress={() => setGen(true)} style={{ height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.sand, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
                  <Icon name="casino" size={18} />
                  <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>Make one</Text>
                </Pressable>
              </>
            }
          />
          {appName ? (
            // Linked to an installed app: show its name, not the package.
            <View>
              <Text style={s.label}>Website or app</Text>
              <View style={[s.field, { borderColor: C.line, gap: 12 }]}>
                <Pebble w={32} h={28} color={tintFor(appName)}>
                  <Text style={{ fontFamily: F.displayBold, fontSize: 13, color: C.ink }}>{appName[0]?.toUpperCase()}</Text>
                </Pebble>
                <View style={{ flex: 1, minWidth: 0, paddingVertical: 8 }}>
                  <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 16, color: C.ink }}>{appName}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 12, color: C.faint }}>Android app</Text>
                </View>
                <IconButton name="close" label={`Unlink ${appName}`} color={C.muted} size={20} style={{ width: 44, height: 44 }} onPress={() => setF((x) => ({ ...x, url: '' }))} />
              </View>
            </View>
          ) : (
            <Field
              label="Website or app"
              value={f.url}
              onChangeText={set('url')}
              placeholder="emberbank.app"
              keyboardType="url"
              trailing={
                <Pressable onPress={() => setPicking(true)} style={{ height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.sand, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
                  <Icon name="apps" size={18} />
                  <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>Pick app</Text>
                </Pressable>
              }
            />
          )}
          <Field label="Notes" value={f.notes} onChangeText={set('notes')} placeholder="Anything worth remembering" multiline autoCapitalize="sentences" autoCorrect />

          {f.custom.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ width: 110 }}>
                <Field value={c.k} onChangeText={(k) => setCustom(i, { k })} placeholder="Label" autoCapitalize="words" />
              </View>
              <View style={{ flex: 1 }}>
                <Field value={c.v} onChangeText={(val) => setCustom(i, { v: val })} placeholder="Value" />
              </View>
              <IconButton name="remove_circle" label="Remove field" color={C.muted} size={20} style={{ width: 44, height: 44 }} onPress={() => setF((x) => ({ ...x, custom: x.custom.filter((_, j) => j !== i) }))} />
            </View>
          ))}
          <Pressable onPress={() => setF((x) => ({ ...x, custom: [...x.custom, { k: '', v: '' }] }))} style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="add" size={20} color={C.rust} />
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.rust }}>Add a field (PIN, security answer…)</Text>
          </Pressable>
        </ScrollView>

        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 20 + insets.bottom }}>
          <Button title={busy ? 'Saving…' : 'Save to pocket'} onPress={save} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
      </Animated.View>

      {picking && (
        <AppPicker
          onClose={() => setPicking(false)}
          onPick={(app) => {
            setPicking(false);
            // A blank name gets the app's, so picking the app is often all it takes.
            setF((x) => ({ ...x, url: app.pkg, title: x.title.trim() ? x.title : app.label }));
            setErr('');
          }}
        />
      )}
      {gen && (
        <GeneratorSheet
          onClose={() => setGen(false)}
          onUse={(pw) => {
            setF((x) => ({ ...x, password: pw }));
            setShowPw(true);
            setGen(false);
          }}
        />
      )}
    </View>
  );
}
