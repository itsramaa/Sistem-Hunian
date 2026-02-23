import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightOrError } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightOrError(req);
  if (corsResponse) return corsResponse;

  const headers = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user token
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // SR-404: Right to access - return all personal data
      const [profileRes, contractsRes, invoicesRes] = await Promise.all([
        adminClient.from('profiles').select('*').eq('user_id', user.id).single(),
        adminClient.from('contracts').select('id, status, start_date, end_date, rent_amount').eq('tenant_user_id', user.id),
        adminClient.from('invoices').select('id, invoice_number, amount, status, due_date').eq('tenant_user_id', user.id),
      ]);

      // Log the access request
      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'gdpr_data_access',
        entity_type: 'user',
        entity_id: user.id,
        metadata: { requested_at: new Date().toISOString() },
      });

      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile: profileRes.data,
        contracts: contractsRes.data || [],
        invoices: invoicesRes.data || [],
        exported_at: new Date().toISOString(),
      }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      // SR-404: Right to delete - anonymize user data
      const body = await req.json().catch(() => ({}));
      const reason = body.reason || 'User requested data deletion';

      // Anonymize profile
      await adminClient.from('profiles').update({
        full_name: '[REDACTED]',
        phone: null,
        email: `deleted_${user.id.slice(0, 8)}@redacted.local`,
        avatar_url: null,
      }).eq('user_id', user.id);

      // Anonymize tenant data if exists
      await adminClient.from('tenants').update({
        ktp_number: null,
        ktp_photo_url: null,
        date_of_birth: null,
        occupation: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
      }).eq('user_id', user.id);

      // Log the deletion request
      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'gdpr_data_deletion',
        entity_type: 'user',
        entity_id: user.id,
        metadata: { reason, deleted_at: new Date().toISOString() },
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Personal data has been anonymized. Account will be deactivated.',
        processed_at: new Date().toISOString(),
      }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers });
  }
});
