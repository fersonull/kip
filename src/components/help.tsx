import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { Icon, Logo, Pebble } from '@/components/ui';
import { C, F } from '@/constants/tokens';

type IconName = Parameters<typeof Icon>[0]['name'];

export type Topic = {
  id: string;
  icon: IconName;
  title: string;
  sub: string;
  Art: () => ReactNode;
  /** Wrap words in **double stars** to bold them. */
  steps: string[];
  note?: string;
};

// Illustrations: small mockups built from the app's own pieces, so they always match its look.

const txt = (size: number, color: string = C.ink, font: string = F.body) => ({ fontFamily: font, fontSize: size, color });
const card: ViewStyle = { backgroundColor: C.card, borderRadius: 16, elevation: 2 };

function Phone({ children, style }: { children?: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ width: 84, height: 140, borderRadius: 18, borderWidth: 3, borderColor: C.ink, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
    </View>
  );
}

const Shakes = ({ flip }: { flip?: boolean }) => (
  <View style={{ gap: 6, alignItems: flip ? 'flex-start' : 'flex-end' }}>
    {[16, 28, 16].map((h, i) => (
      <View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: C.ember }} />
    ))}
  </View>
);

function ShakeArt() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Shakes />
      <Phone style={{ transform: [{ rotate: '-8deg' }] }}>
        <Logo w={44} h={37} />
        <View style={{ position: 'absolute', right: 8, bottom: 10 }}>
          <Pebble w={26} h={26}>
            <Icon name="add" size={16} />
          </Pebble>
        </View>
      </Phone>
      <Shakes flip />
    </View>
  );
}

function TileArt() {
  const tile = (icon: IconName, label: string) => (
    <View key={label} style={{ width: 104, height: 46, borderRadius: 16, backgroundColor: '#3B3734', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 }}>
      <Icon name={icon} size={18} color="#F2ECE6" />
      <Text style={txt(12, '#F2ECE6')}>{label}</Text>
    </View>
  );
  return (
    <View style={{ width: 236, padding: 10, borderRadius: 22, backgroundColor: '#2B2826', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {tile('wifi', 'Wi‑Fi')}
      {tile('bluetooth', 'Bluetooth')}
      <View style={{ width: 104, height: 46, borderRadius: 16, backgroundColor: C.peach, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 }}>
        <Pebble w={22} h={19} color={C.ink}>
          <View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: C.peach, left: 13, top: 6 }} />
        </Pebble>
        <View>
          <Text style={txt(12, C.ink, F.bold)}>Kip</Text>
          <Text style={txt(10)}>Add login</Text>
        </View>
      </View>
      {tile('flashlight_on', 'Torch')}
    </View>
  );
}

function AutofillArt() {
  return (
    <View style={{ width: 236 }}>
      <Text style={txt(11, C.muted, F.medium)}>Username</Text>
      <View style={{ marginTop: 4, height: 38, borderRadius: 8, borderWidth: 2, borderColor: '#2A78D6', backgroundColor: C.card }} />
      <View style={[card, { marginTop: 6, width: 170, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }]}>
        <Logo w={26} h={22} />
        <View>
          <Text style={txt(13, C.ink, F.bold)}>Unlock Kip</Text>
          <Text style={txt(11, C.muted)}>to fill this login</Text>
        </View>
      </View>
      <View style={{ position: 'absolute', right: 0, bottom: -6 }}>
        <Pebble w={64} h={54}>
          <Icon name="fingerprint" size={30} />
        </Pebble>
      </View>
    </View>
  );
}

