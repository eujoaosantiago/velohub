
import React, { useState, useEffect } from 'react';
import { AuthService } from '@/domains/auth/services/authService';
import { User, UserPermissions } from '@/shared/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Mail, UserPlus, CheckCircle2, Trash2, Lock, Copy, AlertTriangle, Settings, X, Shield, DollarSign, Users, BarChart3, Edit3, ShoppingCart, Share2, MessageCircle, Send, Loader } from 'lucide-react';
import { checkTeamLimit, getPlanLimits } from '@/shared/lib/plans';
import { isSupabaseConfigured, supabase } from '@/services/supabaseClient';

interface TeamInviteProps {
    user: User; // The current logged-in owner
}

export const TeamInvite: React.FC<TeamInviteProps> = ({ user }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [team, setTeam] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal & Success States
    const [inviteLink, setInviteLink] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [emailSentStatus, setEmailSentStatus] = useState<'sent' | 'failed' | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    // Permission Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [tempPermissions, setTempPermissions] = useState<UserPermissions | null>(null);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        const members = await AuthService.getTeam();
        setTeam(members);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setInviteLink('');
        setEmailSentStatus(null);
        
        try {
            // 1. Gera o link (Lógica interna do Auth)
            const generatedLink = await AuthService.inviteEmployee(email, name);
            setInviteLink(generatedLink); // Guarda o link para fallback

            // 2. Tenta enviar o email via Supabase Edge Function (Resend)
            if (isSupabaseConfigured() && supabase && generatedLink !== 'CREATED_LOCALLY') {
                try {
                    const { data, error } = await supabase.functions.invoke('send-invite', {
                        body: {
                            email,
                            name,
                            link: generatedLink,
                            storeName: user.storeName || 'Loja',
                            ownerName: user.name
                        }
                    });

                    if (error) throw error;
                    setEmailSentStatus('sent');
                } catch (mailError) {
                    console.error("Erro ao enviar email via Resend:", mailError);
                    setEmailSentStatus('failed'); // Falha silenciosa, mostra modal com link manual
                }
            } else {
                // Modo Local ou sem Supabase
                await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
                setEmailSentStatus('failed'); // Força modo manual
            }

            // 3. Mostra Modal
            setShowSuccessModal(true);
            
            // Limpa formulário
            setName('');
            setEmail('');
            loadTeam();
        } catch (err: any) {
            setErrorMsg(err.message || "Erro ao gerar convite.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        setInviteLink('');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Link copiado para a área de transferência!");
    };

    const handleResendInvite = async () => {
        setResendLoading(true);
        setResendMessage('');
        
        try {
            if (isSupabaseConfigured() && supabase) {
                const { data, error } = await supabase.functions.invoke('send-invite', {
                    body: {
                        email,
                        name,
                        link: inviteLink,
                        storeName: user.storeName || 'Loja',
                        ownerName: user.name
                    }
                });

                if (error) throw error;
                setResendMessage('Convite reenviado com sucesso!');
            }
        } catch (err: any) {
            setResendMessage('Erro ao reenviar: ' + (err.message || 'Tente novamente mais tarde'));
        } finally {
            setResendLoading(false);
            setTimeout(() => setResendMessage(''), 5000);
        }
    };

    const handleOpenPermissions = (member: User) => {
        setEditingUser(member);
        setTempPermissions(member.permissions || {
            view_costs: false,
            view_customers: true,
            view_analytics: false,
            edit_sale_price: false,
            manage_sales: true,
            share_vehicles: true
        });
    };

    const handlePermissionChange = (key: keyof UserPermissions) => {
        if (!tempPermissions) return;
        setTempPermissions({ ...tempPermissions, [key]: !tempPermissions[key] });
    };

    const handleSavePermissions = async () => {
        if (!editingUser || !tempPermissions) return;
        try {
            await AuthService.updateUserPermissions(editingUser.id, tempPermissions);
            setEditingUser(null);
            loadTeam();
            alert("Permissões atualizadas com sucesso!");
        } catch (e) {
            alert("Erro ao salvar permissões.");
        }
    };

    const limits = getPlanLimits(user);
    const canAddMember = checkTeamLimit(user, team.length);

    return (
        <div className="space-y-6 max-w-4xl">
            
            {/* --- MODAL DE SUCESSO --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-emerald-500/50 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden">
                        
                        {/* Fundo Decorativo */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pop-in">
                                {emailSentStatus === 'sent' ? <Mail size={40} /> : <CheckCircle2 size={40} />}
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {emailSentStatus === 'sent' ? 'Convite Enviado!' : 'Acesso Gerado!'}
                            </h3>
                            
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                {emailSentStatus === 'sent' 
                                    ? `Um email foi enviado para o funcionário com o link de acesso.`
                                    : `O convite foi gerado, mas não conseguimos enviar o e-mail automático. Por favor, envie o link abaixo manualmente.`
                                }
                            </p>

                            {/* Área de Link (Sempre visível como backup ou principal se falhar o email) */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    <span>Link de acesso (Cópia de segurança):</span>
                                </p>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={inviteLink} 
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
                                    />
                                    <button 
                                        onClick={handleCopyLink}
                                        className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors"
                                        title="Copiar Link"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

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
                                <Button onClick={handleCloseSuccess} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-transparent py-3">
                                    Concluir
                                </Button>
                                {emailSentStatus === 'sent' && (
                                    <button
                                        onClick={handleResendInvite}
                                        disabled={resendLoading}
                                        className="w-full py-3 px-4 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {resendLoading ? <Loader className="animate-spin" size={18} /> : <Mail size={18} />}
                                        {resendLoading ? 'Reenviando...' : 'Reenviar Convite'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE PERMISSÕES --- */}
            {editingUser && tempPermissions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                         <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">Acessos de {editingUser.name}</h3>
                                <p className="text-xs text-slate-400">Defina o que este funcionário pode ver.</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Toggle Items */}
                            {[
                                { key: 'view_costs', label: 'Ver Custos e Lucro', sub: 'Acesso ao preço de compra e margem.', icon: <DollarSign size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', checkColor: 'peer-checked:bg-emerald-500' },
                                { key: 'share_vehicles', label: 'Compartilhar Veículo', sub: 'Permite gerar e copiar link público.', icon: <Share2 size={18} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', checkColor: 'peer-checked:bg-indigo-500' },
                                { key: 'view_customers', label: 'Acesso a Clientes', sub: 'Ver menu de clientes e dados de contato.', icon: <Users size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', checkColor: 'peer-checked:bg-blue-500' },
                                { key: 'view_analytics', label: 'Ver Gráficos', sub: 'Dashboard financeiro e estatísticas.', icon: <BarChart3 size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10', checkColor: 'peer-checked:bg-purple-500' },
                                { key: 'edit_sale_price', label: 'Editar Preço de Venda', sub: 'Permite alterar o valor anunciado.', icon: <Edit3 size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10', checkColor: 'peer-checked:bg-amber-500' },
                            ].map((item: any) => (
                                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.label}</p>
                                            <p className="text-xs text-slate-500">{item.sub}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={(tempPermissions as any)[item.key]} 
                                            onChange={() => handlePermissionChange(item.key)} 
                                        />
                                        <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${item.checkColor}`}></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancelar</Button>
                            <Button onClick={handleSavePermissions}>Salvar Alterações</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white">Gestão de Equipe</h1>
                <p className="text-slate-400">Convide vendedores e defina exatamente o que eles podem ver.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- FORMULÁRIO DE CONVITE --- */}
                <Card title="Adicionar Membro">
                    <form onSubmit={handleInvite} className="space-y-4">
                        {!canAddMember ? (
                             <div className="p-4 bg-slate-800 border border-rose-500/30 rounded-lg text-sm mb-4 flex items-center gap-3">
                                <Lock size={20} className="text-rose-400 shrink-0" />
                                <div>
                                    <p className="font-bold text-white">Limite Atingido ({team.length}/{limits.maxTeamMembers})</p>
                                    <p className="text-xs text-slate-400">Faça upgrade para o plano Pro ou Enterprise para adicionar mais vendedores.</p>
                                </div>
                             </div>
                        ) : (
                             <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-300 mb-4 flex gap-2">
                                <UserPlus size={16} className="shrink-0 mt-0.5" />
                                <span>
                                    Preencha os dados abaixo. Enviaremos um email com o link de acesso.
                                </span>
                             </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Funcionário</label>
                            <input 
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={!canAddMember || isLoading}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600 transition-all"
                                placeholder="João Silva"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Email de Acesso</label>
                            <input 
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={!canAddMember || isLoading}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600 transition-all"
                                placeholder="joao@sualoja.com"
                            />
                        </div>

                        {errorMsg && (
                            <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded border border-rose-500/20 flex items-center gap-2">
                                <AlertTriangle size={16} /> {errorMsg}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={isLoading || !canAddMember} 
                            className="w-full py-4 shadow-lg shadow-indigo-500/20" 
                            icon={isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Send size={18} />}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Convite'}
                        </Button>
                    </form>
                </Card>

                {/* --- LISTA DE EQUIPE --- */}
                <Card title={`Equipe Ativa (${team.length}/${limits.maxTeamMembers})`}>
                    {team.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                <UserPlus size={32} className="opacity-30" />
                            </div>
                            <p>Nenhum funcionário cadastrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {team.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{member.name}</p>
                                            <p className="text-slate-500 text-xs">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleOpenPermissions(member)}
                                            className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                                            title="Configurar Acessos"
                                        >
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};



