'use client';

const ACCESS_KEY = 'polaris.accessToken';
const REFRESH_KEY = 'polaris.refreshToken';
const USER_KEY = 'polaris.user';

export interface StoredUser {
  id: string;
  email: string;
  name: string | null;
}

const isBrowser = () => typeof window !== 'undefined';

export const authStore = {
  getAccessToken(): string | null {
    return isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefreshToken(): string | null {
    return isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null;
  },
  getUser(): StoredUser | null {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
  setTokens(access: string, refresh: string) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  setUser(user: StoredUser) {
    if (!isBrowser()) return;
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
