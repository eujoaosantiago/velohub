
import React, { useState, useEffect } from 'react';
import { Vehicle, Buyer } from '../types';
import { Button } from './ui/Button';
import { X, User, FileText, Phone, Calendar, ArrowRightLeft, ShieldCheck, Printer, CheckCircle, AlertCircle } from 'lucide-react';
import { isValidCPF, formatCurrency, maskCurrencyInput, parseCurrencyInput, maskCPF, maskPhone, getBrazilDateISO, parseISODate, fetchCepInfo } from '../lib/utils';
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
  const [date, setDate] = useState(getBrazilDateISO()); // Corrigido para data local BR
  const [buyerName, setBuyerName] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
    const [buyerCep, setBuyerCep] = useState('');
    const [buyerStreet, setBuyerStreet] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [buyerNeighborhood, setBuyerNeighborhood] = useState('');
    const [buyerCity, setBuyerCity] = useState('');
    const [buyerState, setBuyerState] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix / Transferência');
    const [paymentAmountText, setPaymentAmountText] = useState('');
    const [paymentMethodDetail, setPaymentMethodDetail] = useState('');
    const [paymentDateDetail, setPaymentDateDetail] = useState('');
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
    const [tradeInVersion, setTradeInVersion] = useState('');
    const [tradeInYearFab, setTradeInYearFab] = useState(new Date().getFullYear().toString());
    const [tradeInYearModel, setTradeInYearModel] = useState(new Date().getFullYear().toString());
    const [tradeInPlate, setTradeInPlate] = useState('');
    const [tradeInRenavam, setTradeInRenavam] = useState('');
    const [tradeInChassis, setTradeInChassis] = useState('');
    const [tradeInColor, setTradeInColor] = useState('');
    const [tradeInKm, setTradeInKm] = useState('');
    const [tradeInValue, setTradeInValue] = useState('');

  // Success State
  const [saleComplete, setSaleComplete] = useState(false);
  const [showContract, setShowContract] = useState(false); // New state to handle manual contract viewing
  const user = AuthService.getCurrentUser();

    const handleBuyerCepBlur = async () => {
        try {
            const info = await fetchCepInfo(buyerCep);
            if (!info) return;
            setBuyerStreet(prev => prev || info.street);
            setBuyerNeighborhood(prev => prev || info.neighborhood);
            setBuyerCity(prev => prev || info.city);
            setBuyerState(prev => prev || info.state);
        } catch (err) {
            console.error('CEP lookup failed', err);
        }
    };

  // Atualiza data para HOJE sempre que o modal abrir, ganhar foco ou periodicamente
  useEffect(() => {
    const updateDate = () => {
      const newDate = getBrazilDateISO();
      console.log('📅 QuickSaleModal - Atualizando data:', newDate, new Date().toISOString());
      setDate(newDate);
    };
    
    // Atualiza quando monta ou vehicle.id muda
    updateDate();
    
    // Atualiza quando a aba ganha foco (usuário volta para o navegador)
    const handleFocus = () => updateDate();
    window.addEventListener('focus', handleFocus);

    // Atualiza a cada 5 minutos (garante data correta mesmo se ficar aberto por horas)
    const interval = setInterval(updateDate, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [vehicle.id]);

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
              .sort((a, b) => (parseISODate(b.soldDate)?.getTime() || 0) - (parseISODate(a.soldDate)?.getTime() || 0))[0];

          if (existingCustomer && existingCustomer.buyer) {
              setBuyerName(existingCustomer.buyer.name);
              setBuyerPhone(existingCustomer.buyer.phone);
              setBuyerCep(existingCustomer.buyer.cep || '');
              setBuyerStreet(existingCustomer.buyer.street || '');
              setBuyerNumber(existingCustomer.buyer.number || '');
              setBuyerNeighborhood(existingCustomer.buyer.neighborhood || '');
              setBuyerCity(existingCustomer.buyer.city || '');
              setBuyerState(existingCustomer.buyer.state || '');
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
          if (!buyerCep.trim() || !buyerStreet.trim() || !buyerNumber.trim() || !buyerNeighborhood.trim() || !buyerCity.trim() || !buyerState.trim()) {
              throw new Error('Endereço do comprador é obrigatório (CEP, logradouro, número, bairro, cidade e UF).');
          }
          // Validação básica de CPF se preenchido
          if (buyerCpf) {
              if (!isValidCPF(buyerCpf)) {
                  throw new Error('CPF inválido.');
              }
          }
          if (!paymentAmountText.trim() || !paymentMethodDetail.trim() || !paymentDateDetail.trim()) {
              throw new Error('Detalhes de pagamento são obrigatórios (valor por extenso, forma e data).');
          }

          // --- LÓGICA DE SOMA (Troca + Volta) ---
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
               if (!tradeInVersion || !tradeInYearFab || !tradeInYearModel || !tradeInPlate || !tradeInRenavam || !tradeInChassis || !tradeInColor || !tradeInKm) {
                   throw new Error('Preencha todos os dados do veículo de troca (versão, anos, placa, renavam, chassi, cor e KM).');
               }

               tradeInVehicle = {
                    id: Math.random().toString(), 
                    storeId: vehicle.storeId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    make: sanitizeInput(tradeInMake),
                    model: sanitizeInput(tradeInModel),
                    version: sanitizeInput(tradeInVersion) || 'Entrada via Troca',
                    year: parseInt(tradeInYearModel) || parseInt(tradeInYearFab) || new Date().getFullYear(),
                    plate: maskPlate(tradeInPlate),
                    km: parseInt(tradeInKm) || 0,
                    fuel: 'Flex',
                    transmission: 'Automático',
                    color: sanitizeInput(tradeInColor),
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
              phone: sanitizeInput(buyerPhone),
              cep: sanitizeInput(buyerCep),
              street: sanitizeInput(buyerStreet),
              number: sanitizeInput(buyerNumber),
              neighborhood: sanitizeInput(buyerNeighborhood),
              city: sanitizeInput(buyerCity),
              state: sanitizeInput(buyerState)
          };

          // --- LÓGICA DE COMISSÃO COMO DESPESA REAL ---
          const commissionVal = parseCurrencyInput(commission);
          let updatedExpenses = [...vehicle.expenses];

          // Evita duplicar se já houver salário/comissão lançada
          const existingCommissionSum = updatedExpenses
              .filter(e => e.category === 'salary')
              .reduce((acc, e) => acc + e.amount, 0);

          const commissionDifference = commissionVal - existingCommissionSum;

          if (commissionDifference > 0.01) {
              updatedExpenses.push({
                  id: Math.random().toString(),
                  vehicleId: vehicle.id,
                  description: 'Comissão de Venda',
                  amount: commissionDifference,
                  date,
                  category: 'salary',
                  employeeName: commissionTo || undefined
              });
          }

          const saleData: Partial<Vehicle> = {
              status: 'sold',
              soldPrice: finalSalePrice, // Save total price
              soldDate: date,
              paymentMethod,
              paymentDetails: {
                  amountText: sanitizeInput(paymentAmountText),
                  methodDetail: sanitizeInput(paymentMethodDetail),
                  paymentDateDetail: sanitizeInput(paymentDateDetail)
              },
              // Comissão agora entra como despesa (salary) para refletir no lucro real
              saleCommission: 0,
              saleCommissionTo: commissionTo, // Save employee name
              buyer,
              warrantyDetails: {
                  time: warrantyTime,
                  km: warrantyKm
              },
              expenses: updatedExpenses
          };
          
          console.log('💾 QuickSaleModal - Salvando venda com data:', date, '| Date atual:', new Date().toISOString());

          // Adiciona info de troca no registro do carro vendido
          if (paymentMethod === 'Troca + Volta') {
              saleData.tradeInInfo = {
                  make: sanitizeInput(tradeInMake),
                  model: sanitizeInput(tradeInModel),
                  version: sanitizeInput(tradeInVersion),
                  yearFab: sanitizeInput(tradeInYearFab),
                  yearModel: sanitizeInput(tradeInYearModel),
                  plate: maskPlate(tradeInPlate),
                  renavam: sanitizeInput(tradeInRenavam),
                  chassis: sanitizeInput(tradeInChassis),
                  color: sanitizeInput(tradeInColor),
                  km: sanitizeInput(tradeInKm),
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
                    buyer: { 
                        name: buyerName, 
                        cpf: buyerCpf, 
                        phone: buyerPhone,
                        cep: buyerCep,
                        street: buyerStreet,
                        number: buyerNumber,
                        neighborhood: buyerNeighborhood,
                        city: buyerCity,
                        state: buyerState
                    }, 
                    soldPrice: totalSoldPrice,
                    paymentMethod, 
                    paymentDetails: {
                        amountText: paymentAmountText,
                        methodDetail: paymentMethodDetail,
                        paymentDateDetail: paymentDateDetail
                    },
                    warrantyDetails: { time: warrantyTime, km: warrantyKm },
                    tradeInInfo: paymentMethod === 'Troca + Volta' ? {
                        make: tradeInMake,
                        model: tradeInModel,
                        version: tradeInVersion,
                        yearFab: tradeInYearFab,
                        yearModel: tradeInYearModel,
                        plate: tradeInPlate,
                        renavam: tradeInRenavam,
                        chassis: tradeInChassis,
                        color: tradeInColor,
                        km: tradeInKm,
                        value: parseCurrencyInput(tradeInValue)
                    } : undefined
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
        
        <div className={`bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative my-8 transition-all max-h-[90vh] flex flex-col overflow-hidden ${saleComplete ? 'animate-pop-in border-emerald-500/50 shadow-emerald-500/10' : ''}`}>
            {!saleComplete && (
            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center rounded-t-2xl shrink-0">
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
                                <div className="flex-1 overflow-y-auto">
                                    {/* Vehicle Photo Carousel */}
                                    {vehicle.photos && vehicle.photos.length > 0 && (
                                        <div className="relative w-full h-48 bg-slate-800 overflow-hidden">
                                            <img 
                                                src={vehicle.photos[0]} 
                                                alt={`${vehicle.make} ${vehicle.model}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {vehicle.photos.length > 1 && (
                                                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                                                    1 / {vehicle.photos.length}
                                                </div>
                                            )}
                                        </div>
                                    )}

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
                    <p className="text-slate-400 mb-6 max-w-xs mx-auto text-sm">
                        {vehicle.make} {vehicle.model} - {vehicle.plate}
                    </p>

                    {/* Sale Details Summary */}
                    <div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/50 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Valor Final:</span>
                            <span className="font-bold text-emerald-400">{formatCurrency(paymentMethod === 'Troca + Volta' ? (parseCurrencyInput(price) + parseCurrencyInput(tradeInValue)) : parseCurrencyInput(price))}</span>
                        </div>
                        {hasCommissionInput && (
                            <div className="flex justify-between items-center text-sm border-t border-slate-700/30 pt-2">
                                <span className="text-slate-400">Comissão:</span>
                                <span className="font-bold text-indigo-400">{formatCurrency(parseCurrencyInput(commission))}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm border-t border-slate-700/30 pt-2">
                            <span className="text-slate-400">Data:</span>
                            <span className="text-white">{new Date(date).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>

                    <p className="text-slate-400 mb-8 text-sm">
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
                </div>
            ) : (
                // FORM VIEW
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">
                                {paymentMethod === 'Troca + Volta' ? (
                                    <>
                                        <span className="md:hidden">Valor (Volta)</span>
                                        <span className="hidden md:inline">Valor em Dinheiro (Volta)</span>
                                    </>
                                ) : (
                                    'Valor Final'
                                )}
                            </label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                autoFocus
                                value={price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                placeholder="R$ 0,00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Comissão</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={commission}
                                onChange={(e) => handleCommissionChange(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                placeholder="R$ 0,00"
                            />
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
                            <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Data da Venda</label>
                            <input 
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Pagamento</label>
                            <select 
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                            >
                                <option>Pix / Transferência</option>
                                <option>Dinheiro</option>
                                <option>Financiamento</option>
                                <option>Troca + Volta</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Valor por extenso</label>
                            <input
                                value={paymentAmountText}
                                onChange={e => setPaymentAmountText(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                placeholder="Ex: dez mil reais"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Forma de pagamento</label>
                            <input
                                value={paymentMethodDetail}
                                onChange={e => setPaymentMethodDetail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                placeholder="Pix, transferencia, especie"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Data do pagamento</label>
                            <input
                                value={paymentDateDetail}
                                onChange={e => setPaymentDateDetail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                placeholder="Ex: no ato da assinatura"
                            />
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
                                inputMode="numeric"
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
                                    <label className="text-xs text-slate-400">Versão</label>
                                    <input type="text" value={tradeInVersion} onChange={e => setTradeInVersion(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none" placeholder="Ex: EXL 2.0"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Ano Fabricação</label>
                                    <input type="number" inputMode="numeric" value={tradeInYearFab} onChange={e => setTradeInYearFab(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Ano Modelo</label>
                                    <input type="number" inputMode="numeric" value={tradeInYearModel} onChange={e => setTradeInYearModel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Placa</label>
                                    <input type="text" value={tradeInPlate} onChange={e => setTradeInPlate(maskPlate(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none uppercase"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">RENAVAM</label>
                                    <input type="text" value={tradeInRenavam} onChange={e => setTradeInRenavam(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Chassi</label>
                                    <input type="text" value={tradeInChassis} onChange={e => setTradeInChassis(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Cor</label>
                                    <input type="text" value={tradeInColor} onChange={e => setTradeInColor(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Quilometragem</label>
                                    <input type="number" inputMode="numeric" value={tradeInKm} onChange={e => setTradeInKm(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"/>
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
                                        inputMode="numeric"
                                        value={buyerCpf}
                                        onChange={e => handleCpfChange(e.target.value)}
                                        placeholder="CPF"
                                        maxLength={14}
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
                                        inputMode="tel"
                                        value={buyerPhone}
                                        onChange={e => setBuyerPhone(maskPhone(e.target.value))}
                                        placeholder="(DDD) Telefone"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">CEP</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={buyerCep}
                                        onChange={e => setBuyerCep(e.target.value)}
                                        onBlur={handleBuyerCepBlur}
                                        placeholder="00000-000"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Logradouro</label>
                                    <input
                                        type="text"
                                        value={buyerStreet}
                                        onChange={e => setBuyerStreet(e.target.value)}
                                        placeholder="Rua, Avenida..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Número</label>
                                        <input
                                            type="text"
                                            value={buyerNumber}
                                            onChange={e => setBuyerNumber(e.target.value)}
                                            placeholder="Nº"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Bairro</label>
                                        <input
                                            type="text"
                                            value={buyerNeighborhood}
                                            onChange={e => setBuyerNeighborhood(e.target.value)}
                                            placeholder="Bairro"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="text-xs text-slate-500 mb-1 block">Cidade</label>
                                        <input
                                            type="text"
                                            value={buyerCity}
                                            onChange={e => setBuyerCity(e.target.value)}
                                            placeholder="Cidade"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">UF</label>
                                        <input
                                            type="text"
                                            value={buyerState}
                                            onChange={e => setBuyerState(e.target.value.toUpperCase().slice(0, 2))}
                                            placeholder="SP"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500 outline-none uppercase text-center"
                                        />
                                    </div>
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
