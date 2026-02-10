
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno to suppress TS errors in non-Deno environments
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
  link: string;
  storeName: string;
  ownerName: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, link, storeName, ownerName } = await req.json() as InviteRequest;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured on server");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Velohub <onboarding@resend.dev>", // Altere para seu domínio verificado em produção (ex: convite@velohub.com)
        to: [email],
        subject: `Convite: Junte-se à equipe da ${storeName}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
               <h1 style="color: #fff; margin: 0;">VELOHUB</h1>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Olá, <strong>${name}</strong>!</p>
              <p><strong>${ownerName}</strong> convidou você para gerenciar o estoque da <strong>${storeName}</strong> no Velohub.</p>
              <br/>
              <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Aceitar Convite e Criar Conta
              </a>
              <br/><br/>
              <p style="font-size: 12px; color: #64748b;">Se o botão não funcionar, copie este link: ${link}</p>
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Resend Error:", data);
        throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});