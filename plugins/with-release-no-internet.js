const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// Release builds drop INTERNET so "never goes online" is enforced by the OS.
// Debug builds keep it: they load JS from Metro. The release-variant manifest
// outranks main and every library manifest, so the remove applies to all of them.
const MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <uses-permission android:name="android.permission.INTERNET" tools:node="remove" />
</manifest>
`;

module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/release');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'AndroidManifest.xml'), MANIFEST);
      return cfg;
    },
  ]);
