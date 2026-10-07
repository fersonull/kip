import { useEffect, useState } from 'react';

import Autofill from '../../modules/kip-autofill';

export type App = { label: string; pkg: string };

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
