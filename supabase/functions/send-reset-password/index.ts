import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  name: string;
  resetLink: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, resetLink } = await req.json() as ResetPasswordRequest;

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      throw new Error("MAILGUN_API_KEY or MAILGUN_DOMAIN not configured");
    }

    const emailTemplate = `
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
          .warning-box {
            background-color: #fff9f0;
            border-left: 4px solid #ff6035;
            padding: 16px;
            border-radius: 8px;
            margin: 0 0 30px 0;
          }
          .warning-title {
            font-size: 13px;
            font-weight: 600;
            color: #ff6035;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .warning-text {
            font-size: 14px;
            color: #2b2a2a;
            margin: 0;
            line-height: 1.5;
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
            color: #757474;
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
            font-size: 11px;
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
              <p>Redefinir senha</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Olá, <span class="highlight">${name}</span>!
              </div>
              
              <div class="message">
                Recebemos uma solicitação para redefinir sua senha. Se foi você, clique no botão abaixo para criar uma nova senha.
              </div>
              
              <div class="warning-box">
                <div class="warning-title">⚠️ Segurança</div>
                <div class="warning-text">
                  Este link expira em 24 horas. Se não solicitou a redefinição, ignore este email.
                </div>
              </div>
              
              <a href="${resetLink}" class="cta-button">Redefinir Senha</a>
              
              <div class="help-text">
                <div class="help-text-title">Não consegue clicar no botão?</div>
                <div class="fallback-link">${resetLink}</div>
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

    // Encode credentials for Basic Auth
    const credentials = btoa(`api:${MAILGUN_API_KEY}`);

    const formData = new FormData();
    formData.append("from", `Velohub <noreply@${MAILGUN_DOMAIN}>`);
    formData.append("to", email);
    formData.append("subject", "Redefinir sua senha - Velohub");
    formData.append("html", emailTemplate);

    const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Mailgun Error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
