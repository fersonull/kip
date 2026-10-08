import { aesDecryptAsync, aesEncryptAsync, AESEncryptionKey, AESSealedData, getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

import KipCrypto from '../../modules/kip-crypto';

const WRAP = 'kip.wrap';
const BIO = 'kip.bio';
const SETTINGS = 'kip.settings';

// ponytail: fixed Argon2id cost (64 MiB, 3 passes). Store params in the wrap blob if they ever need to change.
const MEM_KIB = 64 * 1024;
const ITER = 3;

export type Wrap = { salt: string; key: string };

export const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
/** expo-crypto's typings allow a base64 string in fromCombined, but Android's native side only takes bytes. */
const b64ToBytes = (b: string) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
export const b64ToHex = (b: string) =>
  Array.from(atob(b), (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

async function kek(password: string, salt: string) {
  return AESEncryptionKey.import(await KipCrypto.argon2id(password, salt, MEM_KIB, ITER), 'base64');
}

export async function seal(keyB64: string, plainB64: string) {
  const key = await AESEncryptionKey.import(keyB64, 'base64');
  return (await aesEncryptAsync(plainB64, key)).combined('base64');
}

/** Throws if the key is wrong or the data was tampered with (GCM auth). */
export async function unseal(keyB64: string, sealedB64: string) {
  const key = await AESEncryptionKey.import(keyB64, 'base64');
  return aesDecryptAsync(AESSealedData.fromCombined(b64ToBytes(sealedB64)), key, { output: 'base64' });
}

/** Wraps a data key with a key derived from the password. */
export async function wrapKey(password: string, dataKey: string): Promise<Wrap> {
  const salt = toB64(getRandomBytes(16));
  const k = await kek(password, salt);
  return { salt, key: await (await aesEncryptAsync(dataKey, k)).combined('base64') };
}

/** Returns the data key, or null when the password is wrong. */
export async function unwrapKey(password: string, w: Wrap): Promise<string | null> {
  try {
    return await aesDecryptAsync(AESSealedData.fromCombined(b64ToBytes(w.key)), await kek(password, w.salt), { output: 'base64' });
  } catch (e) {
    // A wrong password and a broken step look the same to the user; keep them apart in dev logs.
    if (__DEV__) console.warn('[kip] unwrapKey failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

export const hasVault = async () => (await SecureStore.getItemAsync(WRAP)) != null;

export async function getWrap(): Promise<Wrap> {
  return JSON.parse((await SecureStore.getItemAsync(WRAP))!);
}

export async function createVault(password: string) {
  const dataKey = toB64(getRandomBytes(32));
  await SecureStore.setItemAsync(WRAP, JSON.stringify(await wrapKey(password, dataKey)));
  return dataKey;
}

export const unlockWithPassword = async (password: string) => unwrapKey(password, await getWrap());

// The biometric copy of the data key sits behind a Keystore key that needs a fingerprint or face to use.
// ponytail: master password is not forced after reboot yet; add a boot-time flag via native code if needed.
export const canUseBio = () => SecureStore.canUseBiometricAuthentication();

export async function enableBio(dataKey: string) {
  await SecureStore.setItemAsync(BIO, dataKey, { requireAuthentication: true, authenticationPrompt: 'Unlock Kip' });
}

export const disableBio = () => SecureStore.deleteItemAsync(BIO);

export async function unlockWithBio(): Promise<string | null> {
  // A fingerprint prompt asked for while Kip isn't in front (say, opened by a shake mid-unlock) is
  // silently dropped by Android, and expo-secure-store then refuses every later prompt as "already in
  // progress" until the process dies, which the shake service can keep from happening.
  if (AppState.currentState !== 'active') return null;
  try {
    return await SecureStore.getItemAsync(BIO, { requireAuthentication: true, authenticationPrompt: 'Unlock Kip' });
  } catch {
    return null;
  }
}

export type Settings = {
  autoLock: 0 | 60 | 300;
  shake: 'Off' | 'Gentle' | 'Firm';
  /** Shake works while Kip is closed too (Android foreground service). */
  shakeClosed: boolean;
  clipSecs: 15 | 30 | 60;
  bio: boolean;
  lastBackup: string | null;
};

const DEFAULTS: Settings = { autoLock: 60, shake: 'Gentle', shakeClosed: false, clipSecs: 30, bio: false, lastBackup: null };

export async function loadSettings(): Promise<Settings> {
  const raw = await SecureStore.getItemAsync(SETTINGS);
  return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
}

export const saveSettings = (s: Settings) => SecureStore.setItemAsync(SETTINGS, JSON.stringify(s));

/** JSON with non-ASCII escaped, so it round-trips through btoa/atob. */
export const jsonToB64 = (x: unknown) =>
  btoa(JSON.stringify(x).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
export const b64ToJson = <T,>(b: string): T => JSON.parse(atob(b));
