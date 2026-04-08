import { getWarungLoginUrl, hasSupabaseEnv, supabaseAnonKey } from './supabase';

const AUTH_STORAGE_KEY = 'warung-pintar-auth-session';

function readJson(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

export function isSessionActive(session) {
  if (!session?.expiresAt) {
    return false;
  }

  return new Date(session.expiresAt).getTime() > Date.now();
}

export function loadAuthSession() {
  const session = readJson(AUTH_STORAGE_KEY, null);

  if (!isSessionActive(session)) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  return session;
}

export function saveAuthSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function loginWithStoreCode(storeCode, pin) {
  if (!hasSupabaseEnv()) {
    throw new Error('Supabase env belum diisi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  }

  const response = await fetch(getWarungLoginUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ storeCode, pin })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Login gagal');
  }

  return payload;
}
