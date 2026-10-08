import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, LoginMark } from '@/components/ui';
import { useSheet } from '@/components/use-sheet';
import { C, F } from '@/constants/tokens';
import { getApps, type App } from '@/lib/apps';

/** Mount it to open. Picks an installed app so autofill can match the login to it. */
export function AppPicker({ onClose, onPick }: { onClose: () => void; onPick: (app: App) => void }) {
  const insets = useSafeAreaInsets();
  const sheet = useSheet();
  const close = () => sheet.close(onClose);
  const [apps, setApps] = useState<App[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    getApps(true).then(setApps);
  }, []);

  const query = q.trim().toLowerCase();
  const shown = apps?.filter((a) => `${a.label} ${a.pkg}`.toLowerCase().includes(query));

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,36,32,.35)' }, sheet.backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close app list" />
        </Animated.View>
        <Animated.View
          style={[
            { height: '78%', backgroundColor: C.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingBottom: insets.bottom },
            sheet.sheetStyle,
          ]}>
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>Pick the app</Text>
            <Field value={q} onChangeText={setQ} placeholder="Search apps" returnKeyType="search" />
          </View>
          <FlatList
            data={shown ?? []}
            keyExtractor={(a) => a.pkg}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 8 }}
            ListEmptyComponent={
              <Text style={{ padding: 32, textAlign: 'center', fontFamily: F.body, fontSize: 14, color: C.muted }}>
                {apps ? `No app matches “${q.trim()}”.` : 'Finding your apps…'}
              </Text>
            }
            renderItem={({ item: a }) => (
              <Pressable
                onPress={() => sheet.close(() => onPick(a))}
                android_ripple={{ color: '#F1EAE1' }}
                style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 6 }}>
                <LoginMark title={a.label} url={a.pkg} w={40} h={36} fontSize={16} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{a.label}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 12, color: C.faint }}>{a.pkg}</Text>
                </View>
              </Pressable>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
