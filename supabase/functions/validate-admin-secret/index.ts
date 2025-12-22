import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey } = await req.json();
    
    // Get the admin secret from environment variable
    const ADMIN_SECRET = Deno.env.get("ADMIN_SETUP_SECRET") || "sihuni-admin-setup-2024";
    
    const isValid = secretKey === ADMIN_SECRET;
    
    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error validating admin secret:", error);
    return new Response(
      JSON.stringify({ error: "Failed to validate secret", valid: false }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
