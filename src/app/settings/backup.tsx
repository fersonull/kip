import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Body, Button, Field, Icon, IconButton, Title } from '@/components/ui';
import { C, F } from '@/constants/tokens';
import { makeBackup, pickFile, readBackup } from '@/lib/backup';
import { fromPasswordCsv } from '@/lib/import-csv';
import { useVault } from '@/lib/vault-context';

type Picked = { name: string; size: number; text: string };

export default function Backup() {
  const v = useVault();
  const toast = useToast();
  const [bk, setBk] = useState<'idle' | 'working' | 'done'>('idle');
  const [file, setFile] = useState('');
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState<number | null>(null);
  const [imported, setImported] = useState<{ added: number; skipped: number } | null>(null);
  const [importErr, setImportErr] = useState('');
  const [importing, setImporting] = useState(false);

  const backupSub = v.settings.lastBackup ? `Last backup: ${v.settings.lastBackup}` : 'No backup yet. Worth doing today.';

  const create = async () => {
    setBk('working');
    try {
      const name = await v.away(() => makeBackup(v.dataKey(), v.items));
      setFile(name);
      setBk('done');
      const now = new Date();
      await v.setSettings({ lastBackup: `${now.toLocaleDateString()}, ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` });
    } catch {
      setBk('idle');
      toast.flash('Couldn’t make the backup. Try again.', 'error');
    }
  };

  const choose = async () => {
    const f = await v.away(pickFile).catch(() => null);
    if (!f) return;
    setPicked(f);
    setPw('');
    setErr('');
    setRestored(null);
  };

  const importCsv = async () => {
    setImportErr('');
    const f = await v.away(pickFile).catch(() => null);
    if (!f) return;
    const list = fromPasswordCsv(f.text);
    if (!list) return setImportErr('That doesn’t look like a passwords export. Pick the CSV file Google made.');
    setImporting(true);
    try {
      const added = await v.importItems(list);
      setImported({ added, skipped: list.length - added });
    } catch {
      setImportErr('Couldn’t import that file. Try again.');
    } finally {
      setImporting(false);
    }
  };

  const restore = async () => {
    if (!picked || restoring) return;
    setRestoring(true);
    try {
      const list = await readBackup(picked.text, pw);
      if (!list) {
        setPw('');
        setErr('That password doesn’t open this file. Use the master password from when the backup was made.');
        return;
      }
      setRestored(await v.importItems(list));
      setPicked(null);
    } catch {
      setErr('That file isn’t a Kip backup, or it’s damaged.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 8 }}>
        <IconButton name="arrow_back" label="Back" onPress={() => router.back()} />
      </View>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <Title>Your spare key</Title>
          <Body style={{ marginTop: 10 }}>
            Kip lives only on this phone. A backup file is the one way to move to a new phone, or get everything back if this one goes missing.
          </Body>

          <View style={{ marginTop: 20, padding: 16, borderRadius: 22, backgroundColor: C.card, gap: 12 }}>
            <Head icon="upload_file" title="Make a backup file" sub={backupSub} />
            {bk === 'idle' && <Button title="Create backup" height={52} onPress={create} />}
            {bk === 'working' && <Button title="Locking it up…" kind="sand" height={52} icon="hourglass_top" disabled />}
            {bk === 'done' && (
              <Done>
                <Text style={{ fontFamily: F.bold }}>{file}</Text>
                {'\n'}Copy it somewhere off this phone.
              </Done>
            )}
            <Text style={{ fontFamily: F.body, fontSize: 12, lineHeight: 17, color: C.faint }}>
              The file is encrypted with your master password. Without it, the file is just noise.
            </Text>
          </View>

          <View style={{ marginTop: 12, padding: 16, borderRadius: 22, backgroundColor: C.card, gap: 12 }}>
            <Head icon="download" title="Restore from a file" sub="Adds the logins to what’s already here" />
            {!picked && restored === null && <Button title="Choose a backup file" kind="sand" height={52} onPress={choose} />}
            {picked && (
              <>
                <Text style={{ fontFamily: F.mono, fontSize: 13, color: C.muted }}>
                  {picked.name} · {Math.max(1, Math.round(picked.size / 1024))} KB
                </Text>
                <Field
                  value={pw}
                  onChangeText={(t) => {
                    setPw(t);
                    setErr('');
                  }}
                  secureTextEntry
                  placeholder="Master password for this file"
                  error={err}
                  onSubmitEditing={restore}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                  <Button title="Cancel" kind="ghost" height={44} onPress={() => setPicked(null)} />
                  <Button title={restoring ? 'Opening…' : 'Restore'} height={44} onPress={restore} disabled={restoring} />
                </View>
              </>
            )}
            {restored !== null && (
              <Done>
                <Text style={{ fontFamily: F.bold }}>
                  {restored} {restored === 1 ? 'login' : 'logins'} restored.
                </Text>{' '}
                Duplicates were skipped.
              </Done>
            )}
          </View>

          <View style={{ marginTop: 12, padding: 16, borderRadius: 22, backgroundColor: C.card, gap: 12 }}>
            <Head icon="move_to_inbox" title="Import from Google" sub="Bring over passwords saved in Google Password Manager" />
            {imported ? (
              <>
                <Done>
                  <Text style={{ fontFamily: F.bold }}>
                    {imported.added} {imported.added === 1 ? 'login' : 'logins'} imported.
                  </Text>
                  {imported.skipped ? ` ${imported.skipped} ${imported.skipped === 1 ? 'was' : 'were'} already here.` : ''}
                </Done>
                <View style={{ padding: 14, borderRadius: 16, backgroundColor: C.dangerBg, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Icon name="warning" size={22} color={C.danger} />
                  <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.ink }}>
                    <Text style={{ fontFamily: F.bold }}>Now delete the CSV file</Text> from Downloads (and anywhere you copied it). It holds your passwords as plain text.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.muted }}>
                  In Chrome, open <Text style={{ fontFamily: F.bold }}>Password Manager › Settings › Export passwords</Text>, or use passwords.google.com. Then choose the downloaded CSV file here.
                </Text>
                {!!importErr && <Text style={{ fontFamily: F.body, fontSize: 13, color: C.danger }}>{importErr}</Text>}
                <Button title={importing ? 'Importing…' : 'Choose CSV file'} kind="sand" height={52} onPress={importCsv} disabled={importing} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Head({ icon, title, sub }: { icon: Parameters<typeof Icon>[0]['name']; title: string; sub: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Icon name={icon} color={C.rust} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{title}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{sub}</Text>
      </View>
    </View>
  );
}

function Done({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 14, borderRadius: 16, backgroundColor: C.okBg, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Icon name="check_circle" size={22} color={C.okInk} />
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.ink }}>{children}</Text>
    </View>
  );
}
