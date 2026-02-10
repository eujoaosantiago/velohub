
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Vehicle, Page } from '../types';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { supabase } from '../lib/supabaseClient';

interface VelohubContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  vehicles: Vehicle[];
  refreshData: () => Promise<void>;
  currentPage: Page;
  navigateTo: (page: Page) => void;
}

const VelohubContext = createContext<VelohubContextType | undefined>(undefined);

export const VelohubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização
  useEffect(() => {
    let mounted = true;

    // Safety Timeout para garantir que o app nunca fique preso na tela de loading
    const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Loading timeout reached. Forcing unlock.");
            setIsLoading(false);
        }
    }, 5000);

    if (!supabase) {
        setIsLoading(false);
        return;
    }

    const checkSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            // Check for payment return success param
            const params = new URLSearchParams(window.location.search);
            const isPaymentSuccess = params.get('success') === 'true';

            if (session?.user) {
                // Se existe sessão, carrega o perfil completo
                await fetchUserProfile(session.user.id, isPaymentSuccess);
                
                if (isPaymentSuccess) {
                    window.history.replaceState({}, '', window.location.pathname);
                }
            } else {
                if (mounted) {
                    setUser(null);
                    setCurrentPage(Page.LANDING);
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error("Erro ao verificar sessão:", error);
            if (mounted) setIsLoading(false);
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        if (event === 'PASSWORD_RECOVERY') {
            setCurrentPage(Page.RESET_PASSWORD);
            setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
            if (!user || user.id !== session.user.id) {
                await fetchUserProfile(session.user.id);
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setVehicles([]);
            setCurrentPage(Page.LANDING);
            setIsLoading(false);
        }
    });

    return () => {
        mounted = false;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, isPaymentSuccess = false) => {
      try {
          if (!supabase) return;
          
          // Retry Logic para casos de latência (Webhooks, etc)
          let attempts = 0;
          const maxAttempts = isPaymentSuccess ? 5 : 2; 
          let profile = null;

          while (attempts < maxAttempts) {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

              // Se der erro de conexão, tentamos novamente
              if (error && error.code !== 'PGRST116') {
                  console.warn(`Tentativa ${attempts + 1} falhou:`, error.message);
              } else {
                  profile = data;
              }

              // Se achou perfil E (não é pagamento OU o plano já atualizou), sai do loop
              if (profile) {
                  if (!isPaymentSuccess) break;
                  if (isPaymentSuccess && profile.plan !== 'free' && profile.plan !== 'trial') break;
              }

              attempts++;
              if (attempts < maxAttempts) {
                  await new Promise(r => setTimeout(r, 1000)); // Espera 1s
              }
          }

          // Se após tentativas o perfil não existe, recria (Active Sync via Auth Data)
          if (!profile) {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser) {
                  console.log("Recuperando perfil via Active Sync no Context...");
                  const meta = authUser.user_metadata || {};
                  const newProfile = {
                      id: authUser.id,
                      email: authUser.email,
                      name: meta.name || 'Usuário',
                      store_id: meta.store_id || crypto.randomUUID(),
                      store_name: meta.store_name || 'Minha Loja',
                      role: meta.role || 'owner',
                      plan: meta.plan || 'free',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                  };
                  
                  const { data: created } = await supabase.from('users').upsert(newProfile).select().single();
                  profile = created;
              }
          }

          if (profile) {
              const mappedUser = AuthService.mapProfileToUser(profile);
              setUser(mappedUser);
              
              // Carrega dados em paralelo para agilizar
              loadVehicles(mappedUser.storeId).catch(console.error);
              
              setCurrentPage(prev => {
                  if (prev === Page.LANDING || prev === Page.LOGIN || prev === Page.REGISTER) {
                      return mappedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES;
                  }
                  return prev;
              });
          } else {
              // Se falhar catastroficamente, desloga para evitar estado inconsistente
              console.error("Perfil irrecuperável. Realizando logout de segurança.");
              await supabase.auth.signOut();
          }

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
      } catch (e: any) {
          // Trata AbortError silenciosamente
          if (e.name !== 'AbortError') {
              console.error("Failed to load secure vehicle data", e);
          }
      }
  };

  const login = async (loggedUser: User) => {
    setUser(loggedUser);
    setIsLoading(true);
    try {
        await loadVehicles(loggedUser.storeId);
        setCurrentPage(loggedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setVehicles([]);
    setCurrentPage(Page.LANDING);
  };

  const refreshData = async () => {
      if (!user) return;
      await fetchUserProfile(user.id, true);
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
