
import React from 'react';
import { Vehicle } from '../types';
import { formatCurrency } from '../lib/utils';
import { X, Printer, Fuel, Calendar, Gauge, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

interface WindowStickerModalProps {
  vehicle: Vehicle;
  storeName: string;
  onClose: () => void;
}

export const WindowStickerModal: React.FC<WindowStickerModalProps> = ({ vehicle, storeName, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const shareUrl = `${window.location.origin}?vid=${vehicle.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Header Actions (Hidden on Print) */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center print:hidden">
            <div>
                <h3 className="font-bold text-slate-800">Etiqueta de Vidro</h3>
                <p className="text-xs text-slate-500">Imprima e cole no veículo.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} size="sm" className="border-slate-300 text-slate-600 hover:bg-slate-200">
                    <X size={18} />
                </Button>
                <Button onClick={handlePrint} size="sm" icon={<Printer size={18} />}>
                    Imprimir
                </Button>
            </div>
        </div>

        {/* Sticker Content (A4 Ratioish) */}
        <div className="p-8 md:p-12 print:p-0 print:h-screen flex flex-col relative bg-white">
            {/* Watermark Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100 font-black text-9xl rotate-[-45deg] opacity-20 pointer-events-none whitespace-nowrap z-0">
                VELOHUB
            </div>

            <div className="relative z-10 border-4 border-slate-900 h-full p-6 flex flex-col justify-between">
                
                {/* Header */}
                <div className="text-center border-b-2 border-slate-900 pb-6">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{vehicle.make} {vehicle.model}</h1>
                    <p className="text-xl font-medium text-slate-600">{vehicle.version}</p>
                </div>

                {/* Main Specs */}
                <div className="grid grid-cols-2 gap-8 my-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Calendar size={32} className="text-slate-400" />
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400">Ano</p>
                                <p className="text-2xl font-bold">{vehicle.year}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Gauge size={32} className="text-slate-400" />
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400">Quilometragem</p>
                                <p className="text-2xl font-bold">{vehicle.km.toLocaleString()} km</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Fuel size={32} className="text-slate-400" />
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400">Combustível</p>
                                <p className="text-2xl font-bold">{vehicle.fuel}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <CheckCircle2 size={32} className="text-slate-400" />
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400">Câmbio</p>
                                <p className="text-2xl font-bold">{vehicle.transmission}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features / Description Placeholder */}
                <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8">
                    <p className="text-sm font-bold text-slate-400 uppercase mb-2">Observações</p>
                    <p className="text-lg leading-relaxed text-slate-700">
                        Veículo revisado, documentação em dia. Aceitamos troca e financiamento com as melhores taxas do mercado. 
                        Garantia de procedência {storeName}.
                    </p>
                </div>

                {/* Price & QR */}
                <div className="bg-slate-900 text-white p-6 -mx-6 -mb-6 mt-4 flex justify-between items-center print:bg-black print:text-white">
                    <div>
                        <p className="text-sm font-medium opacity-70 uppercase tracking-widest mb-1">Valor à Vista</p>
                        <h2 className="text-5xl font-black tracking-tight">{formatCurrency(vehicle.expectedSalePrice)}</h2>
                    </div>
                    <div className="bg-white p-2 rounded-lg shrink-0">
                        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
