import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Vehicle, Expense, ExpenseCategory, UserRole, checkPermission, User, PlanType } from '@/shared/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle, Save, Share2, Trash2, Lock, Crown, X } from 'lucide-react';

// Import formatting utilities
import {
  formatCurrency,
  isValidPlate,
  maskCurrencyInput,
  maskCEP,
  maskChassis,
  maskPhone,
  maskRenavam,
  numberToMaskedCurrency,
  parseCurrencyInput,
  formatDateBR,
} from '@/shared/lib/utils';

// Import tab components
import { VehicleOverviewTab } from './components/VehicleOverviewTab';
import { VehiclePhotosTab } from './components/VehiclePhotosTab';
import { VehicleExpensesTab } from './components/VehicleExpensesTab';
import { VehicleSellTab } from './components/VehicleSellTab';

// Import modals
import { ShareModal } from '@/components/ShareModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CameraModal } from './components/CameraModal';

// Import hooks
import { useFipeSearch } from './hooks/useFipeSearch';
import { usePhotoManager } from './hooks/usePhotoManager';
import { useSaleForm } from './hooks/useSaleForm';

// Import constants and utilities
import { EXPENSE_CATEGORIES, OPTIONAL_FEATURES, STATUS_OPTIONS } from './constants';
import { maskPlate, splitModelVersion, getBestModelPrefix } from './utils';
import { getPlanLimits } from '@/shared/lib/plans';

// Import services
import { ApiService } from '@/services/api';

export interface VehicleDetailProps {
  vehicle: Vehicle;
  allVehicles?: Vehicle[];
  isNew?: boolean;
  onBack: () => void;
  onUpdate: (updatedVehicle: Vehicle) => Promise<void>;
  onDelete: () => Promise<void>;
  user: User;
  userRole: UserRole;
  userPlan?: PlanType;
  onCreateTradeIn?: (tradeInVehicle: Vehicle) => Promise<void>;
}

