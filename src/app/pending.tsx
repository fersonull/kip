import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Body, IconButton, Pebble, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { useVault } from '@/lib/vault-context';

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

/** Logins the autofill service caught while Kip was locked. The Kotlin queue fills `pending` (Milestone 4). */
export default function PendingScreen() {
  const v = useVault();
  const toast = useToast();

  const pill = (label: string, bg: string, bold: boolean, onPress: () => void, color: string = C.ink) => (
    <Pressable onPress={onPress} style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: bg, justifyContent: 'center' }}>
      <Text style={{ fontFamily: bold ? F.bold : F.medium, fontSize: 14, color }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 8 }}>
        <IconButton name="arrow_back" label="Back" onPress={() => router.back()} />
      </View>
      <Title size={30} style={{ paddingHorizontal: 24, paddingBottom: 6 }}>Caught while you were away</Title>
      <Body style={{ paddingHorizontal: 24, paddingBottom: 14, fontSize: 14 }}>Kip held onto these while it was locked. Keep the ones that are yours.</Body>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}>
        {v.pending.map((p) => (
          <View key={p.id} style={{ padding: 16, borderRadius: 22, backgroundColor: C.card, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Pebble w={40} h={36} color={C.sand}>
                <Text style={{ fontFamily: F.displayBold, fontSize: 16, color: C.ink }}>{p.title[0]?.toUpperCase()}</Text>
              </Pebble>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{p.title}</Text>
                <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{p.username} · ••••••••</Text>
                <Text style={{ fontFamily: F.body, fontSize: 12, color: C.faint }}>from {p.source} · {ago(p.createdAt)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {pill('Toss', 'transparent', false, () => v.dropPending(p.id), C.muted)}
              <View style={{ flex: 1 }} />
              {pill('Edit', C.sand, false, () => router.push({ pathname: '/add', params: { pendingId: String(p.id) } }))}
              {pill('Keep', C.ember, true, async () => {
                await v.save({ title: p.title, username: p.username, password: p.password, url: p.source, notes: '', custom: [] });
                await v.dropPending(p.id);
                toast.flash('Kept. It’s in your pocket.');
              })}
            </View>
          </View>
        ))}
        {v.pending.length === 0 && (
          <Text style={{ padding: 40, textAlign: 'center', fontFamily: F.body, fontSize: 15, color: C.muted }}>All sorted. Nice and tidy.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
