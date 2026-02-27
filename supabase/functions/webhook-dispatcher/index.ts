import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { merchant_id, event_type, payload } = await req.json()

    if (!merchant_id || !event_type || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find active webhook endpoints for this merchant and event
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('merchant_id', merchant_id)
      .eq('is_active', true)
      .lt('failure_count', 10)

    if (!endpoints?.length) {
      return new Response(JSON.stringify({ delivered: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const matchingEndpoints = endpoints.filter(ep => {
      const events = ep.events as string[]
      return events.includes(event_type) || events.includes('*')
    })

    let delivered = 0

    for (const ep of matchingEndpoints) {
      const bodyStr = JSON.stringify({ event: event_type, data: payload, timestamp: new Date().toISOString() })
      const signature = await signPayload(bodyStr, ep.secret)

      let responseStatus: number | null = null
      let responseBody: string | null = null

      try {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
          },
          body: bodyStr,
          signal: AbortSignal.timeout(10000),
        })

        responseStatus = res.status
        responseBody = await res.text()

        if (res.ok) {
          delivered++
          await supabase.from('webhook_endpoints')
            .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
            .eq('id', ep.id)
        } else {
          await supabase.from('webhook_endpoints')
            .update({ failure_count: (ep.failure_count || 0) + 1 })
            .eq('id', ep.id)
        }
      } catch (fetchErr) {
        responseStatus = 0
        responseBody = String(fetchErr)
        await supabase.from('webhook_endpoints')
          .update({ failure_count: (ep.failure_count || 0) + 1 })
          .eq('id', ep.id)
      }

      // Log delivery
      await supabase.from('webhook_logs').insert({
        webhook_id: ep.id,
        event_type,
        payload: payload,
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 2000),
      })
    }

    return new Response(JSON.stringify({ delivered, total: matchingEndpoints.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}
