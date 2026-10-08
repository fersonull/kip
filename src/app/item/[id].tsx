import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDeleteLogin } from '@/components/login-menu';
import { useToast } from '@/components/toast';
import { Button, IconButton, LoginMark, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { useAppNames } from '@/lib/apps';
import { useVault } from '@/lib/vault-context';

type FieldRow = { key: string; label: string; value: string; secret?: boolean; mono?: boolean };

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = useVault();
  const appNames = useAppNames();
  const toast = useToast();
  const deleteLogin = useDeleteLogin();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const c = v.items.find((i) => i.id === Number(id));
  if (!c) return null;
  // A url that is an installed app's package shows as that app's name.
  const appName = appNames?.get(c.url.trim());

  const fields: FieldRow[] = [
    ...(c.username ? [{ key: 'u', label: 'Username', value: c.username }] : []),
    // Only fields with a value: a hidden empty one would still draw dots and look saved.
    ...(c.password ? [{ key: 'p', label: 'Password', value: c.password, secret: true, mono: true }] : []),
    ...(c.url ? [appName ? { key: 'url', label: 'App', value: appName } : { key: 'url', label: 'Website', value: c.url }] : []),
    ...c.custom.flatMap((f, i) => (f.v ? [{ key: 'c' + i, label: f.k || 'Field', value: f.v, secret: true, mono: true }] : [])),
    ...(c.notes ? [{ key: 'n', label: 'Notes', value: c.notes }] : []),
  ];

  const del = () => deleteLogin(c, router.back);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Inner view so the absolute bottom bar sits above the system nav bar. */}
      <View style={{ flex: 1 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
        <IconButton name="arrow_back" label="Back" onPress={() => router.back()} />
        <IconButton name="star" label={c.fav ? 'Remove from favorites' : 'Add to favorites'} color={C.ember} fill={c.fav} onPress={() => v.toggleFav(c.id)} />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <LoginMark title={c.title} url={c.url} w={60} h={52} fontSize={22} font={F.display} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Title size={26}>{c.title}</Title>
          {!!c.url && <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{appName ? `${appName} app` : c.url}</Text>}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 8 }}>
        {fields.map((f) => {
          const hidden = f.secret && !shown[f.key];
          return (
            <View key={f.key} style={{ paddingVertical: 10, paddingLeft: 16, paddingRight: 6, borderRadius: 18, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{f.label}</Text>
                <Text style={{ marginTop: 2, fontSize: 16, color: C.ink, fontFamily: f.mono ? F.mono : F.body }}>
                  {hidden ? '•'.repeat(Math.min(12, Math.max(6, f.value.length))) : f.value}
                </Text>
              </View>
              {f.secret && (
                <IconButton
                  name={hidden ? 'visibility' : 'visibility_off'}
                  label={hidden ? `Show ${f.label}` : `Hide ${f.label}`}
                  color={C.muted}
                  size={22}
                  style={{ width: 44, height: 44 }}
                  onPress={() => setShown((x) => ({ ...x, [f.key]: !x[f.key] }))}
                />
              )}
              <IconButton
                name="content_copy"
                label={`Copy ${f.label}`}
                color={C.rust}
                size={22}
                style={{ width: 44, height: 44 }}
                onPress={() => toast.copied(f.label, f.value, v.settings.clipSecs)}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 20, flexDirection: 'row', gap: 10 }}>
        <IconButton name="delete" label="Delete" color={C.danger} onPress={del} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.sand }} />
        <Button title="Edit" icon="edit" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add', params: { id: String(c.id) } })} />
      </View>
      </View>
    </SafeAreaView>
  );
}
