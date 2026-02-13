
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, MessageSquare, ShieldCheck, FileText, Lock, User, Send, CheckCircle2, HelpCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/services/supabaseClient';
import { useVelohub } from '@/shared/contexts/VelohubContext';
import { Page } from '@/shared/types';

// Layout wrapper for legal/support pages with 2026 Aesthetics and Floating Pill Header
const LegalLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode; onBack: () => void }> = ({ 
    title, subtitle, children, onBack 
}) => {
    const { navigateTo } = useVelohub();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[linear-gradient(to_right,rgba(117,116,116,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(117,116,116,0.12)_1px,transparent_1px)] bg-[size:24px_24px]">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#2b2a2a] via-transparent to-[#2b2a2a]"></div>
            </div>

            {/* --- MINIMALIST FLOATING HEADER --- */}
            <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${scrolled ? 'pt-3' : 'pt-6'} px-4`}>
                <div className={`
                    flex justify-between items-center
                    w-full max-w-5xl
                    transition-all duration-500 ease-in-out
                    backdrop-blur-xl border
                    ${scrolled 
                        ? 'bg-slate-900/90 border-slate-700/50 shadow-2xl shadow-black/50 py-3 px-6 rounded-full' 
                        : 'bg-slate-900/40 border-white/5 py-4 px-6 md:px-8 rounded-full shadow-lg'
                    }
                `}>
                    
                    {/* Logo / Back Area */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={onBack}>
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
                                <span className="font-bold text-white text-sm">V</span>
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white hidden sm:block">VELO<span className="text-indigo-500">HUB</span></span>
                        </div>
                        
                        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
                        
                        <button onClick={onBack} className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                            <ArrowLeft size={14} /> Voltar
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <button 
                            onClick={() => navigateTo(Page.LOGIN)}
                            className="text-xs md:text-sm font-semibold text-white hover:text-indigo-400 transition-colors px-3 py-2"
                        >
                            Entrar
                        </button>
                        <Button 
                            onClick={() => navigateTo(Page.REGISTER)} 
                            size="sm" 
                            className="hidden sm:flex bg-white text-slate-950 hover:bg-indigo-50 border-none font-bold rounded-full px-5 h-9 shadow-sm text-xs md:text-sm"
                        >
                            Criar Conta
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 pt-40 pb-20 px-4">
                <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">{title}</h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
                </div>
                <div className="max-w-5xl mx-auto animate-slide-in-top">
                    {children}
                </div>
            </div>

            <footer className="relative z-10 py-12 text-center text-slate-600 text-sm border-t border-slate-800 bg-slate-950">
                <p>© 2026 Velohub Tecnologia.</p>
            </footer>
        </div>
    );
};

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <LegalLayout title="Termos de Uso" subtitle="Regras claras para uma parceria transparente e de longo prazo." onBack={onBack}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
                <div className="space-y-12 text-slate-300 leading-relaxed text-lg">
                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <FileText size={24} className="text-indigo-500" /> 1. Visão Geral
                        </h3>
                        <p className="text-slate-400">
                            Ao utilizar o Velohub, você concorda com estes termos. Somos uma plataforma SaaS (Software as a Service) 
                            destinada à gestão de estoque automotivo. O serviço é fornecido "como está", visando otimizar a operação de lojistas com tecnologia de ponta.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Lock size={24} className="text-indigo-500" /> 2. Assinatura e Pagamentos
                        </h3>
                        <p className="text-slate-400">
                            O Velohub opera no modelo de assinatura mensal. Os pagamentos são processados via Stripe de forma segura e criptografada. 
                            O não pagamento pode resultar na suspensão temporária do acesso. Oferecemos um período de teste de 7 dias.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <ShieldCheck size={24} className="text-indigo-500" /> 3. Responsabilidades
                        </h3>
                        <p className="text-slate-400">
                            O usuário é responsável pela veracidade dos dados inseridos no sistema (preços, status, documentos). 
                            O Velohub atua como facilitador tecnológico e não se responsabiliza por negociações realizadas entre o lojista e seus clientes finais.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4">4. Cancelamento</h3>
                        <p className="text-slate-400">
                            Você pode cancelar sua assinatura a qualquer momento através do painel de controle. 
                            O acesso permanecerá ativo até o fim do ciclo de cobrança vigente, sem multas ou taxas ocultas.
                        </p>
                    </section>
                </div>
            </div>
        </LegalLayout>
    );
};

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <LegalLayout title="Política de Privacidade" subtitle="Seus dados são o seu maior ativo. Nós os protegemos com criptografia de nível bancário." onBack={onBack}>
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
                <div className="space-y-12 text-slate-300 leading-relaxed text-lg">
                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4">1. Coleta de Dados Inteligente</h3>
                        <p className="text-slate-400">
                            Coletamos apenas os dados estritamente necessários para a inteligência do sistema: informações de cadastro da loja, 
                            dados técnicos dos veículos e registros financeiros de vendas. Não vendemos, alugamos ou compartilhamos suas informações com terceiros para fins publicitários.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4">2. Segurança e Criptografia</h3>
                        <p className="text-slate-400">
                            Seguimos rigorosamente a Lei Geral de Proteção de Dados (LGPD). Todos os dados são armazenados em servidores 
                            com redundância global e criptografia AES-256 de ponta a ponta.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4">3. Uso de Cookies</h3>
                        <p className="text-slate-400">
                            Utilizamos cookies técnicos apenas para manter sua sessão ativa e segura, e cookies analíticos anônimos para melhorar a performance da plataforma.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-4">4. Propriedade dos Dados</h3>
                        <p className="text-slate-400">
                            Os dados da sua loja pertencem a você. Ao cancelar sua conta, você pode solicitar a exportação completa ou a exclusão permanente de nossos servidores.
                        </p>
                    </section>
                </div>
            </div>
        </LegalLayout>
    );
};

export const SupportPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    const supportSecret = (import.meta as any).env?.VITE_SUPPORT_SECRET;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !topic || !message) return;
        if (!supportSecret) {
            alert("Chave de suporte nao configurada. Tente novamente mais tarde.");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            if (supabase) {
                const { error } = await supabase.functions.invoke('send-support', {
                    body: {
                        name,
                        email,
                        subject: topic,
                        message,
                        isClient: false // Visitante
                    },
                    headers: {
                        ...(supabaseAnonKey ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } : {}),
                        "x-velohub-secret": supportSecret,
                    },
                });
                if (error) throw error;
            } else {
                // Fake delay local
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setSubmitted(true);
            setName('');
            setEmail('');
            setTopic('');
            setMessage('');
        } catch (err) {
            console.error("Erro ao enviar contato:", err);
            alert("Erro ao enviar mensagem. Tente novamente mais tarde.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LegalLayout title="Central de Ajuda" subtitle="Suporte premium para lojistas de alta performance." onBack={onBack}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left Column: Contact Info */}
                <div className="space-y-6">
                     <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-indigo-500/50 transition-colors group">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                            <Mail size={24} />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-2">Comercial & Parcerias</h3>
                        <p className="text-slate-400 text-sm mb-6">Dúvidas sobre planos Enterprise, migração de dados ou parcerias.</p>
                        <a href="mailto:contato@velohub.com" className="text-white font-bold hover:text-indigo-400 transition-colors border-b border-indigo-500/30 pb-1">contato@velohub.com</a>
                    </div>

                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-colors group">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-2">Suporte Técnico</h3>
                        <p className="text-slate-400 text-sm mb-6">Reportar bugs, dificuldades de acesso ou dúvidas operacionais.</p>
                        <a href="mailto:suporte@velohub.com" className="text-white font-bold hover:text-emerald-400 transition-colors border-b border-emerald-500/30 pb-1">suporte@velohub.com</a>
                    </div>

                    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Clock size={18} className="text-indigo-500" /> Horário de Atendimento
                        </h3>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span>Segunda a Sexta</span>
                                <span className="text-white font-medium bg-slate-900 px-3 py-1 rounded-full border border-slate-800">09:00 - 18:00</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>Finais de Semana</span>
                                <span className="text-slate-500 font-medium">Plantão via Email</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Contact Form */}
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-10 shadow-2xl relative overflow-hidden">
                    <h3 className="text-2xl font-bold text-white mb-8">Envie uma mensagem</h3>
                    
                    {submitted ? (
                        <div className="h-[460px] flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-white font-bold text-2xl mb-2">Mensagem Recebida!</h3>
                            <p className="text-slate-400 mb-8 max-w-xs">Nossa equipe de especialistas entrará em contato com você em breve.</p>
                            <Button variant="secondary" onClick={() => setSubmitted(false)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">Enviar nova mensagem</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Seu Nome</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                    <input 
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                                        placeholder="Nome completo"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Email de Contato</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                    <input 
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Assunto</label>
                                <div className="relative">
                                    <HelpCircle className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                    <select 
                                        required
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full select-premium pl-12 pr-10 py-3.5 cursor-pointer"
                                    >
                                        <option value="" disabled>Selecione um tópico</option>
                                        <option value="planos">Dúvidas sobre Planos</option>
                                        <option value="suporte">Suporte Técnico</option>
                                        <option value="financeiro">Financeiro</option>
                                        <option value="parceria">Parcerias</option>
                                        <option value="outro">Outros Assuntos</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Mensagem</label>
                                <textarea 
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 h-32 resize-none focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                                    placeholder="Descreva como podemos ajudar..."
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full py-4 rounded-xl shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-500 border-none font-bold text-white hover:scale-[1.02] transition-transform" 
                                disabled={isSubmitting} 
                                icon={isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Send size={18} />}
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </LegalLayout>
    );
};



