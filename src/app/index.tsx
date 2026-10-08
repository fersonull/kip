import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginMenu } from '@/components/login-menu';
import { Button, Icon, IconButton, LoginMark, Pebble, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import type { Cred } from '@/lib/vault';
import { useVault } from '@/lib/vault-context';

import Autofill from '../../modules/kip-autofill';

const ROW_H = 58;
const HEAD_H = 36;
/** From this many logins, the list groups by first letter and gets the A–Z rail. */
const GROUP_AT = 10;

type Line = { kind: 'head'; key: string; label: string } | { kind: 'row'; key: string; c: Cred };

/** "Émile" -> "E". Anything that isn't A–Z (digits, symbols, other scripts) files under "#". */
const letterOf = (title: string) => {
  const L = title.normalize('NFD')[0]?.toUpperCase() ?? '';
  return L >= 'A' && L <= 'Z' ? L : '#';
};

/** Favorites on top. From GROUP_AT logins, the rest group by first letter (and get an A–Z rail). */
function buildLines(items: Cred[], q: string): Line[] {
  const head = (key: string, label: string): Line => ({ kind: 'head', key: 'h-' + key, label });
  const rows = (list: Cred[]) => list.map((c): Line => ({ kind: 'row', key: 'r-' + c.id, c }));
  if (q) {
    const hits = items.filter((c) => `${c.title} ${c.username} ${c.url}`.toLowerCase().includes(q));
    return hits.length ? [head('q', `${hits.length} ${hits.length === 1 ? 'MATCH' : 'MATCHES'}`), ...rows(hits)] : [];
  }
  const byTitle = (a: Cred, b: Cred) => a.title.localeCompare(b.title);
  const favs = items.filter((c) => c.fav).sort(byTitle);
  const rest = items.filter((c) => !c.fav).sort(byTitle);
  const out: Line[] = favs.length ? [head('fav', '★ FAVORITES'), ...rows(favs)] : [];
  if (items.length < GROUP_AT) return rest.length ? [...out, head('all', 'EVERYTHING ELSE'), ...rows(rest)] : out;
  // "#" first, so each letter's titles stay together under one heading.
  const keyed = rest.map((c) => ({ c, L: letterOf(c.title) })).sort((a, b) => Number(a.L !== '#') - Number(b.L !== '#') || byTitle(a.c, b.c));
  let letter = '';
  for (const { c, L } of keyed) {
    if (L !== letter) out.push(head(L, (letter = L)));
    out.push({ kind: 'row', key: 'r-' + c.id, c });
  }
  return out;
}

export default function VaultScreen() {
  const v = useVault();
  const [q, setQ] = useState('');
  const list = useRef<FlatList<Line>>(null);
  const [menu, setMenu] = useState<{ c: Cred; row: { y: number; h: number } } | null>(null);
  const searchInput = useRef<TextInput>(null);

  // Re-checked on focus: the user may have just switched it on in Android settings.
  const [autofillOn, setAutofillOn] = useState(Autofill.isEnabled());
  useFocusEffect(useCallback(() => setAutofillOn(Autofill.isEnabled()), []));

  // The search bar floats (absolute), so KeyboardAvoidingView padding can't move it. Lift it by the
  // keyboard height instead; RN reports that height already minus the nav bar this screen sits above.
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // The "Search" app shortcut lands here with a fresh ?search= value each time.
  const { search } = useLocalSearchParams<{ search?: string }>();
  useEffect(() => {
    if (!search) return;
    const t = setTimeout(() => searchInput.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = q.trim().toLowerCase();
  const lines = buildLines(v.items, query);
  const offsets: number[] = [];
  lines.reduce((y, l) => (offsets.push(y), y + (l.kind === 'head' ? HEAD_H : ROW_H)), 0);
  const rail = !query && v.items.length >= GROUP_AT
    ? lines.flatMap((l, i) => (l.kind === 'head' && l.label.length === 1 ? [{ k: l.label, i }] : []))
    : [];

  const n = v.items.length;
  const p = v.pending.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Title>Your pocket</Title>
          <IconButton name="settings" label="Settings" color={C.muted} onPress={() => router.push('/settings')} style={{ marginRight: -12 }} />
        </View>
        <Text style={{ paddingHorizontal: 20, paddingBottom: 10, fontFamily: F.body, fontSize: 13, color: C.muted }}>
          {n ? `${n} ${n === 1 ? 'login' : 'logins'} · all on this phone` : 'Offline and ready'}
        </Text>

        {p > 0 && (
          <Pressable onPress={() => router.push('/pending')} style={{ marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 18, backgroundColor: C.sand, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.ember }} />
            <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink }}>
              <Text style={{ fontFamily: F.bold }}>{`${p} new ${p === 1 ? 'login' : 'logins'}`}</Text> saved while locked
            </Text>
            <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.rust }}>Review</Text>
          </Pressable>
        )}

        {n === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 120 }}>
            <Pebble w={110} h={92} color={C.sand}>
              <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: C.ember, left: 62, top: 30 }} />
            </Pebble>
            <Title size={24} style={{ marginTop: 22, textAlign: 'center' }}>Nothing in your pocket yet.</Title>
            <Text style={{ marginTop: 8, fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, textAlign: 'center' }}>
              Give your phone a little shake to add a login. Kip will also offer to save when you sign in somewhere.
            </Text>
            <Pressable
              onPress={() => router.push('/settings/autofill')}
              style={{
                marginTop: 18, height: 48, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8,
                ...(autofillOn ? { backgroundColor: C.okBg } : { borderWidth: 1.5, borderColor: C.ink }),
              }}>
              <Icon name={autofillOn ? 'check_circle' : 'auto_awesome'} size={20} color={autofillOn ? C.okInk : C.ink} />
              <Text style={{ fontFamily: F.medium, fontSize: 14, color: autofillOn ? C.okInk : C.ink }}>{autofillOn ? 'Autofill is on' : 'Turn on autofill'}</Text>
            </Pressable>
            <Text style={{ marginTop: 28, fontFamily: F.body, fontSize: 13, color: C.muted }}>Moving in from somewhere?</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              <Button title="Restore a backup" kind="sand" icon="download" height={44} onPress={() => router.push({ pathname: '/settings/backup', params: { start: 'restore' } })} />
              <Button title="Import from Google" kind="sand" icon="move_to_inbox" height={44} onPress={() => router.push({ pathname: '/settings/backup', params: { start: 'import' } })} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={list}
              data={lines}
              keyExtractor={(l) => l.key}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 110 + kb }}
              getItemLayout={(_, i) => ({ index: i, offset: offsets[i], length: lines[i].kind === 'head' ? HEAD_H : ROW_H })}
              ListEmptyComponent={
                <Text style={{ padding: 40, textAlign: 'center', fontFamily: F.body, fontSize: 14, color: C.muted }}>
                  Nothing matches “{q.trim()}”. Shake to add it?
                </Text>
              }
              renderItem={({ item: l }) =>
                l.kind === 'head' ? (
                  <Text style={{ height: HEAD_H, paddingHorizontal: 20, paddingTop: 14, fontFamily: F.monoBold, fontSize: 11, letterSpacing: 0.5, color: C.faint }}>{l.label}</Text>
                ) : (
                  <Row c={l.c} onMenu={(row) => setMenu({ c: l.c, row })} />
                )
              }
            />
            {rail.length > 0 && <Rail marks={rail} onPick={(i) => list.current?.scrollToIndex({ index: i, animated: false })} />}
          </View>
        )}
        {menu && <LoginMenu c={menu.c} row={menu.row} preview={<RowBody c={menu.c} />} onClose={() => setMenu(null)} />}

        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 20 + kb, flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, height: 56, borderRadius: 28, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, elevation: 6 }}>
            <Icon name="search" size={22} color={C.bg} />
            <TextInput
              ref={searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Find a login"
              placeholderTextColor="#9A8E84"
              autoCorrect={false}
              autoCapitalize="none"
              style={{ flex: 1, minWidth: 0, color: C.bg, fontFamily: F.body, fontSize: 15 }}
            />
          </View>
          <Pressable onPress={() => router.push('/add')} accessibilityRole="button" accessibilityLabel="Add a login" style={{ elevation: 6 }}>
            <Pebble w={56} h={56}>
              <Icon name="add" size={28} />
            </Pebble>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({ c, onMenu }: { c: Cred; onMenu: (row: { y: number; h: number }) => void }) {
  const ref = useRef<View>(null);
  return (
    <Pressable
      ref={ref}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: String(c.id) } })}
      onLongPress={() => ref.current?.measureInWindow((_x, y, _w, h) => onMenu({ y, h }))}
      delayLongPress={350}
      android_ripple={{ color: '#F1EAE1' }}
      style={{ height: ROW_H, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 20, paddingRight: 32 }}>
      <RowBody c={c} />
    </Pressable>
  );
}

