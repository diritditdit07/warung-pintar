import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type SessionContext = {
  sessionId: string;
  storeId: string;
  storeUserId: string;
};

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function sha256(value: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((buffer) => {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
}

export async function resolveSession(request: Request) {
  const rawToken = request.headers.get('x-session-token') || '';

  if (!rawToken) {
    throw new Error('Session token is required');
  }

  const tokenHash = await sha256(rawToken);
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('app_sessions')
    .select('id, store_id, store_user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Session tidak valid atau sudah habis');
  }

  await supabase
    .from('app_sessions')
    .update({ last_used_at: nowIso })
    .eq('id', data.id);

  return {
    supabase,
    session: {
      sessionId: data.id,
      storeId: data.store_id,
      storeUserId: data.store_user_id
    } as SessionContext
  };
}
