import { Slider } from '@expo/ui/community/slider';
import { getRandomValues } from 'expo-crypto';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, IconButton } from '@/components/ui';
import { useSheet } from '@/components/use-sheet';
import { C, F } from '@/constants/tokens';
import { generate, type GenOpts } from '@/lib/password';

const make = (len: number, o: GenOpts) => generate(len, o, getRandomValues);

/** Mount it to open. It animates itself out before calling onClose / onUse. */
export function GeneratorSheet({ onClose, onUse }: { onClose: () => void; onUse: (pw: string) => void }) {
  const insets = useSafeAreaInsets();
  const sheet = useSheet();
  const close = () => sheet.close(onClose);
  const [len, setLen] = useState(18);
  const [opts, setOpts] = useState<GenOpts>({ upper: true, num: true, sym: true });
  const [val, setVal] = useState(() => make(18, opts));

  const update = (l: number, o: GenOpts) => {
    setLen(l);
    setOpts(o);
    setVal(make(l, o));
  };

  const chips: [keyof GenOpts, string, Parameters<typeof Icon>[0]['name']][] = [
    ['upper', 'ABC', 'title'],
    ['num', '123', 'pin'],
    ['sym', '#$%', 'tag'],
  ];

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,36,32,.35)' }, sheet.backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close generator" />
      </Animated.View>
      <Animated.View style={[{ backgroundColor: C.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 20 + insets.bottom, gap: 14 }, sheet.sheetStyle]}>
        <Text style={{ fontFamily: F.display, fontSize: 20, color: C.ink }}>Fresh password</Text>
        <View style={{ padding: 16, borderRadius: 18, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text selectable style={{ flex: 1, fontFamily: F.monoBold, fontSize: 17, lineHeight: 23, color: C.ink }}>{val}</Text>
          <IconButton name="refresh" label="Make another" onPress={() => setVal(make(len, opts))} size={22} style={{ width: 44, height: 44, backgroundColor: C.sand }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ width: 84, fontFamily: F.body, fontSize: 14, color: C.ink }}>
            Length <Text style={{ fontFamily: F.bold }}>{len}</Text>
          </Text>
          <Slider
            style={{ flex: 1 }}
            value={len}
            minimumValue={8}
            maximumValue={40}
            step={1}
            minimumTrackTintColor={C.ember}
            thumbTintColor={C.ember}
            onValueChange={(n) => Math.round(n) !== len && update(Math.round(n), opts)}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {chips.map(([k, label, icon]) => (
            <Pressable
              key={k}
              onPress={() => update(len, { ...opts, [k]: !opts[k] })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: opts[k] }}
              style={{
                height: 40, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5,
                backgroundColor: opts[k] ? C.sand : 'transparent', borderColor: opts[k] ? C.ember : '#E0D5CA',
              }}>
              <Icon name={opts[k] ? 'check' : icon} size={18} />
              <Text style={{ fontFamily: F.body, fontSize: 14, color: C.ink }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Button title="Use this one" kind="ember" onPress={() => sheet.close(() => onUse(val))} />
      </Animated.View>
      </View>
    </Modal>
  );
}
