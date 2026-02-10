
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
    if (!supabase) {
        setIsLoading(false);
        return;
    }

    // --- CLOUD MODE INITIALIZATION ---
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchUserProfile(session.user.id);
        } else {
            setUser(null);
            setCurrentPage(Page.LANDING);
            setIsLoading(false);
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setCurrentPage(Page.RESET_PASSWORD);
            setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setVehicles([]);
            setCurrentPage(Page.LANDING);
            setIsLoading(false);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
      try {
          if (!supabase) return;
          
          // Tenta buscar o perfil
          let { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          // --- SELF-HEALING (AUTO-CURA) ---
          // Se o usuário existe no Auth mas não no Banco (Erro PGRST116 = row not found),
          // vamos criar o perfil agora mesmo.
          if (error && error.code === 'PGRST116') {
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
              console.error("Erro crítico de perfil:", error);
              if (error?.code !== 'PGRST116') {
                  // Só desloga se for um erro real, não apenas "não encontrado" (que tentamos tratar acima)
                  supabase.auth.signOut();
              }
              setIsLoading(false);
              return;
          }

          const mappedUser = AuthService.mapProfileToUser(profile);
          setUser(mappedUser);
          await loadVehicles(mappedUser.storeId);
          
          // Redirecionamento Inteligente Pós-Login
          // Se estiver na Landing ou Login, joga pro Dashboard
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
