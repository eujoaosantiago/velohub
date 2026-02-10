
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno to suppress TS errors
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Email da equipe de suporte (para onde as dúvidas vão)
const SUPPORT_EMAIL = "suporte@velohub.com"; 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  isClient: boolean; // Se é usuário logado ou visitante da landing page
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, isClient } = await req.json() as SupportRequest;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // 1. Enviar notificação para a Equipe Velohub
    const resAdmin = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Velohub System <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL], // Na prática, coloque seu email real aqui para testar
        reply_to: email,
        subject: `[Suporte] ${subject} - ${name}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Novo chamado de suporte</h2>
            <p><strong>De:</strong> ${name} (${email})</p>
            <p><strong>Tipo:</strong> ${isClient ? 'Cliente Logado' : 'Visitante'}</p>
            <p><strong>Assunto:</strong> ${subject}</p>
            <hr />
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        `,
      }),
    });

    if (!resAdmin.ok) {
        const errData = await resAdmin.json();
        console.error("Resend Error:", errData);
        throw new Error("Failed to send admin email");
    }

    // 2. Enviar confirmação automática para o Usuário
    await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Velohub Suporte <onboarding@resend.dev>",
          to: [email],
          subject: `Recebemos sua mensagem: ${subject}`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <p>Olá, <strong>${name}</strong>.</p>
              <p>Recebemos sua solicitação de suporte. Nossa equipe técnica já foi notificada e entrará em contato em breve.</p>
              <br/>
              <p>Sua mensagem:</p>
              <blockquote style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">
                ${message}
              </blockquote>
              <br/>
              <p>Atenciosamente,<br/>Equipe Velohub</p>
            </div>
          `,
        }),
      });

    return new Response(JSON.stringify({ success: true }), {
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
