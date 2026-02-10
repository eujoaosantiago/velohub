
import React, { useState } from 'react';
import { Vehicle } from '../types';
import { formatCurrency } from '../lib/utils';
import { Fuel, Calendar, Gauge, MessageCircle, ChevronLeft, ChevronRight, MapPin, CheckCircle2 } from 'lucide-react';

interface PublicVehicleShareProps {
    vehicle: Vehicle;
    storeName: string;
}

export const PublicVehicleShare: React.FC<PublicVehicleShareProps> = ({ vehicle, storeName }) => {
    const [activeImage, setActiveImage] = useState(0);

    const handleNextImage = () => {
        if (activeImage < vehicle.photos.length - 1) setActiveImage(activeImage + 1);
        else setActiveImage(0);
    };

    const handlePrevImage = () => {
        if (activeImage > 0) setActiveImage(activeImage - 1);
        else setActiveImage(vehicle.photos.length - 1);
    };

    const handleWhatsApp = () => {
        const text = `Olá, vi o anúncio do *${vehicle.make} ${vehicle.model}* na *${storeName}* e gostaria de mais informações.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white md:bg-slate-50 text-slate-900 pb-20">
            {/* Header Mobile Style */}
            <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100 p-4 flex justify-between items-center">
                <span className="font-bold text-lg">{storeName}</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Estoque</span>
            </div>

            <div className="max-w-4xl mx-auto md:py-10">
                <div className="bg-white md:rounded-3xl md:shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Gallery */}
                        <div className="relative aspect-[4/3] md:aspect-auto md:h-[500px] bg-slate-900">
                            {vehicle.photos.length > 0 ? (
                                <img 
                                    src={vehicle.photos[activeImage]} 
                                    className="w-full h-full object-cover" 
                                    alt={`${vehicle.make} ${vehicle.model}`} 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    Sem fotos
                                </div>
                            )}

                            {/* Navigation Arrows */}
                            {vehicle.photos.length > 1 && (
                                <>
                                    <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white transition-all">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 text-white transition-all">
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                            
                            {/* Dots */}
                            {vehicle.photos.length > 1 && (
                                <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
                                    {vehicle.photos.map((_, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === activeImage ? 'bg-white w-4' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="p-6 md:p-10 flex flex-col h-full relative">
                            <div className="flex-1">
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            Oportunidade
                                        </span>
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                            <MapPin size={12} /> Disponível na Loja
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-1">
                                        {vehicle.make} {vehicle.model}
                                    </h1>
                                    <p className="text-lg text-slate-500 font-medium">{vehicle.version}</p>
                                </div>

                                <div className="mb-8">
                                    <p className="text-sm text-slate-400 mb-1">Valor à vista</p>
                                    <h2 className="text-4xl font-bold text-indigo-600 tracking-tight">
                                        {formatCurrency(vehicle.expectedSalePrice)}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Ano</p>
                                            <p className="font-semibold text-slate-700">{vehicle.year}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                            <Gauge size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">KM</p>
                                            <p className="font-semibold text-slate-700">{vehicle.km.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                            <Fuel size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Combustível</p>
                                            <p className="font-semibold text-slate-700">{vehicle.fuel}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Câmbio</p>
                                            <p className="font-semibold text-slate-700">{vehicle.transmission}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-100">
                                <div className="mb-4">
                                     <p className="text-center text-sm text-slate-500 mb-4">
                                         Fale diretamente com <span className="font-bold text-slate-900">{storeName}</span>
                                     </p>
                                </div>
                                <button 
                                    onClick={handleWhatsApp}
                                    className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    <MessageCircle size={24} />
                                    Tenho Interesse
                                </button>
                                <p className="text-[10px] text-center text-slate-400 mt-4">
                                    Veículo sujeito a disponibilidade. Valores podem sofrer alteração.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="text-center mt-8 pb-8">
                     <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                         Gerenciado por <strong>Velohub</strong>
                     </p>
                </div>
            </div>
        </div>
    );
};
