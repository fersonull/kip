import * as SQLite from 'expo-sqlite';

import { b64ToHex } from './keys';

export type Custom = { k: string; v: string };
export type Cred = {
  id: number;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  custom: Custom[];
  fav: boolean;
  createdAt: number;
  updatedAt: number;
};
export type CredInput = Pick<Cred, 'title' | 'username' | 'password' | 'url' | 'notes' | 'custom'>;
/** url: the site or app package the login came from (what fill matches on). source: how to describe it. */
export type Pending = { id: number; title: string; username: string; password: string; url: string; source: string; createdAt: number };

let db: SQLite.SQLiteDatabase | null = null;
const d = () => {
  if (!db) throw new Error('Vault is locked');
  return db;
};

/** Opens the SQLCipher DB. Throws if the key is wrong. */
export async function openVault(dataKeyB64: string) {
  // The JS runtime outlives the activity while the shake service keeps the process up, so a handle from the
  // last session can still be open. expo-sqlite would hand that cached connection back, and it fails on use.
  await closeVault().catch(() => {});
  const next = await SQLite.openDatabaseAsync('kip.db');
  try {
    // Hex comes from our own key bytes, so interpolation is safe here.
    await next.execAsync(`PRAGMA key = "x'${b64ToHex(dataKeyB64)}'";`);
    await next.execAsync(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, username TEXT NOT NULL DEFAULT '', password TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', custom_fields TEXT NOT NULL DEFAULT '[]',
        fav INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS pending (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, username TEXT NOT NULL DEFAULT '', password TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);`);
    // v2: pending logins keep the site or app package. Throws once the column exists, which is fine.
    await next.execAsync("ALTER TABLE pending ADD COLUMN url TEXT NOT NULL DEFAULT ''").catch(() => {});
  } catch (e) {
    await next.closeAsync();
    throw e;
  }
  db = next;
}

/** Only for first setup: a DB without a wrapped key can never be opened again. */
export async function discardVaultFile() {
  await closeVault();
  await SQLite.deleteDatabaseAsync('kip.db').catch(() => {});
}

export async function closeVault() {
  const old = db;
  db = null;
  await old?.closeAsync();
}

type Row = {
  id: number; title: string; username: string; password: string; url: string; notes: string;
  custom_fields: string; fav: number; created_at: number; updated_at: number;
};

export async function listCreds(): Promise<Cred[]> {
  const rows = await d().getAllAsync<Row>('SELECT * FROM credentials');
  return rows.map((r) => ({
    id: r.id, title: r.title, username: r.username, password: r.password, url: r.url, notes: r.notes,
    custom: JSON.parse(r.custom_fields), fav: !!r.fav, createdAt: r.created_at, updatedAt: r.updated_at,
  }));
}

export async function listPending(): Promise<Pending[]> {
  const rows = await d().getAllAsync<Omit<Pending, 'createdAt'> & { created_at: number }>(
    'SELECT * FROM pending ORDER BY created_at');
  return rows.map(({ created_at, ...p }) => ({ ...p, createdAt: created_at }));
}

export async function saveCred(c: CredInput, id?: number) {
  const now = Date.now();
  const args = [c.title, c.username, c.password, c.url, c.notes, JSON.stringify(c.custom), now];
  if (id) {
    await d().runAsync(
      'UPDATE credentials SET title=?, username=?, password=?, url=?, notes=?, custom_fields=?, updated_at=? WHERE id=?',
      ...args, id);
  } else {
    await d().runAsync(
      'INSERT INTO credentials (title, username, password, url, notes, custom_fields, updated_at, created_at) VALUES (?,?,?,?,?,?,?,?)',
      ...args, now);
  }
}

export const deleteCred = (id: number) => d().runAsync('DELETE FROM credentials WHERE id=?', id);
export const setFav = (id: number, fav: boolean) => d().runAsync('UPDATE credentials SET fav=? WHERE id=?', fav ? 1 : 0, id);
export const addPending = (p: Omit<Pending, 'id'>) =>
  d().runAsync('INSERT INTO pending (title, username, password, url, source, created_at) VALUES (?,?,?,?,?,?)',
    p.title, p.username, p.password, p.url, p.source, p.createdAt);
export const deletePending = (id: number) => d().runAsync('DELETE FROM pending WHERE id=?', id);
