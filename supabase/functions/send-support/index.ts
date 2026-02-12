
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export const config = {
  verify_jwt: false,
};

// Declare Deno to suppress TS errors
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_SECRET = Deno.env.get("SUPPORT_SECRET");
// Email da equipe de suporte (para onde as dúvidas vão)
const SUPPORT_EMAIL = "eujoaopedrosantiago@gmail.com"; 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-velohub-secret",
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
    if (!SUPPORT_SECRET) {
      throw new Error("SUPPORT_SECRET not configured");
    }

    const providedSecret = req.headers.get("x-velohub-secret");
    if (providedSecret !== SUPPORT_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { name, email, subject, message, isClient } = await req.json() as SupportRequest;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Template HTML para email interno (notificação para você) - Estilo Apple
    const adminEmailTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Chamado de Suporte</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f5f5f7; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 16px; }
          .card { background: #ffffff; border-radius: 20px; padding: 48px 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); margin-bottom: 24px; }
          .header { text-align: center; padding-bottom: 40px; border-bottom: 1px solid #f0f0f0; }
          .logo { font-size: 32px; font-weight: 700; letter-spacing: -1px; margin: 0; color: #2b2a2a; }
          .logo-accent { color: #ff6035; }
          .tagline { color: #757474; font-size: 15px; margin: 8px 0 0 0; }
          h1 { font-size: 28px; font-weight: 700; color: #2b2a2a; margin: 40px 0 32px 0; line-height: 1.2; }
          .info-row { margin-bottom: 28px; }
          .label { font-size: 13px; font-weight: 600; color: #757474; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
          .value { font-size: 16px; color: #2b2a2a; font-weight: 500; }
          .value-accent { color: #ff6035; font-weight: 600; }
          .message-box { background: #f5f5f7; border-radius: 12px; padding: 24px; margin-top: 40px; }
          .message-text { color: #2b2a2a; font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin: 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #ff6035 0%, #ff7a52 100%); color: white; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; margin-top: 32px; border: none; cursor: pointer; }
          .footer { text-align: center; padding-top: 40px; border-top: 1px solid #f0f0f0; color: #757474; font-size: 13px; line-height: 1.5; }
          .footer a { color: #ff6035; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <p class="logo">VELO<span class="logo-accent">HUB</span></p>
              <p class="tagline">Centro de Suporte</p>
            </div>

            <div>
              <h1>Novo Chamado Recebido</h1>
              
              <div class="info-row">
                <div class="label">De</div>
                <div class="value">${name}</div>
                <div style="color: #757474; font-size: 14px; margin-top: 4px;">${email}</div>
              </div>

              <div class="info-row">
                <div class="label">Tipo</div>
                <div class="value">${isClient ? '👤 Cliente Logado' : '🌐 Visitante'}</div>
              </div>

              <div class="info-row">
                <div class="label">Assunto</div>
                <div class="value value-accent">${subject}</div>
              </div>

              <div class="message-box">
                <div class="label">Mensagem</div>
                <p class="message-text">${message}</p>
              </div>

              <center>
                <a href="mailto:${email}" class="cta-button">Responder por Email</a>
              </center>
            </div>
          </div>

          <div class="footer">
            <p>© 2026 Velohub Tecnologia<br>
            <a href="https://velohub-theta.vercel.app">Voltar ao Painel</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Enviar notificação para a Equipe Velohub
    const resAdmin = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Velohub <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL],
        reply_to: email,
        subject: `🔔 [Suporte] ${subject} - ${name}`,
        html: adminEmailTemplate,
      }),
    });

    if (!resAdmin.ok) {
        const errData = await resAdmin.json();
        console.error("Resend Error:", errData);
        throw new Error("Failed to send admin email");
    }

    // Template HTML para email de confirmação (para o usuário) - Estilo Apple
    const userEmailTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recebemos sua Mensagem</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f5f5f7; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 16px; }
          .card { background: #ffffff; border-radius: 20px; padding: 48px 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); margin-bottom: 24px; }
          .header { text-align: center; padding-bottom: 40px; border-bottom: 1px solid #f0f0f0; }
          .logo { font-size: 32px; font-weight: 700; letter-spacing: -1px; margin: 0; color: #2b2a2a; }
          .logo-accent { color: #ff6035; }
          .tagline { color: #757474; font-size: 15px; margin: 8px 0 0 0; }
          h1 { font-size: 28px; font-weight: 700; color: #2b2a2a; margin: 40px 0 16px 0; line-height: 1.2; }
          .subtitle { font-size: 16px; color: #757474; line-height: 1.6; margin: 0 0 40px 0; }
          .status-box { background: linear-gradient(135deg, rgba(255,96,53,0.08) 0%, rgba(255,122,82,0.06) 100%); border-left: 4px solid #ff6035; border-radius: 12px; padding: 20px; margin: 32px 0; }
          .status-label { font-size: 13px; font-weight: 600; color: #757474; text-transform: uppercase; margin-bottom: 8px; }
          .status-value { font-size: 16px; font-weight: 600; color: #ff6035; }
          .info-row { margin-bottom: 20px; }
          .label { font-size: 13px; font-weight: 600; color: #757474; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
          .value { font-size: 16px; color: #2b2a2a; font-weight: 500; }
          .message-preview { background: #f5f5f7; border-radius: 12px; padding: 20px; margin-top: 16px; border-left: 4px solid #ff6035; }
          .message-text { color: #2b2a2a; font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin: 0; }
          .timeline { padding: 32px 0; }
          .timeline-item { margin-bottom: 24px; display: flex; }
          .timeline-number { width: 40px; height: 40px; background: #ff6035; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; margin-right: 16px; }
          .timeline-number.inactive { background: #e5e5e7; }
          .timeline-content h3 { margin: 0; font-size: 15px; font-weight: 600; color: #2b2a2a; }
          .timeline-content p { margin: 4px 0 0 0; font-size: 13px; color: #757474; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #ff6035 0%, #ff7a52 100%); color: white; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; text-decoration: none; margin-top: 32px; border: none; cursor: pointer; }
          .footer { text-align: center; padding-top: 40px; border-top: 1px solid #f0f0f0; color: #757474; font-size: 13px; line-height: 1.5; }
          .footer a { color: #ff6035; text-decoration: none; font-weight: 500; }
          .help-text { font-size: 13px; color: #757474; text-align: center; }
          .help-text a { color: #ff6035; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <p class="logo">VELO<span class="logo-accent">HUB</span></p>
              <p class="tagline">Obrigado por Entrar em Contato</p>
            </div>

            <div>
              <h1>Olá, ${name}!</h1>
              <p class="subtitle">Recebemos sua mensagem com sucesso. Nossa equipe de especialistas já foi notificada e entrará em contato em breve.</p>

              <div class="status-box">
                <div class="status-label">Status do Seu Chamado</div>
                <div class="status-value">✓ Recebido e Em Processamento</div>
              </div>

              <h2 style="font-size: 16px; font-weight: 600; color: #2b2a2a; margin: 32px 0 16px 0;">Detalhes da Sua Mensagem</h2>
              
              <div class="info-row">
                <div class="label">Assunto</div>
                <div class="value" style="color: #ff6035; font-weight: 600;">${subject}</div>
              </div>

              <div class="message-preview">
                <div class="label" style="margin-bottom: 12px;">Sua Mensagem</div>
                <p class="message-text">${message}</p>
              </div>

              <h2 style="font-size: 16px; font-weight: 600; color: #2b2a2a; margin: 32px 0 16px 0;">Próximos Passos</h2>
              
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-number">1</div>
                  <div class="timeline-content">
                    <h3>Sua mensagem foi recebida</h3>
                    <p>Confirmado em ${new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-number">2</div>
                  <div class="timeline-content">
                    <h3>Nossa equipe analisará</h3>
                    <p>Em até 24 horas úteis</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-number inactive">3</div>
                  <div class="timeline-content">
                    <h3>Você receberá uma resposta</h3>
                    <p>Por email neste endereço</p>
                  </div>
                </div>
              </div>

              <center>
                <a href="https://velohub-theta.vercel.app" class="cta-button">Voltar ao Velohub</a>
              </center>

              <p class="help-text" style="margin-top: 32px;">
                Tem alguma dúvida adicional?<br>
                <a href="https://velohub-theta.vercel.app/legal">Acesse nossa Central de Ajuda</a>
              </p>
            </div>
          </div>

          <div class="footer">
            <p>© 2026 Velohub Tecnologia<br>
            Este é um email automático. Por favor, não responda a este endereço.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Enviar confirmação automática para o Usuário
    await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Velohub <onboarding@resend.dev>",
          to: [email],
          subject: `✓ Recebemos sua Mensagem: ${subject}`,
          html: userEmailTemplate,
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
