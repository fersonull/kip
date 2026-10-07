import { MaterialSymbols_400Regular_Filled } from '@expo-google-fonts/material-symbols/400Regular_Filled';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { C, F } from '@/constants/tokens';

type AndroidName = Extract<ComponentProps<typeof SymbolView>['name'], { android?: unknown }>['android'];
const FILLED = { name: 'MaterialSymbols_400Regular_Filled', font: MaterialSymbols_400Regular_Filled };

export function Icon({ name, size = 24, color = C.ink, fill }: { name: AndroidName; size?: number; color?: string; fill?: boolean }) {
  return (
    <SymbolView
      name={{ ios: 'circle', android: name, web: name }}
      size={size}
      tintColor={color}
      weight={fill ? { ios: 'regular', android: FILLED } : undefined}
    />
  );
}

/**
 * The prototype's pebble: border-radius 58% 42% 52% 48% / 56% 50% 50% 44%.
 * RN has no elliptical corners, so each corner averages its horizontal and vertical radius.
 */
export function Pebble({ w, h, color = C.ember, style, children }: { w: number; h: number; color?: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const r = (x: number, y: number) => (w * x + h * y) / 2;
  return (
    <View
      style={[
        {
          width: w, height: h, backgroundColor: color, alignItems: 'center', justifyContent: 'center',
          borderTopLeftRadius: r(0.58, 0.56), borderTopRightRadius: r(0.42, 0.5),
          borderBottomRightRadius: r(0.52, 0.5), borderBottomLeftRadius: r(0.48, 0.44),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Pebble with the dark "eye": the Kip logo. */
export function Logo({ w, h }: { w: number; h: number }) {
  const eye = Math.round(w * 0.19);
  return (
    <Pebble w={w} h={h}>
      <View style={{ position: 'absolute', width: eye, height: eye, borderRadius: eye, backgroundColor: C.ink, left: w * 0.58, top: h * 0.33 }} />
    </Pebble>
  );
}

const BTN = {
  ink: { bg: C.ink, fg: C.bg },
  ember: { bg: C.ember, fg: C.ink },
  sand: { bg: C.sand, fg: C.ink },
  ghost: { bg: 'transparent', fg: C.ink },
  off: { bg: C.line, fg: C.disabled },
  danger: { bg: C.danger, fg: '#FFFFFF' },
};

export function Button({ title, onPress, kind = 'ink', icon, iconAfter, height = 56, style, disabled }: {
  title: string; onPress?: () => void; kind?: keyof typeof BTN; icon?: AndroidName; iconAfter?: AndroidName;
  height?: number; style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const c = BTN[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        { height, borderRadius: height / 2, backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, opacity: pressed ? 0.85 : 1 },
        style,
      ]}>
      {icon && <Icon name={icon} size={20} color={c.fg} />}
      <Text style={{ color: c.fg, fontFamily: kind === 'ghost' ? F.medium : F.bold, fontSize: height >= 52 ? 16 : 14 }}>{title}</Text>
      {iconAfter && <Icon name={iconAfter} size={20} color={c.fg} />}
    </Pressable>
  );
}

export function IconButton({ name, onPress, color = C.ink, size = 24, label, fill, style }: {
  name: AndroidName; onPress?: () => void; color?: string; size?: number; label: string; fill?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={4} style={[s.iconBtn, style]}>
      <Icon name={name} size={size} color={color} fill={fill} />
    </Pressable>
  );
}

export function Field({ label, error, trailing, mono, ...input }: TextInputProps & { label?: string; error?: string; trailing?: ReactNode; mono?: boolean }) {
  return (
    <View>
      {label && <Text style={s.label}>{label}</Text>}
      <View style={[s.field, { borderColor: error ? C.dangerLine : C.line }]}>
        <TextInput
          placeholderTextColor="#9A8E84"
          autoCapitalize="none"
          autoCorrect={false}
          {...input}
          // Mono only for typed text: a mono placeholder is too wide next to trailing buttons.
          style={[s.input, mono && !!input.value && { fontFamily: F.mono }]}
        />
        {trailing}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, format = String }: {
  options: readonly T[]; value: T; onChange: (v: T) => void; format?: (v: T) => string;
}) {
  return (
    <View style={s.seg}>
      {options.map((o) => (
        <Pressable key={String(o)} onPress={() => onChange(o)} style={[s.segOpt, o === value && { backgroundColor: C.ink }]}>
          <Text style={{ fontFamily: F.medium, fontSize: 13, color: o === value ? C.bg : C.ink }}>{format(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Title({ children, size = 32, style }: { children: ReactNode; size?: number; style?: StyleProp<any> }) {
  return <Text style={[{ fontFamily: F.display, fontSize: size, lineHeight: size * 1.05, letterSpacing: -size / 32, color: C.ink }, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<any> }) {
  return <Text style={[{ fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.muted }, style]}>{children}</Text>;
}

export function OfflineLine({ text = 'Offline. Nothing left this phone.' }: { text?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.ok }} />
      <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{text}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  label: { fontFamily: F.medium, fontSize: 12, color: C.muted, marginBottom: 6 },
  field: { minHeight: 52, borderRadius: 16, backgroundColor: C.card, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4 },
  input: { flex: 1, minWidth: 0, fontFamily: F.body, fontSize: 16, color: C.ink, paddingVertical: 12 },
  error: { marginTop: 6, fontFamily: F.body, fontSize: 13, color: C.danger },
  seg: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 14, backgroundColor: C.bg },
  segOpt: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, borderRadius: 20, backgroundColor: C.card },
  mono: { fontFamily: F.monoBold, fontSize: 11, letterSpacing: 1, color: C.faint },
});
