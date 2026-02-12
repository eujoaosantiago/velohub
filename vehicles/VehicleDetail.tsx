
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Vehicle, Expense, Buyer, VehicleStatus, UserRole, PlanType, checkPermission, ExpenseCategory } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatCurrency, calculateTotalExpenses, calculateROI, isValidCPF, isValidPlate, maskCurrencyInput, parseCurrencyInput, maskCPF, maskPhone, getBrazilDateISO, parseISODate, fetchCepInfo, maskRenavam, maskChassis } from '../lib/utils';
import { ArrowLeft, Camera, DollarSign, Share2, Save, Trash2, Tag, AlertTriangle, User, FileText, Phone, Edit2, X, Search, Lock, Upload, ArrowRightLeft, Printer, ChevronDown, Check, Wrench, Circle, AlertCircle, CheckCircle, RotateCcw, TrendingUp, TrendingDown, Minus, Briefcase, Plus, Wallet, RefreshCw, FileCheck, CheckCircle2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { FipeApi, FipeBrand, FipeModel, FipeYear } from '../services/fipeApi';
import { PLAN_CONFIG, getPlanLimits } from '../lib/plans';
import { sanitizeInput } from '../lib/security';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { ContractModal } from '../components/ContractModal';
import { ShareModal } from '../components/ShareModal';
import { ReservationModal } from '../components/ReservationModal';
import { Confetti } from '../components/ui/Confetti';
import { useVelohub } from '../contexts/VelohubContext';

interface VehicleDetailProps {
  vehicle: Vehicle;
  allVehicles?: Vehicle[];
  isNew?: boolean;
  onBack: () => void;
  onUpdate: (updatedVehicle: Vehicle) => Promise<void>; 
  onDelete: () => void;
  userRole: UserRole;
  userPlan?: PlanType;
  onCreateTradeIn?: (tradeInVehicle: Vehicle) => Promise<void>; 
}

type Tab = 'overview' | 'expenses' | 'photos' | 'sell';

const maskPlate = (value: string) => {
  const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (v.length > 7) return v.slice(0, 7);
  return v;
};

// Expense Categories
const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
    { id: 'maintenance', label: 'Manutenção' },
    { id: 'bodywork', label: 'Funilaria' },
    { id: 'tires', label: 'Pneus' },
    { id: 'document', label: 'Documentação' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'salary', label: 'Comissão (Despesa)' },
    { id: 'other', label: 'Outros' },
];

const FipeSearch: React.FC<{ 
    brands: FipeBrand[], 
    models: FipeModel[], 
    years: FipeYear[],
    selectedBrand: string,
    selectedModel: string,
    selectedYear: string,
    onBrandChange: (e: any) => void,
    onModelChange: (e: any) => void,
    onYearChange: (e: any) => void,
    isLoading: boolean,
    onRetry: () => void
}> = ({ brands, models, years, selectedBrand, selectedModel, selectedYear, onBrandChange, onModelChange, onYearChange, isLoading, onRetry }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6 animate-fade-in relative">
        {isLoading && <div className="absolute inset-0 bg-slate-900/50 z-10 flex items-center justify-center rounded-xl"><RefreshCw className="animate-spin text-indigo-500" /></div>}
        
        <div>
            <label className="text-xs text-slate-400 block mb-1 flex justify-between">
                1. Marca
                {brands.length === 0 && !isLoading && (
                    <button onClick={onRetry} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <RefreshCw size={10} /> Recarregar
                    </button>
                )}
            </label>
            <select className="w-full select-premium text-sm" value={selectedBrand} onChange={onBrandChange} disabled={isLoading}>
                <option value="">{isLoading ? 'Carregando...' : 'Selecione...'}</option>
                {Array.isArray(brands) && brands.map(b => (<option key={b.codigo} value={b.codigo}>{b.nome}</option>))}
            </select>
        </div>
        <div>
            <label className="text-xs text-slate-400 block mb-1">2. Modelo</label>
            <select className="w-full select-premium text-sm" value={selectedModel} onChange={onModelChange} disabled={!selectedBrand || isLoading}>
                <option value="">Selecione...</option>
                {Array.isArray(models) && models.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}
            </select>
        </div>
        <div>
            <label className="text-xs text-slate-400 block mb-1">3. Ano/Versão</label>
            <select className="w-full select-premium text-sm" value={selectedYear} onChange={onYearChange} disabled={!selectedModel || isLoading}>
                <option value="">Selecione...</option>
                {Array.isArray(years) && years.map(y => (<option key={y.codigo} value={y.codigo}>{y.nome}</option>))}
            </select>
        </div>
    </div>
);

const STATUS_OPTIONS = [
    { value: 'available', label: 'Em Estoque', color: 'bg-emerald-500 text-white' },
    { value: 'reserved', label: 'Reservado', color: 'bg-amber-500 text-white' },
    { value: 'preparation', label: 'Preparação', color: 'bg-indigo-500 text-white' },
];

