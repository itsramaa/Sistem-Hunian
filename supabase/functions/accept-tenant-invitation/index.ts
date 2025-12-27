import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, user_id, contract_duration_months = 12 } = await req.json();

    console.log('[accept-tenant-invitation] Request received:', { token: token?.substring(0, 8) + '...', user_id, contract_duration_months });

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'INVALID_TOKEN', message: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id || typeof user_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'INVALID_USER', message: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch invitation
    const { data: invitation, error: invError } = await supabase
      .from('tenant_invitations')
      .select(`
        *,
        unit:units(
          id,
          unit_number,
          rent_amount,
          deposit_amount,
          status,
          property:properties(
            id,
            name,
            address,
            merchant_id
          )
        )
      `)
      .eq('token', token)
      .maybeSingle();

    if (invError) {
      console.error('[accept-tenant-invitation] DB error:', invError);
      return new Response(
        JSON.stringify({ error: 'DB_ERROR', message: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!invitation) {
      console.log('[accept-tenant-invitation] Invitation not found for token');
      return new Response(
        JSON.stringify({ error: 'INVITATION_NOT_FOUND', message: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      console.log('[accept-tenant-invitation] Invitation already accepted');
      return new Response(
        JSON.stringify({ error: 'INVITATION_ALREADY_ACCEPTED', message: 'Invitation has already been accepted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      console.log('[accept-tenant-invitation] Invitation expired');
      return new Response(
        JSON.stringify({ error: 'INVITATION_EXPIRED', message: 'Invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if cancelled
    if (invitation.status === 'cancelled') {
      console.log('[accept-tenant-invitation] Invitation cancelled');
      return new Response(
        JSON.stringify({ error: 'INVITATION_CANCELLED', message: 'Invitation has been cancelled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check unit availability
    if (invitation.unit?.status !== 'available') {
      console.log('[accept-tenant-invitation] Unit not available:', invitation.unit?.status);
      return new Response(
        JSON.stringify({ error: 'UNIT_NOT_AVAILABLE', message: 'Unit is no longer available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const merchantId = invitation.unit?.property?.merchant_id;
    if (!merchantId) {
      console.error('[accept-tenant-invitation] No merchant_id found');
      return new Response(
        JSON.stringify({ error: 'INVALID_INVITATION', message: 'Invalid invitation data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate contract dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + contract_duration_months);

    console.log('[accept-tenant-invitation] Processing acceptance for user:', user_id);

    // === FALLBACK: Ensure profile and user_roles exist ===
    // This handles cases where the on_auth_user_created trigger didn't fire
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!existingProfile) {
      console.log('[accept-tenant-invitation] Creating missing profile for user:', user_id);
      // Get user email from auth
      const { data: authData } = await supabase.auth.admin.getUserById(user_id);
      if (authData?.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id,
          email: authData.user.email || '',
          full_name: authData.user.user_metadata?.full_name || '',
        });
        if (profileError) {
          console.error('[accept-tenant-invitation] Failed to create profile:', profileError);
        }
      }
    }

    // Check if user_roles exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!existingRole) {
      console.log('[accept-tenant-invitation] Creating missing user_role for user:', user_id);
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id,
        role: 'tenant',
      });
      if (roleError) {
        console.error('[accept-tenant-invitation] Failed to create user_role:', roleError);
      }
    }

    // Check if tenant record exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!existingTenant) {
      console.log('[accept-tenant-invitation] Creating missing tenant record for user:', user_id);
      const { error: tenantError } = await supabase.from('tenants').insert({
        user_id,
        verification_status: 'pending',
      });
      if (tenantError) {
        console.error('[accept-tenant-invitation] Failed to create tenant:', tenantError);
      }
    }

    // Start transaction-like operations
    // 1. Update invitation status
    const { error: updateInvError } = await supabase
      .from('tenant_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user_id
      })
      .eq('id', invitation.id);

    if (updateInvError) {
      console.error('[accept-tenant-invitation] Failed to update invitation:', updateInvError);
      return new Response(
        JSON.stringify({ error: 'UPDATE_FAILED', message: 'Failed to update invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update tenant record to link to merchant (unit stays available until contract is signed)
    const { error: updateTenantError } = await supabase
      .from('tenants')
      .update({
        linked_merchant_id: merchantId,
        current_unit_id: invitation.unit_id,
        verification_status: 'verified'
      })
      .eq('user_id', user_id);

    if (updateTenantError) {
      console.error('[accept-tenant-invitation] Failed to update tenant:', updateTenantError);
      // Continue anyway
    }

    // NOTE: Contract is NOT created automatically
    // Merchant must create contract manually via Contracts page
    // Unit status will be updated to 'occupied' via database trigger when contract is fully signed

    console.log('[accept-tenant-invitation] Successfully accepted invitation for user:', user_id);

    return new Response(
      JSON.stringify({
        success: true,
        unit_id: invitation.unit_id,
        merchant_id: merchantId,
        message: 'Invitation accepted successfully. Merchant will create your contract.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[accept-tenant-invitation] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
