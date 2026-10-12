/**
 * Secure token storage backed by react-native-keychain.
 *
 * Tokens are stored in the device Keychain (iOS) / Keystore (Android)
 * with WHEN_UNLOCKED_THIS_DEVICE_ONLY accessibility — they cannot be
 * read by other apps, backed up in plaintext, or migrated to another device.
 *
 * NEVER store tokens in AsyncStorage, Redux persisted state, or plain text.
 */

import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'com.flexdesk.mobile.auth';

export interface Tokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Read the stored access + refresh tokens from the Keychain.
 * Returns `{ accessToken: null, refreshToken: null }` if nothing is stored.
 */
export async function getTokens(): Promise<Tokens> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });

    if (!credentials) {
      return { accessToken: null, refreshToken: null };
    }

    // We store the access token as `username` and the refresh token as
    // `password` inside a single Keychain entry so both tokens share
    // the same security settings.
    return {
      accessToken: credentials.username || null,
      refreshToken: credentials.password || null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Persist access + refresh tokens into the Keychain.
 *
 * Uses `WHEN_UNLOCKED_THIS_DEVICE_ONLY` so the entry is only readable
 * while the device is unlocked and is never included in device backups.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Keychain.setGenericPassword(accessToken, refreshToken, {
    service: SERVICE_NAME,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Remove all stored tokens from the Keychain (e.g. on logout or refresh failure).
 */
export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE_NAME });
}
