
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { 
    ArrowRight, BarChart3, Car, ShieldCheck, Zap, LayoutDashboard, 
    DollarSign, Smartphone, Check, Star, TrendingUp, Users, Lock, ChevronDown, ChevronUp,
    FileX, AlertTriangle, Clock, XCircle, FileText, Share2, Wrench, CheckCircle2,
    Calculator, MousePointer2, Globe, Printer
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
      setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800/60 transition-all duration-300 supports-[backdrop-filter]:bg-[#020617]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all">
                <span className="font-bold text-white text-xl">V</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">VELO<span className="text-indigo-500">HUB</span></span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
                <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Funcionalidades</button>
                <button onClick={() => scrollToSection('benefits')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Vantagens</button>
                <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Planos</button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onNavigateLogin}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <Button onClick={onNavigateRegister} size="sm" className="bg-white text-slate-950 hover:bg-slate-200 border-none font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Criar Conta Grátis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
            <div className="absolute bottom-[0%] right-[0%] w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px] opacity-30" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-indigo-400 text-xs font-bold mb-8 animate-fade-in backdrop-blur-md uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-default shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Sistema para Lojistas e Concessionárias
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1] max-w-5xl mx-auto drop-shadow-xl">
              Pare de perder dinheiro com <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-white animate-gradient-x">
                Planilhas Amadoras.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Controle seu estoque, lance gastos de oficina e veja o <strong>lucro líquido real</strong> de cada carro. O Velohub é a ferramenta definitiva para donos de loja de carros.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button onClick={onNavigateRegister} size="lg" className="h-14 px-8 text-base rounded-full shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 border-none scale-105 ring-offset-2 ring-offset-slate-950 focus:ring-2 focus:ring-indigo-500">
                Começar Grátis Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <button 
                  onClick={() => scrollToSection('features')}
                  className="h-14 px-8 text-base font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2 group border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-full hover:bg-slate-800 hover:border-slate-700"
              >
                  Ver Funcionalidades <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
              </button>
            </div>

            {/* Dashboard Preview - Glass Effect */}
            <div className="relative mx-auto max-w-6xl group perspective-1000 mt-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative rounded-2xl bg-[#0B0F19] border border-slate-800 shadow-2xl overflow-hidden">
                    {/* Fake Browser Header */}
                    <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                    </div>
                    {/* Content Image */}
                    <img 
                        src="https://images.unsplash.com/photo-1642132652859-3ef5a92905a3?q=80&w=2000&auto=format&fit=crop" 
                        alt="Dashboard Velohub" 
                        className="w-full opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                    />
                    
                    {/* Floating Cards (Overlay) */}
                    <div className="absolute bottom-8 left-8 hidden md:block animate-slide-in-right">
                        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-xs">
                            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <Printer size={20} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Contrato Gerado</p>
                                <p className="text-slate-400 text-xs">PDF pronto em 2 segundos</p>
                            </div>
                            <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />
                        </div>
                    </div>

                    <div className="absolute top-20 right-8 hidden md:block animate-slide-in-top" style={{ animationDelay: '0.2s' }}>
                        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold">ROI Estimado</p>
                                <p className="text-white font-bold text-lg">+18.5%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- STATS BAR --- */}
      <section className="border-y border-slate-800 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800">
              <div className="py-8 text-center">
                  <p className="text-3xl font-bold text-white mb-1">100%</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Web & Mobile</p>
              </div>
              <div className="py-8 text-center">
                  <p className="text-3xl font-bold text-white mb-1">FIPE</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Integração Real</p>
              </div>
              <div className="py-8 text-center">
                  <p className="text-3xl font-bold text-white mb-1">PDF</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Contratos Auto</p>
              </div>
              <div className="py-8 text-center">
                  <p className="text-3xl font-bold text-white mb-1">24h</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Showroom Online</p>
              </div>
          </div>
      </section>

      {/* --- PROBLEM SECTION --- */}
      <section className="py-24 bg-[#020617] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sua loja ainda depende de <span className="text-rose-500">caderninho ou Excel?</span></h2>
                  <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                      Concessionárias modernas não perdem tempo calculando lucro na mão. O Velohub resolve o caos financeiro da sua loja.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <ProblemCard 
                    icon={<FileX size={32} className="text-rose-500" />}
                    title="Cegueira Financeira"
                    description="Vendeu o carro por 50k, mas esqueceu da comissão, da funilaria e do documento? Seu lucro real foi embora e você nem viu."
                  />
                  <ProblemCard 
                    icon={<Clock size={32} className="text-rose-500" />}
                    title="Tempo Perdido"
                    description="O cliente quer comprar, mas você demora 40 minutos editando um contrato no Word. A venda esfria, o cliente desiste."
                  />
                  <ProblemCard 
                    icon={<AlertTriangle size={32} className="text-rose-500" />}
                    title="Estoque Parado"
                    description="Carros 'esquecidos' no fundo do pátio desvalorizando há 90 dias sem ninguém notar. Dinheiro que vira pó."
                  />
              </div>
          </div>
      </section>

      {/* --- FEATURES DEEP DIVE --- */}
      <section id="features" className="py-24 relative overflow-hidden bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-24">
                  <span className="text-indigo-500 font-bold tracking-wider uppercase text-sm">Velohub V1.0</span>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6">Funcionalidades que geram caixa</h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">Cada clique no Velohub foi desenhado para economizar seu tempo ou aumentar seu lucro.</p>
              </div>

              {/* Feature 1: Financeiro */}
              <div className="flex flex-col lg:flex-row items-center gap-16 mb-32 group">
                  <div className="lg:w-1/2 relative order-2 lg:order-1">
                      <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl hover:border-slate-700 transition-colors">
                          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                              <h4 className="text-white font-bold flex items-center gap-2"><TrendingUp size={20} className="text-emerald-400"/> Resultado Líquido</h4>
                              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">Tempo Real</span>
                          </div>
                          <div className="space-y-4">
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">Venda Bruta</span>
                                  <span className="text-white font-bold">R$ 85.900,00</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">(-) Compra</span>
                                  <span className="text-rose-400">R$ 68.000,00</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">(-) Reformas/Peças</span>
                                  <span className="text-rose-400">R$ 1.250,00</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">(-) Comissão Vendedor</span>
                                  <span className="text-rose-400">R$ 850,00</span>
                              </div>
                              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                  <span className="text-white font-bold uppercase text-sm">Lucro Real</span>
                                  <span className="text-2xl font-black text-emerald-400">R$ 15.800,00</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="lg:w-1/2 space-y-6 order-1 lg:order-2">
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Calculator size={28} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white">Lucro Real, Sem "Achismo"</h3>
                      <p className="text-slate-400 text-lg leading-relaxed">
                          O Velohub separa o <strong>CMV</strong> (Custo da Mercadoria Vendida) das suas despesas operacionais. Ao vender um carro, o sistema abate automaticamente o valor de compra, as reformas lançadas e a comissão.
                      </p>
                      <ul className="space-y-3">
                          <FeatureCheck text="Cálculo automático de ROI por veículo" />
                          <FeatureCheck text="Lançamento de despesas (Funilaria, Mecânica)" />
                          <FeatureCheck text="Gestão de comissões integrada" />
                      </ul>
                  </div>
              </div>

              {/* Feature 2: Contracts */}
              <div className="flex flex-col lg:flex-row items-center gap-16 mb-32 group">
                  <div className="lg:w-1/2 space-y-6">
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                          <Printer size={28} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white">Contratos em 1 Clique</h3>
                      <p className="text-slate-400 text-lg leading-relaxed">
                          Esqueça o "Ctrl+C, Ctrl+V". Selecione o carro, digite o CPF do cliente e o Velohub gera um PDF profissional, jurídico e pronto para assinar.
                      </p>
                      <ul className="space-y-3">
                          <FeatureCheck text="Preenchimento automático de dados do veículo" />
                          <FeatureCheck text="Cláusulas de garantia e responsabilidade inclusas" />
                          <FeatureCheck text="Suporte para vendas com Troca + Volta" />
                      </ul>
                  </div>
                  <div className="lg:w-1/2 relative">
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                      <div className="relative bg-white text-slate-900 rounded-2xl p-8 shadow-2xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500 max-w-md mx-auto">
                          <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                              <h4 className="font-black text-xl uppercase">Contrato de Compra e Venda</h4>
                              <p className="text-xs text-slate-500">Documento gerado eletronicamente em {new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="space-y-2 text-xs font-serif leading-relaxed text-justify opacity-60">
                              <div className="h-2 bg-slate-200 rounded w-full"></div>
                              <div className="h-2 bg-slate-200 rounded w-full"></div>
                              <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                          </div>
                          <div className="my-6 bg-slate-100 p-4 rounded border border-slate-200">
                              <p className="font-bold text-sm mb-2 uppercase">Resumo da Operação</p>
                              <div className="flex justify-between text-sm">
                                  <span>Veículo:</span>
                                  <strong>BMW 320i 2021</strong>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span>Valor:</span>
                                  <strong>R$ 245.000,00</strong>
                              </div>
                          </div>
                          <div className="flex justify-end">
                              <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                  <Check size={14} /> Pronto para Imprimir
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Feature 3: Showroom & FIPE */}
              <div className="flex flex-col lg:flex-row items-center gap-16 group">
                  <div className="lg:w-1/2 relative order-2 lg:order-1">
                      <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-2 shadow-2xl max-w-sm mx-auto">
                          {/* Phone Mockup */}
                          <div className="bg-slate-950 rounded-[20px] overflow-hidden border border-slate-800">
                              <div className="bg-white p-4 pb-6">
                                  <div className="w-full aspect-video bg-slate-200 rounded-lg mb-4 relative overflow-hidden">
                                      <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600" className="object-cover w-full h-full" />
                                      <div className="absolute bottom-2 right-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded">1/8</div>
                                  </div>
                                  <h3 className="text-slate-900 font-bold text-lg leading-tight mb-1">Porsche Macan 2.0</h3>
                                  <p className="text-slate-500 text-xs mb-3">2022 • 18.000km • Blindado</p>
                                  <div className="flex items-end gap-1 mb-4">
                                      <span className="text-indigo-600 font-bold text-2xl">R$ 489.900</span>
                                  </div>
                                  <div className="w-full bg-[#25D366] text-white py-3 rounded-lg font-bold text-center text-sm flex items-center justify-center gap-2 shadow-lg">
                                      <Smartphone size={16} /> Tenho Interesse
                                  </div>
                              </div>
                          </div>
                          {/* Floating Share Button */}
                          <div className="absolute -right-6 top-1/2 bg-white text-indigo-600 p-3 rounded-full shadow-xl animate-bounce">
                              <Share2 size={24} />
                          </div>
                      </div>
                  </div>
                  <div className="lg:w-1/2 space-y-6 order-1 lg:order-2">
                      <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                          <Globe size={28} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white">Seu Estoque na Palma da Mão</h3>
                      <p className="text-slate-400 text-lg leading-relaxed">
                          Integração total com a <strong>Tabela FIPE</strong> para precificação inteligente. Além disso, gere links públicos ("Link na Bio") dos seus carros para enviar no WhatsApp.
                      </p>
                      <ul className="space-y-3">
                          <FeatureCheck text="Consulta FIPE atualizada em tempo real" />
                          <FeatureCheck text="Links de compartilhamento seguros (sem custos visíveis)" />
                          <FeatureCheck text="Etiqueta de vidro com QR Code gerada automaticamente" />
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* --- BENEFITS / STEPS --- */}
      <section id="benefits" className="py-24 bg-slate-950 border-y border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-white">Simples como deve ser</h2>
                  <p className="text-slate-400">Do cadastro à venda em 3 passos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StepCard 
                    step="1"
                    title="Entrada Inteligente"
                    description="Cadastre o carro usando a busca FIPE. O sistema já sugere a versão correta e preenche os dados técnicos."
                  />
                  <StepCard 
                    step="2"
                    title="Gestão Total"
                    description="Lance gastos de preparação, controle quem reservou o carro e monitore há quantos dias ele está parado."
                  />
                  <StepCard 
                    step="3"
                    title="Saída Lucrativa"
                    description="Ao vender, o sistema calcula o lucro final, gera o contrato e arquiva o histórico do cliente para o futuro."
                  />
              </div>
          </div>
      </section>

      {/* --- PRICING --- */}
      <section className="py-24 relative overflow-hidden" id="pricing">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <div className="inline-block bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    Experimente Agora
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Comece grátis, cresça com o tempo</h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                    Planos flexíveis para revendedores autônomos e grandes lojas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
                {/* PLANO FREE */}
                <PricingCard 
                    title="Gratuito"
                    price="0,00"
                    description="Para testar o sistema ou pequenos revendedores."
                    features={["Até 3 Carros", "Tabela FIPE", "Gestão de Gastos", "1 Usuário"]}
                    onSelect={onNavigateRegister}
                />

                {/* PLANO STARTER (ANTIGO) / PRO */}
                <PricingCard 
                    title="Starter"
                    price="39,90"
                    description="Para lojistas que estão acelerando as vendas."
                    isPopular
                    features={["Até 15 Carros", "Showroom Digital (Link)", "Contratos Automáticos", "1 Usuário"]}
                    onSelect={onNavigateRegister}
                    trial
                />

                {/* PLANO PRO (ANTIGO) / ELITE */}
                <PricingCard 
                    title="Pro"
                    price="89,90"
                    description="Alta performance e gestão completa."
                    features={["Tudo do Starter +", "Até 50 Carros", "3 Usuários", "Relatórios de ROI", "Suporte Prioritário", "Gestão de Equipe"]}
                    onSelect={onNavigateRegister}
                    trial
                />

                {/* PLANO ENTERPRISE - NOVO */}
                <PricingCard 
                    title="Enterprise"
                    price="Sob Consulta"
                    description="Para redes de lojas que precisam de mais limites que o Pro."
                    features={["Tudo do Pro +", "Estoque Ilimitado", "API Dedicada", "Usuários Ilimitados", "Gerente de Conta"]}
                    onSelect={onNavigateSupport} // Redireciona para contato/suporte
                    isEnterprise
                />
            </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-20 bg-slate-900/30">
          <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-white text-center mb-10">Dúvidas Frequentes</h2>
              <div className="space-y-4">
                  <FaqItem 
                    question="Preciso instalar algum programa?" 
                    answer="Não. O Velohub é 100% online. Você acessa pelo navegador do computador, tablet ou celular." 
                    isOpen={openFaq === 0}
                    onClick={() => toggleFaq(0)}
                  />
                  <FaqItem 
                    question="O plano gratuito expira?" 
                    answer="Não! O plano Gratuito é eterno para até 3 carros. Você só paga se precisar cadastrar mais veículos ou desbloquear funções avançadas." 
                    isOpen={openFaq === 1}
                    onClick={() => toggleFaq(1)}
                  />
                  <FaqItem 
                    question="Como funciona o teste de 7 dias?" 
                    answer="Nos planos Starter e Pro, você pode usar todas as funcionalidades sem pagar nada por 7 dias. O sistema só cobrará após esse período se você decidir continuar." 
                    isOpen={openFaq === 2}
                    onClick={() => toggleFaq(2)}
                  />
                  <FaqItem 
                    question="O sistema emite Nota Fiscal?" 
                    answer="O Velohub é um sistema de gestão gerencial. Nós ajudamos você a gerar contratos e recibos, mas a emissão fiscal (NFe) deve ser feita pelo seu contador ou sistema emissor específico." 
                    isOpen={openFaq === 3}
                    onClick={() => toggleFaq(3)}
                  />
              </div>
          </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Assuma o controle da sua loja hoje.</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={onNavigateRegister} size="lg" className="h-16 px-12 text-lg rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-transform bg-indigo-600 hover:bg-indigo-500 border-none group">
                <Zap className="mr-2 group-hover:text-yellow-300 transition-colors" size={20} />
                Criar Conta Gratuita
            </Button>
          </div>
          <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-indigo-500"/> Plano Grátis Disponível</span>
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-indigo-500"/> Dados Criptografados</span>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">V</div>
            <span className="font-bold text-lg text-slate-300">VELO<span className="text-indigo-500">HUB</span></span>
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-slate-500 justify-center font-medium">
              <button onClick={onNavigateTerms} className="hover:text-white transition-colors">Termos de Uso</button>
              <button onClick={onNavigatePrivacy} className="hover:text-white transition-colors">Privacidade</button>
              <button onClick={onNavigateSupport} className="hover:text-white transition-colors">Suporte</button>
          </div>
          <div className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Velohub Tecnologia.
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FeatureCheck: React.FC<{ text: string }> = ({ text }) => (
    <li className="flex items-center gap-3 text-slate-300">
        <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
            <Check size={14} />
        </div>
        <span>{text}</span>
    </li>
);

const ProblemCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-rose-900/50 transition-all duration-300 group">
        <div className="mb-6 p-4 bg-slate-950 rounded-2xl inline-flex border border-slate-800 group-hover:scale-110 transition-transform shadow-lg">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const StepCard: React.FC<{ step: string, title: string, description: string }> = ({ step, title, description }) => (
    <div className="relative p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center group hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1">
        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-bold text-white mx-auto mb-6 border border-slate-700 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-colors shadow-lg">
            {step}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
    </div>
);

const PricingCard: React.FC<{ 
    title: string, 
    price: string, 
    description: string, 
    features: string[], 
    isPopular?: boolean, 
    onSelect: () => void,
    trial?: boolean,
    isEnterprise?: boolean
}> = ({ title, price, description, features, isPopular, onSelect, trial, isEnterprise }) => {
    return (
        <div className={`relative bg-slate-900/60 backdrop-blur-md border rounded-[2rem] p-8 flex flex-col transition-all duration-300 ${isPopular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10' : 'border-slate-800 hover:border-slate-700'}`}>
            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg border border-indigo-400/50">
                    Mais Escolhido
                </div>
            )}
            <div className="mb-8">
                <h3 className={`text-lg font-bold mb-2 ${isPopular ? 'text-white' : 'text-slate-200'}`}>{title}</h3>
                <div className="flex items-baseline gap-1">
                    {!isEnterprise && <span className="text-sm text-slate-400 font-medium">R$</span>}
                    <span className={`${isEnterprise ? 'text-3xl' : 'text-5xl'} font-black text-white tracking-tight`}>{price}</span>
                    {!isEnterprise && <span className="text-sm text-slate-400 font-medium">/mês</span>}
                </div>
                <p className="text-slate-400 text-sm mt-4 pb-6 border-b border-slate-800 font-medium">{description}</p>
            </div>
            
            <div className="flex-1 space-y-4 mb-8">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                        <div className={`p-1 rounded-full ${isPopular ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <Check size={10} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <Button 
                variant={isPopular ? 'primary' : 'secondary'} 
                className={`w-full py-4 rounded-xl font-bold shadow-lg ${!isPopular && 'bg-slate-800 hover:bg-slate-700 border-transparent text-white'}`}
                onClick={onSelect}
            >
                {isEnterprise ? 'Falar com Consultor' : (trial ? 'Testar Grátis (7 Dias)' : 'Criar Conta Grátis')}
            </Button>
        </div>
    );
};

const FaqItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30 transition-all hover:border-slate-700">
            <button 
                onClick={onClick}
                className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
            >
                <span className="font-bold text-white">{question}</span>
                {isOpen ? <ChevronUp className="text-indigo-500" size={20} /> : <ChevronDown className="text-slate-500" size={20} />}
            </button>
            <div 
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="p-5 pt-0 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50">
                    {answer}
                </p>
            </div>
        </div>
    );
}
