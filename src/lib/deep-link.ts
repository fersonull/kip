// Fast-add links (Quick Settings tile, app-icon shortcuts) can arrive while Kip is locked.
// They wait here until the vault is open, then the root layout routes to them.

let pending: string | null = null;
const listeners = new Set<() => void>();

const FAST = /^(?:kip:)?\/*(add|search)\/?(?:\?(.*))?$/;

/** kip://add?source=tile -> /add?source=tile, kip://search -> /?search=<nonce>. Null for any other link. */
export function fastRoute(path: string): string | null {
  const m = FAST.exec(path);
  if (!m) return null;
  // The nonce makes a repeat "Search" still refocus the field on an already-open vault.
  return m[1] === 'add' ? `/add${m[2] ? `?${m[2]}` : ''}` : `/?search=${Date.now()}`;
}

export function park(route: string) {
  pending = route;
  listeners.forEach((l) => l());
}

export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const peek = () => pending;
export const take = () => {
  const r = pending;
  pending = null;
  listeners.forEach((l) => l());
  return r;
};
