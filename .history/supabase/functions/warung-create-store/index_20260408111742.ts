import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function createServiceClient() {
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

function sha256(value: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((buffer) => {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
}

function buildJsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse({ error: 'Method not allowed' }, 405);
  }

  let supabase;

  try {
    supabase = createServiceClient();
  } catch {
    return buildJsonResponse({ error: 'Supabase environment is not configured' }, 500);
  }

  try {
    const { storeCode, storeName, pin, fullName } = await request.json();

    if (!storeCode || !storeName || !pin || !fullName) {
      return buildJsonResponse({ error: 'Store code, name, PIN, and full name are required' }, 400);
    }

    // Validate PIN is numeric and 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return buildJsonResponse({ error: 'PIN must be 4 digits' }, 400);
    }

    // Check if store code already exists
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('code', storeCode.trim().toUpperCase())
      .single();

    if (existingStore) {
      return buildJsonResponse({ error: 'Store code already exists' }, 409);
    }

    // Insert store
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        code: storeCode.trim().toUpperCase(),
        name: storeName.trim(),
        is_active: true
      })
      .select('id')
      .single();

    if (storeError) {
      return buildJsonResponse({ error: 'Failed to create store', details: storeError.message }, 500);
    }

    // Generate salt and hash PIN
    const { data: saltData, error: saltError } = await supabase.rpc('generate_pin_salt');

    if (saltError || !saltData) {
      return buildJsonResponse({ error: 'Failed to generate PIN salt' }, 500);
    }

    const salt = saltData;

    const { data: hashData, error: hashError } = await supabase.rpc('hash_pin', {
      raw_pin: pin,
      raw_salt: salt
    });

    if (hashError || !hashData) {
      return buildJsonResponse({ error: 'Failed to hash PIN' }, 500);
    }

    const pinHash = hashData;

    // Insert store user
    const { error: userError } = await supabase
      .from('store_users')
      .insert({
        store_id: storeData.id,
        full_name: fullName.trim(),
        pin_salt: salt,
        pin_hash: pinHash,
        role: 'owner',
        is_active: true
      });

    if (userError) {
      // If user insert fails, try to delete the store
      await supabase.from('stores').delete().eq('id', storeData.id);
      return buildJsonResponse({ error: 'Failed to create user', details: userError.message }, 500);
    }

    // Create default store settings
    const { error: settingsError } = await supabase
      .from('store_settings')
      .insert({
        store_id: storeData.id,
        store_name: storeName.trim()
      });

    if (settingsError) {
      // Log but don't fail, settings can be created later
      console.error('Failed to create store settings:', settingsError);
    }

    return buildJsonResponse({
      message: 'Store created successfully',
      store: {
        id: storeData.id,
        code: storeCode.trim().toUpperCase(),
        name: storeName.trim()
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