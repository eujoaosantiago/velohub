import React from 'react';
import { Vehicle } from '@/shared/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Camera, Check, FileCheck, FileText, RefreshCw, Search, Tag, Wallet, X } from 'lucide-react';

type UploadProgress = {
  total: number;
  done: number;
};

interface VehicleOverviewTabProps {
  formData: Vehicle;
  vehicle: Vehicle;
  dirtyStateIsOverview: boolean;
  safeCompare: (a: any, b: any) => boolean;
  useFipeSearch: boolean;
  onToggleFipeSearch: () => void;
  fipeSearch: React.ReactNode;
  handleChange: (field: keyof Vehicle, value: any) => void;
  formatIntegerForInput: (val: number) => string;
  parseIntegerFromInput: (value: string) => number;
  optionalInput: string;
  setOptionalInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddOptional: () => void;
  toggleOptional: (label: string) => void;
  removeOptional: (label: string) => void;
  optionalFeatures: string[];
  getMaskedValue: (val: number) => string;
  maskCurrencyInput: (value: string) => string;
  parseCurrencyInput: (value: string) => number;
  setFormData: React.Dispatch<React.SetStateAction<Vehicle>>;
  isPhotoUploading: boolean;
  uploadProgress: UploadProgress;
  onOpenPhotos: () => void;
  canViewCosts: boolean;
  allExpensesSum: number;
  totalCost: number;
  formatCurrency: (value: number) => string;
}

