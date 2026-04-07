import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process vendor referral rewards when an order is completed
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, vendor_id } = await req.json();

    if (!order_id || !vendor_id) {
      return new Response(
        JSON.stringify({ error: 'Missing order_id or vendor_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing vendor order referral for order ${order_id}, vendor ${vendor_id}`);

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, referred_by, referral_order_count, referral_reward_given')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      console.log('Vendor not found or no referral');
      return new Response(
        JSON.stringify({ success: true, message: 'No vendor found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if no referrer or reward already given
    if (!vendor.referred_by || vendor.referral_reward_given) {
      console.log('No referrer or reward already given');
      return new Response(
        JSON.stringify({ success: true, message: 'No referral or reward already given' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count completed orders for this vendor
    const { count: orderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor_id)
      .eq('status', 'completed');

    // Get average rating
    const { data: reviews } = await supabase
      .from('order_reviews')
      .select('rating')
      .eq('vendor_id', vendor_id);

    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    console.log(`Vendor ${vendor_id}: ${orderCount} completed orders, avg rating: ${avgRating}`);

    // Update vendor's referral order count
    await supabase
      .from('vendors')
      .update({ 
        referral_order_count: orderCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor_id);

    // Check if eligible for referral reward (10 orders, rating >= 4.0)
    if (orderCount && orderCount >= 10 && avgRating >= 4.0) {
      // Call process-referral-reward to handle the reward
      await fetch(`${supabaseUrl}/functions/v1/process-referral-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          event_type: 'order_completed',
          user_id: vendor.user_id,
          order_count: orderCount,
          avg_rating: avgRating,
        }),
      });

      console.log('Vendor referral reward triggered');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_count: orderCount,
        avg_rating: avgRating,
        eligible: orderCount && orderCount >= 10 && avgRating >= 4.0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing vendor order referral:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
