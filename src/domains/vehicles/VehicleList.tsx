
import React, { useState } from 'react';
import { Vehicle, UserRole, VehicleStatus, checkPermission } from '@/shared/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency, getStatusLabel, getStatusBorderColor, getStatusColor, formatDateBR, parseISODate } from '@/shared/lib/utils';
import { Search, Plus, ChevronRight, Fuel, Calendar, AlertTriangle, Clock, EyeOff, Image as ImageIcon, ChevronDown, Lock, DollarSign, Share2, FileCheck, FileX, X, Crown, Rocket, Check, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { QuickSaleModal } from '@/components/QuickSaleModal';
import { ReservationModal } from '@/components/ReservationModal';
import { ShareModal } from '@/components/ShareModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useVelohub } from '@/shared/contexts/VelohubContext'; 
import { Page } from '@/shared/types';
import { getPlanLimits } from '@/shared/lib/plans';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  userRole: UserRole;
  onUpdateVehicle: (vehicle: Vehicle) => Promise<void>; 
  onCreateTradeIn?: (vehicle: Vehicle) => Promise<void>;
  onDeleteVehicle?: (id: string) => void; // Nova prop
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onSelectVehicle, onAddVehicle, userRole, onUpdateVehicle, onCreateTradeIn, onDeleteVehicle }) => {
  const { navigateTo, user: currentUser } = useVelohub(); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  const [quickSaleVehicle, setQuickSaleVehicle] = useState<Vehicle | null>(null);
  const [reservationVehicle, setReservationVehicle] = useState<Vehicle | null>(null);
  const [shareVehicle, setShareVehicle] = useState<Vehicle | null>(null); 
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; vehicle?: Vehicle }>({
            open: false,
    });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canViewCosts = checkPermission(currentUser || null, 'view_costs');
  const canManageSales = checkPermission(currentUser || null, 'manage_sales');
  
  const planLimits = currentUser ? getPlanLimits(currentUser) : null;
  const canShare = (planLimits?.showShareLink ?? false) && checkPermission(currentUser || null, 'share_vehicles');

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

  const handleStatusUpdate = async (vehicle: Vehicle, newStatus: VehicleStatus) => {
      setOpenStatusId(null); 
      
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

  const showToast = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  };

  const handleConfirmDelete = async () => {
      if (!confirmDelete.vehicle || !onDeleteVehicle) return;
      try {
          await Promise.resolve(onDeleteVehicle(confirmDelete.vehicle.id));
          showToast('Veiculo excluido com sucesso!', 'success');
      } catch (error) {
          console.error(error);
          showToast('Erro ao excluir veiculo.', 'error');
      } finally {
          setConfirmDelete({ open: false });
      }
  };

  return (
    <div className="space-y-6" onClick={() => setOpenStatusId(null)}>
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

      <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false })}
          onConfirm={handleConfirmDelete}
          title="Excluir veiculo?"
          message="Esta acao remove o veiculo do estoque. Essa operacao nao pode ser desfeita."
          confirmText="Excluir veiculo"
          cancelText="Cancelar"
          variant="danger"
      />

      {shareVehicle && (
          <ShareModal 
              vehicleId={shareVehicle.id}
              vehicleModel={`${shareVehicle.make} ${shareVehicle.model}`}
              onClose={() => setShareVehicle(null)}
              photoUrl={shareVehicle.photos[0] || undefined}
          />
      )}

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

      {notification && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slide-in-top pointer-events-none ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="font-medium text-sm">{notification.message}</span>
          </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Meu Estoque</h1>
          <p className="text-slate-400 text-sm md:text-base">
             {userRole === 'owner' ? 'Gerencie custos e margens do seu estoque.' : 'Catálogo de veículos disponíveis para venda.'}
          </p>
        </div>
        <Button onClick={onAddVehicle} icon={<Plus size={18} />} className="w-full md:w-auto justify-center">
          Adicionar Veículo
        </Button>
      </div>

      {staleInventoryCount > 0 && userRole === 'owner' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-full text-amber-500 shrink-0">
                  <AlertTriangle size={20} />
              </div>
              <div>
                  <h4 className="text-amber-400 font-bold text-sm">Atenção Necessária</h4>
                  <p className="text-xs md:text-sm text-amber-200/70">
                      Você tem <span className="font-bold text-white">{staleInventoryCount}</span> veículos parados há mais de 60 dias.
                      Considere revisar os preços.
                  </p>
              </div>
          </div>
      )}

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

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0">
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
                        const purchaseDate = parseISODate(vehicle.purchaseDate || vehicle.createdAt);
                        const daysInStock = purchaseDate
                            ? Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24))
                            : 0;
            const isStale = vehicle.status === 'available' && daysInStock > 60;
            const borderColorClass = getStatusBorderColor(vehicle.status);
            // Parse correto da data para evitar problemas de timezone
                        const dateStr = vehicle.purchaseDate || vehicle.createdAt;
                        const addedDate = dateStr ? formatDateBR(dateStr, 'Data invalida') : 'Data nao informada';
            const plateLabel = vehicle.plate ? vehicle.plate.toUpperCase() : 'S/ PLACA';
            const versionLabel = vehicle.version || 'Versao nao informada';
            const fuelLabel = vehicle.fuel || 'Combustivel nao informado';
            const yearLabel = vehicle.year ? vehicle.year.toString() : '--';
            const kmLabel = typeof vehicle.km === 'number' ? vehicle.km.toLocaleString('pt-BR') : '--';
            const isDropdownOpen = openStatusId === vehicle.id;

            return (
              <div 
                key={vehicle.id} 
                onClick={() => onSelectVehicle(vehicle.id)}
                className={`group bg-slate-900/40 backdrop-blur-sm border-l-4 ${borderColorClass} border-y border-r border-slate-800/60 rounded-2xl p-4 hover:bg-slate-800/60 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden ${isStale && userRole === 'owner' ? 'shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]' : ''}`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Imagem: Topo no Mobile, Esquerda no Desktop */}
                    <div className="w-full h-48 md:w-64 md:h-44 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-800">
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
                        {/* Mobile Status Badge Overlay */}
                        <div className="absolute top-2 right-2 md:hidden">
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-md uppercase tracking-wide border ${getStatusColor(vehicle.status)}`}>
                                {getStatusLabel(vehicle.status)}
                             </span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full flex flex-col justify-between">
                        <div>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg md:text-xl font-bold text-white truncate">{vehicle.make} {vehicle.model}</h3>
                                        {isStale && userRole === 'owner' && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full animate-pulse shrink-0">
                                                <Clock size={10} />
                                                +60 Dias
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-300 font-medium text-sm md:text-base truncate">{versionLabel}</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar size={12} className="text-slate-500" />
                                        <span>Entrada: {addedDate}</span>
                                    </div>
                                </div>
                                
                                {/* Status Dropdown - Desktop Only */}
                                <div className="relative group min-w-[140px] hidden md:block" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => setOpenStatusId(isDropdownOpen ? null : vehicle.id)}
                                        className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-full shadow-lg transition-all cursor-pointer border ${getStatusColor(vehicle.status)}`}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-wide truncate">
                                            {getStatusLabel(vehicle.status)}
                                        </span>
                                        {vehicle.status !== 'sold' && <ChevronDown size={14} className={`opacity-80 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                                    </button>
                                    
                                    {isDropdownOpen && vehicle.status !== 'sold' && (
                                        <div className="absolute top-full right-0 mt-2 w-48 dropdown-panel overflow-hidden z-20 animate-fade-in origin-top-right">
                                            {[
                                                { val: 'available', label: 'Em Estoque', color: 'text-emerald-400' },
                                                { val: 'reserved', label: 'Reservado', color: 'text-amber-400' },
                                                { val: 'preparation', label: 'Preparação', color: 'text-indigo-400' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.val}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusUpdate(vehicle, opt.val as VehicleStatus);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm dropdown-item flex items-center justify-between"
                                                >
                                                    <span className={opt.color.includes('text') ? opt.color : ''}>{opt.label}</span>
                                                    {vehicle.status === opt.val && <Check size={14} className="text-emerald-400"/>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {vehicle.status === 'reserved' && vehicle.reservationDetails && (
                                <div className="mb-3 flex flex-col gap-1 text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded text-amber-200">
                                    <div className="flex items-center gap-2">
                                        <Lock size={12} />
                                        <span className="truncate">Reservado para <strong>{vehicle.reservationDetails.reservedBy}</strong></span>
                                    </div>
                                    <span className="opacity-80">Sinal: {formatCurrency(vehicle.reservationDetails.signalValue)}</span>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-slate-500 text-xs bg-slate-800/50 px-2 py-0.5 rounded border border-slate-800 uppercase font-mono">{plateLabel}</span>
                                
                                <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${vehicle.ipvaPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {vehicle.ipvaPaid ? <FileCheck size={10} /> : <FileX size={10} />} IPVA
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${vehicle.licensingPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {vehicle.licensingPaid ? <FileCheck size={10} /> : <FileX size={10} />} Licenciamento
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                                    <Calendar size={12} className="text-indigo-400" /> {yearLabel}
                                </div>
                                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                                    <Fuel size={12} className="text-indigo-400" /> {fuelLabel}
                                </div>
                                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                                    <span className="font-bold text-indigo-400 text-[10px]">KM</span> {kmLabel}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS - DESKTOP VIEW */}
                    <div className="hidden md:flex flex-col items-end justify-between min-w-[160px] pl-6 border-l border-slate-800">
                        <div className="text-right w-full">
                            <p className="text-xs text-slate-500 mb-1">Preço de Venda</p>
                            <p className="text-2xl font-bold text-white tracking-tight truncate">{formatCurrency(vehicle.expectedSalePrice)}</p>
                            
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
                                    variant="success"
                                    className="w-full font-bold"
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
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => handleShareClick(e, vehicle)}
                                    className={`flex-1 ${canShare ? 'text-slate-300' : 'text-slate-500'}`}
                                    icon={canShare ? <Share2 size={16} /> : <Lock size={14} />}
                                >
                                    Compartilhar
                                </Button>
                                {userRole === 'owner' && onDeleteVehicle && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDelete({ open: true, vehicle });
                                        }} 
                                        className="px-3 border border-slate-800 bg-slate-900 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full transition-colors flex items-center justify-center"
                                        title="Excluir Veículo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS - MOBILE VIEW (Bottom Bar) */}
                <div className="flex flex-col md:hidden gap-3 mt-2 pt-3 border-t border-slate-800/50">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500">Valor</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(vehicle.expectedSalePrice)}</p>
                    </div>
                    
                    {vehicle.status !== 'sold' && (
                        <div className="flex gap-2">
                            {canManageSales && vehicle.status !== 'preparation' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickSaleVehicle(vehicle);
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm"
                                >
                                    <DollarSign size={18} />
                                    VENDER
                                </button>
                            )}
                            <button 
                                onClick={(e) => handleShareClick(e, vehicle)}
                                className={`flex-1 px-4 rounded-xl border flex items-center justify-center gap-2 active:bg-slate-700 transition-colors ${
                                    canShare
                                    ? 'bg-slate-800 text-white border-slate-700'
                                    : 'bg-slate-900 text-slate-600 border-slate-800'
                                }`}
                            >
                                {canShare ? <Share2 size={18} /> : <Lock size={18} />}
                                <span className="text-sm font-semibold">Compartilhar</span>
                            </button>
                            {userRole === 'owner' && onDeleteVehicle && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDelete({ open: true, vehicle });
                                    }} 
                                    className="px-4 rounded-xl border border-slate-800 bg-slate-900 text-rose-500 flex items-center justify-center active:bg-rose-500 active:text-white transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
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



