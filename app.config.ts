import type { ConfigContext, ExpoConfig } from 'expo/config';

// Release builds strip INTERNET so "never goes online" is enforced by the OS.
// Dev clients keep it because they load JS from Metro: APP_VARIANT=development npx expo run:android
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    blockedPermissions:
      process.env.APP_VARIANT === 'development' ? [] : ['android.permission.INTERNET'],
  },
});
