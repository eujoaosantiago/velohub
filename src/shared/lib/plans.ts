
import { PlanType, User } from '@/shared/types';

interface PlanLimits {
  maxVehicles: number;
  maxTeamMembers: number; // Excluding owner
  maxCustomers: number; // New limit for CRM
  showAdvancedReports: boolean;
  showShareLink: boolean;
  supportPriority: 'standard' | 'high' | 'dedicated';
  stripePaymentLink?: string; // URL do Link de Pagamento (Criado no Dashboard do Stripe)
  price: number;
}

// ==============================================================================
// 🚨 CONFIGURAÇÃO DE PAGAMENTOS (STRIPE) - PASSO 3 DO MANUAL
// ==============================================================================
// Você precisa criar "Links de Pagamento" no painel do Stripe (stripe.com) 
// e colar as URLs abaixo (começam com https://buy.stripe.com/...).
//
// Se deixar vazio, o botão de "Assinar" não fará nada.
// ==============================================================================

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  free: {
    maxVehicles: 3, // "Gosto de quero mais"
    maxTeamMembers: 0,
    maxCustomers: 10, // Limite da carteira de clientes
    showAdvancedReports: false,
    showShareLink: false, // Bloqueado no free
    supportPriority: 'standard',
    price: 0,
    stripePaymentLink: ''
  },
  starter: {
    maxVehicles: 15,
    maxTeamMembers: 0,
    maxCustomers: Infinity,
    showAdvancedReports: false,
    showShareLink: true, 
    supportPriority: 'standard',
    price: 39.90,
    stripePaymentLink: 'https://buy.stripe.com/test_4gMbJ1bOmbTt4Nha25aIM02' // <--- 🔴 COLE AQUI O LINK DO PLANO STARTER (ex: https://buy.stripe.com/test_123...)
  },
  pro: {
    maxVehicles: 50,
    maxTeamMembers: 2,
    maxCustomers: Infinity,
    showAdvancedReports: true,
    showShareLink: true,
    supportPriority: 'high',
    price: 89.90,
    stripePaymentLink: 'https://buy.stripe.com/test_cNi4gzbOmcXx4Nh7TXaIM01' // <--- 🔴 COLE AQUI O LINK DO PLANO PRO
  },
  enterprise: {
    maxVehicles: Infinity,
    maxTeamMembers: Infinity,
    maxCustomers: Infinity,
    showAdvancedReports: true,
    showShareLink: true,
    supportPriority: 'dedicated',
    price: 149.90,
    stripePaymentLink: '' // <--- 🔴 (Opcional) LINK ENTERPRISE
  },
  trial: {
    maxVehicles: Infinity,
    maxTeamMembers: Infinity,
    maxCustomers: Infinity,
    showAdvancedReports: true,
    showShareLink: true,
    supportPriority: 'high',
    price: 0
  }
};

export const getPlanLimits = (user: User): PlanLimits => {
  return PLAN_CONFIG[user.plan];
};

export const checkVehicleLimit = (user: User, currentCount: number): boolean => {
  const limits = getPlanLimits(user);
  return currentCount < limits.maxVehicles;
};

export const checkTeamLimit = (user: User, currentTeamSize: number): boolean => {
  const limits = getPlanLimits(user);
  return currentTeamSize < limits.maxTeamMembers;
};



