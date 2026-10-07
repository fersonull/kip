import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Rich, TOPICS } from '@/components/help';
import { Button, IconButton, Pebble, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';

export default function Help() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const i = Math.max(0, TOPICS.findIndex((t) => t.id === topic));
  const t = TOPICS[i];
  const next = TOPICS[i + 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 8 }}>
        <IconButton name="arrow_back" label="Back" onPress={() => router.back()} />
      </View>
      <ScrollView key={t.id} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}>
        <View style={{ height: 210, borderRadius: 28, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <t.Art />
        </View>

        <Title style={{ marginTop: 22 }}>{t.title}</Title>

        <View style={{ marginTop: 18, gap: 10 }}>
          {t.steps.map((s, n) => (
            <View key={n} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: C.card }}>
              <Pebble w={32} h={28}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>{n + 1}</Text>
              </Pebble>
              <Rich text={s} style={{ flex: 1, fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.ink }} />
            </View>
          ))}
        </View>

        {t.note && (
          <View style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: C.sand }}>
            <Rich text={t.note} style={{ fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.muted }} />
          </View>
        )}

        {next && (
          <Button
            title={`Next: ${next.title}`}
            kind="ghost"
            iconAfter="arrow_forward"
            height={48}
            style={{ marginTop: 18, alignSelf: 'flex-start', paddingHorizontal: 0 }}
            onPress={() => router.setParams({ topic: next.id })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
