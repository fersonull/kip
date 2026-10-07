import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';

const PROMISES = ['They stay on this phone. Only here.', 'No account, no internet, no catch.', 'Save a login in about two seconds.'];

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 28 }}>
        <Logo w={96} h={80} />
        <Title size={42} style={{ marginTop: 32 }}>Your passwords, tucked in.</Title>
        <View style={{ marginTop: 28, gap: 16 }}>
          {PROMISES.map((p) => (
            <View key={p} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.ember }} />
              <Text style={{ fontFamily: F.body, fontSize: 16, color: C.ink, flex: 1 }}>{p}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <Button title="Let's go" onPress={() => router.push('/setup/password')} />
        <Text style={{ marginTop: 14, textAlign: 'center', fontFamily: F.body, fontSize: 12, color: C.muted }}>
          Takes under a minute. Kip never goes online.
        </Text>
      </View>
    </SafeAreaView>
  );
}
