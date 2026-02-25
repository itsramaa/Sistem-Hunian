import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Verify caller is a merchant
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const callerId = claimsData.claims.sub;

    // Use service role to create user
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller has merchant role
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "merchant")
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Forbidden: merchant role required" }), { status: 403, headers: corsHeaders });
    }

    const { email, password, full_name, phone, merchant_id } = await req.json();

    if (!email || !password || !full_name || !merchant_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    if (password.length < 12) {
      return new Response(JSON.stringify({ error: "Password must be at least 12 characters" }), { status: 400, headers: corsHeaders });
    }

    // Verify merchant belongs to caller
    const { data: merchant } = await adminClient
      .from("merchants")
      .select("id")
      .eq("id", merchant_id)
      .eq("user_id", callerId)
      .maybeSingle();

    if (!merchant) {
      return new Response(JSON.stringify({ error: "Merchant not found or unauthorized" }), { status: 403, headers: corsHeaders });
    }

    // Check if email already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: "Email sudah terdaftar dalam sistem" }), { status: 409, headers: corsHeaders });
    }

    // Create user with email auto-confirmed
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone: phone || null,
        role: "tenant",
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders });
    }

    const userId = newUser.user.id;

    // Create tenant record and link to merchant
    await adminClient
      .from("tenants")
      .upsert({ user_id: userId, linked_merchant_id: merchant_id }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({ user_id: userId, email: email.toLowerCase().trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
