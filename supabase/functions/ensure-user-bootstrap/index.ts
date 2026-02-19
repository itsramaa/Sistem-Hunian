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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create a client with the user's token to get their identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email || '';
    const fullName = user.user_metadata?.full_name || '';

    console.log(`Bootstrapping user: ${userId}, email: ${userEmail}`);

    // Parse request body for role (default to tenant)
    let role = 'tenant';
    try {
      const body = await req.json();
      if (body.role && ['tenant', 'vendor', 'merchant'].includes(body.role)) {
        role = body.role;
      }
    } catch {
      // No body or invalid JSON, use default role
    }

    // 1. Ensure profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProfile) {
      console.log(`Creating profile for user ${userId}`);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email: userEmail,
          full_name: fullName,
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        // Don't fail if profile already exists (race condition)
        if (!profileError.message.includes('duplicate')) {
          throw profileError;
        }
      }
    }

    // 2. Ensure user_roles exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingRole) {
      console.log(`Creating user_role (${role}) for user ${userId}`);
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
        });

      if (roleError) {
        console.error('Role insert error:', roleError);
        // Don't fail if role already exists (race condition)
        if (!roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }
    }

    // 3. Ensure role-specific table exists (only for tenant in this flow)
    if (role === 'tenant') {
      const { data: existingTenant } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingTenant) {
        console.log(`Creating tenant record for user ${userId}`);
        const { error: tenantError } = await supabaseAdmin
          .from('tenants')
          .insert({
            user_id: userId,
            verification_status: 'pending',
          });

        if (tenantError) {
          console.error('Tenant insert error:', tenantError);
          // Don't fail if tenant already exists (race condition)
          if (!tenantError.message.includes('duplicate')) {
            throw tenantError;
          }
        }
      }
    }

    console.log(`Bootstrap completed for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        role: existingRole?.role || role,
        message: 'User bootstrap completed'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const err = error as Error;
    console.error('Bootstrap error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
