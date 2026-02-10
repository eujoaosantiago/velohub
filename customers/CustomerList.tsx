
import React, { useState } from 'react';
import { Vehicle, Buyer, Page } from '../types';
import { Card } from '../components/ui/Card';
import { formatCurrency, maskCPF, maskPhone } from '../lib/utils';
import { Search, Phone, Mail, FileText, User, ShoppingBag, MessageCircle, Edit2, X, ChevronRight, Car, Lock, Crown, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useVelohub } from '../contexts/VelohubContext';
import { ApiService } from '../services/api';
import { getPlanLimits } from '../lib/plans';

interface CustomerListProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (id: string) => void;
}

interface EditCustomerModalProps {
    customer: { buyer: Buyer, vehicles: Vehicle[] };
    onClose: () => void;
    onSave: (oldCpf: string, newBuyer: Buyer) => Promise<void>;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ customer, onClose, onSave }) => {
    const [name, setName] = useState(customer.buyer.name);
    const [phone, setPhone] = useState(customer.buyer.phone);
    const [email, setEmail] = useState(customer.buyer.email || '');
    const [cpf, setCpf] = useState(customer.buyer.cpf);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const updatedBuyer: Buyer = {
            ...customer.buyer,
            name,
            phone,
            email,
            cpf
        };
        await onSave(customer.buyer.cpf, updatedBuyer);
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
                        <input value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} inputMode="numeric" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Telefone</label>
                        <input value={phone} onChange={e => setPhone(maskPhone(e.target.value))} inputMode="tel" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" />
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
  const { user, refreshData, navigateTo } = useVelohub();
  const [editingCustomer, setEditingCustomer] = useState<{ buyer: Buyer, vehicles: Vehicle[] } | null>(null);

  // Group customers logic
  const customersMap = new Map<string, { buyer: Buyer, vehicles: Vehicle[], totalSpent: number }>();

  vehicles.filter(v => v.status === 'sold' && v.buyer).forEach(v => {
    // Key priority: CPF -> Phone -> Name
    const key = v.buyer!.cpf?.replace(/\D/g, '') || v.buyer!.phone?.replace(/\D/g, '') || v.buyer!.name.trim().toLowerCase();
    
    if (!customersMap.has(key)) {
        customersMap.set(key, { 
            buyer: v.buyer!, 
            vehicles: [], 
            totalSpent: 0 
        });
    }
    const customerRecord = customersMap.get(key)!;
    if (!customerRecord.vehicles.find(veh => veh.id === v.id)) {
        customerRecord.vehicles.push(v);
        customerRecord.totalSpent += v.soldPrice || 0;
    }
  });

  const customers = Array.from(customersMap.values());

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
        c.buyer.name.toLowerCase().includes(term) ||
        c.buyer.cpf.includes(term) ||
        c.buyer.phone.includes(term)
    );
  });

  // --- LIMIT LOGIC ---
  const planLimits = user ? getPlanLimits(user) : { maxCustomers: 10 };
  const maxCustomers = planLimits.maxCustomers;
  
  const displayedCustomers = filteredCustomers.slice(0, maxCustomers);
  const hiddenCustomersCount = filteredCustomers.length - displayedCustomers.length;

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

  const handleUpdateCustomer = async (oldCpf: string, newBuyer: Buyer) => {
      const targetVehicles = customersMap.get(oldCpf.replace(/\D/g, ''))?.vehicles || [];
      
      try {
          for (const v of targetVehicles) {
              const updatedVehicle = { ...v, buyer: newBuyer };
              await ApiService.updateVehicle(updatedVehicle);
          }
          await refreshData();
          alert("Cadastro atualizado com sucesso!");
      } catch (e) {
          console.error(e);
          alert("Erro ao atualizar cliente.");
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
        {displayedCustomers.length > 0 ? displayedCustomers.map((c, idx) => (
            <Card key={idx} className="hover:border-slate-700 transition-colors flex flex-col justify-between group relative">
                <button 
                    onClick={() => setEditingCustomer(c)} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-indigo-400 transition-colors p-2"
                    title="Editar Cliente"
                >
                    <Edit2 size={16} />
                </button>

                <div>
                    <div className="flex items-start justify-between mb-4 pr-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                {c.buyer.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-white font-bold truncate max-w-[150px]">{c.buyer.name}</h3>
                                <p className="text-xs text-slate-400">Cliente desde {new Date(c.vehicles[0].soldDate!).getFullYear()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Phone size={14} className="text-slate-500" />
                            {c.buyer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <FileText size={14} className="text-slate-500" />
                            {c.buyer.cpf}
                        </div>
                        {c.buyer.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
                                <Mail size={14} className="text-slate-500 shrink-0" />
                                {c.buyer.email}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Histórico</span>
                        <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            Total: {formatCurrency(c.totalSpent)}
                        </span>
                    </div>
                    <div className="space-y-2 mb-4 bg-slate-950/50 p-2 rounded-lg">
                        {c.vehicles.map(v => (
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
                        onClick={() => handleWhatsApp(c.buyer.phone, c.buyer.name)}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={18} />
                        Conversar no WhatsApp
                    </Button>
                </div>
            </Card>
        )) : (
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
