/**
 * MENTOR: Only EXPO_PUBLIC_* vars are available in the Expo client bundle.
 * Never put secrets here — base URL is public config.
 */

const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const ENV = {
  apiBaseUrl: (
    raw && raw.length > 0 ? raw : 'https://nayem5002.binarybards.online'
  ).replace(/\/$/, ''),
} as const;
