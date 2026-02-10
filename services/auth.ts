
import { User, UserPermissions } from '../types';
import { supabase } from '../lib/supabaseClient';

export const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
    view_costs: false,
    view_customers: true,
    view_analytics: false,
    edit_sale_price: false,
    manage_sales: true,
    share_vehicles: true
};

export const AuthService = {
  init: () => {
    // No initialization needed
  },

  getCurrentUser: (): User | null => {
    // SECURITY: Não confiamos mais no localStorage para sessão de usuário completa
    // A fonte da verdade é o estado do Supabase no Context
    return null;
  },

  // Helper function to map DB User to App User
  mapProfileToUser: (profile: any): User => {
      return {
        id: profile.id,
        storeId: profile.store_id,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        plan: profile.plan || 'free',
        storeName: profile.store_name,
        cnpj: profile.cnpj,
        phone: profile.phone,
        city: profile.city,
        state: profile.state,
        permissions: profile.permissions,
        contractTemplate: profile.contract_template,
        stripeCustomerId: profile.stripe_customer_id,
        subscriptionStatus: profile.subscription_status
    };
  },

  login: async (email: string, password: string): Promise<User> => {
    if (!supabase) throw new Error("Sistema não configurado (Falta conexão segura).");

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw new Error("Credenciais inválidas ou erro de conexão.");
    
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
    if (profileError) throw new Error("Erro ao carregar perfil de segurança.");

    return AuthService.mapProfileToUser(profile);
  },

  logout: () => {
    if (supabase) {
        supabase.auth.signOut();
    }
    // Limpeza de qualquer resquício local inseguro
    localStorage.removeItem('velohub_session_user');
    localStorage.removeItem('velohub_users_db');
  },

  register: async (name: string, email: string, password: string, storeName: string, storeData?: any, inviteStoreId?: string): Promise<User> => {
    if (!supabase) throw new Error("Registro indisponível: Backend desconectado.");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                store_name: storeName,
                role: inviteStoreId ? 'employee' : 'owner',
                store_id: inviteStoreId, 
                plan: inviteStoreId ? 'starter' : 'free',
                ...storeData
            }
        }
    });
    
    if (error) throw new Error(error.message);
    
    // Retorna objeto parcial apenas para feedback de UI, a sessão real vem do listener
    return {
        id: data.user?.id || '',
        name,
        email,
        role: inviteStoreId ? 'employee' : 'owner',
        storeId: inviteStoreId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plan: 'free'
    };
  },

  updateUser: async (user: User, newPassword?: string): Promise<User> => {
      if (!supabase) throw new Error("Conexão perdida.");

      const updates: any = {
          name: user.name,
          store_name: user.storeName,
          cnpj: user.cnpj,
          contract_template: user.contractTemplate
      };
      
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw new Error(error.message);
      
      if (user.role === 'owner') {
          const sharedUpdates = {
              store_name: user.storeName,
              cnpj: user.cnpj,
              contract_template: user.contractTemplate
          };
          // RLS deve garantir que apenas o dono faça isso
          await supabase.from('users').update(sharedUpdates).eq('store_id', user.storeId);
      }

      if (newPassword) {
          const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
          if (pwdError) throw new Error("Erro ao atualizar senha. Tente novamente.");
      }
      
      return user;
  },

  resetPassword: async (email: string) => {
      if (!supabase) throw new Error("Serviço de email indisponível.");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, 
      });
      if (error) throw new Error(error.message);
  },

  getTeam: async (): Promise<User[]> => {
      if (!supabase) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return [];

      const { data: profile } = await supabase.from('users').select('store_id').eq('id', user.id).single();
      if(!profile) return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('store_id', profile.store_id)
        .neq('id', user.id);
      
      if (error) return [];
      return data.map((u: any) => AuthService.mapProfileToUser(u));
  },

  inviteEmployee: async (email: string, name: string): Promise<string> => {
    if (!supabase) throw new Error("Função indisponível offline.");

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Não autenticado");
    
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
    if (!profile) throw new Error("Perfil não encontrado");

    // Gera um token base64 do store_id para o link de convite
    // Em produção, isso deveria ser um token temporário assinado no backend, 
    // mas por enquanto removemos a criação automática de usuário local inseguro.
    const token = btoa(profile.store_id); 
    return `${window.location.origin}?invite=${token}&storeName=${encodeURIComponent(profile.store_name || '')}`;
  },

  updateUserPermissions: async (userId: string, permissions: UserPermissions) => {
      if (!supabase) throw new Error("Erro de conexão.");
      
      const { error } = await supabase.from('users').update({ permissions }).eq('id', userId);
      if (error) throw new Error(error.message);
  }
};
