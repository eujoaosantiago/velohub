
import React from 'react';
import { User, PlanType } from '../types';
import { Button } from './ui/Button';
import { X, CreditCard, CheckCircle2, Clock, Shield, Zap } from 'lucide-react';
import { PaymentService } from '../services/payment';
import { PLAN_CONFIG } from '../lib/plans';

interface SubscriptionModalProps {
  user: User;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ user, onClose }) => {
  const currentPlan = PLAN_CONFIG[user.plan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-indigo-500" />
                    Gerenciar Assinatura
                </h2>
                <p className="text-sm text-slate-400">Detalhes do seu plano e faturamento.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Current Plan */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Plano Atual</h3>
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-2xl font-bold text-white capitalize">{user.plan}</span>
                            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">ATIVO</span>
                        </div>
                        <p className="text-slate-300 text-sm mb-4">
                            {user.plan === 'trial' ? 'Período de testes gratuito.' : `Cobrança mensal de R$ ${currentPlan.price.toFixed(2).replace('.', ',')}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-indigo-300">
                            <Clock size={14} />
                            Renova em: {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Método de Pagamento</h3>
                    <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="bg-slate-700 p-2 rounded">
                            <CreditCard size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">•••• •••• •••• 4242</p>
                            <p className="text-xs text-slate-500">Visa - Expira 12/28</p>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => PaymentService.manageSubscription()}>
                            Alterar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right: History & Actions */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Últimas Faturas</h3>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span className="text-sm text-slate-300 group-hover:text-white">Fatura #{1000 + i}</span>
                                </div>
                                <span className="text-xs text-slate-500">{new Date(new Date().setMonth(new Date().getMonth() - i)).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-3">
                    <Button className="w-full" onClick={() => PaymentService.manageSubscription()}>
                        Ir para Portal do Assinante
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                        Para cancelar, fazer upgrade ou baixar notas fiscais, acesse o portal seguro.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
