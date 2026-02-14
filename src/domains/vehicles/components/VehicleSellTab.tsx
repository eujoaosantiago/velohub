import React from 'react';
import { Vehicle } from '@/shared/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertCircle, AlertTriangle, ArrowRightLeft, CheckCircle, Minus, TrendingUp } from 'lucide-react';

type SaleData = {
  price: string;
  date: string;
  method: string;
  paymentAmountText: string;
  paymentMethodDetail: string;
  paymentDateDetail: string;
  commission: string;
  commissionTo: string;
  warrantyTime: string;
  warrantyKm: string;
  buyerName: string;
  buyerCpf: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerCep: string;
  buyerStreet: string;
  buyerNumber: string;
  buyerNeighborhood: string;
  buyerCity: string;
  buyerState: string;
  tradeIn: {
    make: string;
    model: string;
    version: string;
    yearFab: string;
    yearModel: string;
    plate: string;
    renavam: string;
    chassis: string;
    color: string;
    km: string;
    value: string;
  };
};

interface VehicleSellTabProps {
  formData: Vehicle;
  vehicle: Vehicle;
  saleData: SaleData;
  setSaleData: React.Dispatch<React.SetStateAction<SaleData>>;
  priceInputRef: React.RefObject<HTMLInputElement>;
  isSold: boolean;
  isSaving: boolean;
  isCpfValid: boolean;
  isCpfInvalid: boolean;
  hasCommissionInput: boolean;
  canViewCosts: boolean;
  grossRevenue: number;
  tradeInValue: number;
  cashReceived: number;
  totalCost: number;
  operatingExpensesValue: number;
  effectiveCommissionCost: number;
  isProfit: boolean;
  netProfit: number;
  formatCurrency: (value: number) => string;
  maskCurrencyInput: (value: string) => string;
  maskPhone: (value: string) => string;
  maskCEP: (value: string) => string;
  maskPlate: (value: string) => string;
  maskRenavam: (value: string) => string;
  maskChassis: (value: string) => string;
  calculateDefaultCommission: () => number;
  handleCpfChange: (value: string) => void;
  handleBuyerCepBlur: () => void;
  handleSale: () => void;
}

