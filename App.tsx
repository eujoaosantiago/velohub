
import React, { useState, useEffect } from 'react';
import { VelohubProvider, useVelohub } from './contexts/VelohubContext';
import { Layout } from './components/Layout';
import { Dashboard } from './dashboard/Dashboard';
import { VehicleList } from './vehicles/VehicleList';
import { VehicleDetail } from './vehicles/VehicleDetail';
import { SalesList } from './sales/SalesList';
import { ExpensesList } from './expenses/ExpensesList';
import { CustomerList } from './customers/CustomerList';
import { TeamInvite } from './components/TeamInvite';
import { ProfilePage } from './auth/ProfilePage';
import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { ResetPasswordPage } from './auth/ResetPasswordPage'; 
import { LandingPage } from './landing/LandingPage';
import { TermsPage, PrivacyPage, SupportPage } from './landing/LegalPages';
import { PublicVehicleShare } from './vehicles/PublicVehicleShare';
import { Page, Vehicle } from './types';
import { ApiService } from './services/api';
import { checkVehicleLimit, getPlanLimits } from './lib/plans';
import { WelcomeModal } from './components/WelcomeModal';
import { CookieConsent } from './components/CookieConsent';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { Button } from './components/ui/Button';
import { Database, Loader2 } from 'lucide-react';

// Wrapper component to use the hook
const AppContent: React.FC = () => {
  const { user, vehicles, currentPage, navigateTo, login, logout, refreshData, isLoading } = useVelohub();
  
  // --- SETUP CHECK ---
  if (!isSupabaseConfigured()) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 animate-fade-in">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
                  
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/20">
                      <Database size={32} />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-2">Conexão Necessária</h1>
                  <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                      O Velohub precisa se conectar ao Supabase para funcionar com segurança. As chaves de API não foram detectadas.
                  </p>
                  
                  <div className="bg-slate-950 rounded-lg p-4 text-left border border-slate-800 mb-6 font-mono text-xs text-slate-300">
                      <p className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Configure seu arquivo .env:</p>
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

  // Invite & Public Share Logic State
  const [inviteStoreId, setInviteStoreId] = useState<string | null>(null);
  const [inviteStoreName, setInviteStoreName] = useState<string | null>(null);
  const [publicVehicleId, setPublicVehicleId] = useState<string | null>(null);

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

  // Force redirect if user is logged in but on public pages
  useEffect(() => {
      if (user && !isLoading && (currentPage === Page.LANDING || currentPage === Page.LOGIN || currentPage === Page.REGISTER)) {
          navigateTo(user.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
      }
  }, [user, isLoading, currentPage]);

  const handleSelectVehicle = (id: string) => {
    setDraftVehicle(null);
    setSelectedVehicleId(id);
    navigateTo(Page.VEHICLE_DETAIL);
  };

  const handleBackToVehicles = () => {
      setDraftVehicle(null);
      navigateTo(Page.VEHICLES);
  }

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    if (!user) return;
    try {
        if (draftVehicle && draftVehicle.id === updatedVehicle.id) {
            await ApiService.createVehicle(updatedVehicle, user);
            setDraftVehicle(null);
            setSelectedVehicleId(null);
            navigateTo(Page.VEHICLES);
        } else {
            await ApiService.updateVehicle(updatedVehicle);
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
          await ApiService.createVehicle(tradeInVehicle, user);
          await refreshData();
      } catch (error: any) {
          alert("Erro ao criar veículo de troca: " + error.message);
      }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!user) return;
    if (window.confirm('Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.')) {
      try {
        await ApiService.deleteVehicle(id, user.storeId);
        await refreshData();
        navigateTo(Page.VEHICLES);
      } catch (e) {
        alert("Erro ao excluir veículo.");
      }
    }
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
        expenses: []
    };
    
    setDraftVehicle(newVehicle);
    navigateTo(Page.VEHICLE_DETAIL);
  };

  // --- TELA DE CARREGAMENTO (SÓ APARECE SE TIVER SESSÃO) ---
  if (isLoading && !user) {
      // Se está carregando mas não temos usuário em memória (validação de token inicial),
      // mostramos o loading. Se tiver usuário em memória, mostramos a UI antiga enquanto valida.
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/20">
                <span className="font-bold text-white text-xl">V</span>
            </div>
        </div>
      );
  }

  if (currentPage === Page.PUBLIC_SHARE && publicVehicleId) {
      const foundVehicle = vehicles.find(v => v.id === publicVehicleId);
      if (!foundVehicle) {
           return <div className="min-h-screen bg-white flex items-center justify-center text-slate-500">
               <div className="flex flex-col items-center gap-2">
                   <Loader2 className="animate-spin text-slate-400" size={24} />
                   <span className="text-sm">Carregando ficha...</span>
               </div>
           </div>;
      }
      return (
        <>
            <PublicVehicleShare vehicle={foundVehicle} storeName={user?.storeName || 'Nossa Loja'} />
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
      case Page.VEHICLES: return <VehicleList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} onAddVehicle={handleAddVehicle} userRole={user.role} onUpdateVehicle={handleUpdateVehicle} onCreateTradeIn={handleCreateTradeIn} />;
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
            onDelete={() => handleDeleteVehicle(vehicle.id)}
            userRole={user.role}
            userPlan={user.plan}
            onCreateTradeIn={handleCreateTradeIn} 
          />
        );
      case Page.SALES: return <SalesList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} />;
      case Page.EXPENSES: return <ExpensesList vehicles={vehicles} />;
      case Page.CUSTOMERS: return <CustomerList vehicles={vehicles} onSelectVehicle={handleSelectVehicle} />;
      case Page.TEAM: return <TeamInvite user={user} />;
      case Page.PROFILE: return <ProfilePage user={user} onUpdateUser={(u) => login(u)} />;
      default: return <Dashboard vehicles={vehicles} user={user} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={navigateTo} onAddVehicle={handleAddVehicle} user={user} onLogout={logout}>
      <WelcomeModal user={user} />
      <CookieConsent />
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
