
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { Lock, CheckCircle, Loader, AlertTriangle } from 'lucide-react';

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
        setError('A senha deve ter no mínimo 8 caracteres.');
        return;
    }

    if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    setIsLoading(true);

    try {
        if (!supabase) throw new Error("Erro de configuração do servidor.");

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) throw error;

        setSuccess(true);
        setTimeout(() => {
            onSuccess();
        }, 3000); // Espera 3s para o usuário ler a mensagem de sucesso e redireciona para login
    } catch (err: any) {
        setError(err.message || 'Erro ao redefinir senha. Tente solicitar o link novamente.');
    } finally {
        setIsLoading(false);
    }
  };

  if (success) {
      return (
        <AuthLayout title="Senha Redefinida!" subtitle="Sua conta está segura novamente.">
            <div className="text-center py-8 animate-fade-in">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle size={40} />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Tudo certo!</h3>
                <p className="text-slate-400 text-sm mb-8">
                    Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes...
                </p>
                <Loader className="animate-spin text-indigo-500 mx-auto" size={24} />
            </div>
        </AuthLayout>
      );
  }

  return (
    <AuthLayout title="Criar Nova Senha" subtitle="Digite sua nova senha de acesso.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Nova Senha</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                    placeholder="Mínimo 8 caracteres"
                />
            </div>
        </div>

        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Confirmar Senha</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                    placeholder="Repita a senha"
                />
            </div>
        </div>

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
            {isLoading ? <Loader className="animate-spin" size={20} /> : 'Salvar Nova Senha'}
        </Button>
      </form>
    </AuthLayout>
  );
};
