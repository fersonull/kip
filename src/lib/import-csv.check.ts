// Run: node --experimental-strip-types src/lib/import-csv.check.ts
// @ts-ignore -- Node needs the extension; the app bundler doesn't.
import { fromPasswordCsv, parseCsv, siteOrApp } from './import-csv.ts';

const eq = (a: unknown, b: unknown) => {
  const [x, y] = [JSON.stringify(a), JSON.stringify(b)];
  if (x !== y) throw new Error(`expected ${y}\n     got ${x}`);
};

// CSV edge cases: quotes, commas, line breaks inside quotes, CRLF, blank lines, last line without newline.
eq(parseCsv('a,b\r\n"x, y","he said ""hi"""\n\n"multi\nline",z'), [['a', 'b'], ['x, y', 'he said "hi"'], ['multi\nline', 'z']]);
eq(parseCsv('a,,c\n'), [['a', '', 'c']]);

eq(siteOrApp('https://github.com/login?x=1'), 'github.com');
eq(siteOrApp('android://AbC123_-==@com.instagram.android/'), 'com.instagram.android');
eq(siteOrApp('http://192.168.8.1:8080/admin'), '192.168.8.1:8080');
eq(siteOrApp(''), '');

// Google Password Manager export, with Excel's BOM and an empty row to skip.
const csv =
  '﻿name,url,username,password,note\n' +
  'github.com,https://github.com/,fersonull,"p@ss, word",\n' +
  'Instagram,android://hash@com.instagram.android/,sam,s3cret, \n' +
  ',https://example.org/x,,,\n' +
  ',https://nameless.site/,me,  spaced  ,a note\n';
eq(fromPasswordCsv(csv), [
  { title: 'github.com', username: 'fersonull', password: 'p@ss, word', url: 'github.com', notes: '', custom: [] },
  { title: 'Instagram', username: 'sam', password: 's3cret', url: 'com.instagram.android', notes: '', custom: [] },
  { title: 'nameless.site', username: 'me', password: '  spaced  ', url: 'nameless.site', notes: 'a note', custom: [] },
]);

// Older Chrome exports have no note column; columns can come in any order.
eq(fromPasswordCsv('url,password,username,name\nhttps://a.com,pw,u,A')![0], { title: 'A', username: 'u', password: 'pw', url: 'a.com', notes: '', custom: [] });

// Not a password export.
eq(fromPasswordCsv('{"v":1}'), null);
eq(fromPasswordCsv('first,last\nAda,Lovelace'), null);

console.log('import-csv.check ok');
