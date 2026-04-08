import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type LoginRow = {
  store_id: string;
  store_code: string;
  store_name: string;
  store_user_id: string;
  full_name: string;
  role: string;
};

function buildJsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function sha256(value: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((buffer) => {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return buildJsonResponse({ error: 'Supabase environment is not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    const { storeCode, pin } = await request.json();

    if (!storeCode || !pin) {
      return buildJsonResponse({ error: 'Store code and PIN are required' }, 400);
    }

    const { data, error } = await supabase.rpc('verify_store_user_pin', {
      input_store_code: String(storeCode).trim(),
      input_pin: String(pin).trim()
    });

    if (error) {
      return buildJsonResponse({ error: 'Failed to verify login', details: error.message }, 500);
    }

    const loginRow = (data?.[0] ?? null) as LoginRow | null;

    if (!loginRow) {
      return buildJsonResponse({ error: 'Kode warung atau PIN salah' }, 401);
    }

    const rawToken = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

    const { error: sessionError } = await supabase.from('app_sessions').insert({
      store_id: loginRow.store_id,
      store_user_id: loginRow.store_user_id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    if (sessionError) {
      return buildJsonResponse({ error: 'Failed to create session', details: sessionError.message }, 500);
    }

    return buildJsonResponse({
      sessionToken: rawToken,
      expiresAt,
      store: {
        id: loginRow.store_id,
        code: loginRow.store_code,
        name: loginRow.store_name
      },
      user: {
        id: loginRow.store_user_id,
        fullName: loginRow.full_name,
        role: loginRow.role
      }
    });
  } catch (error) {
    return buildJsonResponse(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
});
