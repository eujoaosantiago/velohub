
import React, { useEffect, useMemo, useState } from 'react';
import { Vehicle, Page, Customer } from '@/shared/types';
import { Card } from '@/components/ui/Card';
import { fetchCepInfo, formatCurrency, isValidCPF, maskCPF, maskPhone, parseISODate } from '@/shared/lib/utils';
import { Search, Phone, Mail, FileText, User, ShoppingBag, MessageCircle, Edit2, X, ChevronRight, Car, Lock, Crown, Users, MapPin, Loader, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useVelohub } from '@/shared/contexts/VelohubContext';
import { customerService } from '@/domains/customers/services/customerService';
import { getPlanLimits } from '@/shared/lib/plans';
import { ConfirmModal } from '@/components/ConfirmModal';

interface CustomerListProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (id: string) => void;
}

interface EditCustomerModalProps {
        customer: Customer;
    onClose: () => void;
        onSave: (customer: Customer) => Promise<void>;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ customer, onClose, onSave }) => {
    const [name, setName] = useState(customer.name);
    const [phone, setPhone] = useState(customer.phone);
    const [email, setEmail] = useState(customer.email || '');
    const [cpf, setCpf] = useState(customer.cpf);
    const [cep, setCep] = useState(customer.cep || '');
    const [street, setStreet] = useState(customer.street || '');
    const [number, setNumber] = useState(customer.number || '');
    const [neighborhood, setNeighborhood] = useState(customer.neighborhood || '');
    const [city, setCity] = useState(customer.city || '');
    const [state, setState] = useState(customer.state || '');
    const [isSaving, setIsSaving] = useState(false);
    const [cpfError, setCpfError] = useState('');
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const handleCepChange = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        const masked = digits.replace(/(\d{5})(\d{0,3})/, (_match, p1, p2) => (p2 ? `${p1}-${p2}` : p1));
        setCep(masked);
    };

    const handleCepBlur = async () => {
        const cleaned = cep.replace(/\D/g, '');
        if (cleaned.length !== 8) return;

        setIsLoadingCep(true);
        try {
            const info = await fetchCepInfo(cleaned);
            if (!info) return;
            setStreet((prev) => prev || info.street);
            setNeighborhood((prev) => prev || info.neighborhood);
            setCity((prev) => prev || info.city);
            setState((prev) => prev || info.state);
        } catch (error) {
            console.error('Erro ao buscar CEP', error);
        } finally {
            setIsLoadingCep(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (cpf && !isValidCPF(cpf)) {
            setCpfError('CPF invalido.');
            setIsSaving(false);
            return;
        }
        setCpfError('');
        const updatedCustomer: Customer = {
            ...customer,
            name,
            phone,
            email,
            cpf,
            cep,
            street,
            number,
            neighborhood,
            city,
            state
        };
        await onSave(updatedCustomer);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-white font-bold">Editar Cliente</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Nome Completo</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">CPF (Chave)</label>
                        <input
                            value={cpf}
                            onChange={e => setCpf(maskCPF(e.target.value))}
                            onBlur={() => setCpfError(cpf && !isValidCPF(cpf) ? 'CPF invalido.' : '')}
                            inputMode="numeric"
                            className={`w-full bg-slate-950 border rounded-lg p-2 text-white ${cpfError ? 'border-rose-500' : 'border-slate-700'}`}
                        />
                        {cpfError && (
                            <p className="text-xs text-rose-400 mt-1">{cpfError}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Telefone</label>
                        <input value={phone} onChange={e => setPhone(maskPhone(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">CEP</label>
                        <div className="relative">
                            {isLoadingCep ? (
                                <Loader className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={16} />
                            ) : (
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            )}
                            <input
                                value={cep}
                                onChange={e => handleCepChange(e.target.value)}
                                onBlur={handleCepBlur}
                                inputMode="numeric"
                                maxLength={9}
                                placeholder="00000-000"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-9 text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Logradouro</label>
                        <input value={street} onChange={e => setStreet(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-xs text-slate-400 block mb-1">Numero</label>
                            <input value={number} onChange={e => setNumber(e.target.value)} inputMode="numeric" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">Bairro</label>
                            <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">Cidade</label>
                            <input value={city} onChange={e => setCity(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-slate-400 block mb-1">UF</label>
                            <input value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-center" />
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button onClick={handleSave} className="w-full" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CustomerList: React.FC<CustomerListProps> = ({ vehicles, onSelectVehicle }) => {
  const [searchTerm, setSearchTerm] = useState('');
    const { user, navigateTo } = useVelohub();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const soldVehiclesCount = useMemo(() => vehicles.filter(v => v.status === 'sold').length, [vehicles]);

  useEffect(() => {
      const loadCustomers = async () => {
          if (!user?.storeId) return;
          setIsLoadingCustomers(true);
          try {
              console.log('🔄 Carregando clientes para store:', user.storeId);
              const data = await customerService.getCustomers(user.storeId);
              console.log('✅ Clientes carregados:', data.length);
              setCustomers(data);
          } catch (error) {
              console.error('❌ Erro ao buscar clientes:', error);
          } finally {
              setIsLoadingCustomers(false);
          }
      };

      loadCustomers();
  }, [user?.storeId, soldVehiclesCount]);

  const vehiclesByCustomerId = useMemo(() => {
      const map = new Map<string, Vehicle[]>();
      vehicles.filter(v => v.status === 'sold').forEach(v => {
          if (!v.customerId) return;
          const list = map.get(v.customerId) || [];
          if (!list.find(item => item.id === v.id)) {
              list.push(v);
              map.set(v.customerId, list);
          }
      });
      return map;
  }, [vehicles]);

  const filteredCustomers = customers.filter(c => {
      const term = searchTerm.toLowerCase();
      return (
          c.name.toLowerCase().includes(term) ||
          c.cpf.includes(term) ||
          c.phone.includes(term)
      );
  });

  // --- LIMIT LOGIC ---
  const planLimits = user ? getPlanLimits(user) : { maxCustomers: 10 };
  const maxCustomers = planLimits.maxCustomers;
  
  const displayedCustomers = filteredCustomers.slice(0, maxCustomers);
  const hiddenCustomersCount = filteredCustomers.length - displayedCustomers.length;

  const showToast = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  };

  const handleWhatsApp = (phone: string, customerName: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      const firstName = customerName.split(' ')[0];
      const myName = user?.name.split(' ')[0] || 'Atendimento';
      const storeName = user?.storeName || 'nossa loja';
      const messages = [
          `Olá ${firstName}, tudo bem? Aqui é ${myName} da ${storeName}. Gostaria de falar sobre seu veículo.`,
          `Oi ${firstName}, ${myName} falando pela ${storeName}. Como está o carro novo?`,
          `Olá ${firstName}, passando para agradecer a preferência na ${storeName}. Qualquer dúvida, estou à disposição! Att, ${myName}.`
      ];
      const text = messages[Math.floor(Math.random() * messages.length)];
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
      try {
          await customerService.updateCustomer(updatedCustomer);
          const data = await customerService.getCustomers(updatedCustomer.storeId);
          setCustomers(data);
          showToast("Cadastro atualizado com sucesso!", "success");
      } catch (e) {
          console.error(e);
          showToast("Erro ao atualizar cliente.", "error");
      }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
      setConfirmModal({
          isOpen: true,
          title: 'Excluir cliente?',
          message: `Tem certeza que deseja excluir ${customer.name} (CPF: ${customer.cpf})? Esta ação não pode ser desfeita.`,
          variant: 'danger',
          confirmText: 'Excluir Cliente',
          onConfirm: async () => {
              try {
                  await customerService.deleteCustomer(customer.id);
                  const data = await customerService.getCustomers(customer.storeId);
                  setCustomers(data);
                  showToast("Cliente excluído com sucesso!", "success");
              } catch (e) {
                  console.error(e);
                  showToast("Erro ao excluir cliente.", "error");
              } finally {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }
          }
      });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slide-in-top pointer-events-none ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}
      
      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          confirmText={confirmModal.confirmText}
      />
      
      {editingCustomer && (
          <EditCustomerModal 
            customer={editingCustomer} 
            onClose={() => setEditingCustomer(null)} 
            onSave={handleUpdateCustomer} 
          />
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Carteira de Clientes</h1>
        <p className="text-slate-400">Base de contatos gerada automaticamente a partir das vendas.</p>
      </div>

      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingCustomers ? (
                        <div className="col-span-full py-12 text-center text-slate-500">
                                <Loader className="mx-auto mb-3 animate-spin" size={24} />
                                <p>Carregando clientes...</p>
                        </div>
                ) : displayedCustomers.length > 0 ? displayedCustomers.map((c, idx) => {
            const history = vehiclesByCustomerId.get(c.id) || [];
            const totalSpent = history.reduce((acc, v) => acc + (v.soldPrice || 0), 0);
            return (
            <Card key={idx} className="hover:border-slate-700 transition-colors flex flex-col justify-between group relative">
                <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button 
                        onClick={() => setEditingCustomer(c)} 
                        className="text-slate-500 hover:text-indigo-400 transition-colors p-2"
                        title="Editar Cliente"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteCustomer(c)} 
                        className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                        title="Excluir Cliente"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div>
                    <div className="flex items-start justify-between mb-4 pr-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-white font-bold truncate max-w-[150px]">{c.name}</h3>
                                <p className="text-xs text-slate-400">
                                    Cliente desde {history[0] ? (parseISODate(history[0].soldDate)?.getFullYear() || '--') : '--'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Phone size={14} className="text-slate-500" />
                            {c.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <FileText size={14} className="text-slate-500" />
                            {c.cpf}
                        </div>
                        {c.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
                                <Mail size={14} className="text-slate-500 shrink-0" />
                                {c.email}
                            </div>
                        )}
                        {(c.street || c.city || c.state || c.cep) && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <MapPin size={14} className="text-slate-500" />
                                <span className="truncate">
                                    {[
                                        c.street,
                                        c.number ? `nº ${c.number}` : '',
                                        c.neighborhood,
                                        c.city ? `${c.city}${c.state ? `/${c.state}` : ''}` : '',
                                        c.cep ? `CEP ${c.cep}` : ''
                                    ].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Histórico</span>
                        <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            Total: {formatCurrency(totalSpent)}
                        </span>
                    </div>
                    <div className="space-y-2 mb-4 bg-slate-950/50 p-2 rounded-lg">
                        {history.map(v => (
                            <div 
                                key={v.id} 
                                className="flex justify-between items-center text-sm text-slate-400 hover:bg-slate-800/50 p-1.5 rounded cursor-pointer transition-colors group/item"
                                onClick={() => onSelectVehicle && onSelectVehicle(v.id)}
                                title="Ver Ficha do Veículo"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Car size={14} className="shrink-0 text-slate-600 group-hover/item:text-indigo-400" />
                                    <span className="truncate group-hover/item:text-white transition-colors">{v.make} {v.model}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-500 text-xs">{v.year}</span>
                                    <ChevronRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <Button 
                        onClick={() => handleWhatsApp(c.phone, c.name)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-transparent flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={18} />
                        Conversar no WhatsApp
                    </Button>
                </div>
            </Card>
        );
        }) : (
            <div className="col-span-full py-12 text-center text-slate-500">
                <User size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente encontrado.</p>
                <p className="text-sm">Os clientes aparecem aqui automaticamente após uma venda.</p>
            </div>
        )}

        {/* LOCKED CARD (UPSELL) */}
        {hiddenCustomersCount > 0 && (
            <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                <div className="absolute inset-0 bg-indigo-500/5 blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                        <Lock size={32} className="text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">+{hiddenCustomersCount} Clientes Ocultos</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs">
                        Sua carteira de clientes cresceu! O plano Gratuito exibe apenas os 10 mais recentes.
                    </p>
                    <Button 
                        onClick={() => navigateTo(Page.PROFILE)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        icon={<Crown size={16} />}
                    >
                        Desbloquear CRM Completo
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};