type UploadProgress = {
  total: number;
  done: number;
};

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle,
  allVehicles = [],
  isNew = false,
  onBack,
  onUpdate,
  onDelete,
  user,
  userRole,
  userPlan = 'free',
  onCreateTradeIn,
}) => {
  // ===== STATE MANAGEMENT =====
  const [formData, setFormData] = useState<Vehicle>(vehicle);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'expenses' | 'sell'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Tab-specific state
  const [expenseData, setExpenseData] = useState({
    desc: '',
    amount: '',
    category: 'maintenance' as ExpenseCategory,
    employeeName: '',
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [activeExpenseFilter, setActiveExpenseFilter] = useState<ExpenseCategory | 'all'>('all');
  const [optionalInput, setOptionalInput] = useState('');
  const [showFipeSearch, setShowFipeSearch] = useState(false);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showUpgradeShareModal, setShowUpgradeShareModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const isSold = formData.soldDate ? true : false;

  // Check permissions
  const canViewCosts = checkPermission({ role: userRole } as User, 'view_costs');
  const canManageSales = checkPermission({ role: userRole } as User, 'manage_sales');

  // Plan limits for share
  const planLimits = getPlanLimits(user);
  const canShare = (planLimits?.showShareLink ?? false) && checkPermission(user, 'share_vehicles');

  // ===== SYNCHRONIZE FORMDATA WITH VEHICLE PROP =====
  useEffect(() => {
    setFormData(vehicle);
    setOptionalInput('');
  }, [vehicle.id]);

  // ===== CUSTOM HOOKS =====
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const {
    useFipeSearch: _fipeSearchState,
    fipeData,
    fipeSelection,
    isLoadingFipe,
    loadBrands,
    handleFipeChange,
  } = useFipeSearch({
    isNew,
    setFormData,
    showToast,
  });

  const {
    fileInputRef: photoFileRef,
    cameraState,
    setCameraState,
    isPhotoUploading,
    uploadProgress,
    photoIndex,
    setPhotoIndex,
    handlePhotoUpload,
    handlePhotoDelete,
    markPhotoMoved,
    draggedPhotoIndex,
    setDraggedPhotoIndex,
    dragOverPhotoIndex,
    setDragOverPhotoIndex,
    recentlyMovedIndex,
    cameraZoom,
    cameraZoomRange,
    cameraHasZoom,
    cameraTorchOn,
    cameraHasTorch,
    toggleCameraTorch,
    applyCameraZoom,
    capturePhoto,
    videoRef,
    canvasRef,
  } = usePhotoManager({
    vehicle,
    formData,
    setFormData,
    onUpdate: onUpdate,
    showToast,
    isNew,
    activeTab,
  });

  const {
    saleData,
    setSaleData,
    isCpfValid,
    isCpfInvalid,
    hasCommissionInput,
    handleCpfChange,
    handleBuyerCepBlur,
    handleSale,
    calculateDefaultCommission,
  } = useSaleForm({
    vehicle,
    allVehicles,
    formData,
    setFormData,
    onUpdate: onUpdate,
    onCreateTradeIn: onCreateTradeIn,
    showToast,
    setIsSaving,
    setShowSaleSuccess,
  });

  // ===== COMPUTED VALUES =====
  const filteredExpenses = useMemo(() => {
    if (activeExpenseFilter === 'all') return formData.expenses || [];
    return (formData.expenses || []).filter(
      (exp: Expense) => exp.category === activeExpenseFilter
    );
  }, [formData.expenses, activeExpenseFilter]);

  const allExpensesSum = useMemo(
    () => (formData.expenses || []).reduce((sum: number, exp: Expense) => sum + exp.amount, 0),
    [formData.expenses]
  );

  const totalCost = useMemo(
    () => formData.purchasePrice + allExpensesSum,
    [formData.purchasePrice, allExpensesSum]
  );

  const operatingExpensesValue = useMemo(() => {
    return (formData.expenses || [])
      .filter((exp: Expense) => exp.category !== 'salary')
      .reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
  }, [formData.expenses]);

  const effectiveCommissionCost = useMemo(() => {
    return parseCurrencyInput(saleData.commission);
  }, [saleData.commission]);

  const grossRevenue = useMemo(() => {
    const price = parseCurrencyInput(saleData.price);
    const tradeIn = parseCurrencyInput(saleData.tradeIn?.value || '0');
    return price + tradeIn;
  }, [saleData.price, saleData.tradeIn?.value]);

  const tradeInValue = useMemo(() => {
    return parseCurrencyInput(saleData.tradeIn?.value || '0');
  }, [saleData.tradeIn?.value]);

  const cashReceived = useMemo(() => {
    return grossRevenue - tradeInValue;
  }, [grossRevenue, tradeInValue]);

  const isProfit = useMemo(() => {
    return grossRevenue > totalCost + effectiveCommissionCost;
  }, [grossRevenue, totalCost, effectiveCommissionCost]);

  const netProfit = useMemo(() => {
    return grossRevenue - totalCost - effectiveCommissionCost;
  }, [grossRevenue, totalCost, effectiveCommissionCost]);

  // ===== DIRTY STATE =====
  const safeCompare = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((item: any, idx: number) => item === b[idx]);
    }
    return false;
  };

  const normalizeOptional = (value: string) => value.trim().toLowerCase();
  const normalizeOptionals = (values?: string[]) => (values || []).map(normalizeOptional).filter(Boolean);

  const dirtyState = useMemo(() => {
    const overviewFields = [
      'make',
      'model',
      'version',
      'year',
      'km',
      'plate',
      'chassis',
      'renavam',
      'color',
      'fuel',
      'transmission',
      'purchasePrice',
      'purchaseDate',
      'expectedSalePrice',
      'fipePrice',
      'status',
      'photos',
      'ipvaPaid',
      'licensingPaid',
    ];

    const isOverviewDirty = overviewFields.some(
      (field: string) =>
        !safeCompare(
          (formData as any)[field],
          (vehicle as any)[field]
        )
    );

    return {
      isOverviewDirty,
      isDirty: isOverviewDirty ||
        !safeCompare(formData.photos, vehicle.photos) ||
        !safeCompare(formData.expenses, vehicle.expenses) ||
        !safeCompare(normalizeOptionals(formData.optionals), normalizeOptionals(vehicle.optionals)),
    };
  }, [formData, vehicle, safeCompare]);

  const tabDirty = useMemo(() => {
    const optionalsDirty = !safeCompare(
      normalizeOptionals(formData.optionals),
      normalizeOptionals(vehicle.optionals),
    );
    const overviewDirty = dirtyState.isOverviewDirty || optionalsDirty;
    return {
      overview: overviewDirty,
      photos: !safeCompare(formData.photos, vehicle.photos),
      expenses: !safeCompare(formData.expenses, vehicle.expenses),
    };
  }, [dirtyState.isOverviewDirty, formData, vehicle, safeCompare]);

  // ===== EVENT HANDLERS =====
  const handleChange = (field: keyof Vehicle, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatIntegerForInput = (val: number) => {
    if (!val) return '';
    return val.toLocaleString('pt-BR');
  };

  const parseIntegerFromInput = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  const handleAddOptional = () => {
    const raw = optionalInput.trim();
    if (!raw) return;

    const nextNormalized = normalizeOptional(raw);
    const current = formData.optionals || [];
    if (current.some((item) => normalizeOptional(item) === nextNormalized)) {
      setOptionalInput('');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      optionals: [...(prev.optionals || []), raw],
    }));
    setOptionalInput('');
  };

  const toggleOptional = (label: string) => {
    const normalized = normalizeOptional(label);
    const current = formData.optionals || [];
    const hasItem = current.some((item) => normalizeOptional(item) === normalized);

    setFormData((prev) => ({
      ...prev,
      optionals: hasItem
        ? (prev.optionals || []).filter((item) => normalizeOptional(item) !== normalized)
        : [...(prev.optionals || []), label],
    }));
  };

  const removeOptional = (label: string) => {
    const normalized = normalizeOptional(label);
    setFormData((prev) => ({
      ...prev,
      optionals: (prev.optionals || []).filter((item) => normalizeOptional(item) !== normalized),
    }));
  };

  const getMaskedValue = (val: number) => {
    if (val === 0) return '';
    return formatCurrency(val);
  };

  const handleResetChanges = () => {
    setFormData(vehicle);
    setOptionalInput('');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      await onUpdate(formData);
      showToast('Alteracoes salvas com sucesso!', 'success');
      // Reset optionalInput after successful save
      setOptionalInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar veículo';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      showToast('Veiculo excluido com sucesso!', 'success');
      onBack();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir veículo';
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleAddExpense = useCallback(async () => {
    if (!expenseData.desc || !expenseData.amount) return;

    try {
      const newExpense: Expense = {
        id: editingExpenseId || `exp_${Date.now()}`,
        vehicleId: vehicle.id,
        description: expenseData.desc,
        amount: parseCurrencyInput(expenseData.amount),
        category: expenseData.category,
        date: new Date().toISOString().split('T')[0],
        employeeName: expenseData.employeeName || undefined,
        storeId: vehicle.storeId,
      } as Expense;

      if (editingExpenseId) {
        setFormData((prev) => ({
          ...prev,
          expenses: (prev.expenses || []).map((exp) =>
            exp.id === editingExpenseId ? newExpense : exp
          ),
        }));
        setEditingExpenseId(null);
      } else {
        setFormData((prev) => ({
          ...prev,
          expenses: [...(prev.expenses || []), newExpense],
        }));
      }

      setExpenseData({
        desc: '',
        amount: '',
        category: 'maintenance',
        employeeName: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar gasto';
      showToast(message, 'error');
    }
  }, [expenseData, editingExpenseId, showToast, vehicle.id, vehicle.storeId]);

  const handleEditExpense = (expense: Expense) => {
    setExpenseData({
      desc: expense.description,
      amount: numberToMaskedCurrency(expense.amount),
      category: expense.category,
      employeeName: expense.employeeName || '',
    });
    setEditingExpenseId(expense.id);
  };

  const handleCancelEditExpense = () => {
    setExpenseData({
      desc: '',
      amount: '',
      category: 'maintenance',
      employeeName: '',
    });
    setEditingExpenseId(null);
  };
  const handleDeleteExpense = (expenseId: string) => {
    setFormData((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).filter((exp) => exp.id !== expenseId),
    }));
  };

  // ===== RENDER =====
  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">
              {formData.make} {formData.model}
            </h1>
            <p className="text-slate-400 text-sm">{formData.plate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirtyState.isDirty && (
            <span className="text-amber-500 text-xs flex items-center gap-1">
              <AlertTriangle size={14} />
              Alterações não salvas
            </span>
          )}
          {dirtyState.isDirty && (
            <Button variant="ghost" onClick={handleResetChanges} disabled={isSaving}>
              Desfazer
            </Button>
          )}
          <button
            onClick={() => {
              if (canShare) {
                setShareModalOpen(true);
              } else {
                setShowUpgradeShareModal(true);
              }
            }}
            className={`px-4 py-2 border rounded-xl transition-colors flex items-center gap-2 text-sm font-medium ${
              canShare
                ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title={canShare ? 'Compartilhar' : 'Funcionalidade Premium'}
          >
            {canShare ? <Share2 size={16} /> : <Lock size={16} />}
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="px-4 py-2 border border-slate-800 bg-slate-900 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Excluir Veículo"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Excluir</span>
          </button>
          <Button onClick={handleSave} disabled={isSaving || !dirtyState.isDirty}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {shareModalOpen && (
          <ShareModal 
              vehicleId={formData.id}
              vehicleModel={`${formData.make} ${formData.model}`}
              onClose={() => setShareModalOpen(false)}
              photoUrl={formData.photos[0] || undefined}
          />
      )}

      <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Excluir veiculo?"
          message="Esta acao remove o veiculo permanentemente do sistema. Essa operacao nao pode ser desfeita."
          confirmText="Excluir veiculo"
          cancelText="Cancelar"
          variant="danger"
      />

      <CameraModal
        isOpen={cameraState.isOpen}
        onClose={() => setCameraState((prev) => ({ ...prev, isOpen: false }))}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onCapture={capturePhoto}
        isUploading={cameraState.isUploading}
        cameraZoom={cameraZoom}
        cameraZoomRange={cameraZoomRange}
        cameraHasZoom={cameraHasZoom}
        cameraTorchOn={cameraTorchOn}
        cameraHasTorch={cameraHasTorch}
        toggleTorch={toggleCameraTorch}
        applyCameraZoom={applyCameraZoom}
      />

      {showUpgradeShareModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowUpgradeShareModal(false)}>
              <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowUpgradeShareModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                      <X size={20} />
                  </button>

                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
                          <Share2 size={32} className="text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">Compartilhamento de Veículos</h3>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                          O compartilhamento de veículos é uma funcionalidade exclusiva dos planos <strong>Starter</strong> e <strong>Pro</strong>.
                      </p>

                      <div className="space-y-3">
                          <Button 
                              onClick={() => {/* navigateTo profile */}} 
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-lg shadow-indigo-500/20 py-3"
                          >
                              <Crown size={16} className="mr-2" />
                              Fazer Upgrade Agora
                          </Button>
                          <Button 
                              variant="ghost" 
                              onClick={() => setShowUpgradeShareModal(false)} 
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
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 px-4 py-4 flex gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`whitespace-nowrap py-2 px-1 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            Visão Geral
            {tabDirty.overview && <span className="h-2 w-2 rounded-full bg-amber-500" />}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`whitespace-nowrap py-2 px-1 border-b-2 transition-colors ${
            activeTab === 'photos'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            Fotos
            {tabDirty.photos && <span className="h-2 w-2 rounded-full bg-amber-500" />}
          </span>
        </button>
        {canViewCosts && (
          <button
            onClick={() => setActiveTab('expenses')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 transition-colors ${
              activeTab === 'expenses'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              Gastos
              {tabDirty.expenses && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </span>
          </button>
        )}
        {canManageSales && !isNew && (
          <button
            onClick={() => setActiveTab('sell')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 transition-colors ${
              activeTab === 'sell'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Venda
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="min-h-[400px]">
            {activeTab === 'overview' && (
            <VehicleOverviewTab
              formData={formData}
              vehicle={vehicle}
              dirtyStateIsOverview={dirtyState.isOverviewDirty}
              safeCompare={safeCompare}
              useFipeSearch={showFipeSearch}
              onToggleFipeSearch={() => setShowFipeSearch(!showFipeSearch)}
              fipeSearch={
                showFipeSearch && (
                  <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
                    <select value={fipeSelection.brand} onChange={(e) => handleFipeChange('brand', e.target.value)} className="w-full select-premium">
                      <option value="">Selecione a Marca</option>
                      {fipeData.brands.map((b) => (
                        <option key={b.codigo} value={b.codigo}>{b.nome}</option>
                      ))}
                    </select>
                    {fipeData.models.length > 0 && (
                      <select value={fipeSelection.model} onChange={(e) => handleFipeChange('model', e.target.value)} className="w-full select-premium">
                        <option value="">Selecione o Modelo</option>
                        {fipeData.models.map((m) => (
                          <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                        ))}
                      </select>
                    )}
                    {fipeData.years.length > 0 && (
                      <select value={fipeSelection.year} onChange={(e) => handleFipeChange('year', e.target.value)} className="w-full select-premium">
                        <option value="">Selecione o Ano</option>
                        {fipeData.years.map((y) => (
                          <option key={y.codigo} value={y.codigo}>{y.nome}</option>
                        ))}
                      </select>
                    )}
                    {isLoadingFipe && <p className="text-slate-400 text-sm">Carregando...</p>}
                  </div>
                )
              }
              handleChange={handleChange}
              formatIntegerForInput={formatIntegerForInput}
              parseIntegerFromInput={parseIntegerFromInput}
              optionalInput={optionalInput}
              setOptionalInput={setOptionalInput}
              handleAddOptional={handleAddOptional}
              toggleOptional={toggleOptional}
              removeOptional={removeOptional}
              optionalFeatures={OPTIONAL_FEATURES}
              getMaskedValue={getMaskedValue}
              maskCurrencyInput={maskCurrencyInput}
              parseCurrencyInput={parseCurrencyInput}
              setFormData={setFormData}
              isPhotoUploading={isPhotoUploading}
              uploadProgress={uploadProgress}
              onOpenPhotos={() => setActiveTab('photos')}
              canViewCosts={canViewCosts}
              allExpensesSum={allExpensesSum}
              totalCost={totalCost}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'photos' && (
            <VehiclePhotosTab
              formData={formData}
              fileInputRef={photoFileRef}
              isPhotoUploading={isPhotoUploading}
              uploadProgress={uploadProgress}
              photoIndex={photoIndex}
              setPhotoIndex={setPhotoIndex}
              setCameraState={setCameraState}
              handlePhotoUpload={handlePhotoUpload}
              handlePhotoDelete={handlePhotoDelete}
              setFormData={setFormData}
              draggedPhotoIndex={draggedPhotoIndex}
              setDraggedPhotoIndex={setDraggedPhotoIndex}
              dragOverPhotoIndex={dragOverPhotoIndex}
              setDragOverPhotoIndex={setDragOverPhotoIndex}
              markPhotoMoved={markPhotoMoved}
              recentlyMovedIndex={recentlyMovedIndex}
            />
          )}

          {activeTab === 'expenses' && canViewCosts && (
            <VehicleExpensesTab
              expenseData={expenseData}
              setExpenseData={setExpenseData}
              editingExpenseId={editingExpenseId}
              handleAddExpense={handleAddExpense}
              handleCancelEditExpense={handleCancelEditExpense}
              handleEditExpense={handleEditExpense}
              handleDeleteExpense={handleDeleteExpense}
              activeExpenseFilter={activeExpenseFilter}
              setActiveExpenseFilter={setActiveExpenseFilter}
              filteredExpenses={filteredExpenses}
              categories={EXPENSE_CATEGORIES}
              totalExpensesValue={allExpensesSum}
              originalExpenses={vehicle.expenses}
              formatCurrency={formatCurrency}
              formatDateBR={formatDateBR}
              maskCurrencyInput={maskCurrencyInput}
            />
          )}

          {activeTab === 'sell' && canManageSales && !isNew && (
            <VehicleSellTab
              formData={formData}
              vehicle={vehicle}
              saleData={saleData}
              setSaleData={setSaleData}
              priceInputRef={priceInputRef}
              isSold={isSold}
              isSaving={isSaving}
              isCpfValid={isCpfValid}
              isCpfInvalid={isCpfInvalid}
              hasCommissionInput={hasCommissionInput}
              canViewCosts={canViewCosts}
              grossRevenue={grossRevenue}
              tradeInValue={tradeInValue}
              cashReceived={cashReceived}
              totalCost={totalCost}
              operatingExpensesValue={operatingExpensesValue}
              effectiveCommissionCost={effectiveCommissionCost}
              isProfit={isProfit}
              netProfit={netProfit}
              formatCurrency={formatCurrency}
              maskCurrencyInput={maskCurrencyInput}
              maskPhone={maskPhone}
              maskCEP={maskCEP}
              maskPlate={maskPlate}
              maskRenavam={maskRenavam}
              maskChassis={maskChassis}
              calculateDefaultCommission={calculateDefaultCommission}
              handleCpfChange={handleCpfChange}
              handleBuyerCepBlur={handleBuyerCepBlur}
              handleSale={handleSale}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
