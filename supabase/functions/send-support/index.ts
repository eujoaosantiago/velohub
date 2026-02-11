
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno to suppress TS errors
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Email da equipe de suporte (para onde as dúvidas vão)
const SUPPORT_EMAIL = "eujoaopedrosantiago@gmail.com"; 

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

    // Template HTML para email interno (notificação para você)
    const adminEmailTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Chamado de Suporte</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #2b2a2a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #2b2a2a; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" style="background: #3d3c3c; border-radius: 12px; border: 1px solid #757474; overflow: hidden; box-shadow: 0 20px 25px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Header with Logo -->
                  <tr style="background: linear-gradient(135deg, #ff6035 0%, #ff7a52 100%);">
                    <td style="padding: 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #2b2a2a; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        VELO<span style="color: #ece8e8;">HUB</span>
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #ece8e8; font-size: 14px; font-weight: 500;">Centro de Suporte</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Title -->
                      <h2 style="margin: 0 0 30px 0; color: #ece8e8; font-size: 24px; font-weight: 700;">Novo Chamado Recebido</h2>

                      <!-- Info Cards -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                        <tr>
                          <td style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                            <p style="margin: 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">De:</p>
                            <p style="margin: 6px 0 0 0; color: #ece8e8; font-size: 16px; font-weight: 600;">${name}</p>
                            <p style="margin: 4px 0 0 0; color: #757474; font-size: 14px;">${email}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                            <p style="margin: 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Tipo:</p>
                            <p style="margin: 6px 0 0 0; color: #ece8e8; font-size: 16px; font-weight: 600;">${isClient ? '👤 Cliente Logado' : '🌐 Visitante'}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 16px;">
                            <p style="margin: 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Assunto:</p>
                            <p style="margin: 6px 0 0 0; color: #ff6035; font-size: 16px; font-weight: 600;">${subject}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Message -->
                      <div style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Mensagem:</p>
                        <p style="margin: 0; color: #ece8e8; font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${message}</p>
                      </div>

                      <!-- Action Button -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                        <tr>
                          <td align="center">
                            <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #ff6035 0%, #ff7a52 100%); color: #2b2a2a; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; border: none; cursor: pointer;">
                              Responder por Email
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr style="background: #2b2a2a; border-top: 1px solid #757474;">
                    <td style="padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #757474; font-size: 12px; line-height: 1.6;">
                        © 2026 Velohub Tecnologia. Todos os direitos reservados.<br>
                        <a href="https://velohub-theta.vercel.app" style="color: #ff6035; text-decoration: none; font-weight: 500;">Voltar ao Painel</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </tbody>
        </table>
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
        from: "Velohub Suporte <onboarding@resend.dev>",
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

    // Template HTML para email de confirmação (para o usuário)
    const userEmailTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recebemos sua Mensagem</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #2b2a2a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #2b2a2a; padding: 40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" style="background: #3d3c3c; border-radius: 12px; border: 1px solid #757474; overflow: hidden; box-shadow: 0 20px 25px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Header with Logo -->
                  <tr style="background: linear-gradient(135deg, #ff6035 0%, #ff7a52 100%);">
                    <td style="padding: 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #2b2a2a; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        VELO<span style="color: #ece8e8;">HUB</span>
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #ece8e8; font-size: 14px; font-weight: 500;">Obrigado por Entrar em Contato</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Greeting -->
                      <h2 style="margin: 0 0 8px 0; color: #ece8e8; font-size: 24px; font-weight: 700;">Olá, ${name}!</h2>
                      <p style="margin: 0 0 30px 0; color: #757474; font-size: 16px; line-height: 1.6;">
                        Recebemos sua mensagem com sucesso. Nossa equipe de especialistas já foi notificada e entrará em contato em breve.
                      </p>

                      <!-- Status Box -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #ff6035;">
                        <tr>
                          <td>
                            <p style="margin: 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Status do Seu Chamado</p>
                            <p style="margin: 8px 0 0 0; color: #ff6035; font-size: 16px; font-weight: 700;">✓ Recebido e Em Processamento</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Details -->
                      <div style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0 0 16px 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Detalhes da Sua Mensagem:</p>
                        
                        <p style="margin: 0 0 12px 0;">
                          <span style="color: #757474; font-size: 13px;">Assunto:</span><br>
                          <span style="color: #ff6035; font-size: 15px; font-weight: 600;">${subject}</span>
                        </p>

                        <p style="margin: 0;">
                          <span style="color: #757474; font-size: 13px;">Mensagem:</span><br>
                          <span style="color: #ece8e8; font-size: 14px; line-height: 1.6; display: block; margin-top: 8px; padding: 12px; background: #2b2a2a; border-radius: 6px; border-left: 3px solid #ff6035; white-space: pre-wrap; word-wrap: break-word;">${message}</span>
                        </p>
                      </div>

                      <!-- Timeline -->
                      <div style="background: #2b2a2a; border: 1px solid #757474; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0 0 16px 0; color: #757474; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Próximos Passos:</p>
                        
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="vertical-align: top; padding-bottom: 16px;">
                              <span style="display: inline-block; width: 32px; height: 32px; background: #ff6035; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px; float: left;">1</span>
                              <p style="margin: 0; color: #ece8e8; font-size: 14px; font-weight: 500; overflow: hidden;">Sua mensagem foi recebida</p>
                              <p style="margin: 4px 0 0 0; color: #757474; font-size: 13px; overflow: hidden;">Confirmado em ${new Date().toLocaleDateString('pt-BR')}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="vertical-align: top; padding-bottom: 16px;">
                              <span style="display: inline-block; width: 32px; height: 32px; background: #ff6035; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px; float: left;">2</span>
                              <p style="margin: 0; color: #ece8e8; font-size: 14px; font-weight: 500; overflow: hidden;">Nossa equipe analisará</p>
                              <p style="margin: 4px 0 0 0; color: #757474; font-size: 13px; overflow: hidden;">Em até 24 horas úteis</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="vertical-align: top;">
                              <span style="display: inline-block; width: 32px; height: 32px; background: #757474; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px; float: left;">3</span>
                              <p style="margin: 0; color: #ece8e8; font-size: 14px; font-weight: 500; overflow: hidden;">Você receberá uma resposta</p>
                              <p style="margin: 4px 0 0 0; color: #757474; font-size: 13px; overflow: hidden;">Por email neste endereço</p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- CTA -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                        <tr>
                          <td align="center">
                            <a href="https://velohub-theta.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #ff6035 0%, #ff7a52 100%); color: #2b2a2a; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; border: none; cursor: pointer;">
                              Voltar ao Velohub
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help Text -->
                      <p style="margin: 0; color: #757474; font-size: 13px; text-align: center; line-height: 1.6;">
                        Tem alguma dúvida adicional?<br>
                        <a href="https://velohub-theta.vercel.app/legal" style="color: #ff6035; text-decoration: none; font-weight: 500;">Acesse nossa Central de Ajuda</a>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr style="background: #2b2a2a; border-top: 1px solid #757474;">
                    <td style="padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #757474; font-size: 12px; line-height: 1.6;">
                        © 2026 Velohub Tecnologia. Todos os direitos reservados.<br>
                        Este é um email automático. Por favor, não responda a este endereço.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </tbody>
        </table>
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
          from: "Velohub Suporte <onboarding@resend.dev>",
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
