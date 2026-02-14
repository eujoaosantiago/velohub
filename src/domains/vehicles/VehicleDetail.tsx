import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Vehicle, Expense, ExpenseCategory, UserRole, checkPermission, User, PlanType } from '@/shared/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/PageHeader';
import { AlertCircle, AlertTriangle, CheckCircle, Save, Share2, Trash2, Lock, Crown, X, RefreshCw, Tag, Check, RotateCcw, ChevronDown } from 'lucide-react';

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
  getStatusLabel,
  getStatusColor,
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
  onShowToast?: (message: string, type: 'success' | 'error') => void;
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
  onShowToast,
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
  const [showStatusModal, setShowStatusModal] = useState(false);

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
    videoTrackRef,
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
      
      if (isNew) {
        if (onShowToast) {
          onShowToast('Veículo adicionado com sucesso!', 'success');
        } else {
          showToast('Veículo adicionado com sucesso!', 'success');
        }
        onBack();
      } else {
        showToast('Alterações salvas com sucesso!', 'success');
        // Reset optionalInput after successful save
        setOptionalInput('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar veículo';
      if (isNew && onShowToast) {
        onShowToast(message, 'error');
      } else {
        showToast(message, 'error');
      }
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

  // ===== PREPARE HEADER DATA =====
  const tabs = [
    {
      id: 'overview',
      label: 'Visão Geral',
      isDirty: tabDirty.overview,
      onClick: () => setActiveTab('overview'),
    },
    {
      id: 'photos',
      label: 'Fotos',
      isDirty: tabDirty.photos,
      onClick: () => setActiveTab('photos'),
    },
    ...(canViewCosts
      ? [
          {
            id: 'expenses',
            label: 'Gastos',
            isDirty: tabDirty.expenses,
            onClick: () => setActiveTab('expenses'),
          },
        ]
      : []),
    ...(canManageSales && !isNew
      ? [
          {
            id: 'sell',
            label: 'Fechar Venda',
            isDirty: false,
            onClick: () => setActiveTab('sell'),
          },
        ]
      : []),
  ];

  const actions = [
    ...(!isNew ? [
        {
            id: 'status',
            label: getStatusLabel(formData.status),
            icon: <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusModal ? 'rotate-180' : ''}`} />,
            onClick: () => setShowStatusModal(prev => !prev),
            variant: 'primary' as const,
            size: 'md' as const,
            className: `flex-row-reverse justify-between min-w-[140px]`,
            dropdownContent: showStatusModal && (
              <>
                <div className="fixed inset-0 z-[90] bg-transparent" onClick={() => setShowStatusModal(false)} />
                <div 
                    className="absolute top-full right-0 mt-2 z-[100] w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden animate-fade-in flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {[
                        { val: 'available', label: 'Em Estoque', color: 'text-emerald-500 dark:text-emerald-400' },
                        { val: 'reserved', label: 'Reservado', color: 'text-amber-500 dark:text-amber-400' },
                        { val: 'preparation', label: 'Preparação', color: 'text-indigo-500 dark:text-indigo-400' },
                        { val: 'sold', label: 'Vendido', color: 'text-blue-500 dark:text-blue-400' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => {
                                setFormData(prev => ({ ...prev, status: opt.val as any }));
                                setShowStatusModal(false);
                                showToast(`Status alterado para ${opt.label}. Salve para confirmar.`, 'success');
                            }}
                            className="w-full text-left px-4 py-3 text-sm flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className={opt.color}>{opt.label}</span>
                            {formData.status === opt.val && <Check size={14} className="text-emerald-500 dark:text-emerald-400"/>}
                        </button>
                    ))}
                </div>
              </>
            )
        }
    ] : []),
    ...(dirtyState.isDirty
      ? [
          {
            id: 'revert',
            label: 'Reverter',
            icon: <RotateCcw size={16} />,
            onClick: handleResetChanges,
            variant: 'ghost' as const,
            size: 'md' as const,
            className: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          },
        ]
      : []),
    ...(dirtyState.isDirty || isNew
      ? [
          {
            id: 'save',
            label: isNew ? 'Adicionar Veículo' : 'Salvar Alterações',
            icon: <Save size={16} />,
            onClick: handleSave,
            variant: 'primary' as const,
            size: 'md' as const,
            disabled: isSaving,
          },
        ]
      : []),
    ...(isNew || formData.status === 'preparation'
      ? []
      : [
          {
            id: 'share',
            label: 'Compartilhar',
            icon: canShare ? <Share2 size={16} /> : <Lock size={16} />,
            onClick: () => {
              if (canShare) {
                setShareModalOpen(true);
              } else {
                setShowUpgradeShareModal(true);
              }
            },
            variant: canShare ? ('secondary' as const) : ('ghost' as const),
            size: 'md' as const,
            disabled: !canShare,
            hideLabel: false,
          },
        ]),
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 size={16} />,
      onClick: () => setConfirmDeleteOpen(true),
      variant: 'ghost' as const,
      size: 'md' as const,
      hideLabel: true,
      className: 'text-rose-500 hover:text-white hover:bg-rose-500/20',
      title: 'Excluir Veículo'
    },
  ];

  // ===== RENDER =====
  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">
      <PageHeader
        title={isNew ? 'Novo Veículo' : `${formData.make} ${formData.model}`}
        description={isNew ? 'Preencha os dados do veículo' : `${formData.version ? formData.version + ' • ' : ''}${formData.year || ''} • ${formData.plate || 'Sem placa'}`}
        onBack={onBack}
        tabs={tabs}
        activeTab={activeTab}
        actions={actions}
      >
        {/* Status Badge - Optional injection into header area if PageHeader supported children for this, 
            but for now title/desc covers the context. 
            We can add a badge nearby if PageHeader layout allows customized title area or via children.
        */}
      </PageHeader>

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
        videoTrackRef={videoTrackRef}
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

      {dirtyState.isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 backdrop-blur-sm">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <span className="font-medium text-sm text-amber-400">Alterações não salvas</span>
        </div>
      )}

      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slide-in-top pointer-events-none ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
                  <div className="mb-4 p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                    <select value={fipeSelection.brand} onChange={(e) => handleFipeChange('brand', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none">
                      <option value="">Selecione a Marca</option>
                      {fipeData.brands.map((b) => (
                        <option key={b.codigo} value={b.codigo}>{b.nome}</option>
                      ))}
                    </select>
                    {fipeData.models.length > 0 && (
                      <select value={fipeSelection.model} onChange={(e) => handleFipeChange('model', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none">
                        <option value="">Selecione o Modelo</option>
                        {fipeData.models.map((m) => (
                          <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                        ))}
                      </select>
                    )}
                    {fipeData.years.length > 0 && (
                      <select value={fipeSelection.year} onChange={(e) => handleFipeChange('year', e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none">
                        <option value="">Selecione o Ano</option>
                        {fipeData.years.map((y) => (
                          <option key={y.codigo} value={y.codigo}>{y.nome}</option>
                        ))}
                      </select>
                    )}
                    {isLoadingFipe && <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando...</p>}
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
