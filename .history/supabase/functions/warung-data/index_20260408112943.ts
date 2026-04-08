import { corsHeaders } from '../_shared/cors.ts';
import { resolveSession } from '../_shared/session.ts';

declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
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

type BootstrapProductRow = {
  id: string;
  name: string;
  price: number | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type BootstrapSaleItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  price: number | string;
  quantity: number;
};

type BootstrapSaleRow = {
  id: string;
  total: number | string;
  day_key: string;
  created_at: string;
  sale_items: BootstrapSaleItemRow[] | null;
};

type BootstrapExpenseRow = {
  id: string;
  name: string;
  amount: number | string;
  day_key: string;
  created_at: string;
};

function isUuidString(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function loadBootstrapData(supabase: any, storeId: string) {
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
    products: ((products || []) as BootstrapProductRow[]).map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    })),
    sales: ((sales || []) as BootstrapSaleRow[]).map((sale) => ({
      id: sale.id,
      total: Number(sale.total),
      dayKey: sale.day_key,
      createdAt: sale.created_at,
      items: (sale.sale_items || []).map((item: BootstrapSaleItemRow) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        price: Number(item.price),
        quantity: item.quantity
      }))
    })),
    expenses: ((expenses || []) as BootstrapExpenseRow[]).map((expense) => ({
      id: expense.id,
      name: expense.name,
      amount: Number(expense.amount),
      dayKey: expense.day_key,
      createdAt: expense.created_at
    }))
  };
}

Deno.serve(async (request: Request) => {
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

      const query = isUuidString(payload?.id)
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

    if (action === 'seed-products') {
      const incomingProducts = Array.isArray(payload?.products) ? payload.products : [];

      if (incomingProducts.length === 0) {
        return buildJsonResponse({ error: 'Produk awal kosong' }, 400);
      }

      const { count, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', session.storeId);

      if (countError) {
        return buildJsonResponse({ error: countError.message }, 400);
      }

      if ((count || 0) > 0) {
        const { data: existingProducts, error: existingError } = await supabase
          .from('products')
          .select('id, name, price, is_active, created_at, updated_at')
          .eq('store_id', session.storeId)
          .order('created_at', { ascending: false });

        if (existingError) {
          return buildJsonResponse({ error: existingError.message }, 400);
        }

        return buildJsonResponse({
          products: ((existingProducts || []) as BootstrapProductRow[]).map((product) => ({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            isActive: product.is_active,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          }))
        });
      }

      const insertProducts = incomingProducts.map((product: Record<string, unknown>) => ({
        store_id: session.storeId,
        name: String(product?.name || '').trim(),
        price: Number(product?.price || 0)
      })).filter((product: { name: string; price: number }) => product.name && product.price > 0);

      const { data: seededProducts, error: seedError } = await supabase
        .from('products')
        .insert(insertProducts)
        .select('id, name, price, is_active, created_at, updated_at');

      if (seedError) {
        return buildJsonResponse({ error: seedError.message }, 400);
      }

      return buildJsonResponse({
        products: ((seededProducts || []) as BootstrapProductRow[]).map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          isActive: product.is_active,
          createdAt: product.created_at,
          updatedAt: product.updated_at
        }))
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
        product_id: isUuidString(item.id) ? item.id : null,
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
          items: ((insertedItems || []) as BootstrapSaleItemRow[]).map((item) => ({
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

    if (action === 'delete-sale') {
      const saleId = String(payload?.id || '').trim();

      if (!isUuidString(saleId)) {
        return buildJsonResponse({ error: 'ID transaksi tidak valid' }, 400);
      }

      const { error: itemError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      if (itemError) {
        return buildJsonResponse({ error: itemError.message }, 400);
      }

      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('store_id', session.storeId);

      if (saleError) {
        return buildJsonResponse({ error: saleError.message }, 400);
      }

      return buildJsonResponse({ success: true });
    }

    if (action === 'delete-expense') {
      const expenseId = String(payload?.id || '').trim();

      if (!isUuidString(expenseId)) {
        return buildJsonResponse({ error: 'ID pengeluaran tidak valid' }, 400);
      }

      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('store_id', session.storeId);

      if (expenseError) {
        return buildJsonResponse({ error: expenseError.message }, 400);
      }

      return buildJsonResponse({ success: true });
    }

    if (action === 'delete-product') {
      const productId = String(payload?.id || '').trim();

      if (!isUuidString(productId)) {
        return buildJsonResponse({ error: 'ID produk tidak valid' }, 400);
      }

      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', session.storeId);

      if (productError) {
        return buildJsonResponse({ error: productError.message }, 400);
      }

      return buildJsonResponse({ success: true });
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
