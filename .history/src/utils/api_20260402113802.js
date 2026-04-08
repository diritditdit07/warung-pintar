import { getWarungLoginUrl, hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from './supabase';

function getWarungDataUrl() {
  if (!supabaseUrl) {
    return '';
  }

  return `${supabaseUrl}/functions/v1/warung-data`;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request gagal');
  }

  return payload;
}

function createFunctionHeaders(authSession) {
  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'x-session-token': authSession.sessionToken
  };
}

export async function fetchWarungBootstrap(authSession) {
  if (!hasSupabaseEnv()) {
    throw new Error('Supabase env belum diisi.');
  }

  const response = await fetch(getWarungDataUrl(), {
    method: 'GET',
    headers: createFunctionHeaders(authSession)
  });

  return parseResponse(response);
}

export async function invokeWarungAction(authSession, action, payload) {
  if (!hasSupabaseEnv()) {
    throw new Error('Supabase env belum diisi.');
  }

  const response = await fetch(getWarungDataUrl(), {
    method: 'POST',
    headers: createFunctionHeaders(authSession),
    body: JSON.stringify({ action, payload })
  });

  return parseResponse(response);
}