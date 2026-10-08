import { useEffect, useState } from 'react';

import { appForSite } from '@/lib/site-app';

import Autofill from '../../modules/kip-autofill';

export type App = { label: string; pkg: string };
export type AppIcon = { uri: string; full: boolean };

let cache: Promise<App[]> | null = null;

/** Installed apps with a launcher icon. Cached for the session; pass fresh to pick up new installs. */
export function getApps(fresh = false): Promise<App[]> {
  if (fresh || !cache) {
    cache = Autofill.listApps().catch(() => {
      cache = null;
      return [];
    });
  }
  return cache;
}

/** Package name -> app name, or undefined while loading. A login's url is an app when it's a key here. */
export function useAppNames() {
  const [names, setNames] = useState<Map<string, string>>();
  useEffect(() => {
    let live = true;
    getApps().then((list) => live && setNames(new Map(list.map((a) => [a.pkg, a.label]))));
    return () => {
      live = false;
    };
  }, []);
  return names;
}

const icons = new Map<string, Promise<AppIcon | null>>();
const resolved = new Map<string, AppIcon | null>();

/** Icon for a login's url: its app, or the installed app its website matches. Null when there's none. */
function iconFor(url: string): Promise<AppIcon | null> {
  let p = icons.get(url);
  if (!p) {
    p = getApps()
      .then((apps) => {
        const app = apps.find((a) => a.pkg === url) ?? appForSite(url, apps);
        return app ? Autofill.appIcon(app.pkg) : null;
      })
      .catch(() => null)
      .then((icon) => (resolved.set(url, icon), icon));
    icons.set(url, p);
  }
  return p;
}

/** A login's icon, or undefined while loading / null when it has none. Rows seen before render it at once. */
export function useLoginIcon(url: string) {
  const key = url.trim();
  const [icon, setIcon] = useState(() => resolved.get(key));
  useEffect(() => {
    let live = true;
    iconFor(key).then((i) => live && setIcon(i));
    return () => {
      live = false;
    };
  }, [key]);
  return icon;
}
