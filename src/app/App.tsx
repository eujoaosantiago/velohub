
import React, { useEffect, useState } from 'react';
import { VelohubProvider, useVelohub } from '@/shared/contexts/VelohubContext';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/domains/dashboard/Dashboard';
import { SupportDashboard } from '@/domains/dashboard/Support';
import { VehicleList } from '@/domains/vehicles/VehicleList';
import { VehicleDetail } from '@/domains/vehicles/VehicleDetail';
import { SalesList } from '@/domains/sales/SalesList';
import { ExpensesList } from '@/domains/expenses/ExpensesList';
import { CustomerList } from '@/domains/customers/CustomerList';
import { TeamInvite } from '@/components/TeamInvite';
import { ProfilePage } from '@/domains/auth/ProfilePage';
import { LoginPage } from '@/domains/auth/LoginPage';
import { RegisterPage } from '@/domains/auth/RegisterPage';
import { ResetPasswordPage } from '@/domains/auth/ResetPasswordPage';
import { LandingPage } from '@/domains/landing/LandingPage';
import { TermsPage, PrivacyPage, SupportPage } from '@/domains/landing/LegalPages';
import { PublicVehicleShare } from '@/domains/vehicles/PublicVehicleShare';
import { Page, Vehicle } from '@/shared/types';
import { vehicleService } from '@/domains/vehicles/services/vehicleService';
import { checkVehicleLimit, getPlanLimits } from '@/shared/lib/plans';
import { WelcomeModal } from '@/components/WelcomeModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CookieConsent } from '@/components/CookieConsent';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Wrapper component to use the hook
const AppContent: React.FC = () => {
  const { user, vehicles, currentPage, navigateTo, login, logout, refreshData, isLoading } = useVelohub();
  
  // --- SETUP CHECK ---
  if (!isSupabaseConfigured()) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 animate-fade-in">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
                  
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/20">
                      <Database size={32} />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Conexão Necessária</h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                      O Velohub precisa se conectar ao Supabase para funcionar com segurança. As chaves de API não foram detectadas.
                  </p>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 text-left border border-slate-200 dark:border-slate-800 mb-6 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <p className="text-slate-500 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">Configure seu arquivo .env:</p>
                      <p className="text-emerald-400">VITE_SUPABASE_URL</p>
                      <p className="truncate text-slate-600 mb-2">https://seu-projeto.supabase.co</p>
                      <p className="text-emerald-400">VITE_SUPABASE_ANON_KEY</p>
                      <p className="truncate text-slate-600">eyJhbGciOiJIUzI1NiIsInR5cCI...</p>
                  </div>
                  
                  <Button onClick={() => window.location.reload()} className="w-full">
                      Tentar Novamente
                  </Button>
              </div>
          </div>
      );
  }

  // Local UI State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [draftVehicle, setDraftVehicle] = useState<Vehicle | null>(null);
  const [returnPage, setReturnPage] = useState<Page | null>(null);

  // Invite & Public Share Logic State
  const [inviteStoreId, setInviteStoreId] = useState<string | null>(null);
  const [inviteStoreName, setInviteStoreName] = useState<string | null>(null);
  const [publicVehicleId, setPublicVehicleId] = useState<string | null>(null);
  const [publicVehicle, setPublicVehicle] = useState<Vehicle | null>(null);
  const [loadingPublicVehicle, setLoadingPublicVehicle] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('invite');
      const storeName = params.get('storeName');
      const vid = params.get('vid');
      
      if (vid) {
          setPublicVehicleId(vid);
          navigateTo(Page.PUBLIC_SHARE);
          return;
      }

      if (inviteToken) {
          try {
              const decodedStoreId = atob(inviteToken);
              setInviteStoreId(decodedStoreId);
              setInviteStoreName(storeName);
              navigateTo(Page.REGISTER);
          } catch (e) {
              console.error("Invalid invite token");
          }
      }
  }, []);

  // Load public vehicle when publicVehicleId is set
  useEffect(() => {
      if (publicVehicleId && !publicVehicle) {
          console.log('🔄 Iniciando carregamento de veículo público. ID:', publicVehicleId);
          const loadPublicVehicle = async () => {
              setLoadingPublicVehicle(true);
              try {
                  console.log('📡 Chamando vehicleService.getVehicleById...');
                  const vehicle = await vehicleService.getVehicleById(publicVehicleId);
                  console.log('✅ Veículo carregado com sucesso:', vehicle);
                  setPublicVehicle(vehicle);
              } catch (error: any) {
                  console.error('❌ Erro ao carregar veículo público:', error);
                  console.error('❌ Mensagem de erro:', error?.message);
                  setPublicVehicle(null);
              } finally {
                  setLoadingPublicVehicle(false);
                  console.log('🏁 Carregamento finalizado');
              }
          };
          loadPublicVehicle();
      }
  }, [publicVehicleId, publicVehicle]);

  // Force redirect if user is logged in but on public pages
  useEffect(() => {
      if (user && !isLoading && (currentPage === Page.LANDING || currentPage === Page.LOGIN || currentPage === Page.REGISTER)) {
          navigateTo(user.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
      }
  }, [user, isLoading, currentPage]);

  const handleSelectVehicle = (id: string) => {
    setDraftVehicle(null);
    setSelectedVehicleId(id);
    setReturnPage(currentPage);
    navigateTo(Page.VEHICLE_DETAIL);
  };

  const handleBackToVehicles = () => {
      setDraftVehicle(null);
      const targetPage =
        returnPage && returnPage !== Page.VEHICLE_DETAIL
          ? returnPage
          : Page.VEHICLES;
      setReturnPage(null);
      navigateTo(targetPage);
  }

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    if (!user) return;
    try {
        if (draftVehicle && draftVehicle.id === updatedVehicle.id) {
            await vehicleService.createVehicle(updatedVehicle, user);
            setDraftVehicle(null);
            setSelectedVehicleId(null);
          const targetPage =
            returnPage && returnPage !== Page.VEHICLE_DETAIL
            ? returnPage
            : Page.VEHICLES;
          setReturnPage(null);
          navigateTo(targetPage);
        } else {
            await vehicleService.updateVehicle(updatedVehicle);
        }
        await refreshData();
    } catch (error: any) {
        alert(error.message || "Erro ao salvar dados.");
        throw error;
    }
  };

  const handleCreateTradeIn = async (tradeInVehicle: Vehicle) => {
      if (!user) return;
      try {
          await vehicleService.createVehicle(tradeInVehicle, user);
          await refreshData();
      } catch (error: any) {
          alert("Erro ao criar veículo de troca: " + error.message);
      }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const deleteVehicle = async (id: string) => {
    if (!user) return;

    try {
      await vehicleService.deleteVehicle(id, user.storeId);
      await refreshData();
      showToast("Veículo excluído com sucesso!", "success");
      
      if (currentPage === Page.VEHICLE_DETAIL) {
        const targetPage =
          returnPage && returnPage !== Page.VEHICLE_DETAIL
          ? returnPage
          : Page.VEHICLES;
        setReturnPage(null);
        navigateTo(targetPage);
      }
    } catch (e) {
      showToast("Erro ao excluir veículo.", "error");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!user) return;

    const vehicleToDelete = vehicles.find(v => v.id === id);
    if (!vehicleToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir veículo?',
      message: `Tem certeza que deseja excluir ${vehicleToDelete.make} ${vehicleToDelete.model} (${vehicleToDelete.plate || 'S/ Placa'})? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      confirmText: 'Excluir Veículo',
      onConfirm: () => deleteVehicle(id)
    });
  };

  const handleAddVehicle = () => {
    if (!user) return;

    const activeVehiclesCount = vehicles.filter(v => v.status !== 'sold').length;
    if (!checkVehicleLimit(user, activeVehiclesCount)) {
        const limits = getPlanLimits(user);
        alert(`Limite do plano atingido (${limits.maxVehicles} veículos). Atualize seu plano em Configurações.`);
        return;
    }

    const newVehicle: Vehicle = {
        id: Math.random().toString(),
        storeId: user.storeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        make: 'Nova',
        model: 'Marca/Modelo',
        version: 'Versão',
        year: new Date().getFullYear(),
        plate: '',
        renavam: '',
        chassis: '',
        km: 0,
        fuel: 'Flex',
        transmission: 'Automático',
        color: 'Branco',
        status: 'available',
        purchasePrice: 0,
        purchaseDate: new Date().toISOString(),
        expectedSalePrice: 0,
        fipePrice: 0,
        photos: [],
        expenses: [],
        optionals: []
    };
    
    setDraftVehicle(newVehicle);
    setReturnPage(currentPage);
    navigateTo(Page.VEHICLE_DETAIL);
  };

  // --- TELA DE CARREGAMENTO (SÓ APARECE SE TIVER SESSÃO) ---
  if (isLoading && !user) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/20">
                <span className="font-bold text-white text-xl">V</span>
            </div>
        </div>
      );
  }

  if (currentPage === Page.PUBLIC_SHARE && publicVehicleId) {
      if (loadingPublicVehicle) {
          return <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-500">
              <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                  <span className="text-sm">Carregando ficha...</span>
                  <span className="text-xs text-slate-400 font-mono">ID: {publicVehicleId}</span>
              </div>
          </div>;
      }
      
      if (!publicVehicle) {
          return <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 p-4">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-3xl">🚗</span>
                  </div>
                  <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Veículo não encontrado</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Este link pode estar desatualizado ou o veículo foi removido.</p>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-left">
                          <p className="text-slate-400 mb-1">ID do veículo:</p>
                          <p className="font-mono text-slate-700 dark:text-slate-300 break-all">{publicVehicleId}</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => window.location.href = '/'} 
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                      Voltar ao início
                  </button>
              </div>
          </div>;
      }
      
      return (
        <>
            <PublicVehicleShare 
                vehicle={publicVehicle} 
                storeName={(publicVehicle as any).storeName || 'Nossa Loja'}
                storeWhatsapp={(publicVehicle as any).storeWhatsapp}
            />
            <CookieConsent />
        </>
      );
  }

  if (currentPage === Page.RESET_PASSWORD) {
      return (
        <>
            <ResetPasswordPage onSuccess={() => navigateTo(Page.LOGIN)} />
            <CookieConsent />
        </>
      );
  }

  // Se o usuário não está logado
  if (!user) {
      const renderAuthPage = () => {
        switch (currentPage) {
            case Page.LOGIN: return <LoginPage onLoginSuccess={login} onNavigateRegister={() => navigateTo(Page.REGISTER)} onNavigateHome={() => navigateTo(Page.LANDING)} />;
            case Page.REGISTER: return <RegisterPage onRegisterSuccess={login} onNavigateLogin={() => navigateTo(Page.LOGIN)} onNavigateHome={() => navigateTo(Page.LANDING)} inviteStoreId={inviteStoreId} inviteStoreName={inviteStoreName} />;
            case Page.TERMS: return <TermsPage onBack={() => navigateTo(Page.LANDING)} />;
            case Page.PRIVACY: return <PrivacyPage onBack={() => navigateTo(Page.LANDING)} />;
            case Page.SUPPORT: return <SupportPage onBack={() => navigateTo(Page.LANDING)} />;
            default: return <LandingPage onNavigateLogin={() => navigateTo(Page.LOGIN)} onNavigateRegister={() => navigateTo(Page.REGISTER)} onNavigateTerms={() => navigateTo(Page.TERMS)} onNavigatePrivacy={() => navigateTo(Page.PRIVACY)} onNavigateSupport={() => navigateTo(Page.SUPPORT)} />;
        }
      };

      return (
        <>
            {renderAuthPage()}
            <CookieConsent />
        </>
      );
  }

  // Área Logada (Dashboard)
  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD: return <Dashboard vehicles={vehicles} user={user} />;
      case Page.VEHICLES: return <VehicleList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} onAddVehicle={handleAddVehicle} userRole={user.role} onUpdateVehicle={handleUpdateVehicle} onCreateTradeIn={handleCreateTradeIn} onDeleteVehicle={handleDeleteVehicle} />;
      case Page.VEHICLE_DETAIL:
        const vehicle = draftVehicle || vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) return <div className="text-white">Veículo não encontrado</div>;
        return (
          <VehicleDetail 
            vehicle={vehicle}
            allVehicles={vehicles} 
            isNew={!!draftVehicle} 
            onBack={handleBackToVehicles} 
            onUpdate={handleUpdateVehicle}
            onDelete={() => deleteVehicle(vehicle.id)}
            user={user}
            userRole={user.role}
            userPlan={user.plan}
            onCreateTradeIn={handleCreateTradeIn} 
            onShowToast={showToast}
          />
        );
      case Page.SALES: return <SalesList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} />;
      case Page.EXPENSES:
        return (
          <ExpensesList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} />
        );
      case Page.CUSTOMERS: return <CustomerList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} />;
      case Page.TEAM: return <TeamInvite user={user} />;
      case Page.SUPPORT: return <SupportDashboard />;
      case Page.PROFILE: return <ProfilePage user={user} onUpdateUser={(u) => login(u)} onLogout={logout} />;
      default: return <Dashboard vehicles={vehicles} user={user} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={navigateTo} onAddVehicle={handleAddVehicle} user={user} onLogout={logout}>
      <WelcomeModal user={user} />
      <CookieConsent />
      
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slide-in-top pointer-events-none ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <VelohubProvider>
      <AppContent />
    </VelohubProvider>
  );
};

export default App;



