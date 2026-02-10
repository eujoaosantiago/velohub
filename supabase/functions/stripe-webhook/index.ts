
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

// Declare Deno to suppress TS errors in non-Deno environments
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ==============================================================================
// 🚨 MAPA DE PREÇOS (PASSO 4.3 DO MANUAL)
// ==============================================================================
// Quando o cliente paga, o Stripe avisa este código (Webhook).
// O código precisa saber qual "ID de Preço" corresponde a qual plano.
// Pegue esses IDs (price_1Pxyz...) no Dashboard do Stripe > Catálogo de Produtos.
// ==============================================================================
const PLAN_MAP: Record<string, string> = {
    // FORMATO: 'ID_DO_STRIPE': 'nome_do_plano_interno',
    
    'price_1SzM1LDAG9g5kRk5JlWAAQXd': 'starter', // <--- 🔴 COLE O ID DO STARTER AQUI
    'price_1SyOUTDAG9g5kRk5trqAd4cY': 'pro',         // <--- 🔴 COLE O ID DO PRO AQUI
    'price_COLE_SEU_ID_ENTERPRISE_AQUI': 'enterprise'
}

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNATURE')
    
    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            endpointSecret ?? ''
        )
    } catch (err: any) {
        return new Response(`Webhook Signature Error: ${err.message}`, { status: 400 })
    }

    console.log(`🔔 Evento Recebido: ${event.type}`);

    // --- EVENTO: COMPRA REALIZADA COM SUCESSO (CHECKOUT) ---
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const customerId = session.customer as string
        
        // Busca os itens comprados para identificar o plano
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items']
        })
        
        const priceId = fullSession.line_items?.data[0]?.price?.id
        let plan = 'free'
        
        if (priceId && PLAN_MAP[priceId]) {
            plan = PLAN_MAP[priceId]
        } else {
            console.warn(`⚠️ Preço não mapeado: ${priceId}. Usuário permanecerá como Free. Verifique o PLAN_MAP.`)
        }

        if (userId && plan !== 'free') {
            // Atualiza o plano do usuário (Usando Service Role para bypass RLS)
            const { error } = await supabase
                .from('users') 
                .update({ 
                    plan: plan,
                    stripe_customer_id: customerId,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (error) {
                console.error('Erro ao atualizar DB:', error)
                return new Response('Database Error', { status: 500 })
            }
            console.log(`✅ Sucesso: Usuário ${userId} atualizado para ${plan}`)
        }
    }

    // --- EVENTO: MUDANÇA DE PLANO (PORTAL DO CLIENTE OU RENOVAÇÃO) ---
    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status
        
        // Pega o ID do preço atual
        const priceId = subscription.items.data[0]?.price?.id
        let plan = 'free'
        
        if (priceId && PLAN_MAP[priceId]) {
            plan = PLAN_MAP[priceId]
        }

        // Se a assinatura estiver ativa ou em trial, atualiza o plano
        if (status === 'active' || status === 'trialing') {
             const { error } = await supabase
                .from('users')
                .update({ 
                    plan: plan,
                    subscription_status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_customer_id', customerId)
             
             if (error) console.error('Erro ao atualizar assinatura:', error)
             else console.log(`🔄 Assinatura atualizada: Customer ${customerId} agora é ${plan}`)
        }
    }
    
    // --- EVENTO: ASSINATURA CANCELADA OU PAGAMENTO FALHOU ---
    if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Downgrade automático para Free
        const { error } = await supabase
            .from('users')
            .update({ 
                plan: 'free', 
                subscription_status: 'canceled',
                updated_at: new Date().toISOString()
            })
            .eq('stripe_customer_id', customerId)
            
        if (error) console.error('Erro ao processar cancelamento:', error)
        else console.log(`🚫 Assinatura cancelada para customer ${customerId}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error(err)
    return new Response(`Server Error: ${err.message}`, { status: 500 })
  }
})
