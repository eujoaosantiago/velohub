
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
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout de Segurança Absoluto (10s) para não travar a tela de loading
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
            // Verifica query params para retorno de pagamento (Stripe)
            const params = new URLSearchParams(window.location.search);
            const isPaymentReturn = params.get('success') === 'true';

            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            if (session?.user) {
                // Se tem sessão, tenta buscar o perfil com Polling (Tentativas)
                // Se for retorno de pagamento, o polling é mais agressivo/longo
                await fetchUserProfileWithRetry(session.user.id, isPaymentReturn);
                
                if (isPaymentReturn) {
                    // Limpa a URL
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
   * LÓGICA DE POLLING (TENTATIVAS):
   * Tenta buscar o perfil no banco de dados.
   * 
   * 1. Login Normal: Tenta 5 vezes (1s intervalo). Isso cobre o tempo da Trigger do banco criar o usuário.
   * 2. Retorno Pagamento: Tenta 10 vezes (2s intervalo). Aguarda o Webhook do Stripe chegar e atualizar o plano.
   */
  const fetchUserProfileWithRetry = async (userId: string, isPaymentWait = false) => {
      if (!supabase) return;
      
      let attempts = 0;
      const maxAttempts = isPaymentWait ? 10 : 5; 
      const interval = isPaymentWait ? 2000 : 1000;
      
      let profile = null;

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
                      break; // Sucesso! Plano atualizado.
                  }
                  // Se ainda for free, continua tentando no loop...
              } else {
                  // Login normal: achou perfil, ótimo.
                  break; 
              }
          }

          attempts++;
          if (attempts < maxAttempts) {
              // Espera antes da próxima tentativa
              await new Promise(r => setTimeout(r, interval));
          }
      }

      // Se após todas tentativas não temos perfil válido (Apenas no Login normal)
      if (!profile && !isPaymentWait) {
          console.error("Perfil crítico não encontrado após várias tentativas. Deslogando para segurança.");
          await supabase.auth.signOut();
          setUser(null);
          setIsLoading(false);
          return;
      }

      // Se temos perfil (mesmo que plano antigo se o webhook falhou), carregamos
      if (profile) {
          const mappedUser = AuthService.mapProfileToUser(profile);
          setUser(mappedUser);
          
          // Carregar veículos em paralelo
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
          // Caso extremo: Pagamento timeout, mantém logado mas sem perfil (raro)
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
    // Chamada manual do Login Page
    if (loggedUser) {
        // Se o AuthService já retornou o usuário completo, usamos ele
        setUser(loggedUser);
        setIsLoading(true);
        await loadVehicles(loggedUser.storeId);
        setIsLoading(false);
        setCurrentPage(loggedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
    } else {
        // Se o AuthService retornou null (perfil não pronto), forçamos o polling
        const { data: { user: authUser } } = await supabase!.auth.getUser();
        if (authUser) {
            setIsLoading(true);
            await fetchUserProfileWithRetry(authUser.id);
        }
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
