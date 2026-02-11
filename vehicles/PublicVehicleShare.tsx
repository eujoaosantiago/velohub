
import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { formatCurrency } from '../lib/utils';
import { Fuel, Calendar, Gauge, MessageCircle, ChevronLeft, ChevronRight, MapPin, CheckCircle2, Moon, Sun } from 'lucide-react';

interface PublicVehicleShareProps {
    vehicle: Vehicle;
    storeName: string;
    storeWhatsapp?: string;
}

export const PublicVehicleShare: React.FC<PublicVehicleShareProps> = ({ vehicle, storeName, storeWhatsapp }) => {
    const [activeImage, setActiveImage] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [touchStart, setTouchStart] = useState(0);

    const handleNextImage = () => {
        if (activeImage < vehicle.photos.length - 1) setActiveImage(activeImage + 1);
        else setActiveImage(0);
    };

    const handlePrevImage = () => {
        if (activeImage > 0) setActiveImage(activeImage - 1);
        else setActiveImage(vehicle.photos.length - 1);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        const distance = touchStart - touchEnd;
        
        if (Math.abs(distance) > 50) {
            if (distance > 0) {
                handleNextImage();
            } else {
                handlePrevImage();
            }
        }
    };

    const handleWhatsApp = () => {
        const phoneNumber = storeWhatsapp || '';
        if (!phoneNumber) {
            alert('WhatsApp da loja não configurado');
            return;
        }
        
        const text = `Olá, vi o anúncio do *${vehicle.make} ${vehicle.model}* na *${storeName}* e gostaria de mais informações.`;
        window.open(`https://wa.me/55${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className={`min-h-screen pb-20 transition-colors ${
            isDarkMode 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-900'
        }`}>
            {/* Header Mobile Style */}
            <div className={`md:hidden sticky top-0 z-20 backdrop-blur border-b transition-colors ${
                isDarkMode
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-white/90 border-slate-200'
            } p-4 flex justify-between items-center`}>
                <span className="font-bold text-lg">{storeName}</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                                ? 'bg-slate-800 hover:bg-slate-700'
                                : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-100 text-slate-600'
                    }`}>Estoque</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto md:py-10">
                <div className={`md:rounded-3xl md:shadow-xl overflow-hidden transition-colors ${
                    isDarkMode
                        ? 'bg-slate-800'
                        : 'bg-white'
                }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Gallery */}
                        <div 
                            className={`relative aspect-[4/3] md:aspect-auto md:h-[500px] ${
                                isDarkMode ? 'bg-slate-900' : 'bg-slate-100'
                            }`}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {vehicle.photos.length > 0 ? (
                                <img 
                                    src={vehicle.photos[activeImage]} 
                                    className="w-full h-full object-cover" 
                                    alt={`${vehicle.make} ${vehicle.model}`} 
                                />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${
                                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                }`}>
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
                        <div className={`p-6 md:p-10 flex flex-col h-full relative ${
                            isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                            <div className="flex-1">
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            Oportunidade
                                        </span>
                                        <span className={`text-xs flex items-center gap-1 ${
                                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                            <MapPin size={12} /> Disponível na Loja
                                        </span>
                                    </div>
                                    <h1 className={`text-3xl font-bold mb-1 ${
                                        isDarkMode ? 'text-white' : 'text-slate-900'
                                    }`}>
                                        {vehicle.make} {vehicle.model}
                                    </h1>
                                    <p className={`text-lg font-medium ${
                                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                    }`}>{vehicle.version}</p>
                                </div>

                                <div className="mb-8">
                                    <p className={`text-sm mb-1 ${
                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    }`}>Valor à vista</p>
                                    <h2 className="text-4xl font-bold text-indigo-600 tracking-tight">
                                        {formatCurrency(vehicle.expectedSalePrice)}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {[
                                        { icon: Calendar, label: 'Ano', value: vehicle.year },
                                        { icon: Gauge, label: 'KM', value: vehicle.km.toLocaleString() },
                                        { icon: Fuel, label: 'Combustível', value: vehicle.fuel },
                                        { icon: CheckCircle2, label: 'Câmbio', value: vehicle.transmission }
                                    ].map((item, idx) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={idx} className={`p-3 rounded-xl border transition-colors ${
                                                isDarkMode
                                                    ? 'bg-slate-700/50 border-slate-700'
                                                    : 'bg-slate-50 border-slate-200'
                                            } flex items-center gap-3`}>
                                                <div className={`p-2 rounded-lg shadow-sm ${
                                                    isDarkMode
                                                        ? 'bg-slate-600 text-slate-400'
                                                        : 'bg-white text-slate-400'
                                                }`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold uppercase ${
                                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                                    }`}>{item.label}</p>
                                                    <p className={`font-semibold ${
                                                        isDarkMode ? 'text-white' : 'text-slate-900'
                                                    }`}>{item.value}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={`mt-auto pt-6 border-t ${
                                isDarkMode ? 'border-slate-700' : 'border-slate-200'
                            }`}>
                                <div className="mb-4">
                                     <p className={`text-center text-sm mb-4 ${
                                         isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                     }`}>
                                         Fale diretamente com <span className={`font-bold ${
                                             isDarkMode ? 'text-white' : 'text-slate-900'
                                         }`}>{storeName}</span>
                                     </p>
                                </div>
                                <button 
                                    onClick={handleWhatsApp}
                                    className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    <MessageCircle size={24} />
                                    Tenho Interesse
                                </button>
                                <p className={`text-[10px] text-center mt-4 ${
                                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                    Veículo sujeito a disponibilidade. Valores podem sofrer alteração.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="text-center mt-8 pb-8">
                     <p className={`text-sm flex items-center justify-center gap-2 ${
                         isDarkMode ? 'text-slate-500' : 'text-slate-400'
                     }`}>
                         <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                         Gerenciado por <strong>Velohub</strong>
                     </p>
                </div>
            </div>
        </div>
    );
};
