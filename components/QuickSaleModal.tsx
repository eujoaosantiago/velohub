
import React, { useState } from 'react';
import { Vehicle, Buyer } from '../types';
import { Button } from './ui/Button';
import { X, DollarSign, User, FileText, Phone, Calendar, ArrowRightLeft, ShieldCheck, Printer, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
import { isValidCPF, formatCurrency, maskCurrencyInput, parseCurrencyInput, maskCPF, maskPhone } from '../lib/utils';
import { sanitizeInput } from '../lib/security';
import { ContractModal } from './ContractModal';
import { AuthService } from '../services/auth';
import { Confetti } from './ui/Confetti';

interface QuickSaleModalProps {
  vehicle: Vehicle;
  allVehicles?: Vehicle[]; // To search previous customers
  onClose: () => void;
  onConfirmSale: (vehicleId: string, saleData: Partial<Vehicle>, tradeIn?: Vehicle) => Promise<void>;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({ vehicle, allVehicles = [], onClose, onConfirmSale }) => {
  
  // --- LÓGICA DE PRÉ-PREENCHIMENTO DE COMISSÃO ---
  const calculateDefaultCommission = () => {
      if (vehicle.saleCommission && vehicle.saleCommission > 0) return vehicle.saleCommission;
      return vehicle.expenses
          .filter(e => e.category === 'salary')
          .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getDefaultCommissionTo = () => {
      if (vehicle.saleCommissionTo) return vehicle.saleCommissionTo;
      // Pega o nome do funcionário da última despesa de salário lançada
      const lastSalaryExpense = vehicle.expenses.filter(e => e.category === 'salary').pop();
      return lastSalaryExpense?.employeeName || '';
  };

  // Inicializa com o preço esperado ou vazio
  const [price, setPrice] = useState(vehicle.expectedSalePrice ? maskCurrencyInput((vehicle.expectedSalePrice * 100).toString()) : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix / Transferência');
  const [commission, setCommission] = useState(maskCurrencyInput((calculateDefaultCommission() * 100).toString())); 
  const [commissionTo, setCommissionTo] = useState(getDefaultCommissionTo()); 
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Warranty States
  const [warrantyTime, setWarrantyTime] = useState('90 dias');
  const [warrantyKm, setWarrantyKm] = useState('3.000 km');

  // Trade-in States
  const [tradeInMake, setTradeInMake] = useState('');
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInYear, setTradeInYear] = useState(new Date().getFullYear().toString());
  const [tradeInValue, setTradeInValue] = useState('');
  const [tradeInPlate, setTradeInPlate] = useState('');

  // Success State
  const [saleComplete, setSaleComplete] = useState(false);
  const [showContract, setShowContract] = useState(false); // New state to handle manual contract viewing
  const user = AuthService.getCurrentUser();

  const handlePriceChange = (val: string) => {
      setPrice(maskCurrencyInput(val));
  };

  const handleCommissionChange = (val: string) => {
      setCommission(maskCurrencyInput(val));
  };

  const handleTradeInValueChange = (val: string) => {
      setTradeInValue(maskCurrencyInput(val));
  };

   const maskPlate = (value: string) => {
    const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 3) {
        // Simple logic for display
        return v.replace(/^([A-Z]{3})(\d)/, '$1-$2').slice(0, 8);
    }
    return v.slice(0, 7);
  };

  const handleCpfChange = (val: string) => {
      const masked = maskCPF(val);
      setBuyerCpf(masked);

      // Auto-fill logic
      if (masked.length === 14) {
          const cleanCpf = masked.replace(/\D/g, '');
          const existingCustomer = allVehicles
              .filter(v => v.buyer?.cpf?.replace(/\D/g, '') === cleanCpf)
              .sort((a, b) => new Date(b.soldDate || '').getTime() - new Date(a.soldDate || '').getTime())[0];

          if (existingCustomer && existingCustomer.buyer) {
              setBuyerName(existingCustomer.buyer.name);
              setBuyerPhone(existingCustomer.buyer.phone);
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
          let saleValue = parseCurrencyInput(price);
          const tradeInVal = parseCurrencyInput(tradeInValue);

          if (saleValue <= 0 && paymentMethod !== 'Troca + Volta') {
              throw new Error('O valor da venda é obrigatório.');
          }
          if (!buyerName.trim()) {
              throw new Error('Nome do comprador é obrigatório.');
          }
          // Validação básica de CPF se preenchido
          if (buyerCpf) {
              if (!isValidCPF(buyerCpf)) {
                  throw new Error('CPF inválido.');
              }
          }

          // --- LOGICA DE SOMA (Troca + Volta) ---
          // Se for troca, assume que o input principal é o valor da "Volta" (Dinheiro)
          // O valor total da venda será: Volta + Valor da Troca.
          let finalSalePrice = saleValue;
          if (paymentMethod === 'Troca + Volta') {
              finalSalePrice = saleValue + tradeInVal;
          }

          // Validação da Troca
          let tradeInVehicle: Vehicle | undefined;
          if (paymentMethod === 'Troca + Volta') {
               if (!tradeInMake || !tradeInModel || !tradeInVal) {
                   throw new Error('Preencha os dados do veículo de troca (Marca, Modelo e Valor).');
               }

               tradeInVehicle = {
                    id: Math.random().toString(), 
                    storeId: vehicle.storeId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    make: sanitizeInput(tradeInMake),
                    model: sanitizeInput(tradeInModel),
                    version: 'Entrada via Troca',
                    year: parseInt(tradeInYear),
                    plate: maskPlate(tradeInPlate),
                    km: 0,
                    fuel: 'Flex',
                    transmission: 'Automático',
                    color: '',
                    status: 'available',
                    purchasePrice: tradeInVal,
                    purchaseDate: date,
                    expectedSalePrice: tradeInVal * 1.2, 
                    fipePrice: 0,
                    photos: [],
                    expenses: []
               };
          }

          const buyer: Buyer = {
              name: sanitizeInput(buyerName),
              cpf: sanitizeInput(buyerCpf),
              phone: sanitizeInput(buyerPhone)
          };

          const saleData: Partial<Vehicle> = {
              status: 'sold',
              soldPrice: finalSalePrice, // Save total price
              soldDate: date,
              paymentMethod,
              saleCommission: commission ? parseCurrencyInput(commission) : 0,
              saleCommissionTo: commissionTo, // Save employee name
              buyer,
              warrantyDetails: {
                  time: warrantyTime,
                  km: warrantyKm
              }
          };

          // Adiciona info de troca no registro do carro vendido
          if (paymentMethod === 'Troca + Volta') {
              saleData.tradeInInfo = {
                  make: sanitizeInput(tradeInMake),
                  model: sanitizeInput(tradeInModel),
                  plate: maskPlate(tradeInPlate),
                  value: tradeInVal
              };
          }

          // AWAIT the parent action to ensure DB is updated properly
          await onConfirmSale(vehicle.id, saleData, tradeInVehicle);
          setSaleComplete(true);
      } catch (err: any) {
          setError(err.message || "Erro ao salvar. Tente novamente.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // Se a venda estiver completa e o usuário pediu o contrato
  if (saleComplete && showContract) {
      const totalSoldPrice = paymentMethod === 'Troca + Volta' ? (parseCurrencyInput(price) + parseCurrencyInput(tradeInValue)) : parseCurrencyInput(price);
      return (
          <ContractModal 
                vehicle={{
                    ...vehicle, 
                    status: 'sold', 
                    buyer: { name: buyerName, cpf: buyerCpf, phone: buyerPhone }, 
                    soldPrice: totalSoldPrice,
                    paymentMethod, 
                    warrantyDetails: { time: warrantyTime, km: warrantyKm }
                }} 
                storeName={user?.storeName || 'Loja'} 
                storeCnpj={user?.cnpj}
                storeCity={user?.city}
                storeState={user?.state}
                onClose={onClose} 
            />
      );
  }

  // Helper to check CPF state visual
  const isCpfValid = buyerCpf.length === 14 && isValidCPF(buyerCpf);
  const isCpfInvalid = buyerCpf.length === 14 && !isValidCPF(buyerCpf);
  const hasCommissionInput = parseCurrencyInput(commission) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
        {saleComplete && <Confetti />}
        
        <div className={`bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative my-8 transition-all ${saleComplete ? 'animate-pop-in border-emerald-500/50 shadow-emerald-500/10' : ''}`}>
            {!saleComplete && (
                <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 backdrop-blur-md z-10 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-white">
                            Fechar Venda
                        </h3>
                        <p className="text-xs text-slate-400">{vehicle.make} {vehicle.model} - {vehicle.plate}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}

            {saleComplete ? (
                // SUCCESS STATE VIEW
                <div className="p-8 text-center relative overflow-hidden rounded-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
                    
                    <div className="relative">
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle size={40} className="drop-shadow-lg" />
                        </div>
                        
                        {/* Shine effect passing through */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                             <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shine"></div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Venda Realizada!</h2>
                    <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                        O veículo foi marcado como vendido e o estoque foi atualizado.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button onClick={() => setShowContract(true)} icon={<Printer size={18} />} className="w-full py-4 text-lg shadow-lg shadow-indigo-500/20">
                            Imprimir Contrato
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Fechar
                        </Button>
                    </div>
                </div>
            ) : (
                // FORM VIEW
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-medium text-indigo-300 mb-1 uppercase tracking-wider">
                                {paymentMethod === 'Troca + Volta' ? 'Valor em Dinheiro (Volta)' : 'Valor Final'}
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    inputMode="decimal"
                                    autoFocus
                                    value={price}
                                    onChange={(e) => handlePriceChange(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-medium text-indigo-300 mb-1 uppercase tracking-wider">Comissão (R$)</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    inputMode="decimal"
                                    value={commission}
                                    onChange={(e) => handleCommissionChange(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* EMPLOYEE NAME INPUT (SHOWN IF COMMISSION > 0) */}
                    {hasCommissionInput && (
                        <div className="animate-fade-in bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                            <label className="block text-xs font-medium text-slate-300 mb-1">Para quem é a comissão?</label>
                            <input 
                                type="text" 
                                value={commissionTo} 
                                onChange={e => setCommissionTo(e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                placeholder="Nome do Vendedor"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Data da Venda</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Pagamento</label>
                            <select 
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                            >
                                <option>Pix / Transferência</option>
                                <option>Dinheiro</option>
                                <option>Financiamento</option>
                                <option>Troca + Volta</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Garantia (Tempo)</label>
                            <input 
                                type="text"
                                value={warrantyTime}
                                onChange={e => setWarrantyTime(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                placeholder="Ex: 90 dias"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Garantia (KM)</label>
                            <input 
                                type="text"
                                value={warrantyKm}
                                onChange={e => setWarrantyKm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                placeholder="Ex: 3.000 km"
                            />
                        </div>
                    </div>

                    {paymentMethod === 'Troca + Volta' && (
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 animate-fade-in">
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <ArrowRightLeft size={16} className="text-indigo-400"/> Veículo de Entrada
                            </h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-1">
                                    <label className="text-xs text-slate-400">Marca</label>
                                    <input type="text" value={tradeInMake} onChange={e => setTradeInMake(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none" placeholder="Ex: Honda"/>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs text-slate-400">Modelo</label>
                                    <input type="text" value={tradeInModel} onChange={e => setTradeInModel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none" placeholder="Ex: Civic"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Ano</label>
                                    <input type="number" inputMode="numeric" value={tradeInYear} onChange={e => setTradeInYear(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Placa</label>
                                    <input type="text" value={tradeInPlate} onChange={e => setTradeInPlate(maskPlate(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none uppercase"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Valor de Avaliação (Entrada)</label>
                                <input 
                                    type="text" 
                                    inputMode="decimal"
                                    value={tradeInValue} 
                                    onChange={e => handleTradeInValueChange(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm font-bold focus:ring-indigo-500 outline-none"
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-800">
                        <h4 className="text-sm font-semibold text-white mb-3">Dados do Comprador</h4>
                        <div className="space-y-3">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="text"
                                    value={buyerName}
                                    onChange={e => setBuyerName(e.target.value)}
                                    placeholder="Nome Completo"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input 
                                        type="text"
                                        value={buyerCpf}
                                        onChange={e => handleCpfChange(e.target.value)}
                                        placeholder="CPF"
                                        maxLength={14}
                                        inputMode="numeric"
                                        className={`w-full bg-slate-950 border rounded-lg pl-10 pr-8 py-2.5 text-white text-sm focus:ring-2 outline-none transition-colors ${
                                            isCpfInvalid ? 'border-rose-500 focus:ring-rose-500' : 
                                            isCpfValid ? 'border-emerald-500 focus:ring-emerald-500' : 'border-slate-700 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {isCpfValid && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />}
                                    {isCpfInvalid && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500" size={16} />}
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input 
                                        type="text"
                                        value={buyerPhone}
                                        onChange={e => setBuyerPhone(maskPhone(e.target.value))}
                                        placeholder="(DDD) Telefone"
                                        inputMode="tel"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                            {isSubmitting ? 'Salvando...' : 'Confirmar Venda'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    </div>
  );
};
