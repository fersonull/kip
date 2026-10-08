// Run: node --experimental-strip-types src/lib/site-app.check.ts
// @ts-ignore -- Node needs the extension; the app bundler doesn't.
import { appForSite, siteName } from './site-app.ts';

const assert = {
  equal(a: unknown, b: unknown) {
    if (a !== b) throw new Error(`expected ${String(b)}, got ${String(a)}`);
  },
};

const apps = [
  { label: 'Facebook', pkg: 'com.facebook.katana' },
  { label: 'Messenger', pkg: 'com.facebook.orca' },
  { label: 'GCash', pkg: 'com.globe.gcash' },
  { label: 'Google', pkg: 'com.google.android.googlequicksearchbox' },
  { label: 'BDO Pay', pkg: 'ph.com.bdo.pay' },
  { label: 'Shop A', pkg: 'com.shopee.ph' },
  { label: 'Shop B', pkg: 'com.shopee.partner' },
];
const pkg = (url: string) => appForSite(url, apps)?.pkg;

assert.equal(siteName('https://accounts.google.com/signin?x=1'), 'google');
assert.equal(siteName('www.bdo.com.ph'), 'bdo');
assert.equal(siteName('m.facebook.com:443'), 'facebook');
assert.equal(siteName('localhost'), '');
assert.equal(siteName(''), '');

assert.equal(pkg('facebook.com'), 'com.facebook.katana'); // label beats the other facebook packages
assert.equal(pkg('https://www.gcash.com'), 'com.globe.gcash');
assert.equal(pkg('accounts.google.com'), 'com.google.android.googlequicksearchbox');
assert.equal(pkg('online.bdo.com.ph'), 'ph.com.bdo.pay');
assert.equal(pkg('shopee.ph'), undefined); // two packages match, no label does: too unsure
assert.equal(pkg('example.com'), undefined);
assert.equal(pkg('android.com'), undefined); // noise segments never match

console.log('site-app: ok');
