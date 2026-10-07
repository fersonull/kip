import * as Clipboard from 'expo-clipboard';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { C, F } from '@/constants/tokens';

type IconName = Parameters<typeof Icon>[0]['name'];
type Toast = { flash: (msg: string, icon?: IconName, ms?: number) => void; copied: (label: string, value: string, secs: number) => void };

const Ctx = createContext<Toast>(null!);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; icon: IconName } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(clipTimer.current);
    },
    [],
  );

  const flash: Toast['flash'] = (msg, icon = 'check', ms = 2200) => {
    clearTimeout(timer.current);
    setT({ msg, icon });
    timer.current = setTimeout(() => setT(null), ms);
  };

  // ponytail: the clear only runs while the JS runtime is alive; a native alarm would survive process death.
  const copied: Toast['copied'] = (label, value, secs) => {
    Clipboard.setStringAsync(value);
    flash(`${label} copied. Clears in ${secs}s`, 'content_paste');
    clearTimeout(clipTimer.current);
    // Always clears: Android blocks reading the clipboard from the background, so "is it still ours?" can't be checked.
    clipTimer.current = setTimeout(() => Clipboard.setStringAsync(''), secs * 1000);
  };

  return (
    <Ctx.Provider value={{ flash, copied }}>
      {children}
      {t && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute', left: 16, right: 16, bottom: 110, minHeight: 48, borderRadius: 16, backgroundColor: C.ink,
            flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, elevation: 8,
          }}>
          <Icon name={t.icon} size={20} color={C.peach} />
          <Text style={{ flex: 1, color: C.bg, fontFamily: F.body, fontSize: 14 }}>{t.msg}</Text>
        </View>
      )}
    </Ctx.Provider>
  );
}
