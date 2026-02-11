
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { 
    ArrowRight, Car, ShieldCheck, Zap, LayoutDashboard, 
    DollarSign, Smartphone, Check, Star, TrendingUp, Users, Lock, ChevronDown, 
    FileText, Share2, CheckCircle2,
    Calculator, Globe, Rocket, Gem, LineChart, PlayCircle, BarChart
} from 'lucide-react';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateSupport?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onNavigateLogin, 
    onNavigateRegister,
    onNavigateTerms,
    onNavigatePrivacy,
    onNavigateSupport
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* --- PREMIUM FLOATING HEADER --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${scrolled ? 'pt-4' : 'pt-8'} px-4`}>
        <div className={`
            flex justify-between items-center
            w-full max-w-6xl
            transition-all duration-500 ease-out
            backdrop-blur-xl border
            ${scrolled 
                ? 'bg-[#0a0a0a]/80 border-white/5 shadow-[0_8px_32px_rgb(0,0,0,0.4)] py-3 px-6 rounded-full' 
                : 'bg-transparent border-transparent py-4 px-6 md:px-8 rounded-full'
            }
        `}>
            
            {/* Logo Area */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300 border border-white/10">
                <span className="font-extrabold text-white text-lg">V</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">VELO<span className="text-indigo-500">HUB</span></span>
            </div>
            
            {/* Desktop Nav Links */}
            <div className={`hidden md:flex items-center gap-1 ${scrolled ? 'bg-white/5 p-1.5 rounded-full border border-white/5' : ''}`}>
                <NavButton onClick={() => scrollToSection('differential')} label="Diferenciais" />
                <NavButton onClick={() => scrollToSection('features')} label="Plataforma" />
                <NavButton onClick={() => scrollToSection('pricing')} label="Planos" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={onNavigateLogin}
                className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-colors px-2"
              >
                Entrar
              </button>
              <Button 
                onClick={onNavigateRegister} 
                size="sm" 
                className="bg-white text-black hover:bg-slate-200 border-none font-bold rounded-full px-6 h-10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] text-xs md:text-sm hover:scale-105"
              >
                Começar Agora
              </Button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION: HIGH-END SAAS --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Studio Lighting Background */}
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left: Copywriting de Autoridade */}
                <div className="text-left animate-slide-in-right z-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold mb-8 uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/20 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_#818cf8]"></span>
                        Tecnologia Automotiva v2.0
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.05]">
                        O Sistema Operacional de <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-orange-200">
                            Revendas de Elite.
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed font-light">
                        Centralize estoque, financeiro e contratos em uma única plataforma inteligente. 
                        Projetado para lojistas que não aceitam perder margem por desorganização.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-5">
                        <Button onClick={onNavigateRegister} size="lg" className="h-14 px-10 text-base rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_40px_rgba(79,70,229,0.3)] border-none transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(79,70,229,0.5)]">
                            Solicitar Acesso
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <button 
                            onClick={() => scrollToSection('features')}
                            className="h-14 px-8 text-base font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-3 rounded-full border border-slate-700 hover:border-slate-500"
                        >
                            <PlayCircle size={20} className="text-white" /> Ver Plataforma
                        </button>
                    </div>

                    <div className="mt-14 flex items-center gap-6">
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-[#050505] bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                                +2k
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-orange-500 fill-orange-500" />)}
                            </div>
                            <span className="text-sm text-slate-400 font-medium">Confiança de 500+ Lojas</span>
                        </div>
                    </div>
                </div>

                {/* Right: The Professional Avatar + UI */}
                <div className="relative h-[600px] w-full flex items-end justify-center lg:justify-end animate-fade-in delay-100 mt-10 lg:mt-0">
                    
                    {/* The Professional Image - Realistic Avatar */}
                    <div className="relative z-10 w-full max-w-[500px] h-full flex items-end justify-center">
                        {/* Gradient Fade at bottom to blend with section */}
                        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-[#050505] to-transparent z-20"></div>
                        
                        {/* Person Image (Unsplash - Professional using tablet) */}
                        <img 
                            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop" 
                            alt="Gestor VeloHub" 
                            className="h-full object-cover object-top rounded-t-[3rem] opacity-90 mask-image-gradient"
                            style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
                        />

                        {/* Floating Holographic UI - The "Tablet" Content projected */}
                        <div className="absolute top-[20%] -left-[10%] md:-left-[20%] w-[280px] md:w-[320px] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-t-indigo-500/50 animate-float-slow z-30">
                            {/* Header UI */}
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-white tracking-wide">RESULTADO HOJE</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Atualizado agora</span>
                            </div>
                            
                            {/* Main Stat */}
                            <div className="mb-4">
                                <span className="text-slate-400 text-xs font-medium uppercase">Lucro Líquido</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-white">R$ 14.250</span>
                                    <span className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-0.5">
                                        <TrendingUp size={10} /> +12%
                                    </span>
                                </div>
                            </div>

                            {/* Mini Chart Area */}
                            <div className="flex gap-2 items-end h-16 mb-4">
                                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                    <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-sm relative group overflow-hidden">
                                        <div 
                                            className={`absolute bottom-0 w-full bg-indigo-500 transition-all duration-1000 ${i === 5 ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : ''}`} 
                                            style={{ height: `${h}%` }}
                                        ></div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button UI */}
                            <div className="bg-white/5 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Car size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Nova Proposta</p>
                                        <p className="text-[10px] text-slate-400">Honda Civic Touring</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            </div>
                        </div>

                        {/* Floating Notification - Right Side */}
                        <div className="absolute bottom-[20%] -right-[5%] w-[200px] bg-[#0a0a0a]/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl flex items-center gap-3 animate-float-reverse z-30">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                <DollarSign size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Venda Aprovada</p>
                                <p className="text-[10px] text-slate-400">R$ 85.900,00 recebidos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- VALUE PROPOSITION (Why VeloHub?) --- */}
      <section id="differential" className="py-24 bg-[#0a0a0a] relative border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                      A diferença entre <span className="text-slate-500 line-through">vender carros</span> e <span className="text-indigo-400">gerir um negócio</span>.
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                      Planilhas quebram, anotações somem. O VeloHub transforma dados brutos em inteligência comercial para você tomar decisões baseadas em lucro real, não em intuição.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <PremiumFeatureCard 
                      icon={<LineChart size={24} />}
                      title="Lucro Líquido Real"
                      desc="O sistema abate comissões, reparos, impostos e taxas automaticamente. Você vê o que sobra no bolso, não o faturamento bruto ilusório."
                      color="indigo"
                  />

                  {/* Card 2 */}
                  <PremiumFeatureCard 
                      icon={<ShieldCheck size={24} />}
                      title="Contratos Blindados"
                      desc="Adeus Word. Gere contratos jurídicos perfeitos em PDF com um clique. Dados do cliente, veículo e garantia preenchidos automaticamente."
                      color="emerald"
                  />

                  {/* Card 3 */}
                  <PremiumFeatureCard 
                      icon={<Smartphone size={24} />}
                      title="Showroom na Bio"
                      desc="Cada carro ganha uma Landing Page exclusiva e profissional. Envie o link no WhatsApp e impressione o cliente antes mesmo dele visitar a loja."
                      color="orange"
                  />
              </div>
          </div>
      </section>

      {/* --- IMMERSIVE APP PREVIEW --- */}
      <section className="py-32 bg-[#050505] relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900/5 skew-y-3 transform origin-top-left scale-110 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="order-2 lg:order-1">
                      <div className="relative mx-auto border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col">
                          <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                          <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                          <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                          <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                          <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-slate-950 relative">
                               {/* Mockup Screen Content */}
                               <img src="https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1000&auto=format&fit=crop" className="w-full h-1/2 object-cover" />
                               <div className="p-6 bg-slate-900 h-1/2">
                                   <div className="flex gap-2 mb-4">
                                       <span className="bg-indigo-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Disponível</span>
                                       <span className="text-slate-400 text-[10px] flex items-center gap-1"><Gem size={10}/> Premium</span>
                                   </div>
                                   <h3 className="text-white text-2xl font-bold leading-tight mb-2">Porsche 911 Carrera S</h3>
                                   <p className="text-indigo-400 text-xl font-bold mb-6">R$ 859.900</p>
                                   <div className="grid grid-cols-2 gap-2 mb-6">
                                       <div className="bg-slate-800 p-2 rounded text-center"><span className="text-xs text-slate-400 block">Ano</span><span className="text-white font-bold text-sm">2023</span></div>
                                       <div className="bg-slate-800 p-2 rounded text-center"><span className="text-xs text-slate-400 block">KM</span><span className="text-white font-bold text-sm">4.500</span></div>
                                   </div>
                                   <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] border-none">Chamar no WhatsApp</Button>
                               </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="order-1 lg:order-2">
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                          Sua loja no bolso do cliente.<br/>
                          <span className="text-indigo-500">24 horas por dia.</span>
                      </h2>
                      <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                          Não envie fotos soltas e bagunçadas. Com o VeloHub, você gera um link profissional ("Link na Bio") para cada carro. O cliente vê fotos em HD, ficha técnica e te chama no WhatsApp com um clique.
                      </p>
                      
                      <div className="space-y-6">
                          <FeatureRow icon={<Globe size={20} />} title="Link Exclusivo" desc="URL própria para compartilhar no Instagram e WhatsApp." />
                          <FeatureRow icon={<Share2 size={20} />} title="Compartilhamento Fácil" desc="Envie o estoque completo ou um carro específico." />
                          <FeatureRow icon={<Rocket size={20} />} title="Sem Hospedagem" desc="Não precisa pagar site. Nós hospedamos para você." />
                      </div>

                      <div className="mt-10">
                          <Button onClick={onNavigateRegister} variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 h-12 px-8">
                              Criar Meu Showroom
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-[#0a0a0a] border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <span className="text-indigo-500 font-bold tracking-widest text-xs uppercase mb-2 block">Funcionalidades</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">Tudo o que uma loja moderna precisa</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FeatureBox title="Gestão de Estoque" icon={<Car />} desc="Controle total de entrada, saída, custos de reparo e tempo de pátio." />
                  <FeatureBox title="Financeiro Automático" icon={<DollarSign />} desc="Cálculo de ROI, margem de lucro e relatórios de performance." />
                  <FeatureBox title="Tabela FIPE" icon={<BarChart />} desc="Integração nativa para precificação correta na compra e venda." />
                  <FeatureBox title="CRM de Clientes" icon={<Users />} desc="Base de dados automática de quem comprou e vendeu para você." />
              </div>
          </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Investimento Estratégico</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Preço de uma pizza. Retorno de uma multinacional. Escolha seu plano.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                {/* FREE */}
                <PricingCard 
                    title="Start"
                    price="0,00"
                    description="Para quem está começando."
                    features={["Até 3 Carros", "Gestão Básica", "1 Usuário"]}
                    onSelect={onNavigateRegister}
                    variant="basic"
                />

                {/* STARTER - HERO */}
                <div className="relative bg-[#0f0f0f] border border-indigo-500 rounded-3xl p-8 flex flex-col shadow-2xl shadow-indigo-900/20 transform md:scale-110 z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wide border border-indigo-400 shadow-lg">
                        Mais Escolhido
                    </div>
                    
                    <div className="mb-8 pt-4">
                        <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm text-slate-400">R$</span>
                            <span className="text-5xl font-black text-white tracking-tight">39,90</span>
                            <span className="text-sm text-slate-400">/mês</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-4 font-medium border-t border-slate-800 pt-4">Ideal para pequenas lojas e revendedores autônomos.</p>
                    </div>
                    <div className="flex-1 space-y-4 mb-8">
                        <FeatureCheck text="Até 15 Carros" active />
                        <FeatureCheck text="Link na Bio (Showroom)" active />
                        <FeatureCheck text="Contratos em PDF" active />
                        <FeatureCheck text="Suporte por Email" active />
                    </div>
                    <Button onClick={onNavigateRegister} className="w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-none">
                        Começar Teste Grátis
                    </Button>
                </div>

                {/* PRO */}
                <PricingCard 
                    title="Pro"
                    price="89,90"
                    description="Para operações em escala."
                    features={["Até 50 Carros", "Relatórios de ROI", "3 Usuários", "Gestão de Equipe"]}
                    onSelect={onNavigateRegister}
                    variant="basic"
                />
            </div>
        </div>
      </section>

      {/* --- FOOTER CTA (Conversion Zone) --- */}
      <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-950"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                  Sua loja nunca mais será a mesma.
              </h2>
              <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
                  Junte-se a lojistas que transformaram a desorganização em lucro previsível. Crie sua conta em menos de 1 minuto.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button onClick={onNavigateRegister} size="lg" className="h-16 px-12 text-lg rounded-full bg-white text-black hover:bg-slate-200 border-none font-bold shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform">
                      Criar Conta Gratuita
                  </Button>
                  <Button onClick={onNavigateSupport} variant="outline" className="h-16 px-10 text-lg rounded-full border-indigo-400/30 text-indigo-200 hover:bg-indigo-900/50 hover:text-white hover:border-white">
                      Falar com Consultor
                  </Button>
              </div>
              <p className="mt-6 text-xs text-indigo-400/60 font-medium">Teste de 7 dias grátis • Sem fidelidade • Cancele quando quiser</p>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black border-t border-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700">V</div>
            <span className="font-bold text-lg text-slate-300">VELO<span className="text-slate-500">HUB</span></span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 font-medium">
              <button onClick={onNavigateTerms} className="hover:text-white transition-colors">Termos de Uso</button>
              <button onClick={onNavigatePrivacy} className="hover:text-white transition-colors">Política de Privacidade</button>
              <button onClick={onNavigateSupport} className="hover:text-white transition-colors">Central de Ajuda</button>
          </div>
          <div className="text-slate-600 text-sm">
            © 2026 Velohub Tecnologia.
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS (Refined for Premium Look) ---

const NavButton: React.FC<{ onClick: () => void, label: string }> = ({ onClick, label }) => (
    <button onClick={onClick} className="text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all">
        {label}
    </button>
);

const FeatureRow: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="flex gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0 border border-slate-700">
            {icon}
        </div>
        <div>
            <h4 className="text-white font-bold mb-1">{title}</h4>
            <p className="text-slate-400 text-sm">{desc}</p>
        </div>
    </div>
);

const FeatureBox: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="bg-[#0f0f0f] border border-slate-800 p-6 rounded-2xl hover:border-indigo-500/30 transition-colors group">
        <div className="text-slate-500 mb-4 group-hover:text-indigo-400 transition-colors">{icon}</div>
        <h3 className="text-white font-bold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{desc}</p>
    </div>
);

const PremiumFeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, color: 'indigo' | 'emerald' | 'orange' }> = ({ icon, title, desc, color }) => {
    const colors = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/50',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/50',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20 group-hover:border-orange-500/50',
    };

    return (
        <div className={`p-8 rounded-3xl border bg-[#0f0f0f] transition-all duration-300 group hover:-translate-y-1 ${colors[color].replace('text-', 'border-').split(' ')[2]} ${colors[color].split(' ')[3]}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors[color].split(' ').slice(0,2).join(' ')}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
};

