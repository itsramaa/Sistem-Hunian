import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[auth-webhook] Request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseServiceKey) {
      console.error('[auth-webhook] SUPABASE_SERVICE_ROLE_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('[auth-webhook] Request body:', JSON.stringify(body, null, 2));
    
    const { user_id, email, full_name, phone, role, business_name, merchant_code, referral_code } = body;

    if (!user_id || !email) {
      console.error('[auth-webhook] Missing required fields: user_id or email');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[auth-webhook] Processing user creation for: ${email}, role: ${role || 'tenant'}, user_id: ${user_id}`);

    // Check if profile already exists
    console.log('[auth-webhook] Checking if profile already exists...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (checkError) {
      console.error('[auth-webhook] Error checking existing profile:', checkError);
    }

    if (existingProfile) {
      console.log('[auth-webhook] Profile already exists, checking user_roles...');
      
      // Check if user_roles exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user_id)
        .maybeSingle();
      
      if (existingRole) {
        console.log('[auth-webhook] User role already exists:', existingRole.role);
        return new Response(
          JSON.stringify({ message: 'Profile and role already exist', profile_id: existingProfile.id, role: existingRole.role }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Profile exists but role doesn't - create role
      console.log('[auth-webhook] Profile exists but role missing, creating role...');
      const userRole = role || 'tenant';
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id, role: userRole });
      
      if (roleError) {
        console.error('[auth-webhook] Error creating user role:', roleError);
        throw roleError;
      }
      
      console.log('[auth-webhook] User role created:', userRole);
      return new Response(
        JSON.stringify({ message: 'Role created for existing profile', profile_id: existingProfile.id, role: userRole }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = role || 'tenant';
    console.log('[auth-webhook] Creating new profile and role for user:', user_id);

    // 1. Insert profile with phone
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id,
        email,
        full_name: full_name || '',
        phone: phone || null,
      })
      .select('id')
      .single();

    if (profileError) {
      console.error('[auth-webhook] Error creating profile:', profileError);
      throw profileError;
    }
    console.log('[auth-webhook] Profile created successfully:', newProfile?.id);

    // 2. Insert user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id,
        role: userRole,
      });

    if (roleError) {
      console.error('[auth-webhook] Error creating user role:', roleError);
      throw roleError;
    }
    console.log('[auth-webhook] User role created:', userRole);

    // 3. Handle role-specific inserts
    let referrerInfo: { userId: string; role: string } | null = null;

    // Check and process referral code first
    if (referral_code) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_user_id, referrer_role')
        .eq('referral_code', referral_code)
        .is('referee_user_id', null)
        .single();

      if (referral) {
        referrerInfo = { userId: referral.referrer_user_id, role: referral.referrer_role };
        
        // Update referral with referee info
        await supabase
          .from('referrals')
          .update({
            referee_user_id: user_id,
            referee_role: userRole,
            status: 'registered',
            updated_at: new Date().toISOString(),
          })
          .eq('id', referral.id);

        console.log('Linked referral:', referral.id);

        // Notify referrer
        await supabase
          .from('notifications')
          .insert({
            user_id: referral.referrer_user_id,
            type: 'referral_registered',
            title: '🎉 New Referral!',
            message: `${full_name || 'Someone'} signed up using your referral link!`,
            link: `/${referral.referrer_role}/referrals`,
          });
      }
    }

    if (userRole === 'merchant') {
      // Calculate referral bonus if applicable
      const trialDays = referrerInfo ? 21 : 14; // Extra 7 days for referral
      const referralDiscount = referrerInfo ? 10 : 0; // 10% off first month
      const referralDiscountMonths = referrerInfo ? 1 : 0;

      // Create merchant record
      const { data: newMerchant, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          user_id,
          business_name: business_name || 'My Business',
          referral_discount: referralDiscount,
          referral_discount_months: referralDiscountMonths,
          referred_by: referrerInfo?.userId || null,
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
        trialEnd.setDate(trialEnd.getDate() + trialDays);

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
          console.log(`Merchant subscription created with ${trialDays}-day trial`);
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
          referred_by: referrerInfo?.userId || null,
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

    console.log('[auth-webhook] User setup completed successfully for:', email, 'role:', userRole);
    return new Response(
      JSON.stringify({ success: true, message: 'User setup completed', role: userRole }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[auth-webhook] Error:', errorMessage);
    console.error('[auth-webhook] Stack:', errorStack);
    return new Response(
      JSON.stringify({ error: errorMessage, details: errorStack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
