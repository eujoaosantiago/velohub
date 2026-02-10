
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
    let mounted = true;

    // 1. SAFETY TIMEOUT: Garante que o loading desapareça após 3s
    const safetyTimer = setTimeout(() => {
        if (mounted) {
            setIsLoading((prev) => {
                if (prev) {
                    console.warn("⚠️ Loading timeout: Forçando liberação da tela.");
                    return false;
                }
                return prev;
            });
        }
    }, 3000);

    if (!supabase) {
        setIsLoading(false);
        return;
    }

    const checkSession = async () => {
        try {
            // DETECÇÃO DE RETORNO DO STRIPE (Prioridade Alta)
            const params = new URLSearchParams(window.location.search);
            const isPaymentSuccess = params.get('success') === 'true';

            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (session?.user) {
                // Se voltou do pagamento, forçamos um fetch fresco do banco
                // E usamos POLLING para garantir que o webhook do Stripe já processou
                await fetchUserProfile(session.user.id, isPaymentSuccess);
                
                if (isPaymentSuccess) {
                    // Limpa a URL para não ficar ?success=true para sempre
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
            // Evita refetch se o usuário já estiver carregado e igual
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
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, isPaymentSuccess = false) => {
      try {
          if (!supabase) return;
          
          let attempts = 0;
          const maxAttempts = isPaymentSuccess ? 5 : 1; // Tenta 5x se voltou do pagamento
          let profile = null;

          while (attempts < maxAttempts) {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

              if (error) throw error;
              profile = data;

              // Se for retorno de pagamento, verifica se o plano mudou
              // Assumindo que o usuário estava no free ou trial antes
              // Se o plano ainda é free/trial, espera e tenta de novo (Webhook delay)
              if (isPaymentSuccess && (profile.plan === 'free' || profile.plan === 'trial')) {
                  attempts++;
                  if (attempts < maxAttempts) {
                      await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2s
                      continue; 
                  }
              }
              
              // Se achou perfil ou esgotou tentativas
              break;
          }

          // --- SELF-HEALING (AUTO-CURA) ---
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
                      profile = newProfile;
                  } else {
                      console.error("Falha na auto-cura:", insertError);
                  }
              }
          }

          if (!profile) {
              console.error("Impossível carregar perfil. Deslogando por segurança.");
              await supabase.auth.signOut();
              setUser(null);
              setIsLoading(false);
              return;
          }

          const mappedUser = AuthService.mapProfileToUser(profile);
          setUser(mappedUser);
          
          // Carrega veículos
          loadVehicles(mappedUser.storeId);
          
          // Redirecionamento Inteligente Pós-Login
          setCurrentPage(prev => {
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
    setIsLoading(true);
    await loadVehicles(loggedUser.storeId);
    setIsLoading(false);
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
      // Recarrega perfil (importante para atualização de plano) e veículos
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
