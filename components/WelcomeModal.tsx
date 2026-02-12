
import React, { useEffect, useState } from 'react';
import { X, Zap, Rocket, Crown, TrendingUp, Sparkles } from 'lucide-react';
import { User } from '../types';

interface WelcomeModalProps {
  user: User;
}

const MESSAGES = [
  "Bem-vindo à {loja}! Vamos bater todas as metas hoje.",
  "Olá, {user}! O pátio da {loja} está pronto para fazer negócios.",
  "Ótimo dia! Que tal transformar leads em vendas na {loja} hoje?",
  "Foco total! A {loja} é referência graças ao seu trabalho.",
  "Bem-vindo de volta! Suas vendas estão esperando.",
  "Hora de acelerar! O estoque da {loja} não vai se vender sozinho.",
  "Olá! Lembre-se: cada cliente é uma oportunidade de ouro.",
  "A {loja} está em outro nível com você no comando.",
  "Vamos fazer história hoje na {loja}!",
  "Sua performance define o sucesso da {loja}. Vamos lá!",
  "Bom te ver! O sistema está pronto para sua alta performance.",
  "Energia lá em cima! Hoje é dia de vender muito na {loja}.",
  "Olá, {user}. Revise as propostas e feche negócios!",
  "A excelência da {loja} começa com você.",
  "Preparado para quebrar recordes na {loja} hoje?",
  "O mercado não espera. Acelere com a {loja}!",
  "Sucesso é uma decisão. Faça acontecer hoje na {loja}.",
  "Seu potencial é ilimitado. Mostre isso na {loja}.",
  "Clientes satisfeitos, {loja} crescendo. Bom trabalho!",
  "Cada login é um novo começo. Brilhe na {loja} hoje.",
  "A {loja} agradece sua dedicação. Vamos pra cima!",
  "Organização e foco. A receita da {loja} para o sucesso.",
  "Você é a peça chave da {loja}. Ótimo trabalho!",
  "Não pare até se orgulhar. A {loja} conta com você.",
  "Vender é ajudar o cliente a realizar um sonho. Avante {loja}!",
  "Disciplina é liberdade. Organize seu dia na {loja}.",
  "Grandes conquistas começam aqui na {loja}.",
  "Seja extraordinário hoje. A {loja} merece.",
  "O topo é o nosso lugar. Vamos juntos com a {loja}.",
  "Atitude vencedora! Tenha um dia incrível na {loja}."
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ user }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState('');

  const dismiss = () => {
    setIsLeaving(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  useEffect(() => {
    // Verifica se já mostrou nesta sessão
    const hasShown = sessionStorage.getItem('velohub_welcome_shown');
    
    if (!hasShown) {
      // Seleciona mensagem aleatória
      const randomIndex = Math.floor(Math.random() * MESSAGES.length);
      let text = MESSAGES[randomIndex];
      
      // Substitui variáveis
      text = text.replace('{loja}', user.storeName || 'Loja');
      text = text.replace('{user}', user.name.split(' ')[0]); // Apenas primeiro nome
      
      setMessage(text);
      setIsVisible(true);
      setIsLeaving(false);
      sessionStorage.setItem('velohub_welcome_shown', 'true');

      // Auto-close após 5 segundos
      const timer = setTimeout(() => dismiss(), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full ${isLeaving ? 'animate-fade-out' : 'animate-slide-in-right'}`}>
      <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
        {/* Background Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all"></div>
        
        <button 
          onClick={dismiss}
          className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl text-white shadow-lg shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Bem-vindo(a)!</h3>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>
        
        {/* Progress bar timer visual */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-orange-500 w-full animate-shrink-width origin-left"></div>
      </div>
    </div>
  );
};
