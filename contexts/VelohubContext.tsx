
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

const getStoredUser = (): User | null => {
    const stored = localStorage.getItem('velohub_session_user');
    if (!stored) return null;
    try {
        return JSON.parse(stored) as User;
    } catch (err) {
        console.warn('⚠️ Sessão local inválida. Limpando storage.');
        localStorage.removeItem('velohub_session_user');
        return null;
    }
};

export const VelohubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializa estados baseados no LocalStorage
  const [user, setUser] = useState<User | null>(() => {
            return getStoredUser();
  });

  // Ref para acesso síncrono dentro de event listeners (corrige o bug do login)
  const userRef = useRef<User | null>(user);

  // Mantém a ref sincronizada com o state
  useEffect(() => {
      userRef.current = user;
  }, [user]);

  const [isLoading, setIsLoading] = useState(() => {
      // Se tem user no storage, começa true para validar sessão. Se não, false para mostrar landing.
      return !!getStoredUser();
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>(() => {
      const storedUser = getStoredUser();
      if (storedUser) {
          return storedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES;
      }
      return Page.LANDING;
  });

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança
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
            const params = new URLSearchParams(window.location.search);
            const isPaymentReturn = params.get('success') === 'true';

            if (!supabase) {
                if (mounted) setIsLoading(false);
                return;
            }

            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;

            if (session?.user) {
                // Se já temos user na memória (login manual ou storage), validamos silenciosamente
                // Se for retorno de pagamento, forçamos atualização
                if (!userRef.current || isPaymentReturn) {
                    await fetchUserProfileWithRetry(session.user.id, isPaymentReturn);
                } else {
                    // Usuário já carregado, apenas atualiza dados em background
                    loadVehicles(userRef.current.storeId);
                    if (mounted) setIsLoading(false);
                }
                
                if (isPaymentReturn) {
                    window.history.replaceState({}, '', window.location.pathname);
                }
            } else {
                // Sem sessão Supabase
                if (mounted) {
                    // Só faz logout se tinhamos um usuário que agora está inválido
                    // E se NÃO estivermos na página de login (evita flash ao carregar login)
                    if (userRef.current) {
                        handleLogoutCleanup();
                    } else {
                        setIsLoading(false);
                    }
                }
            }
        } catch (error) {
            console.error("Erro na verificação de sessão:", error);
            if (mounted) {
                setIsLoading(false);
                if (userRef.current) handleLogoutCleanup();
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
            // CORREÇÃO CRÍTICA: Usa userRef.current para verificar o estado REAL
            // Se o usuário JÁ está logado (pelo login manual), NÃO dispara o loading novamente
            const currentUser = userRef.current;
            
            if (!currentUser || currentUser.id !== session.user.id) {
                // Realmente é um novo login ou refresh de sessão
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
      userRef.current = null;
      setVehicles([]);
      setCurrentPage(Page.LANDING);
      setIsLoading(false);
      localStorage.removeItem('velohub_session_user');
  };

  const fetchUserProfileWithRetry = async (userId: string, isPaymentWait = false) => {
      if (!supabase) return;
      
      try {
          let attempts = 0;
          // Reduzido para evitar timeout global se o banco estiver lento
          const maxAttempts = isPaymentWait ? 10 : 5; 
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
              // Se falhar drasticamente, faz logout
              await supabase.auth.signOut();
              handleLogoutCleanup();
              return;
          }

          if (profile) {
              const mappedUser = AuthService.mapProfileToUser(profile);
              
              // Atualiza estado e ref
              setUser(mappedUser);
              userRef.current = mappedUser;
              
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
        // Fluxo de Login Manual (rápido e confiável)
        setUser(loggedUser);
        userRef.current = loggedUser; // Atualiza ref imediatamente
        localStorage.setItem('velohub_session_user', JSON.stringify(loggedUser));
        
        // Vamos para o dashboard imediatamente para UX rápida
        setCurrentPage(loggedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
        
        // Carrega dados em segundo plano (sem bloquear tela com isLoading)
        try {
            await loadVehicles(loggedUser.storeId);
        } catch (e) {
            console.error("Background load error", e);
        }
    } else {
        // Fluxo de Login sem usuário pré-carregado (ex: via token mágico ou refresh)
        try {
            setIsLoading(true);
            const { data: { user: authUser } } = await supabase!.auth.getUser();
            if (authUser) {
                await fetchUserProfileWithRetry(authUser.id);
            } else {
                setIsLoading(false);
            }
        } catch (e) {
            console.error("Login flow error", e);
            setIsLoading(false);
        }
    }
  };

  const logout = () => {
    AuthService.logout();
    handleLogoutCleanup();
  };

  const refreshData = async () => {
      if (!user) return;
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
