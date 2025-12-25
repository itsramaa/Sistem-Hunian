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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, email, full_name, phone, role, business_name, merchant_code } = await req.json();

    if (!user_id || !email) {
      console.error('Missing required fields: user_id or email');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing user creation for: ${email}, role: ${role || 'tenant'}`);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existingProfile) {
      console.log('Profile already exists, skipping creation');
      return new Response(
        JSON.stringify({ message: 'Profile already exists', profile_id: existingProfile.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = role || 'tenant';

    // 1. Insert profile with phone
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id,
        email,
        full_name: full_name || '',
        phone: phone || null,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }
    console.log('Profile created successfully');

    // 2. Insert user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id,
        role: userRole,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      throw roleError;
    }
    console.log('User role created:', userRole);

    // 3. Handle role-specific inserts
    if (userRole === 'merchant') {
      // Create merchant record
      const { data: newMerchant, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          user_id,
          business_name: business_name || 'My Business',
        })
        .select('id')
        .single();

      if (merchantError) {
        console.error('Error creating merchant:', merchantError);
        throw merchantError;
      }
      console.log('Merchant created:', newMerchant.id);

      // Create escrow account for merchant
      const { error: escrowError } = await supabase
        .from('escrow_accounts')
        .insert({
          merchant_id: newMerchant.id,
          balance: 0,
          pending_balance: 0,
        });

      if (escrowError) {
        console.error('Error creating escrow account:', escrowError);
        // Don't throw, continue with subscription
      } else {
        console.log('Escrow account created');
      }

      // Create default free subscription if tier exists
      const { data: freeTier } = await supabase
        .from('subscription_tiers')
        .select('id')
        .eq('name', 'free')
        .eq('is_active', true)
        .single();

      if (freeTier) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);

        const { error: subscriptionError } = await supabase
          .from('merchant_subscriptions')
          .insert({
            merchant_id: newMerchant.id,
            tier_id: freeTier.id,
            status: 'trialing',
            trial_ends_at: trialEnd.toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: trialEnd.toISOString(),
            next_billing_date: trialEnd.toISOString(),
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
        } else {
          console.log('Merchant subscription created with free tier');
        }
      } else {
        console.log('No free tier found, skipping subscription creation');
      }

    } else if (userRole === 'vendor') {
      // Create vendor record
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id,
          business_name: business_name || 'My Business',
          contact_email: email,
          verification_status: 'pending',
        });

      if (vendorError) {
        console.error('Error creating vendor:', vendorError);
        throw vendorError;
      }
      console.log('Vendor created');

    } else if (userRole === 'tenant') {
      // Get linked merchant from merchant_code if provided
      let linkedMerchantId = null;
      if (merchant_code) {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('merchant_code', merchant_code.toUpperCase())
          .single();

        if (merchant) {
          linkedMerchantId = merchant.id;
          console.log('Linked to merchant:', linkedMerchantId);
        }
      }

      // Create tenant record
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          user_id,
          linked_merchant_id: linkedMerchantId,
          verification_status: 'pending',
        });

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        throw tenantError;
      }
      console.log('Tenant created');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User setup completed', role: userRole }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Auth webhook error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
