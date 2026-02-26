import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    console.log('Validating invitation token:', token?.substring(0, 10) + '...');

    // Validate token format
    if (!token || typeof token !== 'string' || !/^[a-zA-Z0-9-]{20,100}$/.test(token)) {
      console.log('Invalid token format');
      return new Response(
        JSON.stringify({ error: 'INVITATION_INVALID', message: 'Token format tidak valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, check if invitation exists at all
    const { data: invitation, error: fetchError } = await supabase
      .from('tenant_invitations')
      .select(`
        *,
        unit:units (
          id,
          unit_number,
          rent_amount,
          deposit_amount,
          status,
          property:properties (
            id,
            name,
            address_id
          )
        )
      `)
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      console.log('Invitation not found:', fetchError?.message);
      return new Response(
        JSON.stringify({ error: 'INVITATION_INVALID', message: 'Undangan tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation found:', invitation.id, 'status:', invitation.status);

    // Check if already used
    if (invitation.status === 'accepted') {
      console.log('Invitation already used');
      return new Response(
        JSON.stringify({ error: 'INVITATION_USED', message: 'Undangan sudah digunakan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.log('Invitation expired:', invitation.expires_at);
      return new Response(
        JSON.stringify({ error: 'INVITATION_EXPIRED', message: 'Undangan sudah kadaluarsa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if cancelled
    if (invitation.status === 'cancelled') {
      console.log('Invitation cancelled');
      return new Response(
        JSON.stringify({ error: 'INVITATION_INVALID', message: 'Undangan telah dibatalkan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check unit availability
    if (invitation.unit?.status !== 'available' && invitation.status === 'pending') {
      console.log('Unit not available:', invitation.unit?.status);
      return new Response(
        JSON.stringify({ error: 'UNIT_NOT_AVAILABLE', message: 'Unit sudah tidak tersedia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation valid, returning data');

    // Return the invitation data
    return new Response(
      JSON.stringify({ data: invitation }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing invitation:', error);
    return new Response(
      JSON.stringify({ error: 'INVITATION_INVALID', message: 'Terjadi kesalahan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
