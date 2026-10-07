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
  const tick = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = () => {
    clearTimeout(timer.current);
    clearInterval(tick.current);
  };
  useEffect(() => stop, []);

  const flash: Toast['flash'] = (msg, icon = 'check', ms = 2200) => {
    stop();
    setT({ msg, icon });
    timer.current = setTimeout(() => setT(null), ms);
  };

  // ponytail: the clear only runs while the JS runtime is alive; a native alarm would survive process death.
  const copied: Toast['copied'] = (label, value, secs) => {
    stop();
    Clipboard.setStringAsync(value);
    let left = secs;
    setT({ msg: `${label} copied. Clears in ${left}s`, icon: 'content_paste' });
    tick.current = setInterval(() => {
      left--;
      if (left > 0) return setT({ msg: `${label} copied. Clears in ${left}s`, icon: 'content_paste' });
      clearInterval(tick.current);
      Clipboard.setStringAsync('');
      flash('Clipboard cleared', 'mop', 1600);
    }, 1000);
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
