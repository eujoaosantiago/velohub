
import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, ShieldCheck, FileText, Lock, User, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';

// Layout wrapper for legal/support pages
const LegalLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode; onBack: () => void }> = ({ 
    title, subtitle, children, onBack 
}) => {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 font-sans">
            <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                                <span className="font-bold text-white text-xl">V</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">VELO<span className="text-indigo-400">HUB</span></span>
                        </div>
                        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
                            Voltar
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-12 text-center animate-fade-in">
                        <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
                        <p className="text-slate-400 text-lg">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>

            <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-900">
                <p>© {new Date().getFullYear()} Velohub. Desenvolvido pela <span className="text-indigo-500 font-semibold">ValeCreative</span>.</p>
            </footer>
        </div>
    );
};

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <LegalLayout title="Termos de Uso" subtitle="Regras claras para uma parceria transparente." onBack={onBack}>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-sm animate-fade-in max-w-3xl mx-auto">
                <div className="space-y-8 text-slate-300 leading-relaxed">
                    <section>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-400" /> 1. Visão Geral
                        </h3>
                        <p>
                            Ao utilizar o Velohub, você concorda com estes termos. Somos uma plataforma SaaS (Software as a Service) 
                            destinada à gestão de estoque automotivo. O serviço é fornecido "como está", visando otimizar a operação de lojistas.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <Lock size={20} className="text-indigo-400" /> 2. Assinatura e Pagamentos
                        </h3>
                        <p>
                            O Velohub opera no modelo de assinatura mensal. Os pagamentos são processados via Stripe. 
                            O não pagamento pode resultar na suspensão temporária do acesso. Oferecemos um período de teste de 7 dias, 
                            após o qual a cobrança será iniciada caso o usuário opte por continuar.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-indigo-400" /> 3. Responsabilidades
                        </h3>
                        <p>
                            O usuário é responsável pela veracidade dos dados inseridos no sistema (preços, status, documentos). 
                            O Velohub não se responsabiliza por negociações realizadas entre o lojista e seus clientes finais.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3">4. Cancelamento</h3>
                        <p>
                            Você pode cancelar sua assinatura a qualquer momento através do painel de controle. 
                            O acesso permanecerá ativo até o fim do ciclo de cobrança vigente.
                        </p>
                    </section>
                </div>
            </div>
        </LegalLayout>
    );
};

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <LegalLayout title="Política de Privacidade" subtitle="Seus dados são o seu maior ativo. Nós protegemos." onBack={onBack}>
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-sm animate-fade-in max-w-3xl mx-auto">
                <div className="space-y-8 text-slate-300 leading-relaxed">
                    <section>
                        <h3 className="text-xl font-bold text-white mb-3">1. Coleta de Dados</h3>
                        <p>
                            Coletamos apenas os dados necessários para o funcionamento do sistema: informações de cadastro da loja, 
                            dados dos veículos e registros de vendas. Não vendemos suas informações para terceiros.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3">2. Segurança (LGPD)</h3>
                        <p>
                            Seguimos rigorosamente a Lei Geral de Proteção de Dados (LGPD). Todos os dados são armazenados em servidores 
                            seguros com criptografia de ponta a ponta.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3">3. Uso de Cookies</h3>
                        <p>
                            Utilizamos cookies apenas para manter sua sessão ativa e para métricas anônimas de desempenho do sistema, 
                            visando melhorar a experiência do usuário.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-3">4. Exclusão de Dados</h3>
                        <p>
                            Ao cancelar sua conta, você pode solicitar a exclusão completa dos seus dados de nossos servidores 
                            entrando em contato com nosso suporte.
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !topic || !message) return;
        
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
                    }
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
        <LegalLayout title="Central de Ajuda" subtitle="Estamos aqui para ajudar sua loja a vender mais." onBack={onBack}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-fade-in">
                {/* Left Column: Contact Info */}
                <div className="space-y-6">
                     <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                        <Mail className="text-indigo-400 mb-4" size={32} />
                        <h3 className="text-white font-bold text-lg mb-2">Email Comercial</h3>
                        <p className="text-slate-400 text-sm mb-4">Para dúvidas sobre planos, parcerias e vendas.</p>
                        <a href="mailto:contato@velohub.com" className="text-indigo-400 font-medium hover:underline">contato@velohub.com</a>
                    </div>

                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
                        <MessageSquare className="text-emerald-400 mb-4" size={32} />
                        <h3 className="text-white font-bold text-lg mb-2">Suporte Técnico</h3>
                        <p className="text-slate-400 text-sm mb-4">Problemas de acesso, bugs ou dúvidas de uso.</p>
                        <a href="mailto:suporte@velohub.com" className="text-emerald-400 font-medium hover:underline">suporte@velohub.com</a>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <h3 className="text-white font-bold mb-4">Horário de Atendimento</h3>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li className="flex justify-between items-center border-b border-slate-900 pb-2">
                                <span>Segunda a Sexta</span>
                                <span className="text-white font-medium">09:00 - 18:00</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-slate-900 pb-2">
                                <span>Sábado</span>
                                <span className="text-white font-medium">09:00 - 13:00</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span>Domingo</span>
                                <span className="text-rose-400 font-medium">Fechado</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Contact Form */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
                    
                    <h3 className="text-2xl font-bold text-white mb-6">Envie uma mensagem</h3>
                    
                    {submitted ? (
                        <div className="h-[460px] flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Mensagem Enviada!</h3>
                            <p className="text-slate-400 mb-8 max-w-xs">Nossa equipe recebeu sua solicitação e entrará em contato pelo email informado.</p>
                            <Button variant="secondary" onClick={() => setSubmitted(false)}>Enviar nova mensagem</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Seu Nome</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-slate-500" size={18} />
                                    <input 
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                        placeholder="Digite seu nome completo"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email de Contato</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                                    <input 
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Assunto</label>
                                <div className="relative">
                                    <HelpCircle className="absolute left-3 top-3 text-slate-500" size={18} />
                                    <select 
                                        required
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
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
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Mensagem</label>
                                <textarea 
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                                    placeholder="Descreva como podemos ajudar..."
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full py-4 rounded-xl shadow-lg shadow-indigo-500/20" 
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
