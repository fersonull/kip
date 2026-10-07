import { fastRoute, park } from '@/lib/deep-link';

/** Runs before routing, outside the app's state. Fast-add links are parked so they survive the unlock screen. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const route = fastRoute(path);
    if (!route) return path;
    park(route);
    return '/';
  } catch {
    return '/';
  }
}
