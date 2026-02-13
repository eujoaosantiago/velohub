
import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se já existe uma decisão salva
    const consent = localStorage.getItem('velohub_cookie_consent');
    if (!consent) {
      setIsVisible(true);
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
    <div className="fixed bottom-0 left-0 right-0 z-[150] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#2b2a2a]/95 backdrop-blur-xl border border-[#757474]/40 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">

          <div className="flex gap-4 relative z-10">
            <div className="p-3 bg-[#2b2a2a] rounded-xl border border-[#757474]/40 h-fit hidden md:block">
              <Cookie size={32} className="text-[#ff6035]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#ece8e8] flex items-center gap-2">
                <span className="md:hidden"><Cookie size={20} className="text-[#ff6035]" /></span>
                Valorizamos sua privacidade
              </h3>
              <p className="text-[#757474] text-sm leading-relaxed max-w-2xl">
                Utilizamos cookies e armazenamento local para melhorar sua experiência, garantir a segurança do login e analisar o tráfego do site. Ao continuar, você concorda com nossa <a href="#" className="text-[#ff6035] hover:text-[#ff7a52] underline underline-offset-2">Política de Privacidade</a>.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#757474] pt-1">
                <ShieldCheck size={14} className="text-[#ff6035]" />
                <span>Dados protegidos e criptografados (LGPD Compliance)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <Button 
                variant="ghost" 
                onClick={handleDecline} 
                className="text-[#757474] hover:text-[#ece8e8] border-[#757474]/40 hover:bg-[#2b2a2a] w-full md:w-auto"
            >
              Apenas Essenciais
            </Button>
            <Button 
                onClick={handleAccept} 
                className="bg-[#ff6035] hover:bg-[#ff7a52] text-[#ece8e8] shadow-lg shadow-[#ff6035]/20 border-transparent w-full md:w-auto font-bold"
            >
              Aceitar Todos
            </Button>
          </div>

          <button 
            onClick={() => setIsVisible(false)} 
            className="absolute top-4 right-4 text-[#757474] hover:text-[#ece8e8] transition-colors md:hidden"
          >
            <X size={20} />
          </button>

        </div>
      </div>
    </div>
  );
};