export const VehicleOverviewTab: React.FC<VehicleOverviewTabProps> = ({
  formData,
  vehicle,
  dirtyStateIsOverview,
  safeCompare,
  useFipeSearch,
  onToggleFipeSearch,
  fipeSearch,
  handleChange,
  formatIntegerForInput,
  parseIntegerFromInput,
  optionalInput,
  setOptionalInput,
  handleAddOptional,
  toggleOptional,
  removeOptional,
  optionalFeatures,
  getMaskedValue,
  maskCurrencyInput,
  parseCurrencyInput,
  setFormData,
  isPhotoUploading,
  uploadProgress,
  onOpenPhotos,
  canViewCosts,
  allExpensesSum,
  totalCost,
  formatCurrency,
}) => {
  const isFieldDirty = (field: keyof Vehicle) =>
    dirtyStateIsOverview && !safeCompare(formData[field], vehicle[field]);

  const normalizeOptional = (value: string) => value.trim().toLowerCase();
  const normalizeOptionals = (values?: string[]) => (values || []).map(normalizeOptional).filter(Boolean);
  const optionalsDirty = !safeCompare(normalizeOptionals(formData.optionals), normalizeOptionals(vehicle.optionals));
  const docsDirty = isFieldDirty('ipvaPaid') || isFieldDirty('licensingPaid');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card title="Dados do Veículo">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-white font-medium flex gap-2">
              <Search size={16} className="text-indigo-400" /> FIPE
            </span>
            <button onClick={onToggleFipeSearch} className="text-xs text-indigo-400 underline">
              {useFipeSearch ? 'Manual' : 'Automático'}
            </button>
          </div>

          {useFipeSearch && fipeSearch}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            {[
              { label: 'Marca', field: 'make', type: 'text', disabled: useFipeSearch },
              { label: 'Modelo', field: 'model', type: 'text', disabled: useFipeSearch },
              { label: 'Versão', field: 'version', type: 'text', disabled: false },
              {
                label: 'Ano',
                field: 'year',
                type: 'text',
                disabled: useFipeSearch,
                inputMode: 'numeric',
                formatValue: (value: number) => (value ? String(value) : ''),
                parseValue: (value: string) => {
                  const parsed = parseIntegerFromInput(value);
                  return parsed > 9999 ? parseInt(String(parsed).slice(0, 4), 10) : parsed;
                },
              },
              { label: 'Placa', field: 'plate', type: 'text', disabled: false, uppercase: true },
              { label: 'RENAVAM', field: 'renavam', type: 'text', disabled: false, inputMode: 'numeric', uppercase: true },
              { label: 'Chassi', field: 'chassis', type: 'text', disabled: false, uppercase: true },
              {
                label: 'KM',
                field: 'km',
                type: 'text',
                disabled: false,
                inputMode: 'numeric',
                formatValue: (value: number) => formatIntegerForInput(value),
                parseValue: (value: string) => parseIntegerFromInput(value),
              },
              { label: 'Cor', field: 'color', type: 'text', disabled: false },
              { label: 'Combustível', field: 'fuel', type: 'text', disabled: false },
              { label: 'Câmbio', field: 'transmission', type: 'text', disabled: false },
            ].map((item: any) => (
              <div key={item.field} className={item.field === 'version' ? 'col-span-2 md:col-span-1' : ''}>
                <label className="text-slate-500 mb-1 flex items-center gap-2">
                  {item.label}
                  {isFieldDirty(item.field as keyof Vehicle) && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </label>
                <input
                  type={item.type}
                  inputMode={item.inputMode}
                  className={`w-full bg-slate-900 border ${
                    dirtyStateIsOverview && !safeCompare(formData[item.field as keyof Vehicle], vehicle[item.field as keyof Vehicle])
                      ? 'border-amber-500/50'
                      : 'border-slate-700'
                  } rounded p-2 text-white ${item.uppercase ? 'uppercase' : ''}`}
                  value={item.formatValue ? item.formatValue((formData as any)[item.field]) : (formData as any)[item.field]}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const parsedValue = item.parseValue ? item.parseValue(rawValue) : item.type === 'number' ? parseInt(rawValue) : rawValue;
                    handleChange(item.field, parsedValue);
                  }}
                  disabled={item.disabled}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={16} className="text-slate-400" /> Opcionais
              {optionalsDirty && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </h4>
            <div className="flex flex-wrap gap-2">
              {optionalFeatures.map((opt) => {
                const active = (formData.optionals || []).some((item) => item.toLowerCase() === opt.toLowerCase());
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOptional(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      active
                        ? 'bg-indigo-500 text-white border-indigo-400'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Adicionar opcional"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                value={optionalInput}
                onChange={(e) => setOptionalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOptional();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddOptional}>
                Adicionar
              </Button>
            </div>

            {(formData.optionals || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(formData.optionals || []).map((opt) => (
                  <span
                    key={opt}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    {opt}
                    <button type="button" onClick={() => removeOptional(opt)} className="text-slate-400 hover:text-white" aria-label={`Remover ${opt}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" /> Documentação
              {docsDirty && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.ipvaPaid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${formData.ipvaPaid ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <FileCheck size={16} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${formData.ipvaPaid ? 'text-emerald-400' : 'text-slate-300'}`}>
                      IPVA Pago
                      {isFieldDirty('ipvaPaid') && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500" />}
                    </p>
                    <p className="text-xs text-slate-500">{formData.ipvaPaid ? 'Tudo certo' : 'Pendente'}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!formData.ipvaPaid}
                  onChange={() => setFormData((prev) => ({ ...prev, ipvaPaid: !prev.ipvaPaid }))}
                />
                {formData.ipvaPaid && <Check size={18} className="text-emerald-500" />}
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.licensingPaid
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${formData.licensingPaid ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                  >
                    <FileCheck size={16} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${formData.licensingPaid ? 'text-emerald-400' : 'text-slate-300'}`}>
                      Licenciamento
                      {isFieldDirty('licensingPaid') && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500" />}
                    </p>
                    <p className="text-xs text-slate-500">{formData.licensingPaid ? 'Pago' : 'Pendente'}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!formData.licensingPaid}
                  onChange={() => setFormData((prev) => ({ ...prev, licensingPaid: !prev.licensingPaid }))}
                />
                {formData.licensingPaid && <Check size={18} className="text-emerald-500" />}
              </label>
            </div>
          </div>
        </Card>

        <Card title="Financeiro e Preços">
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400 inline-flex items-center gap-2">
                Referência FIPE
                {isFieldDirty('fipePrice') && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </span>
              <input
                type="text"
                inputMode="decimal"
                className="w-40 md:w-52 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white tabular-nums"
                value={getMaskedValue(formData.fipePrice)}
                onChange={(e) => setFormData((prev) => ({ ...prev, fipePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))}
                onFocus={(e) => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
              />
            </div>

            <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg border border-indigo-500/30">
              <span className="text-indigo-300 inline-flex items-center gap-2">
                Custo de Compra
                {isFieldDirty('purchasePrice') && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </span>
              <input
                type="text"
                inputMode="decimal"
                className="w-40 md:w-52 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white tabular-nums"
                value={getMaskedValue(formData.purchasePrice)}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))}
                onFocus={(e) => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
              />
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-slate-800">
              <span className="text-white inline-flex items-center gap-2">
                Preço Anunciado
                {isFieldDirty('expectedSalePrice') && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </span>
              <input
                type="text"
                inputMode="decimal"
                className="w-40 md:w-52 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white text-lg font-bold tabular-nums"
                value={getMaskedValue(formData.expectedSalePrice)}
                onChange={(e) => setFormData((prev) => ({ ...prev, expectedSalePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))}
                onFocus={(e) => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 relative border border-slate-800 group">
          {formData.photos.length > 0 ? (
            <img src={formData.photos[0]} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Camera size={48} className="mb-2 opacity-50" />
              <span>Sem foto</span>
            </div>
          )}
          {isPhotoUploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 rounded-lg">
              <RefreshCw className="text-indigo-400 animate-spin" size={32} />
              <div className="text-center">
                <span className="text-white font-semibold block mb-1 text-sm">Enviando imagens</span>
                <span className="text-xs text-slate-300">
                  {uploadProgress.done}/{uploadProgress.total}
                </span>
              </div>
              <div className="w-24 bg-slate-700/50 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          <button
            onClick={onOpenPhotos}
            className="absolute bottom-4 right-4 bg-slate-900/80 p-2 rounded-full text-white hover:bg-indigo-600 transition-colors"
          >
            <Camera size={20} />
          </button>
        </div>

        {canViewCosts && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 animate-fade-in shadow-lg">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Wallet size={16} className="text-emerald-500" />
              Custo Total Real
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Compra</span>
                <span>{formatCurrency(formData.purchasePrice)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gastos + Comissões</span>
                <span>{formatCurrency(allExpensesSum)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white text-base">
                <span>Total</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
