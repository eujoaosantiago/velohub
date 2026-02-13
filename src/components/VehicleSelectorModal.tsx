
import React, { useState } from 'react';
import { Vehicle } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/utils';
import { Search, X, ChevronRight, Car } from 'lucide-react';

interface VehicleSelectorModalProps {
  vehicles: Vehicle[];
  onSelect: (vehicle: Vehicle) => void;
  onClose: () => void;
}

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({ vehicles, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar apenas veículos disponíveis
  const availableVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'preparation' || v.status === 'reserved');

  const filtered = availableVehicles.filter(v => {
      const term = searchTerm.toLowerCase();
      return (
          v.make.toLowerCase().includes(term) ||
          v.model.toLowerCase().includes(term) ||
          v.plate.toLowerCase().includes(term)
      );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Se houver apenas um resultado ou se o usuário der Enter, seleciona o primeiro
      if (e.key === 'Enter' && filtered.length > 0) {
          onSelect(filtered[0]);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header with Search */}
        <div className="p-4 border-b border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Selecione o Veículo</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou placa..." 
                    autoFocus
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filtered.length > 0 ? filtered.map(vehicle => (
                <div 
                    key={vehicle.id} 
                    onClick={() => onSelect(vehicle)}
                    className="flex items-center gap-4 p-3 hover:bg-slate-800/50 rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-slate-700"
                >
                    <div className="w-16 h-12 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        {vehicle.photos.length > 0 ? (
                            <img src={vehicle.photos[0]} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600">
                                <Car size={16} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">{vehicle.make} {vehicle.model}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{vehicle.plate || 'S/ Placa'}</span>
                            <span>{vehicle.color}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold text-sm">{formatCurrency(vehicle.expectedSalePrice)}</p>
                        <ChevronRight size={16} className="text-slate-600 ml-auto group-hover:text-indigo-400" />
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 text-slate-500">
                    <Car size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhum veículo disponível encontrado.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};