export const VehicleSellTab: React.FC<VehicleSellTabProps> = ({
  formData,
  vehicle,
  saleData,
  setSaleData,
  priceInputRef,
  isSold,
  isSaving,
  isCpfValid,
  isCpfInvalid,
  hasCommissionInput,
  canViewCosts,
  grossRevenue,
  tradeInValue,
  cashReceived,
  totalCost,
  operatingExpensesValue,
  effectiveCommissionCost,
  isProfit,
  netProfit,
  formatCurrency,
  maskCurrencyInput,
  maskPhone,
  maskCEP,
  maskPlate,
  maskRenavam,
  maskChassis,
  calculateDefaultCommission,
  handleCpfChange,
  handleBuyerCepBlur,
  handleSale,
}) => {
  return (
    <div className="space-y-6">
      {canViewCosts && (
        <Card className="">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className={isSold ? 'text-emerald-500' : 'text-slate-400'} />
              <h3 className="font-bold text-slate-900 dark:text-white">
                {isSold ? 'Demonstrativo do Resultado (DRE)' : 'Simulação de Resultado'}
              </h3>
            </div>
            {!isSold && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                Prévia
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Venda Bruta</p>
              <p className="text-slate-900 dark:text-white font-bold text-lg">{formatCurrency(grossRevenue)}</p>

              {tradeInValue > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Dinheiro:</span>
                    <span className="text-emerald-500 font-bold">{formatCurrency(cashReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Troca:</span>
                    <span className="text-amber-500 font-bold">{formatCurrency(tradeInValue)}</span>
                  </div>
                </div>
              )}
            </div>

            <Minus size={16} className="text-slate-400 hidden md:block mx-auto" />

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 relative">
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Custo Total</p>
              <p className="text-rose-500 font-bold text-lg">- {formatCurrency(totalCost)}</p>
              <div className="text-[10px] text-slate-500 mt-1 flex flex-col">
                <span>Compra: {formatCurrency(formData.purchasePrice)}</span>
                <span>Gastos Op. + Comissão: {formatCurrency(operatingExpensesValue + effectiveCommissionCost)}</span>
              </div>
              {formData.purchasePrice === 0 && (
                <div
                  className="absolute -top-2 -right-2 text-amber-500 bg-white dark:bg-slate-900 rounded-full border border-amber-500/50 p-1"
                  title="Custo de compra zerado"
                >
                  <AlertTriangle size={12} />
                </div>
              )}
            </div>

            <div className="hidden md:block text-slate-400 font-bold text-xl mx-auto">=</div>

            <div
              className={`p-4 rounded-lg border ${
                isProfit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <p className={`text-xs uppercase font-bold mb-1 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isProfit ? 'Lucro Líquido' : 'Prejuízo'}
              </p>
              <p className={`font-black text-2xl ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card title={isSold ? 'Detalhes da Venda' : 'Concluir Venda'} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Pagamento</h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">
                    {saleData.method === 'Troca + Volta' && !isSold
                      ? 'Valor em Dinheiro (Volta)'
                      : 'Valor Final da Venda'}
                  </label>
                  <input
                    type="text"
                    ref={priceInputRef}
                    inputMode="decimal"
                    value={saleData.price}
                    onChange={e => setSaleData({ ...saleData, price: maskCurrencyInput(e.target.value) })}
                    onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 lg:p-4 text-slate-900 dark:text-white text-base lg:text-lg font-bold text-right"
                  />
                </div>
                <div className="hidden lg:block">
                  <label className="block text-sm text-slate-300 mb-2">Valor Anunciado (Ref.)</label>
                  <input
                    type="text"
                    value={formatCurrency(formData.expectedSalePrice || 0)}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 lg:p-4 text-slate-500 dark:text-slate-400 text-base lg:text-lg font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Data</label>
                  <input
                    type="date"
                    value={saleData.date}
                    onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Pagamento</label>
                  <select
                    value={saleData.method}
                    onChange={e => setSaleData({ ...saleData, method: e.target.value })}
                    disabled={isSold}
                    className="w-full select-premium p-3"
                  >
                    <option>Pix / Transferência</option>
                    <option>Financiamento</option>
                    <option>Dinheiro</option>
                    <option>Troca + Volta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Valor por extenso</label>
                  <input
                    value={saleData.paymentAmountText}
                    onChange={e => setSaleData({ ...saleData, paymentAmountText: e.target.value })}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 outline-none"
                    placeholder="Ex: dez mil reais"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Forma de pagamento</label>
                  <input
                    value={saleData.paymentMethodDetail}
                    onChange={e => setSaleData({ ...saleData, paymentMethodDetail: e.target.value })}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 outline-none"
                    placeholder="Pix, transferência, espécie"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Data do pagamento</label>
                <input
                  value={saleData.paymentDateDetail}
                  onChange={e => setSaleData({ ...saleData, paymentDateDetail: e.target.value })}
                  disabled={isSold}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 outline-none"
                  placeholder="Ex: no ato da assinatura"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Garantia e Comissão</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Garantia (Tempo)</label>
                  <input
                    value={isSold ? vehicle.warrantyDetails?.time || '90 dias' : saleData.warrantyTime}
                    onChange={e => setSaleData({ ...saleData, warrantyTime: e.target.value })}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded p-3 md:p-4 text-slate-900 dark:text-white text-sm"
                    placeholder="Ex: 90 dias"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Garantia (KM)</label>
                  <input
                    value={isSold ? vehicle.warrantyDetails?.km || '3.000 km' : saleData.warrantyKm}
                    onChange={e => setSaleData({ ...saleData, warrantyKm: e.target.value })}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded p-3 md:p-4 text-slate-900 dark:text-white text-sm"
                    placeholder="Ex: 3.000 km"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Comissão de Venda (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={isSold ? maskCurrencyInput((calculateDefaultCommission() * 100).toFixed(0)) : saleData.commission}
                    onChange={e => setSaleData({ ...saleData, commission: maskCurrencyInput(e.target.value) })}
                    disabled={isSold}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-sm font-bold"
                    placeholder="R$ 0,00"
                  />
                </div>
                {hasCommissionInput && !isSold && (
                  <div className="animate-fade-in">
                    <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Vendedor</label>
                    <input
                      type="text"
                      value={saleData.commissionTo}
                      onChange={e => setSaleData({ ...saleData, commissionTo: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-sm"
                      placeholder="Nome do funcionário"
                    />
                  </div>
                )}
                {isSold && calculateDefaultCommission() > 0 && (
                  <div>
                    <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Vendedor (Comissão)</label>
                    <input
                      disabled
                      value={vehicle.saleCommissionTo || 'Não informado'}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-500 dark:text-slate-400 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {saleData.method === 'Troca + Volta' && !isSold && (
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                <h4 className="text-slate-900 dark:text-white font-medium mb-3 flex items-center gap-2">
                  <ArrowRightLeft size={16} /> Entrada (Troca)
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="Marca"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.make}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, make: e.target.value } })}
                  />
                  <input
                    placeholder="Modelo"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.model}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, model: e.target.value } })}
                  />
                  <input
                    placeholder="Versão"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.version}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, version: e.target.value } })}
                  />
                  <input
                    placeholder="Ano Fabricação"
                    type="number"
                    inputMode="numeric"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.yearFab}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, yearFab: e.target.value } })}
                  />
                  <input
                    placeholder="Ano Modelo"
                    type="number"
                    inputMode="numeric"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.yearModel}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, yearModel: e.target.value } })}
                  />
                  <input
                    placeholder="Placa"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm uppercase"
                    value={saleData.tradeIn.plate}
                    onChange={e =>
                      setSaleData({
                        ...saleData,
                        tradeIn: { ...saleData.tradeIn, plate: maskPlate(e.target.value) }
                      })
                    }
                  />
                  <input
                    placeholder="RENAVAM"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm uppercase"
                    inputMode="numeric"
                    value={saleData.tradeIn.renavam}
                    onChange={e =>
                      setSaleData({
                        ...saleData,
                        tradeIn: { ...saleData.tradeIn, renavam: maskRenavam(e.target.value) }
                      })
                    }
                  />
                  <input
                    placeholder="Chassi"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm uppercase"
                    value={saleData.tradeIn.chassis}
                    onChange={e =>
                      setSaleData({
                        ...saleData,
                        tradeIn: { ...saleData.tradeIn, chassis: maskChassis(e.target.value) }
                      })
                    }
                  />
                  <input
                    placeholder="Cor"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.color}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, color: e.target.value } })}
                  />
                  <input
                    placeholder="Quilometragem"
                    type="number"
                    inputMode="numeric"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm"
                    value={saleData.tradeIn.km}
                    onChange={e => setSaleData({ ...saleData, tradeIn: { ...saleData.tradeIn, km: e.target.value } })}
                  />
                </div>
                <input
                  placeholder="Valor de Avaliação R$"
                  inputMode="decimal"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-slate-900 dark:text-white text-sm font-bold text-right"
                  value={saleData.tradeIn.value}
                  onChange={e =>
                    setSaleData({
                      ...saleData,
                      tradeIn: { ...saleData.tradeIn, value: maskCurrencyInput(e.target.value) }
                    })
                  }
                  onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                />
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Cliente</h4>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Nome Completo</label>
              <input
                placeholder="Nome completo do cliente"
                value={isSold ? vehicle.buyer?.name : saleData.buyerName}
                onChange={e => setSaleData({ ...saleData, buyerName: e.target.value })}
                disabled={isSold}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">CPF</label>
                <input
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  value={isSold ? vehicle.buyer?.cpf : saleData.buyerCpf}
                  onChange={e => handleCpfChange(e.target.value)}
                  disabled={isSold}
                  maxLength={14}
                  className={`w-full bg-white dark:bg-slate-950 border rounded-lg p-3 text-slate-900 dark:text-white text-base outline-none transition-colors ${
                    !isSold && saleData.buyerCpf.length > 0
                      ? isCpfValid
                        ? 'border-emerald-500'
                        : 'border-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {!isSold && isCpfValid && (
                  <CheckCircle className="absolute right-3 top-[38px] text-emerald-500" size={16} />
                )}
                {!isSold && isCpfInvalid && saleData.buyerCpf.length > 0 && (
                  <AlertCircle className="absolute right-3 top-[38px] text-rose-500" size={16} />
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Telefone</label>
                <input
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  value={isSold ? vehicle.buyer?.phone : saleData.buyerPhone}
                  onChange={e => setSaleData({ ...saleData, buyerPhone: maskPhone(e.target.value) })}
                  disabled={isSold}
                  maxLength={15}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">E-mail</label>
              <input
                placeholder="email@exemplo.com"
                type="email"
                value={isSold ? vehicle.buyer?.email : saleData.buyerEmail}
                onChange={e => setSaleData({ ...saleData, buyerEmail: e.target.value })}
                disabled={isSold}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-3">
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">CEP</label>
                <input
                  placeholder="00000-000"
                  inputMode="numeric"
                  value={isSold ? vehicle.buyer?.cep : saleData.buyerCep}
                  onChange={e => setSaleData({ ...saleData, buyerCep: maskCEP(e.target.value) })}
                  onBlur={handleBuyerCepBlur}
                  disabled={isSold}
                  maxLength={9}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
                />
              </div>
              <div className="lg:col-span-7">
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Cidade</label>
                <input
                  placeholder="Nome da cidade"
                  value={isSold ? vehicle.buyer?.city : saleData.buyerCity}
                  onChange={e => setSaleData({ ...saleData, buyerCity: e.target.value })}
                  disabled={isSold}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">UF</label>
                <input
                  placeholder="UF"
                  value={isSold ? vehicle.buyer?.state : saleData.buyerState}
                  onChange={e => setSaleData({ ...saleData, buyerState: e.target.value.toUpperCase().slice(0, 2) })}
                  disabled={isSold}
                  maxLength={2}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base text-center font-semibold uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-9">
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Logradouro</label>
                <input
                  placeholder="Rua, Avenida, etc."
                  value={isSold ? vehicle.buyer?.street : saleData.buyerStreet}
                  onChange={e => setSaleData({ ...saleData, buyerStreet: e.target.value })}
                  disabled={isSold}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Número</label>
                <input
                  placeholder="Nº"
                  value={isSold ? vehicle.buyer?.number : saleData.buyerNumber}
                  onChange={e => setSaleData({ ...saleData, buyerNumber: e.target.value })}
                  disabled={isSold}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-300 mb-2">Bairro</label>
              <input
                placeholder="Nome do bairro"
                value={isSold ? vehicle.buyer?.neighborhood : saleData.buyerNeighborhood}
                onChange={e => setSaleData({ ...saleData, buyerNeighborhood: e.target.value })}
                disabled={isSold}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-base"
              />
            </div>
          </div>
        </div>

        {isSold && formData.paymentMethod === 'Troca + Volta' && formData.tradeInInfo && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm space-y-2">
            <h4 className="text-slate-900 dark:text-slate-200 font-medium flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-indigo-400" />
              Resumo Troca + Volta
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Valor recebido em dinheiro</span>
              <span className="text-emerald-500 font-semibold">{formatCurrency(cashReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Veículo recebido na troca</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold text-right">
                {formData.tradeInInfo.make} {formData.tradeInInfo.model} ({formData.tradeInInfo.plate || 'S/ Placa'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Valor do veículo recebido</span>
              <span className="text-amber-500 font-semibold">{formatCurrency(tradeInValue)}</span>
            </div>
          </div>
        )}
        {!isSold && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button size="lg" className="w-full" onClick={handleSale} disabled={isSaving || !isCpfValid}>
              {isSaving ? 'Processando...' : 'Confirmar Venda'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
