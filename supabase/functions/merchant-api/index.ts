import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return json({ error: 'Missing X-API-Key header' }, 401)
    }

    const keyHash = await hashKey(apiKey)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, merchant_id, scopes, rate_limit, is_active')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .maybeSingle()

    if (keyError || !keyData) {
      return json({ error: 'Invalid API key' }, 401)
    }

    // Update last_used_at
    await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id)

    const merchantId = keyData.merchant_id
    const url = new URL(req.url)
    const path = url.pathname.replace(/^\/merchant-api\/?/, '')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 100)
    const offset = (page - 1) * perPage

    // Route handling
    if (path === 'properties' || path === '') {
      const { data, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    const propertyMatch = path.match(/^properties\/(.+)$/)
    if (propertyMatch) {
      const { data } = await supabase
        .from('properties')
        .select('*, units(*)')
        .eq('merchant_id', merchantId)
        .eq('id', propertyMatch[1])
        .single()
      return json({ data })
    }

    if (path === 'units') {
      let query = supabase.from('units').select('*, properties!inner(merchant_id)', { count: 'exact' })
        .eq('properties.merchant_id', merchantId)
      const propertyId = url.searchParams.get('property_id')
      const status = url.searchParams.get('status')
      if (propertyId) query = query.eq('property_id', propertyId)
      if (status) query = query.eq('status', status)
      const { data, count } = await query.range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    if (path === 'tenants') {
      const { data, count } = await supabase
        .from('contracts')
        .select('tenant_user_id, profiles!inner(full_name, email, phone)', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    if (path === 'invoices') {
      let query = supabase.from('invoices').select('*', { count: 'exact' }).eq('merchant_id', merchantId)
      const status = url.searchParams.get('status')
      if (status) query = query.eq('status', status)
      const { data, count } = await query.order('created_at', { ascending: false }).range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    if (path === 'payments') {
      const { data, count } = await supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    if (path === 'maintenance') {
      const { data, count } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    if (path === 'contracts') {
      const { data, count } = await supabase
        .from('contracts')
        .select('*', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1)
      return json({ data, meta: { page, per_page: perPage, total: count } })
    }

    return json({ error: 'Not found' }, 404)
  } catch (err) {
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}
