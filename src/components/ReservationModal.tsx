
import React, { useState } from 'react';
import { Vehicle } from '@/shared/types';
import { Button } from './ui/Button';
import { X, DollarSign, User, Phone } from 'lucide-react';
import { maskCurrencyInput, parseCurrencyInput, maskPhone } from '@/shared/lib/utils';

interface ReservationModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onConfirm: (vehicleId: string, reservedBy: string, signalValue: number, reservedByPhone?: string) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ vehicle, onClose, onConfirm }) => {
  const [reservedBy, setReservedBy] = useState('');
  const [reservedByPhone, setReservedByPhone] = useState('');
  const [signalValue, setSignalValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!reservedBy.trim()) {
          setError('Informe o nome do cliente.');
          return;
      }

      const value = parseCurrencyInput(signalValue);
      if (!value || value <= 0) {
          setError('Informe o valor do sinal.');
          return;
      }

      onConfirm(vehicle.id, reservedBy, value, reservedByPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative">
            <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center rounded-t-2xl">
                <div>
                    <h3 className="text-lg font-bold text-white">Confirmar Reserva</h3>
                    <p className="text-xs text-slate-400">{vehicle.make} {vehicle.model}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Reservado Para (Cliente)</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            value={reservedBy}
                            onChange={(e) => setReservedBy(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Nome do Cliente"
                            autoFocus
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefone (Contato)</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            value={reservedByPhone}
                            onChange={(e) => setReservedByPhone(maskPhone(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor do Sinal (Entrada)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={signalValue}
                            onChange={(e) => setSignalValue(maskCurrencyInput(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                            placeholder="R$ 0,00"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Reservar</Button>
                </div>
            </form>
        </div>
    </div>
  );
};



