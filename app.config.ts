import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Development APKs can reach Metro; preview/store binaries remain offline. */
export default function configure({ config }: ConfigContext): ExpoConfig {
  const development = process.env.ZEKR_BUILD_VARIANT === 'development';
  const developmentPermissions = [
    'android.permission.INTERNET',
    'android.permission.SYSTEM_ALERT_WINDOW',
  ];
  return {
    ...config,
    android: {
      ...config.android,
      permissions: development
        ? [...new Set([...(config.android?.permissions ?? []), ...developmentPermissions])]
        : config.android?.permissions,
      blockedPermissions: development
        ? config.android?.blockedPermissions?.filter((permission) => !developmentPermissions.includes(permission))
        : config.android?.blockedPermissions,
    },
  } as ExpoConfig;
}