function SaveArt() {
  return (
    <View style={[card, { width: 236, padding: 16, gap: 10, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Logo w={30} h={25} />
        <Text style={txt(16, C.ink, F.bold)}>Save to Kip?</Text>
      </View>
      <View style={{ padding: 10, borderRadius: 12, backgroundColor: C.sand }}>
        <Text style={txt(12, C.ink, F.bold)}>Ember Bank</Text>
        <Text style={txt(12)}>sam.okafor · ••••••••</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <Text style={txt(12, C.ink, F.medium)}>Not now</Text>
        <View style={{ height: 30, paddingHorizontal: 16, borderRadius: 15, backgroundColor: C.ink, justifyContent: 'center' }}>
          <Text style={txt(12, C.bg, F.bold)}>Save</Text>
        </View>
      </View>
    </View>
  );
}

function CopyArt() {
  return (
    <View style={{ width: 236, gap: 12 }}>
      <View style={[card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={txt(11, C.muted)}>Password</Text>
          <Text style={txt(15, C.ink, F.mono)}>••••••••••</Text>
        </View>
        <Icon name="visibility" size={20} color={C.muted} />
        <View style={{ width: 12 }} />
        <Icon name="content_copy" size={20} color={C.rust} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: C.ink }}>
        <Icon name="content_paste" size={18} color={C.peach} />
        <Text style={txt(12, C.bg)}>Password copied. Clears in 30s</Text>
      </View>
    </View>
  );
}

function LockArt() {
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Pebble w={104} h={88}>
        <Icon name="fingerprint" size={46} />
      </Pebble>
      <View style={{ height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="key" size={16} color={C.rust} />
        <Text style={txt(12, C.ink, F.medium)}>Master password</Text>
      </View>
    </View>
  );
}

function BackupArt() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={[card, { padding: 12, alignItems: 'center', gap: 6, width: 112 }]}>
        <Icon name="upload_file" size={30} color={C.rust} />
        <Text style={txt(10, C.ink, F.monoBold)}>kip-backup.kip</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Icon name="lock" size={12} color={C.muted} />
          <Text style={txt(10, C.muted)}>encrypted</Text>
        </View>
      </View>
      <Icon name="arrow_forward" size={22} color={C.ink} />
      <Phone style={{ width: 64, height: 108, borderRadius: 14 }}>
        <Logo w={34} h={28} />
      </Phone>
    </View>
  );
}

export const TOPICS: Topic[] = [
  {
    id: 'add',
    icon: 'vibration',
    title: 'Add a login fast',
    sub: 'Shake, tap, or skip opening Kip',
    Art: ShakeArt,
    steps: [
      'Inside Kip, give your phone a **little shake**. The Add sheet opens.',
      'Or tap the **+ pebble** next to search.',
      'Only the name is required. Tap **Make one** for a strong password.',
    ],
    note: 'Too jumpy, or not enough? Change it in Settings › **Shake to add**.',
  },
  {
    id: 'tile',
    icon: 'splitscreen_top',
    title: 'Add without opening Kip',
    sub: 'Quick Settings tile and app shortcuts',
    Art: TileArt,
    steps: [
      'Pull down **Quick Settings** and tap the pencil to edit your tiles.',
      'Drag the **Kip** tile in. One tap opens Add, after unlocking.',
      'Or **long-press the Kip icon** on your home screen for Add login and Search.',
    ],
  },
  {
    id: 'autofill',
    icon: 'auto_awesome',
    title: 'Fill logins in other apps',
    sub: 'Unlock Kip right from the login field',
    Art: AutofillArt,
    steps: [
      'Turn it on once: Settings › **Autofill** › Open Android settings › pick **Kip**.',
      'Tap a username or password field, then **Unlock Kip** just below it.',
      'Touch the fingerprint sensor and pick the login. Kip fills both fields.',
    ],
    note: 'Kip matches by the **Website or app** field, so fill it in. In Chrome, also turn on Settings › Autofill settings › **Autofill using another service**. Chrome never autofills plain http:// pages, like router admin pages.',
  },
  {
    id: 'save',
    icon: 'download',
    title: 'Save logins as you sign in',
    sub: 'Even while Kip is locked',
    Art: SaveArt,
    steps: [
      'Sign in or sign up somewhere else. Android asks **Save to Kip?** Tap Save.',
      'Kip holds it, encrypted, until you next unlock. It never needs to open.',
      'In Kip, tap **Review** to keep, edit, or toss what was caught.',
    ],
  },
  {
    id: 'copy',
    icon: 'content_copy',
    title: 'Copy without leaving a trail',
    sub: 'The clipboard wipes itself',
    Art: CopyArt,
    steps: [
      'Passwords stay hidden until you tap the **eye**.',
      'Tap **copy** next to any field, then paste it where you need it.',
      'Kip clears the clipboard on its own, after **30 seconds** unless you changed it.',
    ],
    note: 'Want longer or shorter? Settings › **Clear clipboard after**.',
  },
  {
    id: 'lock',
    icon: 'fingerprint',
    title: 'Locking and your master password',
    sub: 'What opens Kip, and what can’t be undone',
    Art: LockArt,
    steps: [
      'Kip locks itself when you leave the app, after the time in **Lock after**.',
      'Open it with your **fingerprint**, or type your master password any time.',
      'Your master password **can’t be reset**, not even by us. Keep it written down somewhere safe.',
    ],
  },
  {
    id: 'backup',
    icon: 'inventory_2',
    title: 'Back up and move phones',
    sub: 'Your spare key, since nothing syncs',
    Art: BackupArt,
    steps: [
      'Settings › **Backup and restore** › Create backup. Save the file off this phone, like Drive or a computer.',
      'On a new phone, set up Kip, then **Restore from a file**.',
      'Use the **master password from when the backup was made**.',
    ],
    note: 'Logins already in Kip are skipped, so restoring twice is safe.',
  },
];

/** Renders **bold** segments inside a line of text. */
export function Rich({ text, style }: { text: string; style: object }) {
  return (
    <Text style={style}>
      {text.split('**').map((part, i) => (i % 2 ? <Text key={i} style={{ fontFamily: F.bold }}>{part}</Text> : part))}
    </Text>
  );
}
