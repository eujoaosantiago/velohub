
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from '../components/ui/Button';
import { AuthService } from '../services/auth';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, Building2, Loader, ArrowLeft, CheckCircle2, UserPlus, Home, Inbox, Phone, MapPin, FileText, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { maskCNPJ, maskPhone } from '../lib/utils';

interface RegisterPageProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
  inviteStoreId?: string | null;
  inviteStoreName?: string | null;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
    onRegisterSuccess, 
    onNavigateLogin,
    onNavigateHome,
    inviteStoreId,
    inviteStoreName
}) => {
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState(inviteStoreName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Novos campos
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  // Password Validation State
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const passwordCriteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // Busca CEP automático
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '');
      setCep(value);

      if (value.length === 8) {
          setIsLoadingCep(true);
          try {
              const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
              const data = await response.json();
              
              if (!data.erro) {
                  setCity(data.localidade);
                  setState(data.uf);
              }
          } catch (error) {
              console.error("Erro ao buscar CEP", error);
          } finally {
              setIsLoadingCep(false);
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validação de Senha Forte
    if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.special) {
        setError('A senha não atende aos requisitos de segurança.');
        setIsLoading(false);
        return;
    }

    // Validação de Confirmação de Senha
    if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setIsLoading(false);
        return;
    }

    try {
      const storeData = inviteStoreId ? undefined : { cnpj, phone, cep, city, state };
      
      const user = await AuthService.register(name, email, password, storeName, storeData, inviteStoreId || undefined);
      
      if (isSupabaseConfigured()) {
          setShowSuccess(true);
      } else {
          onRegisterSuccess(user);
      }
      
    } catch (err: any) {
      console.error(err);
      // Tratamento específico para erro de configuração SMTP comum no desenvolvimento
      if (err.message && err.message.includes("Error sending confirmation email")) {
          // Mensagem adaptada para o erro 403 do Resend (Test Domain Restriction)
          setError("Erro no envio do email. Se estiver usando o Resend em modo teste, você só pode cadastrar o MESMO email da sua conta Resend.");
      } else {
          setError(err.message || 'Erro ao criar conta.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
      return (
        <AuthLayout title="Cadastro Realizado!" subtitle="Falta pouco para acessar sua conta.">
            <div className="text-center py-6 animate-fade-in">
                 <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                     <Inbox size={40} />
                 </div>
                 
                 <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 text-left">
                     <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-lg">
                         <Mail size={18} className="text-indigo-400" />
                         Verifique seu email
                     </h4>
                     <p className="text-slate-300 text-sm leading-relaxed mb-4">
                         Enviamos um link de confirmação para <strong>{email}</strong>. 
                         Clique no link para ativar sua conta.
                     </p>
                     <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200 flex gap-2">
                        <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                        <span>
                            <strong>Não recebeu?</strong> Verifique sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>. O remetente pode ser "noreply" ou "Velohub".
                        </span>
                     </div>
                 </div>
                 
                 <Button onClick={onNavigateLogin} size="lg" className="w-full">
                     Voltar para Login
                 </Button>
            </div>
        </AuthLayout>
      );
  }

  return (
    <AuthLayout 
        title={inviteStoreId ? "Convite de Equipe" : "Criar conta Grátis"} 
        subtitle={inviteStoreId ? `Você foi convidado para a loja ${inviteStoreName || 'Parceira'}` : "Comece seu teste de 7 dias hoje mesmo."}
    >
      <div className="absolute top-6 left-6 flex gap-2">
        {!inviteStoreId ? (
            <button onClick={onNavigateHome} className="text-slate-400 hover:text-white transition-colors" title="Voltar para Home">
                <Home size={20} />
            </button>
        ) : (
            <button onClick={onNavigateLogin} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
            </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Seu Nome</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                        placeholder="Nome"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Telefone</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        inputMode="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(maskPhone(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                        placeholder="(00) 00000-0000"
                    />
                </div>
            </div>
        </div>

        {/* Store Info (Only if not invited) */}
        {!inviteStoreId && (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Nome da Loja</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                required
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                placeholder="Motors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">CNPJ</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                inputMode="numeric"
                                required
                                value={cnpj}
                                onChange={e => setCnpj(maskCNPJ(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">CEP</label>
                        <div className="relative">
                            {isLoadingCep ? (
                                <Loader className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={18} />
                            ) : (
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            )}
                            <input 
                                type="text" 
                                inputMode="numeric"
                                required
                                value={cep}
                                onChange={handleCepChange}
                                maxLength={8}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                placeholder="00000000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Cidade</label>
                        <input 
                            type="text" 
                            required
                            readOnly
                            value={city}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-2 py-3 text-sm focus:outline-none cursor-default"
                            placeholder="Auto"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">UF</label>
                        <input 
                            type="text" 
                            required
                            readOnly
                            value={state}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-2 py-3 text-sm focus:outline-none cursor-default text-center"
                            placeholder="UF"
                        />
                    </div>
                </div>
            </>
        )}

        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email de Login</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                    placeholder="seu@email.com"
                />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Criar Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                        placeholder="Mínimo 8 caracteres"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Confirmar Senha</label>
                <div className="relative">
                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`w-full bg-slate-950 border text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${password && confirmPassword && password !== confirmPassword ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'}`}
                        placeholder="Repita a senha"
                    />
                </div>
            </div>
        </div>
            
        {/* Password Criteria Feedback */}
        {isPasswordFocused && (
            <div className="mt-1 grid grid-cols-2 gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800 animate-fade-in">
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.length ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600"></div>}
                    Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.uppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.uppercase ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600"></div>}
                    Letra Maiúscula
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.special ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600"></div>}
                    Caractere Especial (!@#)
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${password === confirmPassword && confirmPassword.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {password === confirmPassword && confirmPassword.length > 0 ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-600"></div>}
                    Senhas coincidem
                </div>
            </div>
        )}

        {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center animate-shake flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> {error}
            </div>
        )}

        <Button 
            type="submit" 
            className="w-full py-3.5 text-base shadow-lg shadow-indigo-500/20" 
            disabled={isLoading}
        >
            {isLoading ? <Loader className="animate-spin" size={20} /> : (inviteStoreId ? 'Aceitar Convite' : 'Começar Teste Grátis')}
        </Button>
      </form>
      
      {!inviteStoreId && (
        <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
          <p className="text-slate-500 text-sm">
              Já tem conta?{' '}
              <button onClick={onNavigateLogin} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Fazer Login
              </button>
          </p>
        </div>
      )}
    </AuthLayout>
  );
};
