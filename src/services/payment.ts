
import { User, PlanType } from '@/shared/types';
import { PLAN_CONFIG } from '@/shared/lib/plans';

// ==============================================================================
// 🚨 PORTAL DO CLIENTE (STRIPE)
// ==============================================================================
// O Portal do Cliente é onde seu usuário vai clicar para:
// - Cancelar a assinatura
// - Trocar o cartão de crédito
// - Baixar notas fiscais
//
// Você ativa isso no Stripe em: Settings > Customer Portal
// E cola o link gerado abaixo.
// ==============================================================================

const STRIPE_CUSTOMER_PORTAL_URL: string = 'https://billing.stripe.com/p/login/test_dRmaEX05Ee1BenRfmpaIM00'; // <--- COLE SEU LINK DO PORTAL STRIPE AQUI (ex: https://billing.stripe.com/p/login/...)

export const PaymentService = {
  /**
   * Redireciona o usuário para o Checkout do Stripe
   * Anexa o ID do usuário na URL para que o Webhook saiba quem pagou.
   */
  subscribeToPlan: (user: User, plan: PlanType) => {
    const config = PLAN_CONFIG[plan];
    
    if (!config.stripePaymentLink || config.stripePaymentLink.includes('COLE_AQUI')) {
      console.warn(`Link de pagamento não configurado para o plano ${plan}`);
      alert("⚠️ Modo de Desenvolvimento\n\nO sistema de pagamentos está simulado.\nPara ativar, configure os Links de Pagamento no arquivo lib/plans.ts");
      return;
    }

    // A mágica acontece aqui: client_reference_id liga o pagamento ao usuário no seu banco
    const checkoutUrl = new URL(config.stripePaymentLink);
    checkoutUrl.searchParams.append('client_reference_id', user.id);
    checkoutUrl.searchParams.append('prefilled_email', user.email);
    
    // Redireciona para o checkout seguro do Stripe
    window.location.href = checkoutUrl.toString();
  },

  /**
   * Abre o portal do cliente
   */
  manageSubscription: () => {
      // Verifica se o link do portal está configurado e válido
      if (STRIPE_CUSTOMER_PORTAL_URL && STRIPE_CUSTOMER_PORTAL_URL.startsWith('http')) {
          window.location.href = STRIPE_CUSTOMER_PORTAL_URL;
      } else {
          // Fallback inteligente se não estiver configurado
          alert("⚠️ Configuração Necessária\n\nO Portal do Cliente (Stripe Customer Portal) não foi configurado no arquivo services/payment.ts.\n\nEnquanto isso, entre em contato com o suporte para gerenciar sua assinatura.");
          
          // Opcional: Redirecionar para email
          // const subject = encodeURIComponent("Gerenciar Assinatura Velohub");
          // window.location.href = `mailto:suporte@velohub.com?subject=${subject}`;
      }
  }
};