const FeatureCheck: React.FC<{ text: string, active?: boolean }> = ({ text, active }) => (
    <li className="flex items-center gap-3 text-slate-300">
        <div className={`p-1 rounded-full shrink-0 ${active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
            <Check size={10} strokeWidth={3} />
        </div>
        <span className={active ? 'text-white' : 'text-slate-500'}>{text}</span>
    </li>
);

const PricingCard: React.FC<{ 
    title: string, 
    price: string, 
    description: string, 
    features: string[], 
    onSelect: () => void,
    variant?: 'basic' | 'hero'
}> = ({ title, price, description, features, onSelect, variant }) => {
    return (
        <div className="bg-[#0f0f0f] border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-600 transition-colors">
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-200 mb-2">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-sm text-slate-500 font-medium">R$</span>
                    <span className="text-4xl font-black text-white tracking-tight">{price}</span>
                    <span className="text-sm text-slate-500 font-medium">/mês</span>
                </div>
                <p className="text-slate-500 text-sm mt-4 border-t border-slate-800 pt-4">{description}</p>
            </div>
            
            <div className="flex-1 space-y-4 mb-8">
                {features.map((feature, i) => (
                    <FeatureCheck key={i} text={feature} />
                ))}
            </div>

            <Button 
                variant="secondary" 
                className="w-full py-4 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white border-slate-800"
                onClick={onSelect}
            >
                Escolher Plano
            </Button>
        </div>
    );
};