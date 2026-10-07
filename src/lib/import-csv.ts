import type { CredInput } from './vault';

/** RFC 4180 CSV: quoted fields may hold commas, line breaks and "" for a quote. Blank rows are dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows.filter((r) => r.some((f) => f !== ''));
}

/**
 * Turns an exported url into what Kip matches on:
 * android://<hash>@com.example.app/ -> com.example.app, https://www.site.com/login -> www.site.com
 */
export function siteOrApp(url: string) {
  const u = url.trim();
  const app = /^android:\/\/[^@]*@([^/?#]+)/i.exec(u);
  if (app) return app[1];
  return u.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/)[0];
}

/**
 * Google Password Manager / Chrome export (name,url,username,password,note), matched by header name.
 * Returns null when the file doesn't look like a password export.
 */
export function fromPasswordCsv(text: string): CredInput[] | null {
  const [head, ...body] = parseCsv(text.replace(/^﻿/, ''));
  const h = (head ?? []).map((s) => s.trim().toLowerCase());
  const col = (...names: string[]) => h.findIndex((x) => names.includes(x));
  const iName = col('name', 'title');
  const iUrl = col('url', 'website', 'origin');
  const iUser = col('username', 'login', 'user');
  const iPass = col('password');
  const iNote = col('note', 'notes');
  if (iPass < 0 || (iUrl < 0 && iName < 0)) return null;

  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '') : '');
  return body.flatMap((r) => {
    const username = get(r, iUser).trim();
    const password = get(r, iPass); // Not trimmed: spaces can be part of a password.
    if (!username && !password) return [];
    const url = siteOrApp(get(r, iUrl));
    const title = get(r, iName).trim() || url || 'Imported login';
    return [{ title, username, password, url, notes: get(r, iNote).trim(), custom: [] }];
  });
}
