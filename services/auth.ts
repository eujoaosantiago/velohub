
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
    // Legacy helper, main state is in Context
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

  login: async (email: string, password: string): Promise<User> => {
    if (!supabase) throw new Error("Sistema não configurado (Falta conexão segura).");

    // 1. Autenticação (Email/Senha)
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw new Error("Credenciais inválidas ou erro de conexão.");
    
    // 2. ACTIVE SYNC: Busca perfil, se falhar, cria imediatamente.
    try {
        let { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        // Se perfil não existe (Causa do erro no mobile/pc), recria agora.
        if (!profile) {
            console.log("Perfil ausente. Executando Active Sync...");
            const meta = data.user.user_metadata || {};
            
            const newProfile = {
                id: data.user.id,
                email: data.user.email,
                name: meta.name || 'Usuário',
                store_id: meta.store_id || crypto.randomUUID(),
                store_name: meta.store_name || 'Minha Loja',
                role: meta.role || 'owner',
                plan: meta.plan || 'free',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: createdProfile, error: createError } = await supabase
                .from('users')
                .upsert(newProfile)
                .select()
                .single();

            if (createError) throw createError;
            profile = createdProfile;
        }

        if (!profile) throw new Error("Falha crítica ao carregar perfil do usuário.");

        const mappedUser = AuthService.mapProfileToUser(profile);
        
        // Salva na sessão local como backup
        localStorage.setItem('velohub_session_user', JSON.stringify(mappedUser));
        
        return mappedUser;

    } catch (err: any) {
        console.error("Erro no fluxo de login:", err);
        throw new Error("Erro ao sincronizar dados do perfil. Tente novamente.");
    }
  },

  logout: () => {
    if (supabase) {
        supabase.auth.signOut();
    }
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
    
    // Retorno otimista para UI imediata
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
      
      // Sincroniza nome da loja para todos os usuários da mesma loja
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

    const token = btoa(profile.store_id); 
    return `${window.location.origin}?invite=${token}&storeName=${encodeURIComponent(profile.store_name || '')}`;
  },

  updateUserPermissions: async (userId: string, permissions: UserPermissions) => {
      if (!supabase) throw new Error("Erro de conexão.");
      
      const { error } = await supabase.from('users').update({ permissions }).eq('id', userId);
      if (error) throw new Error(error.message);
  }
};
