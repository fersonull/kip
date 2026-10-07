import { createContext, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Body, Button, Icon, Pebble, Title } from '@/components/ui';
import { C } from '@/constants/tokens';

type IconName = Parameters<typeof Icon>[0]['name'];
type Opts = { title: string; message?: string; confirm: string; cancel?: string; destructive?: boolean; icon?: IconName };

const Ctx = createContext<(o: Opts) => Promise<boolean>>(null!);

/** Kip's own confirm dialog: `if (await confirm({ title, confirm: 'Delete', destructive: true })) …` */
export const useConfirm = () => useContext(Ctx);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the card doesn't go blank while it fades out.
  const [d, setD] = useState<(Opts & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = (o: Opts) =>
    new Promise<boolean>((resolve) => {
      setD({ ...o, resolve });
      setOpen(true);
    });

  const done = (ok: boolean) => {
    setOpen(false);
    d?.resolve(ok);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => done(false)} statusBarTranslucent navigationBarTranslucent>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,36,32,.45)' }]} onPress={() => done(false)} accessibilityLabel="Dismiss" />
          {d && (
            <View accessibilityViewIsModal style={{ backgroundColor: C.sheet, borderRadius: 28, padding: 24, gap: 12, elevation: 12 }}>
              {d.icon && (
                <Pebble w={52} h={44} color={d.destructive ? C.dangerBg : C.sand}>
                  <Icon name={d.icon} size={24} color={d.destructive ? C.danger : C.rust} />
                </Pebble>
              )}
              <Title size={22}>{d.title}</Title>
              {!!d.message && <Body style={{ fontSize: 14, lineHeight: 20 }}>{d.message}</Body>}
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <Button title={d.cancel ?? 'Cancel'} kind="ghost" height={44} onPress={() => done(false)} />
                <Button title={d.confirm} kind={d.destructive ? 'danger' : 'ink'} height={44} onPress={() => done(true)} />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </Ctx.Provider>
  );
}
