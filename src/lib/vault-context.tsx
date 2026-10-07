import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import Autofill, { type QueuedLogin } from '../../modules/kip-autofill';

import * as keys from './keys';
import * as vault from './vault';
import type { Cred, CredInput, Pending } from './vault';

type Status = 'loading' | 'new' | 'locked' | 'unlocked';

type Vault = {
  status: Status;
  onboarding: boolean;
  items: Cred[];
  pending: Pending[];
  settings: keys.Settings;
  /** Route to open right after the next unlock (shake or tile while locked). */
  afterUnlock: string | null;
  setAfterUnlock: (r: string | null) => void;
  create: (password: string) => Promise<void>;
  finishOnboarding: (bio: boolean) => Promise<void>;
  unlockPassword: (password: string) => Promise<boolean>;
  unlockBio: () => Promise<boolean>;
  lock: () => Promise<void>;
  save: (c: CredInput, id?: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  toggleFav: (id: number) => Promise<void>;
  dropPending: (id: number) => Promise<void>;
  setSettings: (patch: Partial<keys.Settings>) => Promise<void>;
  /** Merges logins, skipping exact duplicates. Returns how many were added. */
  importItems: (list: CredInput[]) => Promise<number>;
  dataKey: () => string;
  /** Run something that leaves the app (share sheet, file picker, system settings) without tripping auto-lock. */
  away: <T>(fn: () => Promise<T>) => Promise<T>;
};

const Ctx = createContext<Vault>(null!);
export const useVault = () => useContext(Ctx);

const sameCred = (a: CredInput, b: CredInput) => a.title === b.title && a.username === b.username && a.password === b.password;

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [onboarding, setOnboarding] = useState(false);
  const [items, setItems] = useState<Cred[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [settings, setSettingsState] = useState<keys.Settings>(null!);
  const [afterUnlock, setAfterUnlock] = useState<string | null>(null);
  const key = useRef<string | null>(null);
  const awayCount = useRef(0);
  const settingsRef = useRef<keys.Settings>(null!);

  useEffect(() => {
    (async () => {
      settingsRef.current = await keys.loadSettings();
      setSettingsState(settingsRef.current);
      setStatus((await keys.hasVault()) ? 'locked' : 'new');
    })();
  }, []);

  const refresh = async () => {
    // Logins Android asked Kip to save while it was locked.
    const caught = await Autofill.drainQueue().catch(() => [] as string[]);
    for (const json of caught) await vault.addPending(JSON.parse(json) as QueuedLogin);

    const creds = await vault.listCreds();
    setItems(creds);
    setPending(await vault.listPending());

    // Re-seal what the autofill service may offer. Only logins with a site or app can ever match.
    // Fails quietly on phones without a screen lock, where Android won't create the key.
    const fillable = creds.filter((c) => c.url && c.password).map(({ title, username, password, url }) => ({ title, username, password, url }));
    Autofill.writeFillCache(JSON.stringify(fillable)).catch(() => {});
  };

  const open = async (dataKey: string) => {
    await vault.openVault(dataKey);
    key.current = dataKey;
    await refresh();
    setStatus('unlocked');
  };

  const lock = async () => {
    key.current = null;
    await vault.closeVault();
    setItems([]);
    setPending([]);
    setStatus('locked');
  };

  // Auto-lock: checked on return to the app, against the time it left.
  useEffect(() => {
    let leftAt = 0;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') leftAt = Date.now();
      if (next !== 'active' || !leftAt) return;
      const gone = Date.now() - leftAt;
      leftAt = 0;
      if (awayCount.current > 0 || !key.current) return;
      if (gone >= settingsRef.current.autoLock * 1000) lock();
      else refresh(); // Pick up anything autofill saved meanwhile.
    });
    return () => sub.remove();
  }, []);

  const setSettings = async (patch: Partial<keys.Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    if (patch.bio === true && key.current) await keys.enableBio(key.current);
    if (patch.bio === false) await keys.disableBio();
    settingsRef.current = next;
    setSettingsState(next);
    await keys.saveSettings(next);
  };

  const v: Vault = {
    status, onboarding, items, pending, settings, afterUnlock, setAfterUnlock,
    create: async (password) => {
      await vault.discardVaultFile();
      await Autofill.clearFillCache().catch(() => {});
      setOnboarding(true);
      await open(await keys.createVault(password));
    },
    finishOnboarding: async (bio) => {
      await setSettings({ bio: bio && keys.canUseBio() });
      setOnboarding(false);
    },
    unlockPassword: async (password) => {
      const k = await keys.unlockWithPassword(password);
      if (!k) return false;
      await open(k);
      return true;
    },
    unlockBio: async () => {
      const k = await keys.unlockWithBio();
      if (!k) return false;
      await open(k);
      return true;
    },
    lock,
    save: async (c, id) => {
      await vault.saveCred(c, id);
      await refresh();
    },
    remove: async (id) => {
      await vault.deleteCred(id);
      await refresh();
    },
    toggleFav: async (id) => {
      await vault.setFav(id, !items.find((i) => i.id === id)?.fav);
      await refresh();
    },
    dropPending: async (id) => {
      await vault.deletePending(id);
      await refresh();
    },
    setSettings,
    importItems: async (list) => {
      const have: CredInput[] = [...items];
      let n = 0;
      for (const c of list) {
        if (have.some((h) => sameCred(h, c))) continue;
        await vault.saveCred({ ...c, username: c.username ?? '', password: c.password ?? '', url: c.url ?? '', notes: c.notes ?? '', custom: c.custom ?? [] });
        have.push(c);
        n++;
      }
      await refresh();
      return n;
    },
    dataKey: () => key.current!,
    away: async (fn) => {
      awayCount.current++;
      try {
        return await fn();
      } finally {
        // AppState fires 'active' just after the activity returns; release after it.
        setTimeout(() => awayCount.current--, 500);
      }
    },
  };

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
