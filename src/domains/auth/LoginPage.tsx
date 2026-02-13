
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { AuthService } from '@/domains/auth/services/authService';
import { User } from '@/shared/types';
import { Lock, Mail, Loader, ArrowLeft, CheckCircle, Home } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateRegister, onNavigateHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para fluxo de "Esqueci minha senha"
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await AuthService.login(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Erro ao obter dados do usuário.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
          setError("Digite seu email primeiro.");
          return;
      }
      setIsLoading(true);
      setError('');

      try {
          await AuthService.resetPassword(email);
          setResetSent(true);
      } catch (err: any) {
          setError(err.message || "Erro ao enviar email de recuperação.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleResendPasswordReset = async () => {
      setResendLoading(true);
      setResendMessage('');
      
      try {
          await AuthService.resetPassword(email);
          setResendMessage('Email de recuperação reenviado com sucesso!');
          
          // Remove a mensagem após 5 segundos
          setTimeout(() => setResendMessage(''), 5000);
      } catch (err: any) {
          setResendMessage('Erro ao reenviar: ' + (err.message || 'Tente novamente mais tarde'));
      } finally {
          setResendLoading(false);
      }
  };

  // --- TELA DE RECUPERAÇÃO DE SENHA ---
  if (isResetting) {
      return (
          <AuthLayout title="Recuperar Senha" subtitle="Enviaremos um link para o seu email.">
             <button 
                onClick={() => { setIsResetting(false); setResetSent(false); setError(''); }} 
                className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
             >
                <ArrowLeft size={16} /> Voltar
             </button>

             {resetSent ? (
                 <div className="text-center py-6 animate-fade-in">
                     <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                         <CheckCircle size={32} />
                     </div>
                     <h3 className="text-white font-bold text-lg mb-2">Email Enviado!</h3>
                     <p className="text-slate-400 text-sm mb-2 leading-relaxed">
                         Verifique sua caixa de entrada (e spam). Enviamos um link para redefinir sua senha.
                     </p>
                     <p className="text-slate-500 text-xs mb-6">Para: <strong className="text-slate-300">{email}</strong></p>

                     {resendMessage && (
                        <div className={`mb-4 text-sm p-3 rounded-lg ${
                            resendMessage.includes('sucesso') 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                        }`}>
                            {resendMessage}
                        </div>
                     )}

                     <div className="space-y-3">
                         <Button onClick={() => { setIsResetting(false); setResetSent(false); }} className="w-full">
                             Voltar ao Login
                         </Button>
                         <button
                             onClick={handleResendPasswordReset}
                             disabled={resendLoading}
                             className="w-full py-3 px-4 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                         >
                             {resendLoading ? <Loader className="animate-spin" size={18} /> : <Mail size={18} />}
                             {resendLoading ? 'Reenviando...' : 'Reenviar Email de Recuperação'}
                         </button>
                     </div>
                 </div>
             ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email Cadastrado</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                required
                                autoFocus
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-3.5" disabled={isLoading}>
                        {isLoading ? <Loader className="animate-spin" size={20} /> : 'Enviar Link de Recuperação'}
                    </Button>
                </form>
             )}
          </AuthLayout>
      );
  }

  // --- TELA DE LOGIN ---
  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Acesse o painel de gestão da sua loja.">
      {/* Botão Voltar para Home */}
      <button onClick={onNavigateHome} className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors" title="Voltar para o site">
          <Home size={20} />
      </button>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email Profissional</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="email" 
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                    placeholder="seu@email.com"
                />
            </div>
        </div>
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Senha</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                    placeholder="••••••••"
                />
            </div>
            <div className="flex justify-end mt-1">
                <button 
                    type="button" 
                    onClick={() => { setError(''); setIsResetting(true); }} 
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                    Esqueci minha senha
                </button>
            </div>
        </div>

        {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center animate-shake">
                {error}
            </div>
        )}

        <Button 
            type="submit" 
            className="w-full py-3.5 text-base shadow-lg shadow-indigo-500/20" 
            disabled={isLoading}
        >
            {isLoading ? <Loader className="animate-spin" size={20} /> : 'Entrar na Plataforma'}
        </Button>
      </form>
      
      <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
          <p className="text-slate-500 text-sm">
              É proprietário e não tem conta?{' '}
              <button onClick={onNavigateRegister} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Criar conta da Loja
              </button>
          </p>
      </div>
    </AuthLayout>
  );
};



