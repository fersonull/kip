type App = { label: string; pkg: string };

const SECOND_LEVEL = new Set(['com', 'co', 'net', 'org', 'gov', 'edu', 'ac']);
const NOISE = new Set(['com', 'android', 'app', 'org', 'net', 'mobile']);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** "https://accounts.google.com/x" -> "google", "bdo.com.ph" -> "bdo". */
export function siteName(url: string) {
  const host = url.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').split(/[/:?#]/)[0].replace(/^(www|m)\./, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return '';
  const i = parts.length >= 3 && SECOND_LEVEL.has(parts[parts.length - 2]) ? parts.length - 3 : parts.length - 2;
  return parts[i];
}

/** The installed app a website login most likely belongs to, so it can borrow that app's icon. */
// ponytail: name heuristic, add a domain→pkg table if false matches show up
export function appForSite(url: string, apps: App[]) {
  const name = siteName(url);
  if (!name) return undefined;
  const byLabel = apps.find((a) => norm(a.label) === name);
  if (byLabel) return byLabel;
  const byPkg = apps.filter((a) => a.pkg.split('.').some((s) => !NOISE.has(s) && s === name));
  return byPkg.length === 1 ? byPkg[0] : undefined;
}
