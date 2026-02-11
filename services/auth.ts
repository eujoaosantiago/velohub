
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
    const sessionStr = localStorage.getItem('velohub_session_user');
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

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

  login: async (email: string, password: string): Promise<User | null> => {
    if (!supabase) throw new Error("Sistema não configurado.");

    // 1. Autenticação (Email/Senha)
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw new Error("Credenciais inválidas.");
    
    // 2. Busca Perfil Inicial
    // Nota: Retornamos null se o perfil não existir ainda (race condition do trigger).
    // O Contexto fará o polling (tentativas repetidas) para garantir.
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

    if (profile) {
        const mappedUser = AuthService.mapProfileToUser(profile);
        localStorage.setItem('velohub_session_user', JSON.stringify(mappedUser));
        return mappedUser;
    }

    // Retorna null para sinalizar ao contexto que precisa tentar de novo
    return null;
  },

  logout: () => {
    if (supabase) {
        supabase.auth.signOut();
    }
    localStorage.removeItem('velohub_session_user');
    localStorage.removeItem('velohub_users_db');
  },

  register: async (name: string, email: string, password: string, storeName: string, storeData?: any, inviteStoreId?: string): Promise<User> => {
    if (!supabase) throw new Error("Registro indisponível.");

    // O Frontend cria a conta no Auth.
    // A Trigger 'on_auth_user_created' no Postgres cria o perfil na tabela public.users.
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
    
    // Retorna objeto parcial apenas para feedback visual imediato
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
          await supabase.from('users').update(sharedUpdates).eq('store_id', user.storeId);
      }

      if (newPassword) {
          const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
          if (pwdError) throw new Error("Erro ao atualizar senha.");
      }
      
      return user;
  },

  resetPassword: async (email: string) => {
      if (!supabase) throw new Error("Serviço indisponível.");
      
      // Buscar nome do usuário para o email
      const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('email', email)
          .maybeSingle();
      
      const userName = userData?.name || email.split('@')[0];
      const resetLink = `${window.location.origin}/auth/reset-password?token={token}`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`, 
      });
      if (error) throw new Error(error.message);
      
      // Enviar email de reset de senha via Mailgun
      try {
          if (SUPABASE_URL) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, 
      });
      if (error) throw new Error(error.message);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('store_id', profile.store_id)
        .neq('id', user.id);
      
      if (error) return [];
      return data.map((u: any) => AuthService.mapProfileToUser(u));
  },

  inviteEmployee: async (email: string, name: string): Promise<string> => {
    if (!supabase) throw new Error("Função indisponível.");
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Não autenticado");
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
    if (!profile) throw new Error("Perfil não encontrado");
    const token = btoa(profile.store_id); 
    return `${window.location.origin}?invite=${token}&storeName=${encodeURIComponent(profile.store_name || '')}`;
  },

  updateUserPermissions: async (userId: string, permissions: UserPermissions) => {
      if (!supabase) throw new Error("Erro de conexão.");
      const { error } = await supabase.from('users').update({ permissions }).eq('id', userId);
      if (error) throw new Error(error.message);
  }
};
