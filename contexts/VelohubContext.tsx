
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Vehicle, Page } from '../types';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { supabase } from '../lib/supabaseClient';

interface VelohubContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User | null) => void;
  logout: () => void;
  vehicles: Vehicle[];
  refreshData: () => Promise<void>;
  currentPage: Page;
  navigateTo: (page: Page) => void;
}

const VelohubContext = createContext<VelohubContextType | undefined>(undefined);

export const VelohubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // OTIMIZAÇÃO: Inicializa estados baseados no LocalStorage para evitar "flicker" de loading
  const [user, setUser] = useState<User | null>(() => {
      const stored = localStorage.getItem('velohub_session_user');
      return stored ? JSON.parse(stored) : null;
  });

  // OTIMIZAÇÃO: Se não tem usuário no storage, NÃO mostra loading (exibe Landing Page direto)
  // Se tem usuário, mostra loading enquanto valida a sessão no backend
  const [isLoading, setIsLoading] = useState(() => {
      return !!localStorage.getItem('velohub_session_user');
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // Se já temos user recuperado do storage, vai pro Dashboard, senão Landing
  const [currentPage, setCurrentPage] = useState<Page>(() => {
      const stored = localStorage.getItem('velohub_session_user');
      if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES;
      }
      return Page.LANDING;
  });

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança apenas se estiver carregando
    const safetyTimer = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("⚠️ Timeout de carregamento global.");
            setIsLoading(false);
        }
    }, 15000);

    if (!supabase) {
        setIsLoading(false);
        return;
    }

    const checkSession = async () => {
        try {
            // Verifica query params para retorno de pagamento (Stripe)
            const params = new URLSearchParams(window.location.search);
            const isPaymentReturn = params.get('success') === 'true';

            // Checagem rápida de sessão
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            if (session?.user) {
                // Sessão válida no Supabase. 
                // Se já temos o user no state (via localStorage), apenas atualizamos os dados em background (SWR)
                // Se é retorno de pagamento, forçamos o loading
                if (!user || isPaymentReturn) {
                    await fetchUserProfileWithRetry(session.user.id, isPaymentReturn);
                } else {
                    // Usuário já está visualmente logado, carregamos veículos em background silenciosamente
                    loadVehicles(user.storeId);
                    setIsLoading(false); 
                }
                
                if (isPaymentReturn) {
                    window.history.replaceState({}, '', window.location.pathname);
                }
            } else {
                // Sem sessão no Supabase
                if (mounted) {
                    // Se tínhamos um usuário no state (ex: token expirou), fazemos logout
                    if (user) {
                        handleLogoutCleanup();
                    }
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error("Erro na verificação de sessão:", error);
            if (mounted) {
                setIsLoading(false);
                if (user) handleLogoutCleanup();
            }
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        if (event === 'PASSWORD_RECOVERY') {
            setCurrentPage(Page.RESET_PASSWORD);
            setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
            // Só ativa loading se o usuário ainda não estiver no state
            if (!user || user.id !== session.user.id) {
                setIsLoading(true);
                await fetchUserProfileWithRetry(session.user.id);
            }
        } else if (event === 'SIGNED_OUT') {
            handleLogoutCleanup();
        }
    });

    return () => {
        mounted = false;
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  const handleLogoutCleanup = () => {
      setUser(null);
      setVehicles([]);
      setCurrentPage(Page.LANDING);
      setIsLoading(false);
      localStorage.removeItem('velohub_session_user');
  };

  /**
   * LÓGICA DE POLLING (TENTATIVAS):
   * Tenta buscar o perfil no banco de dados. Aumentado para suportar latência mobile.
   */
  const fetchUserProfileWithRetry = async (userId: string, isPaymentWait = false) => {
      if (!supabase) return;
      
      try {
          let attempts = 0;
          const maxAttempts = isPaymentWait ? 15 : 8; 
          const interval = 1000; 
          
          let profile = null;

          while (attempts < maxAttempts) {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

              if (data) {
                  profile = data;
                  if (isPaymentWait) {
                      if (profile.plan !== 'free' && profile.plan !== 'trial') break; 
                  } else {
                      break; 
                  }
              }

              attempts++;
              if (attempts < maxAttempts) {
                  await new Promise(r => setTimeout(r, interval));
              }
          }

          if (!profile && !isPaymentWait) {
              // Se falhar em recuperar o perfil, faz logout para evitar estado inconsistente
              await supabase.auth.signOut();
              handleLogoutCleanup();
              return;
          }

          if (profile) {
              const mappedUser = AuthService.mapProfileToUser(profile);
              setUser(mappedUser);
              localStorage.setItem('velohub_session_user', JSON.stringify(mappedUser));
              
              await loadVehicles(mappedUser.storeId);
              
              setCurrentPage(prev => {
                  if ([Page.LANDING, Page.LOGIN, Page.REGISTER].includes(prev)) {
                      return mappedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES;
                  }
                  return prev;
              });
          }
      } catch (err) {
          console.error("Critical error fetching profile:", err);
          if (!isPaymentWait) handleLogoutCleanup();
      } finally {
          setIsLoading(false);
      }
  };

  const loadVehicles = async (storeId: string) => {
      try {
          const data = await ApiService.getVehicles(storeId);
          setVehicles(data);
      } catch (e) {
          console.error("Failed to load vehicle data", e);
      }
  };

  const login = async (loggedUser: User | null) => {
    if (loggedUser) {
        setUser(loggedUser);
        localStorage.setItem('velohub_session_user', JSON.stringify(loggedUser));
        setIsLoading(true);
        try {
            await loadVehicles(loggedUser.storeId);
        } finally {
            setIsLoading(false);
            setCurrentPage(loggedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
        }
    } else {
        try {
            const { data: { user: authUser } } = await supabase!.auth.getUser();
            if (authUser) {
                setIsLoading(true);
                await fetchUserProfileWithRetry(authUser.id);
            }
        } catch (e) {
            console.error("Login flow error", e);
        } finally {
            // Garante que o loading para se não entrou no fluxo de retry
            // Se entrou no fluxo de retry, o finally de lá cuida
            // Mas por segurança, checamos se o user foi setado
            if (!user) setIsLoading(false);
        }
    }
  };

  const logout = () => {
    AuthService.logout();
    handleLogoutCleanup();
  };

  const refreshData = async () => {
      if (!user) return;
      // Não bloqueia a tela inteira com isLoading no refresh manual, apenas atualiza
      await fetchUserProfileWithRetry(user.id, true);
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
