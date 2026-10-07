const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

// Long-press app icon shortcuts: "Add login" and "Search". Icons and labels live in
// modules/kip-autofill/android/src/main/res; only the package-specific XML is generated here.
const shortcuts = (pkg) => `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="add"
    android:icon="@drawable/kip_shortcut_add"
    android:shortcutShortLabel="@string/kip_shortcut_add"
    android:shortcutLongLabel="@string/kip_shortcut_add_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="kip://add?source=shortcut"
      android:targetClass="${pkg}.MainActivity"
      android:targetPackage="${pkg}" />
  </shortcut>
  <shortcut
    android:shortcutId="search"
    android:icon="@drawable/kip_shortcut_search"
    android:shortcutShortLabel="@string/kip_shortcut_search"
    android:shortcutLongLabel="@string/kip_shortcut_search_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="kip://search"
      android:targetClass="${pkg}.MainActivity"
      android:targetPackage="${pkg}" />
  </shortcut>
</shortcuts>
`;

module.exports = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    const meta = (activity['meta-data'] ??= []);
    if (!meta.some((m) => m.$['android:name'] === 'android.app.shortcuts')) {
      meta.push({ $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/kip_shortcuts' } });
    }
    return cfg;
  });
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'kip_shortcuts.xml'), shortcuts(cfg.android.package));
      return cfg;
    },
  ]);
};
