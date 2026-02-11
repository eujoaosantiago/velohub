
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Vehicle, Expense, Buyer, VehicleStatus, UserRole, PlanType, checkPermission, ExpenseCategory } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatCurrency, calculateTotalExpenses, calculateROI, isValidCPF, maskCurrencyInput, parseCurrencyInput, maskCPF, maskPhone } from '../lib/utils';
import { ArrowLeft, Camera, DollarSign, Share2, Save, Trash2, Tag, AlertTriangle, User, FileText, Phone, Edit2, X, Search, Lock, Upload, ArrowRightLeft, Printer, ChevronDown, Check, Wrench, Circle, AlertCircle, CheckCircle, RotateCcw, TrendingUp, TrendingDown, Minus, Briefcase, Plus, Wallet, RefreshCw, FileCheck, CheckCircle2 } from 'lucide-react';
import { FipeApi, FipeBrand, FipeModel, FipeYear } from '../services/fipeApi';
import { PLAN_CONFIG, getPlanLimits } from '../lib/plans';
import { sanitizeInput } from '../lib/security';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { ContractModal } from '../components/ContractModal';
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
            <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={selectedBrand} onChange={onBrandChange} disabled={isLoading}>
                <option value="">{isLoading ? 'Carregando...' : 'Selecione...'}</option>
                {Array.isArray(brands) && brands.map(b => (<option key={b.codigo} value={b.codigo}>{b.nome}</option>))}
            </select>
        </div>
        <div>
            <label className="text-xs text-slate-400 block mb-1">2. Modelo</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={selectedModel} onChange={onModelChange} disabled={!selectedBrand || isLoading}>
                <option value="">Selecione...</option>
                {Array.isArray(models) && models.map(m => (<option key={m.codigo} value={m.codigo}>{m.nome}</option>))}
            </select>
        </div>
        <div>
            <label className="text-xs text-slate-400 block mb-1">3. Ano/Versão</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={selectedYear} onChange={onYearChange} disabled={!selectedModel || isLoading}>
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
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Vehicle>(vehicle);
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [showContract, setShowContract] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);

  const [useFipeSearch, setUseFipeSearch] = useState(true);
  const [fipeData, setFipeData] = useState<{ brands: FipeBrand[], models: FipeModel[], years: FipeYear[] }>({ brands: [], models: [], years: [] });
  const [fipeSelection, setFipeSelection] = useState({ brand: '', model: '', year: '' });
  const [isLoadingFipe, setIsLoadingFipe] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState({ isOpen: false, isUploading: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      price: maskCurrencyInput(vehicle.expectedSalePrice ? (vehicle.expectedSalePrice * 100).toString() : '0'),
      commission: maskCurrencyInput((calculateDefaultCommission() * 100).toString()), 
      commissionTo: getDefaultCommissionTo(),
      date: new Date().toISOString().split('T')[0],
      method: vehicle.paymentMethod || 'Pix / Transferência',
      buyerName: vehicle.buyer?.name || '',
      buyerCpf: vehicle.buyer?.cpf || '',
      buyerPhone: vehicle.buyer?.phone || '',
      warrantyTime: vehicle.warrantyDetails?.time || '90 dias',
      warrantyKm: vehicle.warrantyDetails?.km || '3.000 km',
      tradeIn: { make: '', model: '', year: new Date().getFullYear().toString(), value: '', plate: '' }
  });

  const canViewCosts = checkPermission(currentUser || null, 'view_costs');
  const canManageSales = checkPermission(currentUser || null, 'manage_sales');
  
  const currentLimits = currentUser ? getPlanLimits(currentUser) : PLAN_CONFIG['free'];
  const canShare = (currentLimits.showShareLink ?? false) && checkPermission(currentUser || null, 'share_vehicles');

  const dirtyState = useMemo(() => {
      const compareExpenses = (a: Expense[], b: Expense[]) => JSON.stringify(a) !== JSON.stringify(b);
      const comparePhotos = (a: string[], b: string[]) => JSON.stringify(a) !== JSON.stringify(b);
      
      const isOverviewDirty = 
          formData.make !== vehicle.make ||
          formData.model !== vehicle.model ||
          formData.version !== vehicle.version ||
          formData.year !== vehicle.year ||
          formData.plate !== vehicle.plate ||
          formData.km !== vehicle.km ||
          formData.color !== vehicle.color ||
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

  // Sincroniza o estado local com a prop quando o registro é atualizado no banco (ex: após salvar com sucesso)
  useEffect(() => {
      // Quando a prop 'vehicle' muda (o que acontece após um refreshData no pai),
      // atualizamos o formData para refletir a "verdade" do servidor.
      // Isso limpa o estado de "sujo" (dirtyState) porque formData ficará igual a vehicle.
      setFormData(vehicle);
  }, [vehicle]);

  useEffect(() => {
    if (isNew || (useFipeSearch && fipeData.brands.length === 0)) {
        loadBrands();
    }
  }, [isNew, useFipeSearch]);

  useEffect(() => {
      let stream: MediaStream | null = null;

      const startCamera = async () => {
          if (cameraState.isOpen && videoRef.current) {
              try {
                  stream = await navigator.mediaDevices.getUserMedia({ 
                      video: { facingMode: 'environment' },
                      audio: false
                  });
                  if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                      videoRef.current.play().catch(e => console.log("Play error", e));
                  }
              } catch (err) {
                  console.error("Camera Error:", err);
                  showToast("Não foi possível acessar a câmera.", "error");
                  setCameraState(prev => ({ ...prev, isOpen: false }));
              }
          }
      };

      if (cameraState.isOpen) {
          startCamera();
      }

      return () => {
          if (stream) {
              stream.getTracks().forEach(track => track.stop());
          }
      };
  }, [cameraState.isOpen]);

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (video.videoWidth === 0 || video.videoHeight === 0) {
              showToast("Aguarde a câmera iniciar...", "error");
              return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(async (blob) => {
                  if (blob) {
                      setCameraState(prev => ({...prev, isUploading: true}));
                      try {
                        await handlePhotoUpload(blob);
                        setCameraState(prev => ({ ...prev, isOpen: false, isUploading: false }));
                      } catch(e) {
                        setCameraState(prev => ({...prev, isUploading: false}));
                      }
                  }
              }, 'image/jpeg', 0.8);
          }
      }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  };

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
              setFormData(prev => ({
                  ...prev,
                  year: details.AnoModelo,
                  fuel: details.Combustivel,
                  fipePrice: fipeVal,
                  version: details.Modelo
              }));
          }
      }
      setIsLoadingFipe(false);
  };

  const handleChange = (field: keyof Vehicle, value: any) => {
      if (field === 'plate') value = maskPlate(value);
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMaskedValue = (val: number) => {
      return maskCurrencyInput((val * 100).toFixed(0));
  };

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await onUpdate(formData);
          if (!isNew) {
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement> | Blob) => {
      setCameraState(prev => ({ ...prev, isUploading: true }));
      try {
          let files: File[] = [];

          if (e instanceof Blob) {
              files = [new File([e], "camera.jpg", { type: "image/jpeg" })];
          } else {
              const target = (e as React.ChangeEvent<HTMLInputElement>).target;
              if (target.files && target.files.length > 0) {
                  files = Array.from(target.files);
              } else {
                  setCameraState(prev => ({ ...prev, isUploading: false }));
                  return;
              }
          }

          const newUrls: string[] = [];

          for (const f of files) {
              const url = await StorageService.uploadPhoto(f, vehicle.storeId);
              newUrls.push(url);
          }

          setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newUrls] }));

      } catch (err) {
          showToast("Erro ao enviar foto.", "error");
          throw err;
      } finally {
          setCameraState(prev => ({ ...prev, isUploading: false }));
      }
  };

  const handlePhotoDelete = async (index: number) => {
      setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleCpfChange = (val: string) => {
      const masked = maskCPF(val);
      setSaleData(prev => ({ ...prev, buyerCpf: masked }));

      if (masked.length === 14) {
          const cleanCpf = masked.replace(/\D/g, '');
          const existingCustomer = allVehicles
              .filter(v => v.buyer?.cpf?.replace(/\D/g, '') === cleanCpf)
              .sort((a, b) => new Date(b.soldDate || '').getTime() - new Date(a.soldDate || '').getTime())[0]; 

          if (existingCustomer && existingCustomer.buyer) {
              setSaleData(prev => ({
                  ...prev,
                  buyerName: existingCustomer.buyer!.name,
                  buyerPhone: existingCustomer.buyer!.phone
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

      const commissionVal = parseCurrencyInput(saleData.commission);

      let finalSoldPrice = priceInput;
      if (saleData.method === 'Troca + Volta') {
          finalSoldPrice = priceInput + tradeInVal;
      }

      const buyer: Buyer = {
          name: sanitizeInput(saleData.buyerName),
          cpf: sanitizeInput(saleData.buyerCpf),
          phone: sanitizeInput(saleData.buyerPhone)
      };

      const saleUpdate: Partial<Vehicle> = {
          status: 'sold',
          soldPrice: finalSoldPrice,
          soldDate: saleData.date,
          paymentMethod: saleData.method,
          saleCommission: commissionVal,
          saleCommissionTo: saleData.commissionTo,
          buyer,
          warrantyDetails: {
              time: saleData.warrantyTime,
              km: saleData.warrantyKm
          }
      };

      if (saleData.method === 'Troca + Volta') {
          saleUpdate.tradeInInfo = {
              make: sanitizeInput(saleData.tradeIn.make),
              model: sanitizeInput(saleData.tradeIn.model),
              plate: maskPlate(saleData.tradeIn.plate),
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
                  version: 'Entrada via Troca',
                  year: parseInt(saleData.tradeIn.year) || new Date().getFullYear(),
                  plate: maskPlate(saleData.tradeIn.plate),
                  km: 0,
                  fuel: 'Flex',
                  transmission: 'Automático',
                  color: '',
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
                            Venda registrada e estoque atualizado. O veículo agora consta como "Vendido".
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
                  <button onClick={() => setCameraState(prev => ({...prev, isOpen: false}))} className="text-white p-2">
                      <X size={24} />
                  </button>
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

              <div className="p-8 bg-black/50 backdrop-blur absolute bottom-0 w-full flex justify-center">
                  <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition-all shadow-lg active:scale-95">
                      <div className="w-16 h-16 bg-white rounded-full"></div>
                  </button>
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
                                <div className="absolute top-full mt-2 left-0 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleStatusChange(opt.value as VehicleStatus)}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between group"
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
                                    const url = `${window.location.origin}?vid=${vehicle.id}`;
                                    navigator.clipboard.writeText(url);
                                    showToast("Link copiado!", "success");
                                }}
                            >
                                {canShare ? 'Compartilhar' : 'Bloqueado'}
                            </Button>
                            {canManageSales && formData.status !== 'preparation' && <Button onClick={() => setActiveTab('sell')}>Vender</Button>}
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
                                        className={`w-full bg-slate-900 border ${dirtyState.isOverviewDirty && formData[item.field as keyof Vehicle] !== vehicle[item.field as keyof Vehicle] ? 'border-amber-500/50' : 'border-slate-700'} rounded p-2 text-white ${item.uppercase ? 'uppercase' : ''}`}
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
                                    className="w-32 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white" 
                                    value={getMaskedValue(formData.fipePrice)} 
                                    onChange={e => setFormData(prev => ({...prev, fipePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))} 
                                  />
                              </div>

                              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg border border-indigo-500/30">
                                  <span className="text-indigo-300">Custo de Compra</span>
                                  <input 
                                      type="text" 
                                      inputMode="decimal"
                                      className="w-32 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white" 
                                      value={getMaskedValue(formData.purchasePrice)} 
                                      onChange={e => setFormData(prev => ({...prev, purchasePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))} 
                                  />
                              </div>
                              
                              <div className="flex justify-between p-3 rounded-lg bg-slate-800">
                                  <span className="text-white">Preço Anunciado</span>
                                  <input 
                                      type="text" 
                                      inputMode="decimal"
                                      className="w-32 bg-slate-900 border border-slate-700 rounded p-1 text-right text-white text-lg font-bold" 
                                      value={getMaskedValue(formData.expectedSalePrice)} 
                                      onChange={e => setFormData(prev => ({...prev, expectedSalePrice: parseCurrencyInput(maskCurrencyInput(e.target.value)) }))} 
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
                                      <span>{formatCurrency(operatingExpensesValue + effectiveCommissionCost)}</span>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.photos.map((photo, idx) => (
                          <div key={idx} className="aspect-[4/3] relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                              <img src={photo} className="w-full h-full object-cover" />
                              <button onClick={() => handlePhotoDelete(idx)} className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white hover:bg-rose-600 shadow-lg"><Trash2 size={14}/></button>
                              
                              {idx !== 0 && (
                                  <button onClick={async () => {
                                      const newPhotos = [...formData.photos];
                                      const p = newPhotos.splice(idx, 1)[0];
                                      newPhotos.unshift(p);
                                      setFormData({...formData, photos: newPhotos});
                                  }} className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-white text-xs opacity-0 group-hover:opacity-100 backdrop-blur-sm">Definir Capa</button>
                              )}
                          </div>
                      ))}
                      {formData.photos.length === 0 && (
                          <div className="col-span-full py-10 text-center text-slate-500">
                              <Camera size={32} className="mx-auto mb-2 opacity-30" />
                              Nenhuma foto cadastrada.
                          </div>
                      )}
                  </div>
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
                                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm"
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
                                      <span>Gastos Op.: {formatCurrency(operatingExpensesValue)}</span>
                                      <span>Comissões: {formatCurrency(effectiveCommissionCost)}</span>
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

                  <Card title={isSold ? "Detalhes da Venda" : "Concluir Venda"} className="max-w-4xl mx-auto border-indigo-500/30">
                      {/* ... (Keep form inputs as is) ... */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <label className="block text-sm text-slate-300">
                                  {saleData.method === 'Troca + Volta' && !isSold ? 'Valor em Dinheiro (Volta)' : 'Valor Final da Venda'}
                              </label>
                              <input 
                                type="text" 
                                inputMode="decimal"
                                value={saleData.price} 
                                onChange={e => setSaleData({...saleData, price: maskCurrencyInput(e.target.value)})} 
                                disabled={isSold} 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-lg font-bold" 
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm text-slate-300">Data</label>
                                      <input type="date" value={saleData.date} onChange={e => setSaleData({...saleData, date: e.target.value})} disabled={isSold} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                                  </div>
                                  <div>
                                      <label className="block text-sm text-slate-300">Pagamento</label>
                                      <select value={saleData.method} onChange={e => setSaleData({...saleData, method: e.target.value})} disabled={isSold} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                          <option>Pix / Transferência</option>
                                          <option>Financiamento</option>
                                          <option>Dinheiro</option>
                                          <option>Troca + Volta</option>
                                      </select>
                                  </div>
                              </div>

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
                                            value={isSold ? maskCurrencyInput(((vehicle.saleCommission || 0) * 100).toFixed(0)) : saleData.commission} 
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
                                      {isSold && vehicle.saleCommission && vehicle.saleCommission > 0 && (
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

                              {saleData.method === 'Troca + Volta' && !isSold && (
                                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mt-4">
                                      <h4 className="text-white font-medium mb-3 flex items-center gap-2"><ArrowRightLeft size={16}/> Entrada (Troca)</h4>
                                      <div className="grid grid-cols-2 gap-3 mb-3">
                                          <input placeholder="Marca" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.make} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, make: e.target.value}})} />
                                          <input placeholder="Modelo" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.model} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, model: e.target.value}})} />
                                          <input placeholder="Ano" type="number" inputMode="numeric" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={saleData.tradeIn.year} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, year: e.target.value}})} />
                                          <input placeholder="Placa" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm uppercase" value={saleData.tradeIn.plate} onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, plate: maskPlate(e.target.value)}})} />
                                      </div>
                                      <input 
                                        placeholder="Valor de Avaliação R$" 
                                        inputMode="decimal"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm font-bold" 
                                        value={saleData.tradeIn.value} 
                                        onChange={e => setSaleData({...saleData, tradeIn: {...saleData.tradeIn, value: maskCurrencyInput(e.target.value)}})} 
                                      />
                                  </div>
                              )}
                          </div>

                          <div className="space-y-4">
                              <label className="block text-sm text-slate-300">Cliente</label>
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
                          </div>
                      </div>
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
