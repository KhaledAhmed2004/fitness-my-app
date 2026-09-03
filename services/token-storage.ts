/**
 * MENTOR: Tokens belong in SecureStore, NOT AsyncStorage.
 * AsyncStorage is not encrypted. Access/refresh tokens must be protected.
 *
 * Web note: SecureStore is native-only, so we fall back to localStorage on web
 * for local development. Production web auth usually uses httpOnly cookies.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function saveUserJson(userJson: string) {
  // MENTOR: User profile is not as sensitive as tokens, but keeping it next to
  // the session simplifies bootstrap. You can move this to AsyncStorage later.
  await setItem(USER_KEY, userJson);
}

export async function getUserJson() {
  return getItem(USER_KEY);
}

export async function clearSession() {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
    deleteItem(USER_KEY),
  ]);
}
