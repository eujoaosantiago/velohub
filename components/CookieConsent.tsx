
import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se já existe uma decisão salva
    const consent = localStorage.getItem('velohub_cookie_consent');
    if (!consent) {
      // Pequeno delay para animação de entrada ficar suave
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('velohub_cookie_consent', 'accepted');
    setIsVisible(false);
    
    // AQUI: É onde você iniciaria scripts de terceiros (Analytics, Pixel, etc)
    // ex: window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
  };

  const handleDecline = () => {
    localStorage.setItem('velohub_cookie_consent', 'declined');
    setIsVisible(false);
    // AQUI: Garante que scripts de rastreamento não sejam carregados
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] p-4 md:p-6 animate-slide-in-top">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          
          {/* Efeitos de Fundo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 opacity-80"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex gap-4 relative z-10">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 h-fit hidden md:block">
              <Cookie size={32} className="text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="md:hidden"><Cookie size={20} className="text-amber-400" /></span>
                Valorizamos sua privacidade
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                Utilizamos cookies e armazenamento local para melhorar sua experiência, garantir a segurança do login e analisar o tráfego do site. Ao continuar, você concorda com nossa <a href="#" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Política de Privacidade</a>.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Dados protegidos e criptografados (LGPD Compliance)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <Button 
                variant="ghost" 
                onClick={handleDecline} 
                className="text-slate-400 hover:text-white border-slate-700 hover:bg-slate-800 w-full md:w-auto"
            >
              Apenas Essenciais
            </Button>
            <Button 
                onClick={handleAccept} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-transparent w-full md:w-auto font-bold"
            >
              Aceitar Todos
            </Button>
          </div>

          <button 
            onClick={() => setIsVisible(false)} 
            className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors md:hidden"
          >
            <X size={20} />
          </button>

        </div>
      </div>
    </div>
  );
};
