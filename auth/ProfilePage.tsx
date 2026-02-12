
import React, { useState } from 'react';
import { User, PlanType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AuthService } from '../services/auth';
import { PaymentService } from '../services/payment';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { User as UserIcon, Building2, Lock, Save, CheckCircle, Clock, Fingerprint, Crown, Zap, AlertCircle, FileText, RotateCcw, Share2, BarChart3, Users, RefreshCw, Phone, MapPin, Loader } from 'lucide-react';
import { useVelohub } from '../contexts/VelohubContext'; // Importar contexto para refresh
import { fetchCepInfo } from '../lib/utils';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const DEFAULT_CONTRACT = `Pelo presente instrumento particular, de um lado a VENDEDORA identificada no cabeçalho, e de outro lado o COMPRADOR qualificado abaixo, têm entre si justo e contratado o seguinte:

1. OBJETO: A VENDEDORA vende ao COMPRADOR o veículo descrito neste documento, pelo preço e condições acordados.

2. ESTADO DO VEÍCULO: O veículo é entregue no estado em que se encontra, tendo sido examinado pelo COMPRADOR, que declarou estar ciente de suas condições de conservação e funcionamento.

3. GARANTIA: A VENDEDORA oferece garantia legal de motor e câmbio pelo prazo de {garantia_tempo} ou {garantia_km}, o que ocorrer primeiro, contados a partir da data de entrega do veículo, nos termos do Código de Defesa do Consumidor.

4. RESPONSABILIDADE: O COMPRADOR assume, a partir desta data, toda e qualquer responsabilidade civil e criminal por quaisquer infrações cometidas com o veículo.

5. PAGAMENTO: O pagamento será realizado conforme descrito no resumo da venda.`;

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const { refreshData } = useVelohub(); // Hook para refresh
  const [name, setName] = useState(user.name);
  const [storeName, setStoreName] = useState(user.storeName || '');
  const [cnpj, setCnpj] = useState(user.cnpj || '');
    const [cep, setCep] = useState(user.cep || '');
    const [street, setStreet] = useState(user.street || '');
    const [number, setNumber] = useState(user.number || '');
    const [city, setCity] = useState(user.city || '');
    const [state, setState] = useState(user.state || '');
    const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contractTemplate, setContractTemplate] = useState(user.contractTemplate || DEFAULT_CONTRACT);
  const [showSubModal, setShowSubModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingPlan, setIsRefreshingPlan] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password && password !== confirmPassword) {
        setMessage({ type: 'error', text: 'As senhas não coincidem.' });
        setIsLoading(false);
        return;
    }

    try {
        const updatedUser: User = {
            ...user,
            name,
            storeName: user.role === 'owner' ? storeName : undefined,
            cnpj: user.role === 'owner' ? cnpj : undefined,
            cep: user.role === 'owner' ? cep : undefined,
            street: user.role === 'owner' ? street : undefined,
            number: user.role === 'owner' ? number : undefined,
            city: user.role === 'owner' ? city : undefined,
            state: user.role === 'owner' ? state : undefined,
            contractTemplate: user.role === 'owner' ? contractTemplate : undefined
        };

        const result = await AuthService.updateUser(updatedUser, password || undefined);
        onUpdateUser(result);
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setPassword('');
        setConfirmPassword('');
    } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
      setIsRefreshingPlan(true);
      await refreshData();
      setTimeout(() => setIsRefreshingPlan(false), 1000);
  };

  const handleUpgrade = (plan: PlanType) => {
      if (plan === 'enterprise') {
          window.location.href = 'mailto:contato@velohub.com?subject=Interesse no Plano Enterprise';
          return;
      }
      PaymentService.subscribeToPlan(user, plan);
  };

  const getDaysRemaining = () => {
      if (!user.trialEndsAt) return 0;
      const end = new Date(user.trialEndsAt);
      const now = new Date();
      const diffTime = Math.abs(end.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return end > now ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 14) v = v.slice(0, 14);
      v = v.replace(/^(\d{2})(\d)/, '$1.$2');
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
      setCnpj(v);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
      const masked = digits.replace(/(\d{5})(\d{0,3})/, (_match, p1, p2) => (p2 ? `${p1}-${p2}` : p1));
      setCep(masked);
  };

  const handleCepBlur = async () => {
    const cleaned = cep.replace(/\D/g, '');
      if (cleaned.length !== 8) return;

      setIsLoadingCep(true);
      try {
          const info = await fetchCepInfo(cleaned);
          if (!info) return;
          setStreet((prev) => prev || info.street);
          setCity((prev) => prev || info.city);
          setState((prev) => prev || info.state);
      } catch (error) {
          console.error('Erro ao buscar CEP', error);
      } finally {
          setIsLoadingCep(false);
      }
  };

  const restoreDefaultContract = () => {
      if (window.confirm("Isso apagará seu texto personalizado. Deseja restaurar o contrato padrão?")) {
          setContractTemplate(DEFAULT_CONTRACT);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
       {showSubModal && <SubscriptionModal user={user} onClose={() => setShowSubModal(false)} />}

       <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400">Gerencie seu perfil e sua assinatura.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card title="Perfil & Organização">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informações Pessoais</h3>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Seu Nome</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Email (Login)</label>
                            <input 
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full bg-slate-900/50 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {user.role === 'owner' && (
                        <>
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Dados da Organização</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Loja</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input 
                                                type="text"
                                                required
                                                value={storeName}
                                                onChange={e => setStoreName(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">CNPJ</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input 
                                                type="text"
                                                inputMode="numeric"
                                                value={cnpj}
                                                onChange={handleCnpjChange}
                                                placeholder="00.000.000/0000-00"
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">CEP</label>
                                        <div className="relative">
                                            {isLoadingCep ? (
                                                <Loader className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={18} />
                                            ) : (
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            )}
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={cep}
                                                onChange={handleCepChange}
                                                onBlur={handleCepBlur}
                                                maxLength={9}
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="00000-000"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Cidade</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Cidade"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">UF</label>
                                        <input
                                            type="text"
                                            value={state}
                                            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                                            maxLength={2}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                            placeholder="SP"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Logradouro</label>
                                        <input
                                            type="text"
                                            value={street}
                                            onChange={(e) => setStreet(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Rua, Avenida..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Numero</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={number}
                                            onChange={(e) => setNumber(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="123"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">ID da Organização (Tenant)</label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input 
                                            type="text"
                                            value={user.storeId}
                                            disabled
                                            className="w-full bg-slate-900/50 border border-slate-800 text-slate-500 font-mono text-sm rounded-xl pl-10 pr-4 py-3 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Personalização do Contrato</h3>
                                    <button type="button" onClick={restoreDefaultContract} className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 transition-colors">
                                        <RotateCcw size={12} /> Restaurar Padrão
                                    </button>
                                </div>
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 mb-2">
                                    <p className="font-bold mb-1">Variáveis disponíveis (copie e cole no texto):</p>
                                    <div className="flex flex-wrap gap-2 opacity-80">
                                        <code>{`{loja_nome}`}</code>
                                        <code>{`{loja_cnpj}`}</code>
                                        <code>{`{comprador_nome}`}</code>
                                        <code>{`{comprador_cpf}`}</code>
                                        <code>{`{veiculo_marca}`}</code>
                                        <code>{`{veiculo_modelo}`}</code>
                                        <code>{`{veiculo_placa}`}</code>
                                        <code>{`{veiculo_ano}`}</code>
                                        <code>{`{veiculo_km}`}</code>
                                        <code>{`{garantia_tempo}`}</code>
                                        <code>{`{garantia_km}`}</code>
                                        <code>{`{valor_venda}`}</code>
                                    </div>
                                    <p className="mt-2 text-[10px]">* As cláusulas de Troca e Veículo são inseridas automaticamente se houver troca.</p>
                                </div>
                                <textarea 
                                    value={contractTemplate}
                                    onChange={e => setContractTemplate(e.target.value)}
                                    className="w-full h-64 bg-slate-950 border border-slate-800 text-white rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
                                    placeholder="Digite o texto do contrato aqui..."
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Segurança</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Repita a senha"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                            {message.type === 'success' && <CheckCircle size={16} />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={isLoading} icon={<Save size={18} />}>
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </Card>
          </div>

          {/* Subscription Card - Only for Owners */}
          {user.role === 'owner' && (
              <div className="space-y-6">
                  <Card title="Sua Assinatura">
                      <div className="space-y-6">
                          {/* Current Plan Status */}
                          <div className={`p-4 rounded-xl border ${user.plan === 'trial' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800 border-slate-700'}`}>
                              <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Plano Atual</p>
                                  <button onClick={handleManualRefresh} className={`text-slate-400 hover:text-white transition-colors ${isRefreshingPlan ? 'animate-spin' : ''}`} title="Atualizar Status">
                                      <RefreshCw size={14} />
                                  </button>
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-white capitalize">{user.plan === 'trial' ? 'Teste Grátis' : user.plan === 'free' ? 'Gratuito' : user.plan}</span>
                                  {user.plan === 'trial' && (
                                      <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded">7 DIAS</span>
                                  )}
                              </div>
                              {user.plan === 'trial' && (
                                  <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center gap-2 text-indigo-300 text-sm">
                                      <Clock size={16} />
                                      <span>Expira em <strong>{daysRemaining} dias</strong></span>
                                  </div>
                              )}
                          </div>

                          {/* Upgrade Options */}
                          {user.plan !== 'enterprise' && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                    <Zap size={16} className="text-amber-400" />
                                    Fazer Upgrade
                                </h4>
                                
                                {/* Show STARTER option if current plan is FREE or TRIAL */}
                                {(user.plan === 'free' || user.plan === 'trial') && (
                                    <div onClick={() => handleUpgrade('starter')} className="group cursor-pointer p-3 rounded-xl border border-slate-700 bg-slate-900 hover:border-indigo-500 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl z-10">RECOMENDADO</div>
                                        <div className="flex justify-between items-center mb-1 pt-3">
                                            <span className="font-bold text-white">Starter</span>
                                            <span className="text-emerald-400 font-bold">R$ 39,90</span>
                                        </div>
                                        <p className="text-xs text-slate-400 group-hover:text-slate-300 mb-2">Ideal para começar a profissionalizar.</p>
                                        <ul className="text-[10px] text-slate-500 space-y-1">
                                            <li className="flex items-center gap-1"><Share2 size={10} className="text-indigo-400"/> Link na Bio (Showroom)</li>
                                            <li className="flex items-center gap-1"><FileText size={10} className="text-indigo-400"/> Contratos Automáticos</li>
                                            <li className="flex items-center gap-1"><Zap size={10} className="text-indigo-400"/> Até 15 Carros</li>
                                        </ul>
                                    </div>
                                )}

                                {/* Show PRO option if plan is FREE, TRIAL or STARTER */}
                                {user.plan !== 'pro' && (
                                    <div onClick={() => handleUpgrade('pro')} className="group cursor-pointer p-3 rounded-xl border border-slate-700 bg-slate-900 hover:border-indigo-500 transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-white">Plano Pro</span>
                                            <span className="text-emerald-400 font-bold">R$ 89,90</span>
                                        </div>
                                        <p className="text-xs text-slate-400 group-hover:text-slate-300 mb-2">Para quem quer escalar vendas.</p>
                                        <ul className="text-[10px] text-slate-500 space-y-1">
                                            <li className="flex items-center gap-1"><BarChart3 size={10} className="text-indigo-400"/> Relatórios de ROI</li>
                                            <li className="flex items-center gap-1"><Users size={10} className="text-indigo-400"/> 3 Usuários</li>
                                            <li className="flex items-center gap-1"><Zap size={10} className="text-indigo-400"/> Até 50 Carros</li>
                                        </ul>
                                    </div>
                                )}

                                <div onClick={() => handleUpgrade('enterprise')} className="group cursor-pointer p-3 rounded-xl border border-slate-700 bg-slate-900 hover:border-indigo-500 transition-all">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">Enterprise</span>
                                        <span className="text-emerald-400 font-bold">Sob Consulta</span>
                                    </div>
                                    <p className="text-xs text-slate-400 group-hover:text-slate-300">Estoque ilimitado, Gestão de Lojas</p>
                                </div>
                            </div>
                          )}

                          {user.plan !== 'trial' && user.plan !== 'free' && (
                              <div className="pt-4 border-t border-slate-800 space-y-3">
                                  <Button className="w-full" variant="outline" onClick={() => setShowSubModal(true)}>
                                      Gerenciar Assinatura
                                  </Button>
                                  
                                  <p className="text-xs text-center text-slate-500 mt-2">
                                      Pagamentos processados via Stripe.
                                  </p>
                              </div>
                          )}
                      </div>
                  </Card>
              </div>
          )}
      </div>
    </div>
  );
};
