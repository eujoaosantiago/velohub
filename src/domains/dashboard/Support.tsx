import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, MessageSquare, Send, LifeBuoy } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useVelohub } from '@/shared/contexts/VelohubContext';

export const SupportDashboard: React.FC = () => {
  const { user } = useVelohub();
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  const supportSecret = (import.meta as any).env?.VITE_SUPPORT_SECRET;

  const handleSendSupport = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supportMessage.trim()) return;
      if (!supportSubject) return;
      if (!user?.email) {
          alert('Seu email nao esta cadastrado. Atualize seu perfil para enviar suporte.');
          return;
      }
      if (!supportSecret) {
          alert('Chave de suporte nao configurada. Fale com o admin.');
          return;
      }

      setIsSendingSupport(true);

      try {
          if (supabase) {
              const { data, error } = await supabase.functions.invoke('send-support', {
                  body: {
                      name: user?.name || user?.email || 'Usuario',
                      email: user.email,
                      subject: supportSubject,
                      message: supportMessage,
                      isClient: true
                  },
                  headers: {
                      ...(supabaseAnonKey ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } : {}),
                      'x-velohub-secret': supportSecret
                  }
              });
              if (error) throw error;
              if (data?.error) throw new Error(data.error);
          } else {
              await new Promise(resolve => setTimeout(resolve, 1500));
          }

          setSupportSent(true);
          setSupportSubject('');
          setSupportMessage('');
          setTimeout(() => setSupportSent(false), 5000);
      } catch (err) {
          console.error('Erro ao enviar suporte:', err);
          alert('Nao foi possivel enviar sua mensagem agora. Por favor, tente novamente ou envie um email para suporte@velohub.com');
      } finally {
          setIsSendingSupport(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          <LifeBuoy size={20} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Suporte</h1>
          <p className="text-slate-400 text-sm md:text-base">Fale com nosso time e acompanhe a resposta por email.</p>
        </div>
      </div>

      <Card title="Contato Rápido">
        {supportSent ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Mensagem Enviada!</h3>
            <p className="text-slate-400 text-sm">Nossa equipe respondera em breve no seu email cadastrado.</p>
            <Button variant="ghost" className="mt-6" onClick={() => setSupportSent(false)}>Nova Mensagem</Button>
          </div>
        ) : (
          <form onSubmit={handleSendSupport} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Assunto</label>
              <select
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                className="w-full select-premium text-sm"
              >
                <option value="">Selecione um topico...</option>
                <option value="duvida">Duvida sobre o sistema</option>
                <option value="financeiro">Financeiro / Assinatura</option>
                <option value="bug">Relatar um problema</option>
                <option value="sugestao">Sugestao de melhoria</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mensagem</label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:ring-indigo-500 h-40 resize-none"
                placeholder="Como podemos te ajudar hoje?"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSendingSupport || !supportSubject}
              icon={isSendingSupport ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Send size={16} />}
            >
              {isSendingSupport ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
            <p className="text-xs text-center text-slate-600 mt-2 flex items-center justify-center gap-1">
              <MessageSquare size={12} /> Resposta em ate 24h uteis
            </p>
          </form>
        )}
      </Card>

      <Card title="FAQ - Duvidas do Sistema">
        <div className="space-y-3">
          <details className="group rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white flex items-center justify-between">
              Como cadastrar um veiculo em segundos?
              <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2">
              Clique em "Novo Veiculo" no menu lateral, preencha o essencial e salve. O resto voce ajusta quando quiser.
            </p>
          </details>

          <details className="group rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white flex items-center justify-between">
              Como fechar uma venda sem complicacao?
              <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2">
              Entre no veiculo e use "Vender", ou clique em "Realizar Venda" na Visao Geral. Preencha comprador e pagamento e pronto.
            </p>
          </details>

          <details className="group rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white flex items-center justify-between">
              Nao consegui enviar o suporte. O que revisar?
              <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2">
              Verifique se seu email esta no perfil e se a chave de suporte foi configurada no ambiente.
            </p>
          </details>

          <details className="group rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white flex items-center justify-between">
              Como trazer o time para dentro?
              <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2">
              Va em "Equipe", gere o convite e compartilhe o link. O colaborador cria a conta por la.
            </p>
          </details>

          <details className="group rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <summary className="cursor-pointer text-sm font-medium text-white flex items-center justify-between">
              Onde eu atualizo dados da loja e contrato?
              <span className="text-slate-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="text-slate-400 text-sm mt-2">
              Em "Configuracoes", voce edita os dados da organizacao e personaliza o contrato na mesma tela.
            </p>
          </details>
        </div>
      </Card>
    </div>
  );
};



