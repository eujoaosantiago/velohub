
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

    const inviteEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background-color: #f5f5f7;
            color: #2b2a2a;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .card {
            background-color: #ffffff;
            border-radius: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            overflow: hidden;
          }
          .header {
            background-color: #ffffff;
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #f5f5f7;
          }
          .header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
            color: #ff6035;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 0;
            font-size: 13px;
            color: #757474;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            margin: 0 0 20px 0;
            font-size: 17px;
            color: #2b2a2a;
            line-height: 1.5;
          }
          .message {
            margin: 0 0 30px 0;
            font-size: 15px;
            color: #757474;
            line-height: 1.6;
          }
          .highlight {
            color: #ff6035;
            font-weight: 600;
          }
          .info-box {
            background-color: #f5f5f7;
            border-left: 4px solid #ff6035;
            padding: 16px;
            border-radius: 8px;
            margin: 0 0 30px 0;
          }
          .info-box-title {
            font-size: 13px;
            font-weight: 600;
            color: #757474;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-box-value {
            font-size: 16px;
            font-weight: 500;
            color: #2b2a2a;
            margin: 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6035 0%, #ff7c51 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            margin: 0 0 20px 0;
            transition: all 0.2s ease;
          }
          .help-text {
            font-size: 12px;
            color: #ece8e8;
            margin: 20px 0 0 0;
            line-height: 1.5;
          }
          .help-text-title {
            color: #757474;
            font-weight: 600;
            margin: 0 0 4px 0;
          }
          .fallback-link {
            word-break: break-all;
            color: #ff6035;
          }
          .footer {
            padding: 24px 30px;
            border-top: 1px solid #f5f5f7;
            text-align: center;
            font-size: 12px;
            color: #757474;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>VELOHUB</h1>
              <p>Plataforma de Gestão de Veículos</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Olá, <span class="highlight">${name}</span>! 👋
              </div>
              
              <div class="message">
                <span class="highlight">${ownerName}</span> convidou você para gerenciar o estoque da <span class="highlight">${storeName}</span> no Velohub.
              </div>
              
              <div class="info-box">
                <div class="info-box-title">Concessionária</div>
                <div class="info-box-value">${storeName}</div>
              </div>
              
              <a href="${link}" class="cta-button">Aceitar Convite e Criar Conta</a>
              
              <div class="help-text">
                <div class="help-text-title">Não consegue clicar no botão?</div>
                <div class="fallback-link">${link}</div>
              </div>
            </div>
            
            <div class="footer">
              © 2026 Velohub. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Velohub <onboarding@resend.dev>", // Altere para seu domínio verificado em produção (ex: convite@velohub.com)
        to: [email],
        subject: `${ownerName} convidou você para Velohub`,
        html: inviteEmailTemplate,
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