
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Vehicle, Page } from '../types';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { supabase } from '../lib/supabaseClient';

interface VelohubContextType {
  // Auth State
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  
  // Data State
  vehicles: Vehicle[];
  refreshData: () => Promise<void>;
  
  // Navigation State
  currentPage: Page;
  navigateTo: (page: Page) => void;
}

const VelohubContext = createContext<VelohubContextType | undefined>(undefined);

export const VelohubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Boot
  useEffect(() => {
    // 1. SAFETY TIMEOUT: Garante que o loading desapareça após 5s
    // Isso impede o bug do "Carregando infinito" se o Supabase demorar ou falhar.
    const safetyTimer = setTimeout(() => {
        setIsLoading((prev) => {
            if (prev) {
                console.warn("⚠️ Loading timeout: Forçando liberação da tela.");
                return false;
            }
            return prev;
        });
    }, 5000);

    if (!supabase) {
        setIsLoading(false);
        return;
    }

    // 2. DETECÇÃO DE RETORNO DO STRIPE
    // Se a URL tem ?success=true, tentamos limpar para ficar limpo
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        console.log("✅ Retorno de pagamento detectado.");
        window.history.replaceState({}, '', window.location.pathname);
    }

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setUser(null);
                setCurrentPage(Page.LANDING);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Erro ao verificar sessão:", error);
            setIsLoading(false);
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth Event:", event);
        
        if (event === 'PASSWORD_RECOVERY') {
            setCurrentPage(Page.RESET_PASSWORD);
            setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
            // Em caso de login manual ou redirecionamento OAuth
            await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setVehicles([]);
            setCurrentPage(Page.LANDING);
            setIsLoading(false);
        }
    });

    return () => {
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
      try {
          if (!supabase) return;
          
          // Tenta buscar o perfil
          let { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Usa maybeSingle para evitar erro 406

          // --- SELF-HEALING (AUTO-CURA) ---
          // Se o usuário existe no Auth mas não no Banco (Erro PGRST116 ou null),
          // vamos criar o perfil agora mesmo.
          if (!profile) {
              console.warn("Perfil não encontrado. Tentando recriar automaticamente...");
              
              const { data: { user: authUser } } = await supabase.auth.getUser();
              
              if (authUser) {
                  const meta = authUser.user_metadata || {};
                  const newProfile = {
                      id: authUser.id,
                      email: authUser.email,
                      name: meta.name || 'Usuário',
                      store_id: meta.store_id || crypto.randomUUID(),
                      store_name: meta.store_name || 'Minha Loja',
                      role: meta.role || 'owner',
                      plan: meta.plan || 'free',
                      cnpj: meta.cnpj || '',
                      phone: meta.phone || '',
                      city: meta.city || '',
                      state: meta.state || '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                  };

                  const { error: insertError } = await supabase
                      .from('users')
                      .insert(newProfile);

                  if (!insertError) {
                      profile = newProfile; // Recuperado!
                      error = null;
                  } else {
                      console.error("Falha na auto-cura:", insertError);
                  }
              }
          }

          if (error || !profile) {
              // Retry Logic: Se falhar (ex: rede), tenta mais uma vez após 1.5s
              if (retryCount < 1) {
                  console.log("Tentando buscar perfil novamente em 1.5s...");
                  setTimeout(() => fetchUserProfile(userId, retryCount + 1), 1500);
                  return;
              }

              console.error("Erro crítico de perfil:", error);
              // Não desloga forçado para não prender o usuário em loop, 
              // apenas libera a tela (o timeout cuidará do loading state se travar)
              return;
          }

          const mappedUser = AuthService.mapProfileToUser(profile);
          setUser(mappedUser);
          await loadVehicles(mappedUser.storeId);
          
          // Redirecionamento Inteligente Pós-Login
          setCurrentPage(prev => {
              // Se estava na landing/login/registro, vai pro app
              if (prev === Page.LANDING || prev === Page.LOGIN || prev === Page.REGISTER) {
                  return mappedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES;
              }
              return prev;
          });

      } catch (e) {
          console.error("Auth flow error", e);
      } finally {
          setIsLoading(false);
      }
  };

  const loadVehicles = async (storeId: string) => {
      try {
          const data = await ApiService.getVehicles(storeId);
          setVehicles(data);
      } catch (e) {
          console.error("Failed to load secure vehicle data", e);
      }
  };

  const login = async (loggedUser: User) => {
    setUser(loggedUser);
    await loadVehicles(loggedUser.storeId);
    setCurrentPage(loggedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setVehicles([]);
    setCurrentPage(Page.LANDING);
  };

  const refreshData = async () => {
      if (!user) return;
      await loadVehicles(user.storeId);
  };

  const navigateTo = (page: Page) => {
      setCurrentPage(page);
  };

  return (
    <VelohubContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      vehicles,
      refreshData,
      currentPage,
      navigateTo
    }}>
      {children}
    </VelohubContext.Provider>
  );
};

export const useVelohub = () => {
  const context = useContext(VelohubContext);
  if (context === undefined) {
    throw new Error('useVelohub must be used within a VelohubProvider');
  }
  return context;
};