export const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, allVehicles = [], isNew = false, onBack, onUpdate, onDelete, userRole, userPlan = 'starter', onCreateTradeIn }) => {
  const { user: currentUser } = useVelohub();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
    const prevTabRef = useRef<Tab>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Vehicle>(vehicle);
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [showContract, setShowContract] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);
  const [shareVehicle, setShareVehicle] = useState<Vehicle | null>(null);

  const [useFipeSearch, setUseFipeSearch] = useState(true);
  const [fipeData, setFipeData] = useState<{ brands: FipeBrand[], models: FipeModel[], years: FipeYear[] }>({ brands: [], models: [], years: [] });
  const [fipeSelection, setFipeSelection] = useState({ brand: '', model: '', year: '' });
  const [isLoadingFipe, setIsLoadingFipe] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
    const [cameraState, setCameraState] = useState({ isOpen: false, isUploading: false });
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ total: 0, done: 0 });
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
    const [dragOverPhotoIndex, setDragOverPhotoIndex] = useState<number | null>(null);
    const [recentlyMovedIndex, setRecentlyMovedIndex] = useState<number | null>(null);
    const moveTimerRef = useRef<number | null>(null);
    const [cameraZoom, setCameraZoom] = useState(1);
    const [cameraZoomRange, setCameraZoomRange] = useState<{ min: number; max: number }>({ min: 1, max: 1 });
    const [cameraHasZoom, setCameraHasZoom] = useState(false);
    const [cameraTorchOn, setCameraTorchOn] = useState(false);
    const [cameraHasTorch, setCameraHasTorch] = useState(false);
    const videoTrackRef = useRef<MediaStreamTrack | null>(null);
    const lastSavedPhotosRef = useRef<string>(JSON.stringify(vehicle.photos || []));
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [photoIndex, setPhotoIndex] = useState(0); // Índice da foto atual no carrossel

  const [expenseData, setExpenseData] = useState({ 
      desc: '', 
      amount: '', 
      category: 'maintenance' as ExpenseCategory,
      employeeName: '' 
  });
  const [activeExpenseFilter, setActiveExpenseFilter] = useState<ExpenseCategory | 'all'>('all');
  
  const calculateDefaultCommission = () => {
      if (vehicle.saleCommission && vehicle.saleCommission > 0) return vehicle.saleCommission;
      return vehicle.expenses
          .filter(e => e.category === 'salary')
          .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getDefaultCommissionTo = () => {
      if (vehicle.saleCommissionTo) return vehicle.saleCommissionTo;
      const lastSalaryExpense = vehicle.expenses.filter(e => e.category === 'salary').pop();
      return lastSalaryExpense?.employeeName || '';
  };

  const [saleData, setSaleData] = useState({
      // Se já foi vendido, prioriza o valor de venda real
      price: maskCurrencyInput(
          (vehicle.soldPrice ?? vehicle.expectedSalePrice ?? 0) * 100
              ? ((vehicle.soldPrice ?? vehicle.expectedSalePrice ?? 0) * 100).toString()
              : '0'
      ),
      commission: maskCurrencyInput((calculateDefaultCommission() * 100).toString()), 
      commissionTo: getDefaultCommissionTo(),
      date: vehicle.soldDate || getBrazilDateISO(), // Usa data da venda se já vendido, senão data atual
      method: vehicle.paymentMethod || 'Pix / Transferência',
      buyerName: vehicle.buyer?.name || '',
      buyerCpf: vehicle.buyer?.cpf || '',
      buyerPhone: vehicle.buyer?.phone || '',
      buyerCep: vehicle.buyer?.cep || '',
      buyerStreet: vehicle.buyer?.street || '',
      buyerNumber: vehicle.buyer?.number || '',
    buyerNeighborhood: vehicle.buyer?.neighborhood || '',
    buyerCity: vehicle.buyer?.city || '',
    buyerState: vehicle.buyer?.state || '',
      paymentAmountText: vehicle.paymentDetails?.amountText || '',
      paymentMethodDetail: vehicle.paymentDetails?.methodDetail || '',
      paymentDateDetail: vehicle.paymentDetails?.paymentDateDetail || '',
      warrantyTime: vehicle.warrantyDetails?.time || '90 dias',
      warrantyKm: vehicle.warrantyDetails?.km || '3.000 km',
      tradeIn: {
          make: '',
          model: '',
          version: '',
          yearFab: new Date().getFullYear().toString(),
          yearModel: new Date().getFullYear().toString(),
          plate: '',
          renavam: '',
          chassis: '',
          color: '',
          km: '',
          value: ''
      }
  });

    const handleBuyerCepBlur = async () => {
        if (isSold) return;
        try {
            const info = await fetchCepInfo(saleData.buyerCep);
            if (!info) return;
            setSaleData(prev => ({
                ...prev,
                buyerStreet: prev.buyerStreet || info.street,
                buyerNeighborhood: prev.buyerNeighborhood || info.neighborhood,
                buyerCity: prev.buyerCity || info.city,
                buyerState: prev.buyerState || info.state
            }));
        } catch (err) {
            console.error('CEP lookup failed', err);
        }
    };

  // Atualiza a data quando o veículo muda, quando ganha foco ou periodicamente
  useEffect(() => {
    const updateDate = () => {
      if (!vehicle.soldDate) {
        const newDate = getBrazilDateISO();
        console.log('📅 VehicleDetail - Atualizando data:', newDate, new Date().toISOString());
        setSaleData(prev => ({ ...prev, date: newDate }));
      }
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
  }, [vehicle.id, vehicle.soldDate]);

  const canViewCosts = checkPermission(currentUser || null, 'view_costs');
  const canManageSales = checkPermission(currentUser || null, 'manage_sales');
  
  const currentLimits = currentUser ? getPlanLimits(currentUser) : PLAN_CONFIG['free'];
  const canShare = (currentLimits.showShareLink ?? false) && checkPermission(currentUser || null, 'share_vehicles');

  // Helper para comparação segura de valores
  const safeCompare = (a: any, b: any) => {
      // Trata undefined/null/false como iguais para booleanos
      if (typeof a === 'boolean' || typeof b === 'boolean') {
          return !!a === !!b;
      }
      // Trata strings vazias e null/undefined como iguais
      if (!a && !b) return true;
      return a === b;
  };

  const dirtyState = useMemo(() => {
      const compareExpenses = (a: Expense[], b: Expense[]) => JSON.stringify(a) !== JSON.stringify(b);
      const comparePhotos = (a: string[], b: string[]) => JSON.stringify(a) !== JSON.stringify(b);
      
      const isOverviewDirty = 
          !safeCompare(formData.make, vehicle.make) ||
          !safeCompare(formData.model, vehicle.model) ||
          !safeCompare(formData.version, vehicle.version) ||
          formData.year !== vehicle.year ||
          !safeCompare(formData.plate, vehicle.plate) ||
          !safeCompare(formData.renavam, vehicle.renavam) ||
          !safeCompare(formData.chassis, vehicle.chassis) ||
          formData.km !== vehicle.km ||
          !safeCompare(formData.color, vehicle.color) ||
          formData.purchasePrice !== vehicle.purchasePrice ||
          formData.expectedSalePrice !== vehicle.expectedSalePrice ||
          formData.fipePrice !== vehicle.fipePrice ||
          formData.status !== vehicle.status ||
          !!formData.ipvaPaid !== !!vehicle.ipvaPaid ||
          !!formData.licensingPaid !== !!vehicle.licensingPaid;

      const isPhotosDirty = comparePhotos(formData.photos, vehicle.photos);
      const isExpensesDirty = compareExpenses(formData.expenses, vehicle.expenses);

      return {
          hasChanges: isOverviewDirty || isPhotosDirty || isExpensesDirty,
          isOverviewDirty,
          isPhotosDirty,
          isExpensesDirty
      };
  }, [formData, vehicle]);

  // Sincroniza o estado local com a prop quando o registro é atualizado no banco
  useEffect(() => {
      setFormData(vehicle);
      lastSavedPhotosRef.current = JSON.stringify(vehicle.photos || []);
  }, [vehicle]);

  useEffect(() => {
    if (isNew || (useFipeSearch && fipeData.brands.length === 0)) {
        loadBrands();
    }
  }, [isNew, useFipeSearch]);

  // ... (Camera and FIPE effects omitted for brevity) ...
  useEffect(() => {
      let stream: MediaStream | null = null;
      const startCamera = async () => {
          if (cameraState.isOpen && videoRef.current) {
              try {
                  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                  const videoTrack = stream.getVideoTracks()[0] || null;
                  videoTrackRef.current = videoTrack;
                  if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
                      const caps = videoTrack.getCapabilities() as MediaTrackCapabilities & { zoom?: { min?: number; max?: number }; torch?: boolean };
                      const zoomCaps = caps.zoom;
                      const hasZoom = !!zoomCaps && typeof zoomCaps.min === 'number' && typeof zoomCaps.max === 'number';
                      setCameraHasZoom(hasZoom);
                      if (hasZoom) {
                          const min = zoomCaps?.min ?? 1;
                          const max = zoomCaps?.max ?? 1;
                          setCameraZoomRange({ min, max });
                          setCameraZoom(min);
                      }

                      const hasTorch = !!(caps as any).torch;
                      setCameraHasTorch(hasTorch);
                      setCameraTorchOn(false);
                  }
                  if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                      videoRef.current.play().catch(e => console.log("Play error", e));
                  }
              } catch (err) {
                  showToast("Não foi possível acessar a câmera.", "error");
                  setCameraState(prev => ({ ...prev, isOpen: false }));
              }
          }
      };
      if (cameraState.isOpen) startCamera();
      return () => {
          if (videoTrackRef.current) {
              videoTrackRef.current.stop();
              videoTrackRef.current = null;
          }
          if (stream) stream.getTracks().forEach(track => track.stop());
          setCameraHasZoom(false);
          setCameraHasTorch(false);
          setCameraTorchOn(false);
      };
  }, [cameraState.isOpen]);

  const applyCameraZoom = async (value: number) => {
      setCameraZoom(value);
      const track = videoTrackRef.current;
      if (!track || typeof track.applyConstraints !== 'function') return;
      try {
          await track.applyConstraints({ advanced: [{ zoom: value }] } as unknown as MediaTrackConstraints);
      } catch (err) {
          console.warn('Zoom não suportado', err);
      }
  };

  const toggleCameraTorch = async () => {
      const track = videoTrackRef.current;
      if (!track || typeof track.applyConstraints !== 'function') return;
      const next = !cameraTorchOn;
      try {
          await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
          setCameraTorchOn(next);
      } catch (err) {
          console.warn('Torch não suportado', err);
      }
  };

  const capturePhoto = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setCameraState(prev => ({ ...prev, isUploading: true }));
      try {
          const toBlob = (type: string, quality: number) =>
              new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));

          let blob = await toBlob('image/webp', 0.9);
          if (!blob) blob = await toBlob('image/jpeg', 0.9);
          if (!blob) throw new Error('Falha ao capturar imagem');

          await handlePhotoUpload(blob);
      } catch (err) {
          showToast("Erro ao capturar foto.", "error");
      } finally {
          setCameraState(prev => ({ ...prev, isUploading: false }));
      }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  };

  const markPhotoMoved = (index: number) => {
      setRecentlyMovedIndex(index);
      if (moveTimerRef.current) {
          window.clearTimeout(moveTimerRef.current);
      }
      moveTimerRef.current = window.setTimeout(() => {
          setRecentlyMovedIndex(null);
      }, 300);
  };

  const savePhotoOrder = async () => {
      const currentPhotos = JSON.stringify(formData.photos || []);
      if (currentPhotos === lastSavedPhotosRef.current) return;
      try {
          await onUpdate({ ...formData, photos: formData.photos });
          lastSavedPhotosRef.current = currentPhotos;
          showToast('Ordem das fotos salva.', 'success');
      } catch (err) {
          console.error(err);
          showToast('Erro ao salvar ordem das fotos.', 'error');
      }
  };

  useEffect(() => {
      const previousTab = prevTabRef.current;
      if (previousTab === 'photos' && activeTab !== 'photos') {
          if (!isNew && !isPhotoUploading) {
              void savePhotoOrder();
          }
      }
      prevTabRef.current = activeTab;
  }, [activeTab, isNew, isPhotoUploading]);

  useEffect(() => {
      if (!isNew && !isPhotoUploading && activeTab !== 'photos') {
          void savePhotoOrder();
      }
  }, [activeTab, isNew, isPhotoUploading, formData.photos]);

  const loadBrands = async () => {
      setIsLoadingFipe(true);
      try {
        const brands = await FipeApi.getBrands();
        setFipeData(prev => ({ ...prev, brands }));
      } catch (e) {
        showToast("Erro ao carregar tabela FIPE.", "error");
      } finally {
        setIsLoadingFipe(false);
      }
  };

    const splitModelVersion = (fullName: string) => {
        const trimmed = fullName.trim();
        if (!trimmed) return { model: '', version: '' };
        const tokens = trimmed.split(/\s+/);
        if (tokens.length === 1) {
            return { model: trimmed, version: '' };
        }

        const isMarker = (token: string) => /\d/.test(token) || (/^[A-Z]{2,}$/.test(token) && token.length >= 2);
        let splitIndex = tokens.findIndex((token, index) => index > 0 && isMarker(token));
        if (splitIndex === -1) {
            splitIndex = 1;
        }

        const model = tokens.slice(0, splitIndex).join(' ');
        const version = tokens.slice(splitIndex).join(' ');
        return { model, version };
    };

    const getBestModelPrefix = (fullName: string) => {
        const normalizedFull = fullName.toLowerCase();
        let bestMatch = '';

        fipeData.models.forEach((m) => {
            const name = (m.nome || '').trim();
            if (!name) return;
            const normalizedName = name.toLowerCase();
            if (normalizedFull.startsWith(normalizedName) && name.length > bestMatch.length) {
                bestMatch = name;
            }
        });

        return bestMatch;
    };

  const handleFipeChange = async (type: 'brand' | 'model' | 'year', value: string) => {
      setFipeSelection(prev => ({ ...prev, [type]: value }));
      setIsLoadingFipe(true);

      if (type === 'brand') {
          const models = await FipeApi.getModels(value);
          setFipeData(prev => ({ ...prev, models, years: [] }));
          setFipeSelection(prev => ({ ...prev, model: '', year: '' }));
          const brandName = fipeData.brands.find(b => b.codigo === value)?.nome || '';
          setFormData(prev => ({ ...prev, make: brandName }));
      } else if (type === 'model') {
          const years = await FipeApi.getYears(fipeSelection.brand, value);
          setFipeData(prev => ({ ...prev, years }));
          setFipeSelection(prev => ({ ...prev, year: '' }));
          const modelName = fipeData.models.find(m => m.codigo === value)?.nome || '';
          setFormData(prev => ({ ...prev, model: modelName }));
      } else if (type === 'year') {
          const details = await FipeApi.getDetails(fipeSelection.brand, fipeSelection.model, value);
          if (details) {
              const fipeVal = parseFloat(details.Valor.replace(/[^\d,]/g, '').replace(',', '.'));
              const modelName = fipeData.models.find(m => m.codigo === fipeSelection.model)?.nome || '';
              const fullName = details.Modelo || modelName;
              const bestPrefix = modelName || getBestModelPrefix(fullName);
              let model = modelName;
              let version = '';

              if (bestPrefix && fullName.toLowerCase().startsWith(bestPrefix.toLowerCase()) && fullName.length > bestPrefix.length) {
                  model = bestPrefix;
                  version = fullName.slice(bestPrefix.length).trim();
              } else {
                  const split = splitModelVersion(fullName);
                  model = split.model || modelName;
                  version = split.version;
              }
              setFormData(prev => ({
                  ...prev,
                  year: details.AnoModelo,
                  fuel: details.Combustivel,
                  fipePrice: fipeVal,
                  model: model || prev.model,
                  version: version || fullName
              }));
          }
      }
      setIsLoadingFipe(false);
  };

  const handleChange = (field: keyof Vehicle, value: any) => {
      if (field === 'plate') value = maskPlate(value);
      if (field === 'renavam') value = maskRenavam(value);
      if (field === 'chassis') value = maskChassis(value);
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMaskedValue = (val: number) => {
      return maskCurrencyInput((val * 100).toFixed(0));
  };

  const handleSave = async () => {
      if (formData.plate && !isValidPlate(formData.plate)) {
          showToast("Placa inválida. Use o padrão ABC1234 ou ABC1D23.", "error");
          return;
      }
      if (!Number.isFinite(formData.km) || formData.km < 0) {
          showToast("Quilometragem inválida. Informe um número positivo.", "error");
          return;
      }
      setIsSaving(true);
      try {
          await onUpdate(formData);
          // Força a atualização local para coincidir com o que foi salvo, 
          // caso o refreshData demore ou a prop vehicle não mude imediatamente.
          if (!isNew) {
              // setFormData(formData); // Opcional, o useEffect deve cuidar disso via prop
              showToast("Alterações salvas com sucesso!", "success");
          }
      } catch (e) {
          console.error(e);
          showToast("Erro ao salvar alterações.", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDiscard = () => {
      if (window.confirm("Descartar todas as alterações não salvas?")) {
          setFormData(vehicle);
          showToast("Alterações descartadas.", "success");
      }
  };

  const handleBackGuard = () => {
      if (dirtyState.hasChanges && !isNew) {
          if (window.confirm("Você tem alterações não salvas. Deseja sair e perder as edições?")) {
              onBack();
          }
      } else {
          onBack();
      }
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
  };

  const handleStatusChange = async (newStatus: VehicleStatus) => {
      setIsStatusOpen(false);
      if (newStatus === 'reserved') {
          setShowReservation(true);
      } else {
          setFormData(prev => ({ ...prev, status: newStatus, reservationDetails: undefined }));
      }
  };

  const handleConfirmReservation = async (vehicleId: string, reservedBy: string, signalValue: number, reservedByPhone?: string) => {
      setFormData(prev => ({
          ...prev,
          status: 'reserved' as VehicleStatus,
          reservationDetails: { reservedBy, signalValue, reservedByPhone, reservationDate: new Date().toISOString() }
      }));
      setShowReservation(false);
  };

  // Função para comprimir e redimensionar imagens antes do upload
  const compressImage = async (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);

          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;

              img.onload = () => {
                  // Calcula novas dimensões mantendo aspect ratio
                  let width = img.width;
                  let height = img.height;

                  if (width > maxWidth) {
                      height = (height * maxWidth) / width;
                      width = maxWidth;
                  }

                  // Cria canvas e desenha imagem redimensionada
                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;

                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                      reject(new Error('Não foi possível criar contexto do canvas'));
                      return;
                  }

                  ctx.drawImage(img, 0, 0, width, height);

                  const baseName = file.name.replace(/\.[^/.]+$/, '') || 'photo';
                  const canvasToBlob = (type: string, q: number) =>
                      new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));

                  (async () => {
                      let blob = await canvasToBlob('image/webp', quality);
                      let fileType = 'image/webp';
                      let extension = 'webp';

                      if (!blob) {
                          blob = await canvasToBlob('image/jpeg', quality);
                          fileType = 'image/jpeg';
                          extension = 'jpg';
                      }

                      if (!blob) {
                          reject(new Error('Erro ao comprimir imagem'));
                          return;
                      }

                      const compressedFile = new File([blob], `${baseName}.${extension}`, {
                          type: fileType,
                          lastModified: Date.now(),
                      });

                      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
                      const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
                      console.log(`📸 Imagem comprimida: ${originalSizeMB}MB → ${compressedSizeMB}MB (${width}x${height}px)`);

                      resolve(compressedFile);
                  })().catch(reject);
              };

              img.onerror = () => reject(new Error('Erro ao carregar imagem'));
          };

          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement> | Blob) => {
      setCameraState(prev => ({ ...prev, isUploading: true }));
      setIsPhotoUploading(true);
      try {
          let files: File[] = [];

          if (e instanceof Blob) {
              files = [new File([e], "camera.webp", { type: "image/webp" })];
          } else {
              const target = (e as React.ChangeEvent<HTMLInputElement>).target;
              if (target.files && target.files.length > 0) {
                  files = Array.from(target.files);
              } else {
                  setCameraState(prev => ({ ...prev, isUploading: false }));
                  setIsPhotoUploading(false);
                  setUploadProgress({ total: 0, done: 0 });
                  return;
              }
          }

          const newUrls: string[] = [];
          setUploadProgress({ total: files.length, done: 0 });

          for (const f of files) {
              // Comprime a imagem antes de enviar
              const compressedFile = await compressImage(f);
              const url = await StorageService.uploadPhoto(compressedFile, vehicle.storeId);
              newUrls.push(url);
              setUploadProgress(prev => ({ ...prev, done: prev.done + 1 }));
          }

          setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newUrls] }));
          setPhotoIndex(0); // Reseta para primeira foto ao adicionar novas

      } catch (err) {
          showToast("Erro ao enviar foto.", "error");
          throw err;
      } finally {
          setCameraState(prev => ({ ...prev, isUploading: false }));
          setIsPhotoUploading(false);
          setUploadProgress({ total: 0, done: 0 });
      }
  };

  const handlePhotoDelete = async (index: number) => {
      setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
      // Ajusta o índice se a foto deletada era a atual ou posterior
      setPhotoIndex(prev => {
          const newLength = formData.photos.length - 1;
          if (newLength === 0) return 0;
          if (prev >= newLength) return newLength - 1;
          return prev;
      });
  };

  const handleCpfChange = (val: string) => {
      const masked = maskCPF(val);
      setSaleData(prev => ({ ...prev, buyerCpf: masked }));

      if (masked.length === 14) {
          const cleanCpf = masked.replace(/\D/g, '');
          const existingCustomer = allVehicles
              .filter(v => v.buyer?.cpf?.replace(/\D/g, '') === cleanCpf)
              .sort((a, b) => (parseISODate(b.soldDate)?.getTime() || 0) - (parseISODate(a.soldDate)?.getTime() || 0))[0]; 

          if (existingCustomer && existingCustomer.buyer) {
              setSaleData(prev => ({
                  ...prev,
                  buyerName: existingCustomer.buyer!.name,
                  buyerPhone: existingCustomer.buyer!.phone,
                  buyerCep: existingCustomer.buyer!.cep || '',
                  buyerStreet: existingCustomer.buyer!.street || '',
                  buyerNumber: existingCustomer.buyer!.number || '',
                  buyerNeighborhood: existingCustomer.buyer!.neighborhood || '',
                  buyerCity: existingCustomer.buyer!.city || '',
                  buyerState: existingCustomer.buyer!.state || ''
              }));
          }
      }
  };

  const handleSale = async () => {
      let priceInput = parseCurrencyInput(saleData.price) || 0;
      const tradeInVal = parseCurrencyInput(saleData.tradeIn.value) || 0;
      
      if (priceInput < 0) return showToast("Valor de venda inválido.", "error");
      if (priceInput === 0 && saleData.method !== 'Troca + Volta') return showToast("A venda precisa ter um valor.", "error");
      
      if (!saleData.buyerName) return showToast("Nome do comprador obrigatório", "error");
      if (!saleData.buyerCpf || !isValidCPF(saleData.buyerCpf)) {
          return showToast("CPF inválido ou não preenchido.", "error");
      }
      if (!saleData.buyerCep || !saleData.buyerStreet || !saleData.buyerNumber || !saleData.buyerNeighborhood || !saleData.buyerCity || !saleData.buyerState) {
          return showToast("Endereço do comprador obrigatório (CEP, logradouro, número, bairro, cidade e UF).", "error");
      }
      if (!saleData.paymentAmountText || !saleData.paymentMethodDetail || !saleData.paymentDateDetail) {
          return showToast("Detalhes de pagamento obrigatórios (valor por extenso, forma e data).", "error");
      }

      const commissionVal = parseCurrencyInput(saleData.commission);

      let finalSoldPrice = priceInput;
      if (saleData.method === 'Troca + Volta') {
          finalSoldPrice = priceInput + tradeInVal;
      }

      const buyer: Buyer = {
          name: sanitizeInput(saleData.buyerName),
          cpf: sanitizeInput(saleData.buyerCpf),
          phone: sanitizeInput(saleData.buyerPhone),
          cep: sanitizeInput(saleData.buyerCep),
          street: sanitizeInput(saleData.buyerStreet),
          number: sanitizeInput(saleData.buyerNumber),
          neighborhood: sanitizeInput(saleData.buyerNeighborhood),
          city: sanitizeInput(saleData.buyerCity),
          state: sanitizeInput(saleData.buyerState)
      };

      // --- LOGICA DE COMISSÃO COMO GASTO REAL ---
      let updatedExpenses = [...formData.expenses]; // Usa os gastos atuais do formulário
      
      // FIX: Verifica o quanto já existe de despesa de comissão lançada para não duplicar
      const existingCommissionSum = updatedExpenses
          .filter(e => e.category === 'salary')
          .reduce((acc, e) => acc + e.amount, 0);

      const commissionDifference = commissionVal - existingCommissionSum;
      
      if (commissionDifference > 0.01) { 
          const commExpense: Expense = {
              id: Math.random().toString(), 
              vehicleId: vehicle.id,
              description: 'Comissão de Venda',
              amount: commissionDifference,
              date: saleData.date,
              category: 'salary',
              employeeName: saleData.commissionTo || undefined
          };
          updatedExpenses.push(commExpense);
      }

      const saleUpdate: Partial<Vehicle> = {
          status: 'sold',
          soldPrice: finalSoldPrice,
          soldDate: saleData.date,
          paymentMethod: saleData.method,
          paymentDetails: {
              amountText: sanitizeInput(saleData.paymentAmountText),
              methodDetail: sanitizeInput(saleData.paymentMethodDetail),
              paymentDateDetail: sanitizeInput(saleData.paymentDateDetail)
          },
          saleCommission: 0,
          saleCommissionTo: saleData.commissionTo,
          buyer,
          warrantyDetails: {
              time: saleData.warrantyTime,
              km: saleData.warrantyKm
          },
          expenses: updatedExpenses
      };
      
      console.log('💾 VehicleDetail - Salvando venda com data:', saleData.date, '| Date atual:', new Date().toISOString());

      if (saleData.method === 'Troca + Volta') {
          if (!saleData.tradeIn.make || !saleData.tradeIn.model || !saleData.tradeIn.value) {
              return showToast("Preencha os dados do veículo de troca (Marca, Modelo e Valor).", "error");
          }
          if (!saleData.tradeIn.version || !saleData.tradeIn.yearFab || !saleData.tradeIn.yearModel || !saleData.tradeIn.plate || !saleData.tradeIn.renavam || !saleData.tradeIn.chassis || !saleData.tradeIn.color || !saleData.tradeIn.km) {
              return showToast("Preencha todos os dados do veículo de troca (versão, anos, placa, renavam, chassi, cor e KM).", "error");
          }
          saleUpdate.tradeInInfo = {
              make: sanitizeInput(saleData.tradeIn.make),
              model: sanitizeInput(saleData.tradeIn.model),
              version: sanitizeInput(saleData.tradeIn.version),
              yearFab: sanitizeInput(saleData.tradeIn.yearFab),
              yearModel: sanitizeInput(saleData.tradeIn.yearModel),
              plate: maskPlate(saleData.tradeIn.plate),
              renavam: sanitizeInput(saleData.tradeIn.renavam),
              chassis: sanitizeInput(saleData.tradeIn.chassis),
              color: sanitizeInput(saleData.tradeIn.color),
              km: sanitizeInput(saleData.tradeIn.km),
              value: tradeInVal
          };
      }

      try {
          setIsSaving(true);
          await onUpdate({ ...vehicle, ...saleUpdate });

          if (saleData.method === 'Troca + Volta' && onCreateTradeIn) {
              const tradeInVehicle: Vehicle = {
                  id: Math.random().toString(),
                  storeId: vehicle.storeId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  make: sanitizeInput(saleData.tradeIn.make),
                  model: sanitizeInput(saleData.tradeIn.model),
                  version: sanitizeInput(saleData.tradeIn.version) || 'Entrada via Troca',
                  year: parseInt(saleData.tradeIn.yearModel) || parseInt(saleData.tradeIn.yearFab) || new Date().getFullYear(),
                  plate: maskPlate(saleData.tradeIn.plate),
                  km: parseInt(saleData.tradeIn.km) || 0,
                  fuel: 'Flex',
                  transmission: 'Automático',
                  color: sanitizeInput(saleData.tradeIn.color),
                  status: 'available',
                  purchasePrice: tradeInVal,
                  purchaseDate: saleData.date,
                  expectedSalePrice: tradeInVal * 1.2,
                  fipePrice: 0,
                  photos: [],
                  expenses: []
              };
              await onCreateTradeIn(tradeInVehicle);
          } 
          
          setFormData(prev => ({ ...prev, ...saleUpdate }));
          setShowSaleSuccess(true); 

      } catch (err) {
          console.error(err);
          showToast("Erro ao processar venda.", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleAddExpense = async () => {
      if(!expenseData.desc) {
          showToast("Informe a descrição do gasto.", "error");
          return;
      }
      
      const amountVal = parseCurrencyInput(expenseData.amount);
      if(!expenseData.amount || amountVal <= 0) {
          showToast("Informe o valor do gasto para adicionar.", "error");
          return;
      }

      const newExp: Expense = { 
          id: Math.random().toString(), 
          vehicleId: vehicle.id, 
          description: expenseData.desc, 
          amount: amountVal, 
          date: new Date().toISOString(), 
          category: expenseData.category,
          employeeName: expenseData.category === 'salary' ? expenseData.employeeName : undefined
      };
      
      const newExpenses = [...formData.expenses, newExp];
      setFormData(prev => ({ ...prev, expenses: newExpenses }));

      if (expenseData.category === 'salary') {
          const currentCommission = parseCurrencyInput(saleData.commission);
          const newTotalCommission = currentCommission + amountVal;
          setSaleData(prev => ({
              ...prev,
              commission: maskCurrencyInput((newTotalCommission * 100).toString()),
              commissionTo: expenseData.employeeName || prev.commissionTo 
          }));
      }
      
      setExpenseData({desc: '', amount: '', category: 'maintenance', employeeName: ''});
      showToast("Gasto adicionado à lista (Não salvo).", "success");
  };

  const isSold = formData.status === 'sold';

  const currentInputPrice = parseCurrencyInput(saleData.price) || 0;
  const currentTradeInValue = parseCurrencyInput(saleData.tradeIn.value) || 0;
  const currentCommissionInput = parseCurrencyInput(saleData.commission) || 0;

  const tradeInValue = isSold ? (formData.tradeInInfo?.value || 0) : (saleData.method === 'Troca + Volta' ? currentTradeInValue : 0);
  
  const grossRevenue = isSold 
      ? (formData.soldPrice || 0) 
      : (saleData.method === 'Troca + Volta' ? currentInputPrice + currentTradeInValue : currentInputPrice);
  
  const cashReceived = grossRevenue - tradeInValue;

  const expensesCommissionValue = formData.expenses.filter(e => e.category === 'salary').reduce((acc, e) => acc + e.amount, 0);
  const operatingExpensesValue = formData.expenses.filter(e => e.category !== 'salary').reduce((acc, e) => acc + e.amount, 0);
  
  const effectiveCommissionCost = isSold
      ? ((formData.saleCommission && formData.saleCommission > 0) ? formData.saleCommission : expensesCommissionValue)
      : (currentCommissionInput > 0 ? currentCommissionInput : expensesCommissionValue);

  const totalCost = formData.purchasePrice + operatingExpensesValue + effectiveCommissionCost;
  const netProfit = grossRevenue - totalCost;
  const isProfit = netProfit > 0;

  const availableTabs = [
      { id: 'overview', label: 'Visão Geral', isDirty: dirtyState.isOverviewDirty },
      { id: 'photos', label: 'Fotos', isDirty: dirtyState.isPhotosDirty },
  ];
  if (canViewCosts) {
      availableTabs.splice(1, 0, { id: 'expenses', label: 'Gastos', isDirty: dirtyState.isExpensesDirty });
  }
  
  if (canManageSales && !isNew && formData.status !== 'preparation') {
      availableTabs.push({ id: 'sell', label: isSold ? 'Dados da Venda' : 'Fechar Venda', isDirty: false });
  }

  const currentStatusObj = STATUS_OPTIONS.find(s => s.value === formData.status) || STATUS_OPTIONS[0];
  const isCpfValid = saleData.buyerCpf.length === 14 && isValidCPF(saleData.buyerCpf);
  const isCpfInvalid = saleData.buyerCpf.length === 14 && !isValidCPF(saleData.buyerCpf);

  const filteredExpenses = activeExpenseFilter === 'all' 
      ? formData.expenses 
      : formData.expenses.filter(e => e.category === activeExpenseFilter);

  const hasCommissionInput = parseCurrencyInput(saleData.commission) > 0;
  
  // Realiza a soma de todas as despesas (operacionais + salários)
  const allExpensesSum = operatingExpensesValue + expensesCommissionValue;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {notification && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slide-in-top ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span className="font-medium text-sm">{notification.message}</span>
          </div>
      )}

      {showContract && <ContractModal vehicle={vehicle} storeName={currentUser?.storeName || 'Loja'} storeCnpj={currentUser?.cnpj} storeCity={currentUser?.city} storeState={currentUser?.state} onClose={() => setShowContract(false)} />}
      {showReservation && <ReservationModal vehicle={vehicle} onClose={() => setShowReservation(false)} onConfirm={handleConfirmReservation} />}
      {shareVehicle && (
          <ShareModal 
              vehicleId={shareVehicle.id}
              vehicleModel={`${shareVehicle.make} ${shareVehicle.model}`}
              onClose={() => setShareVehicle(null)}
          />
      )}
      
      {showSaleSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <Confetti />
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative animate-pop-in border-emerald-500/50 shadow-emerald-500/10">
                  <button onClick={() => setShowSaleSuccess(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-10">
                      <X size={20} />
                  </button>
                  <div className="p-8 text-center animate-fade-in relative overflow-hidden rounded-2xl">
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                             <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shine"></div>
                        </div>

                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 size={40} className="drop-shadow-lg" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Sucesso!</h2>
                        <p className="text-slate-400 mb-8">
                            Venda registrada e comissão lançada nos gastos.
                        </p>
                        <div className="flex flex-col gap-3 justify-center">
                            <Button onClick={() => setShowContract(true)} icon={<Printer size={18} />} className="w-full py-4 text-lg shadow-lg shadow-indigo-500/20">
                                Imprimir Contrato
                            </Button>
                            <Button variant="ghost" onClick={() => setShowSaleSuccess(false)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
              </div>
          </div>
      )}

      {cameraState.isOpen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col">
              <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur absolute top-0 w-full z-10">
                  <span className="text-white font-bold">Câmera</span>
                  <div className="flex items-center gap-2">
                      {cameraHasTorch && (
                          <button
                              onClick={toggleCameraTorch}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${cameraTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
                          >
                              Flash {cameraTorchOn ? 'Ligado' : 'Desligado'}
                          </button>
                      )}
                      <button onClick={() => setCameraState(prev => ({...prev, isOpen: false}))} className="text-white p-2">
                          <X size={24} />
                      </button>
                  </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover" 
                    onLoadedMetadata={() => videoRef.current?.play().catch(e => console.log(e))}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {cameraState.isUploading && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                          <RefreshCw className="text-white animate-spin mb-2" size={32} />
                          <span className="text-white font-medium">Processando...</span>
                      </div>
                  )}
              </div>

              <div className="p-6 bg-black/50 backdrop-blur absolute bottom-0 w-full">
                  <div className="flex items-center justify-center gap-6">
                      {cameraHasZoom && (
                          <div className="flex items-center gap-2 text-white text-xs">
                              <span className="text-slate-300">Zoom</span>
                              <input
                                  type="range"
                                  min={cameraZoomRange.min}
                                  max={cameraZoomRange.max}
                                  step={0.1}
                                  value={cameraZoom}
                                  onChange={(e) => applyCameraZoom(parseFloat(e.target.value))}
                                  className="w-36"
                              />
                          </div>
                      )}
                      <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition-all shadow-lg active:scale-95">
                          <div className="w-16 h-16 bg-white rounded-full"></div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
              <button onClick={handleBackGuard} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ArrowLeft /></button>
              <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                      {isNew ? 'Novo Veículo' : `${vehicle.make} ${vehicle.model}`}
                      {!isNew && <span className="text-sm font-normal text-slate-500 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full">{vehicle.plate || 'S/ Placa'}</span>}
                      {isSold && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded">Vendido</span>}
                  </h1>
                  {dirtyState.hasChanges && !isNew && (
                      <p className="text-amber-400 text-xs font-bold flex items-center gap-1 mt-1 animate-pulse">
                          <AlertCircle size={12} /> Alterações não salvas
                      </p>
                  )}
              </div>
          </div>
          
          <div className="flex gap-2 items-center">
              {(dirtyState.hasChanges || isNew) ? (
                  <>
                    {!isNew && (
                        <Button variant="ghost" onClick={handleDiscard} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                            <RotateCcw size={16} /> Descartar
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={isSaving} className={isNew ? '' : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-amber-500/20'}>
                        {isNew ? 'Criar Veículo' : (isSaving ? 'Salvando...' : 'Salvar Alterações')}
                    </Button>
                  </>
              ) : (
                  <>
                    {!isSold && (userRole === 'owner' || canManageSales) && (
                        <div className="relative" ref={statusDropdownRef}>
                            <button 
                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg transition-all ${currentStatusObj.color}`}
                            >
                                {currentStatusObj.label}
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isStatusOpen && (
                                <div className="absolute top-full mt-2 left-0 w-44 dropdown-panel overflow-hidden z-20 animate-fade-in">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleStatusChange(opt.value as VehicleStatus)}
                                            className="w-full text-left px-4 py-3 text-sm dropdown-item flex items-center justify-between"
                                        >
                                            {opt.label}
                                            {formData.status === opt.value && <Check size={14} className="text-emerald-400"/>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {!isSold && (
                        <>
                            <Button 
                                variant="secondary" 
                                icon={canShare ? <Share2 size={16} /> : <Lock size={16} />} 
                                disabled={!canShare}
                                className={!canShare ? 'opacity-50' : ''}
                                onClick={() => {
                                    if (!canShare) return;
                                    setShareVehicle(vehicle);
                                }}
                            >
                                {canShare ? 'Compartilhar' : 'Bloqueado'}
                            </Button>
                            {canManageSales && formData.status !== 'preparation' && (
                                <Button variant="success" onClick={() => setActiveTab('sell')}>
                                    Vender
                                </Button>
                            )}
                        </>
                    )}
                    {isSold && (
                        <Button variant="secondary" onClick={() => setShowContract(true)} icon={<Printer size={16} />}>Contrato</Button>
                    )}
                    {userRole === 'owner' && (
                        <button onClick={handleDelete} className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full hover:bg-rose-500 hover:text-white transition-all ml-2">
                            <Trash2 size={18} />
                        </button>
                    )}
                  </>
              )}
          </div>
      </div>

      <div className="border-b border-slate-800 flex gap-6 overflow-x-auto">
          {availableTabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                  {tab.label}
                  {tab.isDirty && !isNew && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Alterações nesta aba"></span>
                  )}
              </button>
          ))}
      </div>

      {/* Renderização das Tabs */}
      <div className="min-h-[400px]">
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ... Overview Content ... */}
                  <div className="md:col-span-2 space-y-6">
                      <Card title="Dados do Veículo">
                          {/* FIPE Section */}
                          <div className="mb-4 flex items-center justify-between">
                              <span className="text-white font-medium flex gap-2"><Search size={16} className="text-indigo-400"/> FIPE</span>
                              <button onClick={() => setUseFipeSearch(!useFipeSearch)} className="text-xs text-indigo-400 underline">
                                  {useFipeSearch ? 'Manual' : 'Automático'}
                              </button>
                          </div>
                          
                          {useFipeSearch && (
                              <FipeSearch 
                                brands={fipeData.brands} 
                                models={fipeData.models} 
                                years={fipeData.years}
                                selectedBrand={fipeSelection.brand}
                                selectedModel={fipeSelection.model}
                                selectedYear={fipeSelection.year}
                                onBrandChange={(e) => handleFipeChange('brand', e.target.value)}
                                onModelChange={(e) => handleFipeChange('model', e.target.value)}
                                onYearChange={(e) => handleFipeChange('year', e.target.value)}
                                isLoading={isLoadingFipe}
                                onRetry={loadBrands}
                              />
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                              {[
                                  { label: 'Marca', field: 'make', type: 'text', disabled: useFipeSearch },
                                  { label: 'Modelo', field: 'model', type: 'text', disabled: useFipeSearch },
                                  { label: 'Versão', field: 'version', type: 'text', disabled: false },
                                  { label: 'Ano', field: 'year', type: 'number', disabled: useFipeSearch, inputMode: 'numeric' },
                                  { label: 'Placa', field: 'plate', type: 'text', disabled: false, uppercase: true },
                                  { label: 'RENAVAM', field: 'renavam', type: 'text', disabled: false, inputMode: 'numeric', uppercase: true },
                                  { label: 'Chassi', field: 'chassis', type: 'text', disabled: false, uppercase: true },
                                  { label: 'KM', field: 'km', type: 'number', disabled: false, inputMode: 'numeric' },
                                  { label: 'Cor', field: 'color', type: 'text', disabled: false },
                                  { label: 'Combustível', field: 'fuel', type: 'text', disabled: false },
                                  { label: 'Câmbio', field: 'transmission', type: 'text', disabled: false },
                              ].map((item: any) => (
                                  <div key={item.field} className={item.field === 'version' ? 'col-span-2 md:col-span-1' : ''}>
                                      <label className="text-slate-500 mb-1 block">{item.label}</label>
                                      <input 
                                        type={item.type} 
                                        inputMode={item.inputMode}
                                        className={`w-full bg-slate-900 border ${dirtyState.isOverviewDirty && !safeCompare(formData[item.field as keyof Vehicle], vehicle[item.field as keyof Vehicle]) ? 'border-amber-500/50' : 'border-slate-700'} rounded p-2 text-white ${item.uppercase ? 'uppercase' : ''}`}
                                        value={(formData as any)[item.field]}
                                        onChange={e => handleChange(item.field, item.type === 'number' ? parseInt(e.target.value) : e.target.value)}
                                        disabled={item.disabled}
                                      />
                                  </div>
                              ))}
                          </div>

                          {/* IPVA & Licensing Status */}
                          <div className="mt-6 pt-6 border-t border-slate-800">
                              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                  <FileText size={16} className="text-slate-400" /> Documentação
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.ipvaPaid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}>
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-full ${formData.ipvaPaid ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                              <FileCheck size={16} />
                                          </div>
                                          <div>
                                              <p className={`font-bold text-sm ${formData.ipvaPaid ? 'text-emerald-400' : 'text-slate-300'}`}>IPVA Pago</p>
                                              <p className="text-xs text-slate-500">{formData.ipvaPaid ? 'Tudo certo' : 'Pendente'}</p>
                                          </div>
                                      </div>
                                      <input 
                                          type="checkbox" 
                                          className="hidden" 
                                          checked={!!formData.ipvaPaid} 
                                          onChange={() => setFormData(prev => ({...prev, ipvaPaid: !prev.ipvaPaid}))} 
                                      />
                                      {formData.ipvaPaid && <Check size={18} className="text-emerald-500" />}
                                  </label>

                                  <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.licensingPaid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}>
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-full ${formData.licensingPaid ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                              <FileCheck size={16} />
                                          </div>
                                          <div>
                                              <p className={`font-bold text-sm ${formData.licensingPaid ? 'text-emerald-400' : 'text-slate-300'}`}>Licenciamento</p>
                                              <p className="text-xs text-slate-500">{formData.licensingPaid ? 'Pago' : 'Pendente'}</p>
                                          </div>
                                      </div>
                                      <input 
                                          type="checkbox" 
                                          className="hidden" 
                                          checked={!!formData.licensingPaid} 
                                          onChange={() => setFormData(prev => ({...prev, licensingPaid: !prev.licensingPaid}))} 
                                      />
                                      {formData.licensingPaid && <Check size={18} className="text-emerald-500" />}
                                  </label>
                              </div>
                          </div>
                      </Card>

                      <Card title="Financeiro e Preços">
                          <div className="space-y-4">
                              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                                  <span className="text-slate-400">Referência FIPE</span>
                                  <input 
                                    type="text" 
                                    inputMode="decimal"
                                    className="w-40 md:w-52 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white tabular-nums" 
                                    value={getMaskedValue(formData.fipePrice)} 
                                    onChange={e => setFormData(prev => ({...prev, fipePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))}
                                    onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                                  />
                              </div>

                              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg border border-indigo-500/30">
                                  <span className="text-indigo-300">Custo de Compra</span>
                                  <input 
                                      type="text" 
                                      inputMode="decimal"
                                      className="w-40 md:w-52 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white tabular-nums" 
                                      value={getMaskedValue(formData.purchasePrice)} 
                                      onChange={e => setFormData(prev => ({...prev, purchasePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))}
                                      onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                                  />
                              </div>
                              
                              <div className="flex justify-between p-3 rounded-lg bg-slate-800">
                                  <span className="text-white">Preço Anunciado</span>
                                  <input 
                                      type="text" 
                                      inputMode="decimal"
                                      className="w-40 md:w-52 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white text-lg font-bold tabular-nums" 
                                      value={getMaskedValue(formData.expectedSalePrice)} 
                                      onChange={e => setFormData(prev => ({...prev, expectedSalePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))}
                                      onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
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
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                                  <RefreshCw className="text-white animate-spin" size={28} />
                                  {uploadProgress.total > 1 && (
                                      <span className="text-xs text-slate-200">Enviando {uploadProgress.done}/{uploadProgress.total}</span>
                                  )}
                              </div>
                          )}
                          <button onClick={() => setActiveTab('photos')} className="absolute bottom-4 right-4 bg-slate-900/80 p-2 rounded-full text-white hover:bg-indigo-600 transition-colors"><Camera size={20}/></button>
                      </div>

                      {/* TOTAL COST SUMMARY CARD */}
                      {canViewCosts && (
                          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 animate-fade-in shadow-lg">
                              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                  <Wallet size={16} className="text-emerald-500" />
                                  Custo Total Real
                              </h4>
                              <div className="space-y-2 text-sm">
                                  <div className="flex justify-between text-slate-400">
                                      <span>Compra</span>
                                      <span>{formatCurrency(vehicle.purchasePrice)}</span>
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
          )}

          {activeTab === 'photos' && (
              <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" multiple accept="image/*" />
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 p-6 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 transition-colors">
                          <Upload size={24} className="mb-2"/> <span className="font-medium">Carregar da Galeria</span>
                      </button>
                      <button 
                        onClick={() => setCameraState(prev => ({...prev, isOpen: true}))}
                        className="flex-1 p-6 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 transition-colors"
                      >
                          <Camera size={24} className="mb-2"/> <span className="font-medium">Tirar Foto Agora</span>
                      </button>
                  </div>

                  {/* Carrossel de Fotos com Swipe */}
                  {formData.photos.length > 0 && (
                      <div className="relative">
                          <div 
                              className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800"
                              onTouchStart={(e) => {
                                  const touch = e.touches[0];
                                  (e.currentTarget as any)._startX = touch.clientX;
                                  (e.currentTarget as any)._startY = touch.clientY;
                              }}
                              onTouchEnd={(e) => {
                                  const touch = e.changedTouches[0];
                                  const startX = (e.currentTarget as any)._startX || 0;
                                  const startY = (e.currentTarget as any)._startY || 0;
                                  const diffX = touch.clientX - startX;
                                  const diffY = Math.abs(touch.clientY - startY);
                                  
                                  // Só responde a swipes horizontais (não verticais)
                                  if (Math.abs(diffX) > 50 && diffY < 100) {
                                      if (diffX > 0) {
                                          // Swipe right - foto anterior
                                          setPhotoIndex(prev => prev === 0 ? formData.photos.length - 1 : prev - 1);
                                      } else {
                                          // Swipe left - próxima foto
                                          setPhotoIndex(prev => prev === formData.photos.length - 1 ? 0 : prev + 1);
                                      }
                                  }
                              }}
                          >
                              {isPhotoUploading && (
                                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 gap-2">
                                      <RefreshCw className="text-white animate-spin" size={32} />
                                      {uploadProgress.total > 1 && (
                                          <span className="text-xs text-slate-200">Enviando {uploadProgress.done}/{uploadProgress.total}</span>
                                      )}
                                  </div>
                              )}
                              <img 
                                  src={formData.photos[photoIndex]} 
                                  className="w-full h-full object-contain" 
                                  alt={`Foto ${photoIndex + 1}`}
                              />
                              
                              {/* Navegação com setas */}
                              {formData.photos.length > 1 && (
                                  <>
                                      <button 
                                          onClick={() => setPhotoIndex(prev => prev === 0 ? formData.photos.length - 1 : prev - 1)}
                                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 backdrop-blur-sm rounded-full text-white hover:bg-indigo-600 transition-all shadow-lg"
                                      >
                                          <ChevronLeft size={24} />
                                      </button>
                                      <button 
                                          onClick={() => setPhotoIndex(prev => prev === formData.photos.length - 1 ? 0 : prev + 1)}
                                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 backdrop-blur-sm rounded-full text-white hover:bg-indigo-600 transition-all shadow-lg"
                                      >
                                          <ChevronRight size={24} />
                                      </button>
                                  </>
                              )}
                              
                              {/* Indicador de posição */}
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                  <span className="text-white text-sm font-medium">{photoIndex + 1} / {formData.photos.length}</span>
                              </div>
                              
                              {/* Botão de excluir foto atual */}
                              <button 
                                  onClick={() => handlePhotoDelete(photoIndex)}
                                  className="absolute top-4 right-4 p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 shadow-lg transition-colors"
                              >
                                  <Trash2 size={18}/>
                              </button>
                              
                              {/* Botão de definir como capa */}
                              {photoIndex !== 0 && (
                                  <button 
                                      onClick={() => {
                                          const newPhotos = [...formData.photos];
                                          const p = newPhotos.splice(photoIndex, 1)[0];
                                          newPhotos.unshift(p);
                                          setFormData({...formData, photos: newPhotos});
                                          setPhotoIndex(0);
                                      }}
                                      className="absolute top-4 left-4 px-3 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-indigo-600 transition-colors shadow-lg flex items-center gap-2"
                                  >
                                      <Star size={16} /> Definir Capa
                                  </button>
                              )}
                          </div>
                          
                          {/* Miniaturas */}
                          {formData.photos.length > 1 && (
                              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                                  {formData.photos.map((photo, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-1">
                                          <button
                                              draggable
                                              onDragStart={() => setDraggedPhotoIndex(idx)}
                                              onDragEnd={() => {
                                                  setDraggedPhotoIndex(null);
                                                  setDragOverPhotoIndex(null);
                                              }}
                                              onDragOver={(e) => {
                                                  e.preventDefault();
                                                  setDragOverPhotoIndex(idx);
                                              }}
                                              onDrop={() => {
                                                  if (draggedPhotoIndex === null || draggedPhotoIndex === idx) return;
                                                  const newPhotos = [...formData.photos];
                                                  const [moved] = newPhotos.splice(draggedPhotoIndex, 1);
                                                  newPhotos.splice(idx, 0, moved);
                                                  setFormData({ ...formData, photos: newPhotos });
                                                  if (photoIndex === draggedPhotoIndex) setPhotoIndex(idx);
                                                  markPhotoMoved(idx);
                                                  setDraggedPhotoIndex(null);
                                                  setDragOverPhotoIndex(null);
                                              }}
                                              onClick={() => setPhotoIndex(idx)}
                                              className={`flex-shrink-0 aspect-[4/3] w-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                                  idx === photoIndex 
                                                      ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                                                      : 'border-slate-700 hover:border-slate-600'
                                              } ${dragOverPhotoIndex === idx ? 'ring-2 ring-amber-500/40 border-amber-500/60' : ''} ${recentlyMovedIndex === idx ? 'animate-pop-in' : ''}`}
                                              title="Arraste para reordenar"
                                          >
                                              <img src={photo} className="w-full h-full object-cover" alt={`Miniatura ${idx + 1}`} />
                                          </button>
                                          <div className="flex items-center gap-1">
                                              <button
                                                  onClick={() => {
                                                      if (idx === 0) return;
                                                      const newPhotos = [...formData.photos];
                                                      const temp = newPhotos[idx - 1];
                                                      newPhotos[idx - 1] = newPhotos[idx];
                                                      newPhotos[idx] = temp;
                                                      setFormData({ ...formData, photos: newPhotos });
                                                      if (photoIndex === idx) setPhotoIndex(idx - 1);
                                                      if (photoIndex === idx - 1) setPhotoIndex(idx);
                                                      markPhotoMoved(idx - 1);
                                                  }}
                                                  className="p-1 rounded-full bg-slate-900/70 text-slate-300 hover:text-white"
                                                  title="Mover para esquerda"
                                              >
                                                  <ChevronLeft size={12} />
                                              </button>
                                              <button
                                                  onClick={() => {
                                                      if (idx === formData.photos.length - 1) return;
                                                      const newPhotos = [...formData.photos];
                                                      const temp = newPhotos[idx + 1];
                                                      newPhotos[idx + 1] = newPhotos[idx];
                                                      newPhotos[idx] = temp;
                                                      setFormData({ ...formData, photos: newPhotos });
                                                      if (photoIndex === idx) setPhotoIndex(idx + 1);
                                                      if (photoIndex === idx + 1) setPhotoIndex(idx);
                                                      markPhotoMoved(idx + 1);
                                                  }}
                                                  className="p-1 rounded-full bg-slate-900/70 text-slate-300 hover:text-white"
                                                  title="Mover para direita"
                                              >
                                                  <ChevronRight size={12} />
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
                  
                  {formData.photos.length === 0 && (
                      <div className="py-16 text-center text-slate-500">
                          <Camera size={48} className="mx-auto mb-4 opacity-30" />
                          <p className="text-lg font-medium">Nenhuma foto cadastrada</p>
                          <p className="text-sm mt-1">Adicione fotos usando os botões acima</p>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'expenses' && canViewCosts && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ... Same Expenses Code ... */}
                  <Card title="Adicionar Gasto">
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                                                            <select 
                                                                value={expenseData.category}
                                                                onChange={e => setExpenseData({...expenseData, category: e.target.value as ExpenseCategory})}
                                                                className="w-full select-premium text-sm"
                                                            >
                                  {EXPENSE_CATEGORIES.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                                  ))}
                              </select>
                              <input 
                                type="text" 
                                inputMode="decimal"
                                placeholder="Valor (R$)" 
                                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm font-bold" 
                                value={expenseData.amount} 
                                onChange={e => setExpenseData({...expenseData, amount: maskCurrencyInput(e.target.value)})} 
                              />
                          </div>
                          
                          {/* SHOW EMPLOYEE INPUT IF CATEGORY IS SALARY/COMMISSION */}
                          {expenseData.category === 'salary' && (
                              <div className="animate-fade-in">
                                  <label className="text-xs text-slate-400 mb-1 block">Nome do Vendedor/Funcionário</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ex: João Silva" 
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" 
                                    value={expenseData.employeeName} 
                                    onChange={e => setExpenseData({...expenseData, employeeName: e.target.value})} 
                                  />
                              </div>
                          )}

                          <input type="text" placeholder="Descrição (ex: Troca de óleo)" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" value={expenseData.desc} onChange={e => setExpenseData({...expenseData, desc: e.target.value})} />
                          <Button onClick={handleAddExpense} className="w-full">Adicionar</Button>
                      </div>
                  </Card>
                  
                  <Card title={`Total: ${formatCurrency(formData.expenses.reduce((acc, curr) => acc + curr.amount, 0))}`}>
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                          <button 
                              onClick={() => setActiveExpenseFilter('all')}
                              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${activeExpenseFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                          >
                              Todos
                          </button>
                          {EXPENSE_CATEGORIES.map(cat => (
                              <button 
                                  key={cat.id}
                                  onClick={() => setActiveExpenseFilter(cat.id)}
                                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${activeExpenseFilter === cat.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                              >
                                  {cat.label}
                              </button>
                          ))}
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {filteredExpenses.map((exp, idx) => {
                              const categoryLabel = EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label || 'Outros';
                              const isNewExpense = !vehicle.expenses.find(e => e.id === exp.id);
                              
                              return (
                                <div key={exp.id} className={`flex justify-between items-center p-2 rounded border ${isNewExpense ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-800'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-sm font-medium">{exp.description}</span>
                                            {isNewExpense && <span className="text-[10px] bg-emerald-500 text-white px-1 rounded">Novo</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 text-xs">{categoryLabel} • {new Date(exp.date).toLocaleDateString()}</span>
                                            {exp.employeeName && <span className="text-indigo-400 text-xs font-bold">• {exp.employeeName}</span>}
                                        </div>
                                    </div>
                                    <span className="text-white font-bold text-sm">{formatCurrency(exp.amount)}</span>
                                </div>
                              );
                          })}
                          {filteredExpenses.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum gasto encontrado.</p>}
                      </div>
                  </Card>
              </div>
          )}

          {activeTab === 'sell' && canManageSales && !isNew && (
              <div className="space-y-6">
                  {/* ... Same Sell Code ... */}
                  {canViewCosts && (
                      <Card className="bg-slate-950 border border-slate-800">
                          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-2">
                                  <TrendingUp size={20} className={isSold ? "text-emerald-400" : "text-slate-400"} />
                                  <h3 className="font-bold text-white">
                                      {isSold ? 'Demonstrativo do Resultado (DRE)' : 'Simulação de Resultado'}
                                  </h3>
                              </div>
                              {!isSold && <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Prévia</span>}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-sm">
                              {/* Venda */}
                              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                                  <p className="text-slate-400 text-xs uppercase font-bold mb-1">Venda Bruta</p>
                                  <p className="text-white font-bold text-lg">{formatCurrency(grossRevenue)}</p>
                                  
                                  {/* Payment Breakdown (Trade In) */}
                                  {tradeInValue > 0 && (
                                      <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-400">
                                          <div className="flex justify-between">
                                              <span>Dinheiro:</span>
                                              <span className="text-emerald-400 font-bold">{formatCurrency(cashReceived)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                              <span>Troca:</span>
                                              <span className="text-amber-400 font-bold">{formatCurrency(tradeInValue)}</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                              
                              <Minus size={16} className="text-slate-600 hidden md:block mx-auto" />

                              {/* Custos (Compra + Gastos + Comissão) */}
                              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 relative">
                                  <p className="text-slate-400 text-xs uppercase font-bold mb-1">Custo Total</p>
                                  <p className="text-rose-400 font-bold text-lg">- {formatCurrency(totalCost)}</p>
                                  <div className="text-[10px] text-slate-500 mt-1 flex flex-col">
                                      <span>Compra: {formatCurrency(vehicle.purchasePrice)}</span>
                                      <span>Gastos Op. + Comissão: {formatCurrency(operatingExpensesValue + effectiveCommissionCost)}</span>
                                  </div>
                                  {vehicle.purchasePrice === 0 && (
                                      <div className="absolute -top-2 -right-2 text-amber-500 bg-slate-900 rounded-full border border-amber-500/50 p-1" title="Custo de compra zerado">
                                          <AlertTriangle size={12} />
                                      </div>
                                  )}
                              </div>

                              <div className="hidden md:block text-slate-600 font-bold text-xl mx-auto">=</div>

                              {/* Lucro Final */}
                              <div className={`p-4 rounded-lg border ${isProfit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                  <p className={`text-xs uppercase font-bold mb-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isProfit ? 'Lucro Líquido' : 'Prejuízo'}
                                  </p>
                                  <p className={`font-black text-2xl ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {formatCurrency(netProfit)}
                                  </p>
                              </div>
                          </div>
                      </Card>
                  )}

                  <Card title={isSold ? "Detalhes da Venda" : "Concluir Venda"} className="max-w-4xl mx-auto bg-slate-950 border-slate-800">
                      {/* ... (Keep form inputs as is) ... */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                                  <h4 className="text-sm font-semibold text-white">Pagamento</h4>
                                  <label className="block text-sm text-slate-300">
                                      {saleData.method === 'Troca + Volta' && !isSold ? 'Valor em Dinheiro (Volta)' : 'Valor Final da Venda'}
                                  </label>
                                  <input 
                                    type="text" 
                                    ref={priceInputRef}
                                    inputMode="decimal"
                                    value={saleData.price} 
                                    onChange={e => setSaleData({...saleData, price: maskCurrencyInput(e.target.value)})}
                                    onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                                    disabled={isSold} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-lg font-bold text-right" 
                                  />
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm text-slate-300">Data</label>
                                          <input type="date" value={saleData.date} onChange={e => setSaleData({...saleData, date: e.target.value})} disabled={isSold} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                                      </div>
                                      <div>
                                          <label className="block text-sm text-slate-300">Pagamento</label>
                                          <select value={saleData.method} onChange={e => setSaleData({...saleData, method: e.target.value})} disabled={isSold} className="w-full select-premium">
                                              <option>Pix / Transferência</option>
                                              <option>Financiamento</option>
                                              <option>Dinheiro</option>
                                              <option>Troca + Volta</option>
                                          </select>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                          <label className="block text-sm text-slate-300">Valor por extenso</label>
                                          <input
                                            value={saleData.paymentAmountText}
                                            onChange={e => setSaleData({...saleData, paymentAmountText: e.target.value})}
                                            disabled={isSold}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                                            placeholder="Ex: dez mil reais"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm text-slate-300">Forma de pagamento</label>
                                          <input
                                            value={saleData.paymentMethodDetail}
                                            onChange={e => setSaleData({...saleData, paymentMethodDetail: e.target.value})}
                                            disabled={isSold}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                                            placeholder="Pix, transferencia, especie"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm text-slate-300">Data do pagamento</label>
                                          <input
                                            value={saleData.paymentDateDetail}
                                            onChange={e => setSaleData({...saleData, paymentDateDetail: e.target.value})}
                                            disabled={isSold}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                                            placeholder="Ex: no ato da assinatura"
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                                  <h4 className="text-sm font-semibold text-white">Garantia e Comissão</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm text-slate-300">Garantia (Tempo)</label>
                                          <input 
                                            value={isSold ? (vehicle.warrantyDetails?.time || '90 dias') : saleData.warrantyTime}
                                            onChange={e => setSaleData({...saleData, warrantyTime: e.target.value})}
                                            disabled={isSold}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                                            placeholder="Ex: 90 dias"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm text-slate-300">Garantia (KM)</label>
                                          <input 
                                            value={isSold ? (vehicle.warrantyDetails?.km || '3.000 km') : saleData.warrantyKm}
                                            onChange={e => setSaleData({...saleData, warrantyKm: e.target.value})}
                                            disabled={isSold}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
                                            placeholder="Ex: 3.000 km"
                                            inputMode="numeric"
                                          />
                                      </div>
                                  </div>

                                  <div>
                                      <div className="flex gap-4">
                                          <div className="flex-1">
                                              <label className="block text-sm text-slate-300">Comissão de Venda (R$)</label>
                                              <input 
                                                type="text" 
                                                inputMode="decimal"
                                                value={isSold ? maskCurrencyInput((calculateDefaultCommission() * 100).toFixed(0)) : saleData.commission} 
                                                onChange={e => setSaleData({...saleData, commission: maskCurrencyInput(e.target.value)})} 
                                                disabled={isSold} 
                                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm font-bold" 
                                                placeholder="R$ 0,00"
                                              />
                                          </div>
                                          {hasCommissionInput && !isSold && (
                                              <div className="flex-1 animate-fade-in">
                                                  <label className="block text-sm text-slate-300">Para Quem? (Vendedor)</label>
                                                  <div className="relative">
                                                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                      <input 
                                                        type="text" 
                                                        value={saleData.commissionTo} 
                                                        onChange={e => setSaleData({...saleData, commissionTo: e.target.value})} 
                                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-9 text-white text-sm" 
                                                        placeholder="Nome do funcionário"
                                                      />
                                                  </div>
                                              </div>
                                          )}
                                          {isSold && calculateDefaultCommission() > 0 && (
                                              <div className="flex-1">
                                                  <label className="block text-sm text-slate-300">Vendedor (Comissão)</label>
                                                  <input 
                                                    disabled
                                                    value={vehicle.saleCommissionTo || 'Não informado'} 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-400 text-sm" 
                                                  />
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>

                              {saleData.method === 'Troca + Volta' && !isSold && (
                                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mt-4">
                                      <h4 className="text-white font-medium mb-3 flex items-center gap-2"><ArrowRightLeft size={16}/> Entrada (Troca)</h4>
                                      <div className="grid grid-cols-2 gap-3 mb-3">
                                          <input placeholder="Marca" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.make} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, make: e.target.value}})} />
                                          <input placeholder="Modelo" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.model} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, model: e.target.value}})} />
                                          <input placeholder="Versão" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.version} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, version: e.target.value}})} />
                                          <input placeholder="Ano Fabricação" type="number" inputMode="numeric" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.yearFab} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, yearFab: e.target.value}})} />
                                          <input placeholder="Ano Modelo" type="number" inputMode="numeric" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.yearModel} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, yearModel: e.target.value}})} />
                                          <input placeholder="Placa" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm uppercase" value={saleData.tradeIn.plate} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, plate: maskPlate(e.target.value)}})} />
                                          <input placeholder="RENAVAM" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm uppercase" inputMode="numeric" value={saleData.tradeIn.renavam} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, renavam: maskRenavam(e.target.value)}})} />
                                          <input placeholder="Chassi" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm uppercase" value={saleData.tradeIn.chassis} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, chassis: maskChassis(e.target.value)}})} />
                                          <input placeholder="Cor" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.color} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, color: e.target.value}})} />
                                          <input placeholder="Quilometragem" type="number" inputMode="numeric" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.km} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, km: e.target.value}})} />
                                      </div>
                                      <input 
                                        placeholder="Valor de Avaliação R$" 
                                        inputMode="decimal"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm font-bold text-right" 
                                        value={saleData.tradeIn.value} 
                                        onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, value: maskCurrencyInput(e.target.value)}})}
                                        onFocus={e => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                                      />
                                  </div>
                              )}
                          </div>

                              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                              <h4 className="text-sm font-semibold text-white">Cliente</h4>
                              <input placeholder="Nome Completo" value={isSold ? vehicle.buyer?.name : saleData.buyerName} onChange={e => setSaleData({...saleData, buyerName: e.target.value})} disabled={isSold} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="relative">
                                    <input 
                                        placeholder="CPF" 
                                        inputMode="numeric"
                                        value={isSold ? vehicle.buyer?.cpf : saleData.buyerCpf} 
                                        onChange={e => handleCpfChange(e.target.value)} 
                                        disabled={isSold} 
                                        maxLength={14}
                                        className={`w-full bg-slate-950 border rounded p-2 text-white outline-none transition-colors ${
                                            !isSold && saleData.buyerCpf.length > 0 ? (isCpfValid ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-700'
                                        }`}
                                    />
                                    {!isSold && isCpfValid && <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />}
                                    {!isSold && isCpfInvalid && saleData.buyerCpf.length > 0 && <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500" size={16} />}
                                  </div>
                                  <input 
                                    placeholder="Telefone" 
                                    inputMode="tel"
                                    value={isSold ? vehicle.buyer?.phone : saleData.buyerPhone} 
                                    onChange={e => setSaleData({...saleData, buyerPhone: maskPhone(e.target.value)})} 
                                    disabled={isSold} 
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                                  />
                              </div>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                    <input
                                                                        placeholder="CEP"
                                                                        inputMode="numeric"
                                                                        value={isSold ? vehicle.buyer?.cep : saleData.buyerCep}
                                                                        onChange={e => setSaleData({...saleData, buyerCep: e.target.value})}
                                                                        onBlur={handleBuyerCepBlur}
                                                                        disabled={isSold}
                                                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                                                    />
                                                                    <input
                                                                        placeholder="Logradouro"
                                                                        value={isSold ? vehicle.buyer?.street : saleData.buyerStreet}
                                                                        onChange={e => setSaleData({...saleData, buyerStreet: e.target.value})}
                                                                        disabled={isSold}
                                                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white col-span-2"
                                                                    />
                                                                    <input
                                                                        placeholder="Número"
                                                                        value={isSold ? vehicle.buyer?.number : saleData.buyerNumber}
                                                                        onChange={e => setSaleData({...saleData, buyerNumber: e.target.value})}
                                                                        disabled={isSold}
                                                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                                                    />
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                    <input
                                                                        placeholder="Bairro"
                                                                        value={isSold ? vehicle.buyer?.neighborhood : saleData.buyerNeighborhood}
                                                                        onChange={e => setSaleData({...saleData, buyerNeighborhood: e.target.value})}
                                                                        disabled={isSold}
                                                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                                                    />
                                                                    <input
                                                                        placeholder="Cidade"
                                                                        value={isSold ? vehicle.buyer?.city : saleData.buyerCity}
                                                                        onChange={e => setSaleData({...saleData, buyerCity: e.target.value})}
                                                                        disabled={isSold}
                                                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white col-span-1"
                                                                    />
                                                                    <input
                                                                        placeholder="UF"
                                                                        value={isSold ? vehicle.buyer?.state : saleData.buyerState}
                                                                        onChange={e => setSaleData({...saleData, buyerState: e.target.value.toUpperCase().slice(0, 2)})}
                                                                        disabled={isSold}
                                                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white uppercase"
                                                                    />
                                                            </div>
                          </div>
                      </div>

                      {isSold && formData.paymentMethod === 'Troca + Volta' && formData.tradeInInfo && (
                          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm space-y-2">
                              <h4 className="text-slate-200 font-medium flex items-center gap-2">
                                  <ArrowRightLeft size={14} className="text-indigo-400" />
                                  Resumo Troca + Volta
                              </h4>
                              <div className="flex justify-between">
                                  <span className="text-slate-400">Valor recebido em dinheiro</span>
                                  <span className="text-emerald-400 font-semibold">
                                      {formatCurrency(cashReceived)}
                                  </span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-slate-400">Veículo recebido na troca</span>
                                  <span className="text-slate-200 font-semibold text-right">
                                      {formData.tradeInInfo.make} {formData.tradeInInfo.model} ({formData.tradeInInfo.plate || 'S/ Placa'})
                                  </span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-slate-400">Valor do veículo recebido</span>
                                  <span className="text-amber-400 font-semibold">
                                      {formatCurrency(tradeInValue)}
                                  </span>
                              </div>
                          </div>
                      )}
                      {!isSold && (
                          <div className="mt-6 pt-6 border-t border-slate-800">
                              <Button size="lg" className="w-full" onClick={handleSale} disabled={isSaving || !isCpfValid}>
                                  {isSaving ? 'Processando...' : 'Confirmar Venda'}
                              </Button>
                          </div>
                      )}
                  </Card>
              </div>
          )}
      </div>
    </div>
  );
};
