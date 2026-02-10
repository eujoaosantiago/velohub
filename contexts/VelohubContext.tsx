
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

  useEffect(() => {
    let mounted = true;

    // Timeout de Segurança Absoluto (10s)
    const safetyTimer = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("⚠️ Timeout de carregamento global.");
            setIsLoading(false);
        }
    }, 10000);

    if (!supabase) {
        setIsLoading(false);
        return;
    }

    const checkSession = async () => {
        try {
            // Verifica query params para retorno de pagamento
            const params = new URLSearchParams(window.location.search);
            const isPaymentReturn = params.get('success') === 'true';

            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            if (session?.user) {
                // Se tem sessão, tenta buscar o perfil com Polling
                await fetchUserProfileWithRetry(session.user.id, isPaymentReturn);
                
                if (isPaymentReturn) {
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
            console.error("Erro na verificação de sessão:", error);
            if (mounted) {
                setIsLoading(false);
                setUser(null);
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
            // Se o usuário mudou ou acabou de logar
            if (!user || user.id !== session.user.id) {
                setIsLoading(true);
                await fetchUserProfileWithRetry(session.user.id);
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
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  /**
   * LÓGICA DE POLLING:
   * Tenta buscar o perfil no banco.
   * - Login Normal: Tenta 5 vezes (1s intervalo). Se falhar, é erro de banco/trigger.
   * - Retorno Pagamento: Tenta 10 vezes (2s intervalo). Aguarda o Webhook atualizar o plano.
   */
  const fetchUserProfileWithRetry = async (userId: string, isPaymentWait = false) => {
      if (!supabase) return;
      
      let attempts = 0;
      const maxAttempts = isPaymentWait ? 10 : 5; 
      const interval = isPaymentWait ? 2000 : 1000;
      
      let profile = null;
      let planUpdated = false;

      while (attempts < maxAttempts) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (data) {
              profile = data;
              
              // Se estamos esperando pagamento, só paramos se o plano mudou de 'free'/'trial'
              if (isPaymentWait) {
                  if (profile.plan !== 'free' && profile.plan !== 'trial') {
                      planUpdated = true;
                      break; // Sucesso! Plano atualizado.
                  }
                  // Se ainda for free, continua tentando...
              } else {
                  // Login normal: achou perfil, ótimo.
                  break; 
              }
          }

          attempts++;
          if (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, interval));
          }
      }

      // Se após todas tentativas não temos perfil válido (Login normal)
      if (!profile && !isPaymentWait) {
          console.error("Perfil crítico não encontrado. Deslogando.");
          await supabase.auth.signOut();
          setUser(null);
          setIsLoading(false);
          return;
      }

      // Se temos perfil (mesmo que plano antigo), carregamos
      if (profile) {
          const mappedUser = AuthService.mapProfileToUser(profile);
          setUser(mappedUser);
          
          // Carregar veículos
          await loadVehicles(mappedUser.storeId);
          
          setIsLoading(false);
          
          // Redireciona apenas se estiver em páginas públicas
          setCurrentPage(prev => {
              if ([Page.LANDING, Page.LOGIN, Page.REGISTER].includes(prev)) {
                  return mappedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES;
              }
              return prev;
          });
      } else {
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

  const login = async (loggedUser: User) => {
    // Chamada inicial do Login Page. 
    // Como o loggedUser pode ser parcial (sem storeId), forçamos um fetch seguro.
    setUser(loggedUser); 
    setIsLoading(true);
    await fetchUserProfileWithRetry(loggedUser.id);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setVehicles([]);
    setCurrentPage(Page.LANDING);
  };

  const refreshData = async () => {
      if (!user) return;
      // Força polling agressivo para tentar pegar atualização de plano manual
      setIsLoading(true);
      await fetchUserProfileWithRetry(user.id, true);
      setIsLoading(false);
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
