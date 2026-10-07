import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Icon, IconButton, OfflineLine, Segmented, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { canUseBio, type Settings } from '@/lib/keys';
import { useVault } from '@/lib/vault-context';

type IconName = Parameters<typeof Icon>[0]['name'];

function Card({ icon, title, sub, right, onPress, bg = C.card, children }: {
  icon: IconName; title: string; sub: string; right?: ReactNode; onPress?: () => void; bg?: string; children?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: bg, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Icon name={icon} color={C.rust} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{title}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{sub}</Text>
        </View>
        {right}
      </View>
      {children}
    </Pressable>
  );
}

const LOCK = [0, 60, 300] as const;
const LOCK_LABEL = { 0: 'Right away', 60: '1 min', 300: '5 min' };

export default function SettingsScreen() {
  const v = useVault();
  const toast = useToast();
  const st = v.settings;
  const set = (patch: Partial<Settings>) => v.setSettings(patch);

  const toggleBio = async (on: boolean) => {
    if (on && !canUseBio()) return toast.flash('Add a fingerprint in Android settings first.', 'info');
    try {
      await set({ bio: on });
    } catch {
      toast.flash('Fingerprint didn’t go through. Try again.', 'info');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 8 }}>
        <IconButton name="arrow_back" label="Back" onPress={() => router.back()} />
      </View>
      <Title style={{ paddingHorizontal: 24, paddingBottom: 12 }}>Settings</Title>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}>
        <Card
          icon="auto_awesome"
          title="Autofill"
          sub="Off. Kip can’t fill or catch logins yet."
          bg={C.sand}
          onPress={() => router.push('/settings/autofill')}
          right={<Text style={{ fontFamily: F.bold, fontSize: 13, color: C.rust }}>Set up</Text>}
        />
        <Card
          icon="inventory_2"
          title="Backup and restore"
          sub={st.lastBackup ? `Last backup: ${st.lastBackup}` : 'No backup yet. Worth doing today.'}
          onPress={() => router.push('/settings/backup')}
          right={<Icon name="chevron_right" size={22} color={C.faint} />}
        />
        <Card
          icon="fingerprint"
          title="Unlock with fingerprint"
          sub="Master password always works too"
          right={<Switch value={st.bio} onValueChange={toggleBio} trackColor={{ true: C.ember, false: C.handle }} thumbColor="#FFFFFF" />}
        />
        <Card icon="timer" title="Lock after" sub="Always locks when you leave the app">
          <Segmented options={LOCK} value={st.autoLock} onChange={(autoLock) => set({ autoLock })} format={(o) => LOCK_LABEL[o]} />
        </Card>
        <Card icon="vibration" title="Shake to add" sub="How hard to shake before Add opens">
          <Segmented options={['Off', 'Gentle', 'Firm'] as const} value={st.shake} onChange={(shake) => set({ shake })} />
        </Card>
        <Card icon="content_paste_off" title="Clear clipboard after" sub="Copied passwords vanish on their own">
          <Segmented options={[15, 30, 60] as const} value={st.clipSecs} onChange={(clipSecs) => set({ clipSecs })} format={(o) => `${o}s`} />
        </Card>
        <View style={{ paddingTop: 10, paddingHorizontal: 8, alignItems: 'flex-start' }}>
          <OfflineLine text="Kip has no internet permission. It physically can’t phone home." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