/** A row's contents, shared with the lifted copy the long-press menu draws. */
function RowBody({ c }: { c: Cred }) {
  return (
    <>
      <LoginMark title={c.title} url={c.url} w={40} h={36} fontSize={16} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{c.title}</Text>
        {!!c.username && <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{c.username}</Text>}
      </View>
      {c.fav && <Icon name="star" size={18} color={C.ember} fill />}
    </>
  );
}

/** A–Z index: tap a letter, or slide along it and the list follows. A pebble shows the letter under the finger. */
function Rail({ marks, onPick }: { marks: { k: string; i: number }[]; onPick: (i: number) => void }) {
  const [room, setRoom] = useState(0);
  const [at, setAt] = useState<{ k: string; y: number } | null>(null);
  const cell = Math.min(22, room / marks.length);
  const pick = (y: number) => {
    const m = marks[Math.min(marks.length - 1, Math.max(0, Math.floor(y / cell)))];
    if (m.k !== at?.k) onPick(m.i);
    setAt({ k: m.k, y: Math.min(cell * marks.length, Math.max(0, y)) });
  };
  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => setRoom(e.nativeEvent.layout.height)}
      style={{ position: 'absolute', right: 2, top: 4, bottom: 100, width: 26, justifyContent: 'center' }}>
      {room > 0 && (
        <View
          hitSlop={{ left: 12, right: 2 }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e) => pick(e.nativeEvent.locationY)}
          onResponderMove={(e) => pick(e.nativeEvent.locationY)}
          onResponderRelease={() => setAt(null)}
          onResponderTerminate={() => setAt(null)}
          accessibilityLabel="Jump to letter">
          {marks.map((r) => (
            <View key={r.k} pointerEvents="none" style={{ height: cell, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.monoBold, fontSize: r.k === at?.k ? 11 : 9, color: r.k === at?.k ? C.rust : C.faint }}>{r.k}</Text>
            </View>
          ))}
          {at && (
            <View pointerEvents="none" style={{ position: 'absolute', right: 40, top: at.y - 26 }}>
              <Pebble w={60} h={52}>
                <Text style={{ fontFamily: F.displayBold, fontSize: 26, color: C.ink }}>{at.k}</Text>
              </Pebble>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
