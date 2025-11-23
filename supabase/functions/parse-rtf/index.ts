import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import rtfToText from "npm:rtf-to-text"; // Importar rtf-to-text do npm para Deno

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
    const { rtfContent } = await req.json();

    if (!rtfContent) {
      return new Response(JSON.stringify({ error: "Missing rtfContent in request body" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // rtfToText.fromString é assíncrono e usa callbacks, vamos envolvê-lo em uma Promise
    const plainText = await new Promise<string>((resolve, reject) => {
      rtfToText.fromString(rtfContent, (err: Error | null, text: string | undefined) => {
        if (err) {
          reject(err);
        } else {
          resolve(text || '');
        }
      });
    });

    return new Response(JSON.stringify({ plainText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error parsing RTF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});