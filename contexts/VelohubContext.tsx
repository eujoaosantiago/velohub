
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
        // Se Supabase não estiver configurado, apenas paramos o loading.
        // O App.tsx vai tratar a exibição da tela de "Configuração Necessária".
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
          
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error || !profile) {
              console.error("Security Error: Profile mismatch or unauthorized", error);
              if(error?.code !== 'PGRST116') {
                  supabase.auth.signOut();
              }
              setIsLoading(false);
              return;
          }

          const mappedUser = AuthService.mapProfileToUser(profile);
          setUser(mappedUser);
          await loadVehicles(mappedUser.storeId);
          
          if (currentPage === Page.LANDING || currentPage === Page.LOGIN) {
              setCurrentPage(mappedUser.role === 'owner' ? Page.DASHBOARD : Page.VEHICLES);
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
    // Reset state handled by onAuthStateChange listener usually, but force clear here too
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
