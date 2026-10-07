import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { b64ToJson, getWrap, jsonToB64, seal, unseal, unwrapKey, type Wrap } from './keys';
import type { CredInput } from './vault';

type BackupFile = { v: 1; wrap: Wrap; data: string };

/**
 * The file carries the data key wrapped by the master password (same Argon2id wrap as the vault),
 * plus every login sealed with AES-256-GCM. Only that master password opens it.
 */
export async function makeBackup(dataKey: string, items: CredInput[]) {
  const body: BackupFile = { v: 1, wrap: await getWrap(), data: await seal(dataKey, jsonToB64(items)) };
  const name = `kip-backup-${new Date().toISOString().slice(0, 10)}.kip`;
  const file = new File(Paths.cache, name);
  file.write(JSON.stringify(body));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Save your Kip backup' });
  return name;
}

export async function pickBackup(): Promise<{ name: string; size: number; text: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (res.canceled) return null;
  const a = res.assets[0];
  return { name: a.name, size: a.size ?? 0, text: await new File(a.uri).text() };
}

/** Returns the logins, or null when the password doesn't open this file. Throws on a corrupt file. */
export async function readBackup(text: string, password: string): Promise<CredInput[] | null> {
  const f: BackupFile = JSON.parse(text);
  if (f.v !== 1) throw new Error('Unknown backup version');
  const key = await unwrapKey(password, f.wrap);
  if (!key) return null;
  return b64ToJson<CredInput[]>(await unseal(key, f.data));
}
