import { corsHeaders } from '../_shared/cors.ts';
import { resolveSession } from '../_shared/session.ts';

function buildJsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

async function loadBootstrapData(supabase: ReturnType<typeof resolveSession> extends Promise<infer T> ? T['supabase'] : never, storeId: string) {
  const [{ data: settings }, { data: products }, { data: sales }, { data: expenses }] = await Promise.all([
    supabase.from('store_settings').select('store_name').eq('store_id', storeId).maybeSingle(),
    supabase.from('products').select('id, name, price, is_active, created_at, updated_at').eq('store_id', storeId).order('created_at', { ascending: false }),
    supabase
      .from('sales')
      .select('id, total, day_key, created_at, sale_items(id, product_id, product_name, price, quantity)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false }),
    supabase.from('expenses').select('id, name, amount, day_key, created_at').eq('store_id', storeId).order('created_at', { ascending: false })
  ]);

  return {
    settings: {
      storeName: settings?.store_name || 'Kasir Warung'
    },
    products: (products || []).map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    })),
    sales: (sales || []).map((sale) => ({
      id: sale.id,
      total: Number(sale.total),
      dayKey: sale.day_key,
      createdAt: sale.created_at,
      items: (sale.sale_items || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        price: Number(item.price),
        quantity: item.quantity
      }))
    })),
    expenses: (expenses || []).map((expense) => ({
      id: expense.id,
      name: expense.name,
      amount: Number(expense.amount),
      dayKey: expense.day_key,
      createdAt: expense.created_at
    }))
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, session } = await resolveSession(request);

    if (request.method === 'GET') {
      const bootstrap = await loadBootstrapData(supabase, session.storeId);
      return buildJsonResponse(bootstrap);
    }

    if (request.method !== 'POST') {
      return buildJsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { action, payload } = await request.json();

    if (action === 'upsert-product') {
      const productPayload = {
        store_id: session.storeId,
        name: String(payload?.name || '').trim(),
        price: Number(payload?.price || 0)
      };

      if (!productPayload.name || productPayload.price <= 0) {
        return buildJsonResponse({ error: 'Nama produk dan harga wajib diisi' }, 400);
      }

      const query = payload?.id
        ? supabase
            .from('products')
            .update(productPayload)
            .eq('id', payload.id)
            .eq('store_id', session.storeId)
            .select('id, name, price, is_active, created_at, updated_at')
            .single()
        : supabase
            .from('products')
            .insert(productPayload)
            .select('id, name, price, is_active, created_at, updated_at')
            .single();

      const { data, error } = await query;

      if (error) {
        return buildJsonResponse({ error: error.message }, 400);
      }

      return buildJsonResponse({
        product: {
          id: data.id,
          name: data.name,
          price: Number(data.price),
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      });
    }

    if (action === 'create-sale') {
      const items = Array.isArray(payload?.items) ? payload.items : [];

      if (items.length === 0) {
        return buildJsonResponse({ error: 'Item penjualan kosong' }, 400);
      }

      const saleInput = {
        store_id: session.storeId,
        store_user_id: session.storeUserId,
        total: Number(payload?.total || 0),
        day_key: String(payload?.dayKey || ''),
        created_at: payload?.createdAt || new Date().toISOString()
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleInput)
        .select('id, total, day_key, created_at')
        .single();

      if (saleError) {
        return buildJsonResponse({ error: saleError.message }, 400);
      }

      const saleItems = items.map((item: Record<string, unknown>) => ({
        sale_id: sale.id,
        product_id: item.id || null,
        product_name: String(item.name || ''),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 0)
      }));

      const { data: insertedItems, error: itemError } = await supabase
        .from('sale_items')
        .insert(saleItems)
        .select('id, product_id, product_name, price, quantity');

      if (itemError) {
        return buildJsonResponse({ error: itemError.message }, 400);
      }

      return buildJsonResponse({
        sale: {
          id: sale.id,
          total: Number(sale.total),
          dayKey: sale.day_key,
          createdAt: sale.created_at,
          items: (insertedItems || []).map((item) => ({
            id: item.id,
            productId: item.product_id,
            name: item.product_name,
            price: Number(item.price),
            quantity: item.quantity
          }))
        }
      });
    }

    if (action === 'create-expense') {
      const expenseInput = {
        store_id: session.storeId,
        store_user_id: session.storeUserId,
        name: String(payload?.name || '').trim(),
        amount: Number(payload?.amount || 0),
        day_key: String(payload?.dayKey || ''),
        created_at: payload?.createdAt || new Date().toISOString()
      };

      if (!expenseInput.name || expenseInput.amount <= 0) {
        return buildJsonResponse({ error: 'Nama dan jumlah pengeluaran wajib diisi' }, 400);
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseInput)
        .select('id, name, amount, day_key, created_at')
        .single();

      if (error) {
        return buildJsonResponse({ error: error.message }, 400);
      }

      return buildJsonResponse({
        expense: {
          id: data.id,
          name: data.name,
          amount: Number(data.amount),
          dayKey: data.day_key,
          createdAt: data.created_at
        }
      });
    }

    if (action === 'update-settings') {
      const storeName = String(payload?.storeName || '').trim();

      if (!storeName) {
        return buildJsonResponse({ error: 'Nama warung wajib diisi' }, 400);
      }

      const { data, error } = await supabase
        .from('store_settings')
        .upsert({ store_id: session.storeId, store_name: storeName }, { onConflict: 'store_id' })
        .select('store_name')
        .single();

      if (error) {
        return buildJsonResponse({ error: error.message }, 400);
      }

      return buildJsonResponse({ settings: { storeName: data.store_name } });
    }

    if (action === 'logout') {
      const { error } = await supabase
        .from('app_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', session.sessionId);

      if (error) {
        return buildJsonResponse({ error: error.message }, 400);
      }

      return buildJsonResponse({ success: true });
    }

    return buildJsonResponse({ error: 'Unknown action' }, 400);
  } catch (error) {
    return buildJsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unexpected error'
      },
      401
    );
  }
});
