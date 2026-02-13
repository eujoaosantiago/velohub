import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmEmailRequest {
  email: string;
  name: string;
  redirectTo?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, redirectTo } = await req.json() as ConfirmEmailRequest;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    const generateLink = async (type: "signup" | "magiclink") => {
      const linkResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type,
          email,
          redirect_to: redirectTo || "https://velohub-theta.vercel.app/?confirmed=1",
        }),
      });

      const linkData = await linkResponse.json();

      if (!linkResponse.ok) {
        console.error("Supabase Error:", linkData);
        throw new Error(linkData?.msg || "Failed to generate confirmation link");
      }

      return linkData.action_link as string;
    };

    let confirmLink = "";

    try {
      confirmLink = await generateLink("signup");
    } catch (err: any) {
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("already been registered")) {
        confirmLink = await generateLink("magiclink");
      } else {
        throw err;
      }
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
            font-size: 15px;
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
              <p>Confirme seu email</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Bem-vindo, <span class="highlight">${name}</span>! 👋
              </div>
              
              <div class="message">
                Obrigado por se cadastrar no Velohub! Para garantir que você receba todos os nossos emails, confirme seu endereço de email clicando no botão abaixo.
              </div>
              
              <div class="info-box">
                <div class="info-box-title">Email cadastrado</div>
                <div class="info-box-value">${email}</div>
              </div>
              
              <a href="${confirmLink}" class="cta-button">Confirmar Email</a>
              
              <div class="help-text">
                <div class="help-text-title">Não consegue clicar no botão?</div>
                <div class="fallback-link">${confirmLink}</div>
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
        from: "Velohub <onboarding@resend.dev>",
        to: [email],
        subject: "Confirme seu email - Velohub",
        html: emailTemplate,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend Error:", data);
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
