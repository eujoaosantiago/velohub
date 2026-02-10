
import React, { useState } from 'react';
import { Vehicle, UserRole, VehicleStatus, checkPermission } from '../types';
import { Button } from '../components/ui/Button';
import { formatCurrency, getStatusLabel, getStatusBorderColor } from '../lib/utils';
import { Search, Plus, ChevronRight, Fuel, Calendar, AlertTriangle, Clock, EyeOff, Image as ImageIcon, ChevronDown, Lock, DollarSign, Share2, FileCheck, FileX, X, Crown, Rocket } from 'lucide-react';
import { QuickSaleModal } from '../components/QuickSaleModal';
import { ReservationModal } from '../components/ReservationModal';
import { ShareModal } from '../components/ShareModal';
import { AuthService } from '../services/auth';
import { useVelohub } from '../contexts/VelohubContext';
import { Page } from '../types';
import { getPlanLimits } from '../lib/plans';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  userRole: UserRole;
  onUpdateVehicle: (vehicle: Vehicle) => Promise<void>; 
  onCreateTradeIn?: (vehicle: Vehicle) => Promise<void>;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onSelectVehicle, onAddVehicle, userRole, onUpdateVehicle, onCreateTradeIn }) => {
  const { navigateTo } = useVelohub();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [quickSaleVehicle, setQuickSaleVehicle] = useState<Vehicle | null>(null);
  const [reservationVehicle, setReservationVehicle] = useState<Vehicle | null>(null);
  const [shareVehicle, setShareVehicle] = useState<Vehicle | null>(null); 
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const currentUser = AuthService.getCurrentUser();
  const canViewCosts = checkPermission(currentUser || null, 'view_costs');
  const canManageSales = checkPermission(currentUser || null, 'manage_sales');
  
  // VERIFICAÇÃO DE PLANO + PERMISSÃO
  const planLimits = currentUser ? getPlanLimits(currentUser) : null;
  const canShare = (planLimits?.showShareLink ?? false) && checkPermission(currentUser || null, 'share_vehicles');

  // Filtragem e Ordenação
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = `${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') {
        return matchesSearch && v.status !== 'sold';
    }
    
    return matchesSearch && v.status === filterStatus;
  }).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
  });

  const staleInventoryCount = vehicles.filter(v => {
      if (v.status !== 'available') return false;
      const daysInStock = Math.floor((new Date().getTime() - new Date(v.purchaseDate).getTime()) / (1000 * 3600 * 24));
      return daysInStock > 60;
  }).length;

  const handleQuickStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, vehicle: Vehicle) => {
      e.preventDefault();
      e.stopPropagation();
      
      const newStatus = e.target.value as VehicleStatus;
      
      if (newStatus === 'sold') {
          setQuickSaleVehicle(vehicle);
      } else if (newStatus === 'reserved') {
          setReservationVehicle(vehicle);
      } else {
          const updatedVehicle = { ...vehicle, status: newStatus, reservationDetails: undefined };
          try {
              await onUpdateVehicle(updatedVehicle);
          } catch (err) {
              alert("Erro ao atualizar status.");
          }
      }
  };

  const handleConfirmReservation = async (vehicleId: string, reservedBy: string, signalValue: number, reservedByPhone?: string) => {
      if (!reservationVehicle) return;

      const updatedVehicle: Vehicle = {
          ...reservationVehicle,
          status: 'reserved',
          reservationDetails: {
              reservedBy,
              reservedByPhone,
              signalValue,
              reservationDate: new Date().toISOString()
          }
      };

      try {
          await onUpdateVehicle(updatedVehicle);
          setReservationVehicle(null);
      } catch (err) {
          alert("Erro ao reservar veículo.");
      }
  };

  const handleConfirmQuickSale = async (vehicleId: string, saleData: Partial<Vehicle>, tradeInVehicle?: Vehicle) => {
      if (!quickSaleVehicle) return;
      
      const updatedVehicle = { ...quickSaleVehicle, ...saleData };
      
      try {
          await onUpdateVehicle(updatedVehicle);
          if (tradeInVehicle && onCreateTradeIn) {
              await onCreateTradeIn(tradeInVehicle);
          }
      } catch (err) {
          console.error(err);
          alert("Erro ao registrar venda. Verifique os dados e tente novamente.");
          throw err; 
      }
  };

  const handleShareClick = (e: React.MouseEvent, vehicle: Vehicle) => {
      e.stopPropagation();
      if (canShare) {
          setShareVehicle(vehicle);
      } else {
          setShowUpgradeModal(true);
      }
  };

  return (
    <div className="space-y-6">
      {/* MODALS */}
      {quickSaleVehicle && (
          <QuickSaleModal 
              vehicle={quickSaleVehicle}
              allVehicles={vehicles}
              onClose={() => setQuickSaleVehicle(null)} 
              onConfirmSale={handleConfirmQuickSale} 
          />
      )}

      {reservationVehicle && (
          <ReservationModal
              vehicle={reservationVehicle}
              onClose={() => setReservationVehicle(null)}
              onConfirm={handleConfirmReservation}
          />
      )}

      {shareVehicle && (
          <ShareModal 
              vehicleId={shareVehicle.id}
              vehicleModel={`${shareVehicle.make} ${shareVehicle.model}`}
              onClose={() => setShareVehicle(null)}
          />
      )}

      {/* UPSELL MODAL (FEATURE LOCKED) */}
      {showUpgradeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowUpgradeModal(false)}>
              <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
                  
                  <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                      <X size={20} />
                  </button>

                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
                          <Rocket size={32} className="text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">Showroom Digital</h3>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                          O compartilhamento de veículos ("Link na Bio") com sua marca é uma funcionalidade exclusiva dos planos <strong>Starter</strong> e <strong>Pro</strong>.
                      </p>

                      <div className="space-y-3">
                          <Button 
                              onClick={() => navigateTo(Page.PROFILE)} 
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-lg shadow-indigo-500/20 py-3"
                          >
                              Fazer Upgrade Agora
                          </Button>
                          <Button 
                              variant="ghost" 
                              onClick={() => setShowUpgradeModal(false)} 
                              className="w-full text-slate-500 hover:text-white"
                          >
                              Continuar no Plano Grátis
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Meu Estoque</h1>
          <p className="text-slate-400">
             {userRole === 'owner' ? 'Gerencie custos e margens do seu estoque.' : 'Catálogo de veículos disponíveis para venda.'}
          </p>
        </div>
        <Button onClick={onAddVehicle} icon={<Plus size={18} />}>
          Adicionar Veículo
        </Button>
      </div>

      {staleInventoryCount > 0 && userRole === 'owner' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                  <AlertTriangle size={20} />
              </div>
              <div>
                  <h4 className="text-amber-400 font-bold">Atenção Necessária</h4>
                  <p className="text-sm text-amber-200/70">
                      Você tem <span className="font-bold text-white">{staleInventoryCount}</span> veículos parados há mais de 60 dias.
                      Considere revisar os preços.
                  </p>
              </div>
          </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por nome, marca ou placa..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'available', 'reserved', 'preparation'].map(status => {
                let label = '';
                switch(status) {
                    case 'all': label = 'Todos'; break;
                    case 'available': label = 'Em Estoque'; break;
                    case 'reserved': label = 'Reservados'; break;
                    case 'preparation': label = 'Preparação'; break;
                }
                return (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-5 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-200 border ${
                            filterStatus === status 
                            ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                            : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVehicles.length > 0 ? filteredVehicles.map(vehicle => {
            const daysInStock = Math.floor((new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 3600 * 24));
            const isStale = vehicle.status === 'available' && daysInStock > 60;
            const borderColorClass = getStatusBorderColor(vehicle.status);
            const addedDate = new Date(vehicle.purchaseDate || vehicle.createdAt).toLocaleDateString('pt-BR');

            return (
              <div 
                key={vehicle.id} 
                onClick={() => onSelectVehicle(vehicle.id)}
                className={`group bg-slate-900/40 backdrop-blur-sm border-l-4 ${borderColorClass} border-y border-r border-slate-800/60 rounded-2xl p-4 hover:bg-slate-800/60 transition-all cursor-pointer flex flex-col gap-4 ${isStale && userRole === 'owner' ? 'shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]' : ''}`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Image Thumbnail */}
                    <div className="w-full md:w-64 h-48 md:h-40 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-800">
                    {vehicle.photos.length > 0 ? (
                        <img 
                            src={vehicle.photos[0]} 
                            alt={vehicle.model} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <ImageIcon size={32} className="opacity-50 mb-2" />
                            <span className="text-xs">Sem foto</span>
                        </div>
                    )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-white truncate">{vehicle.make} {vehicle.model}</h3>
                                {isStale && userRole === 'owner' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                                        <Clock size={10} />
                                        +60 Dias
                                    </span>
                                )}
                            </div>
                            
                            <div className="relative group min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                                <div className={`flex items-center justify-between gap-2 px-4 py-2 rounded-full shadow-lg transition-all cursor-pointer border ${vehicle.status === 'reserved' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-gradient-to-r from-indigo-600 to-orange-600 border-white/10 text-white'}`}>
                                    <span className="text-xs font-bold uppercase tracking-wide truncate">
                                        {getStatusLabel(vehicle.status)}
                                    </span>
                                    {vehicle.status !== 'sold' && <ChevronDown size={14} className="opacity-80 shrink-0" />}
                                </div>
                                {vehicle.status !== 'sold' && (
                                    <select 
                                        value={vehicle.status}
                                        onChange={(e) => handleQuickStatusChange(e, vehicle)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    >
                                        <option value="available">Em Estoque</option>
                                        <option value="reserved">Reservado</option>
                                        <option value="preparation">Preparação</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        
                        <p className="text-slate-300 font-medium mb-1">{vehicle.version}</p>
                        
                        {vehicle.status === 'reserved' && vehicle.reservationDetails && (
                            <div className="mb-3 flex flex-col gap-1 text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded text-amber-200">
                                <div className="flex items-center gap-2">
                                    <Lock size={12} />
                                    <span>Reservado para <strong>{vehicle.reservationDetails.reservedBy}</strong></span>
                                </div>
                                <span className="opacity-80">Sinal: {formatCurrency(vehicle.reservationDetails.signalValue)}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-slate-500 text-xs bg-slate-800/50 px-2 py-0.5 rounded border border-slate-800">{vehicle.plate || 'S/ Placa'}</span>
                            
                            <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${vehicle.ipvaPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                {vehicle.ipvaPaid ? <FileCheck size={10} /> : <FileX size={10} />} IPVA
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${vehicle.licensingPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                {vehicle.licensingPaid ? <FileCheck size={10} /> : <FileX size={10} />} Licenciamento
                            </span>

                            <span className="text-slate-600 text-xs flex items-center gap-1 ml-auto md:ml-0">• Adicionado em {addedDate}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                            <Calendar size={14} className="text-indigo-400" /> {vehicle.year}
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                            <Fuel size={14} className="text-indigo-400" /> {vehicle.fuel}
                            </div>
                            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                            <span className="font-bold text-indigo-400">KM</span> {vehicle.km.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS - DESKTOP VIEW */}
                    <div className="hidden md:flex flex-col items-end justify-between min-w-[160px] pl-6 border-l border-slate-800">
                        <div className="text-right w-full">
                            <p className="text-xs text-slate-500 mb-1">Preço de Venda</p>
                            <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(vehicle.expectedSalePrice)}</p>
                            
                            {canViewCosts ? (
                                <>
                                    {vehicle.status === 'available' && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Margem: <span className="text-emerald-400 font-bold">
                                        {Math.round(((vehicle.expectedSalePrice - vehicle.purchasePrice) / vehicle.purchasePrice) * 100)}%
                                        </span>
                                    </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 justify-end opacity-50 select-none">
                                    <EyeOff size={10} /> Custos ocultos
                                </p>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full mt-4">
                            {canManageSales && vehicle.status !== 'sold' && vehicle.status !== 'preparation' && (
                                <Button 
                                    className="w-full bg-gradient-to-r from-indigo-500 to-orange-600 border-none font-bold shadow-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickSaleVehicle(vehicle);
                                    }}
                                    icon={<DollarSign size={16} />}
                                >
                                    VENDER
                                </Button>
                            )}
                            
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" className="flex-1" icon={<ChevronRight size={16} />}>
                                    Ver
                                </Button>
                                <button 
                                    onClick={(e) => handleShareClick(e, vehicle)}
                                    className={`px-3 border rounded-full transition-colors flex items-center justify-center gap-1 ${
                                        canShare 
                                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white' 
                                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:bg-slate-800 hover:text-indigo-400'
                                    }`}
                                    title={canShare ? "Compartilhar" : "Funcionalidade Premium"}
                                >
                                    {canShare ? <Share2 size={16} /> : <Lock size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS - MOBILE VIEW (Bottom Bar) */}
                <div className="flex flex-col md:hidden gap-4 mt-2 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500">Preço</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(vehicle.expectedSalePrice)}</p>
                    </div>
                    
                    {vehicle.status !== 'sold' && (
                        <div className="flex gap-3">
                            {canManageSales && vehicle.status !== 'preparation' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickSaleVehicle(vehicle);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <DollarSign size={20} />
                                    VENDER
                                </button>
                            )}
                            <button 
                                onClick={(e) => handleShareClick(e, vehicle)}
                                className={`px-4 py-3 rounded-xl border flex items-center justify-center active:bg-slate-700 transition-colors ${
                                    canShare
                                    ? 'bg-slate-800 text-white border-slate-700'
                                    : 'bg-slate-900 text-slate-600 border-slate-800'
                                }`}
                            >
                                {canShare ? <Share2 size={20} /> : <Lock size={20} />}
                            </button>
                        </div>
                    )}
                </div>
              </div>
            );
        }) : (
          <div className="text-center py-16">
            <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-600" />
            </div>
            <h3 className="text-white font-medium">Nenhum veículo encontrado</h3>
            <p className="text-slate-500 text-sm">Tente ajustar seus filtros de busca ou adicione um novo carro.</p>
          </div>
        )}
      </div>
    </div>
  );
};
