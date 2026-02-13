import { Buyer, Customer } from '@/shared/types';
import { supabase } from '@/services/supabaseClient';

export const customerService = {
  upsertCustomer: async (storeId: string, buyer: Buyer): Promise<Customer> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');
    if (!buyer?.cpf) throw new Error('CPF do cliente obrigatorio.');

    const now = new Date().toISOString();
    const payload = {
      store_id: storeId,
      name: buyer.name,
      cpf: buyer.cpf,
      phone: buyer.phone,
      email: buyer.email || null,
      cep: buyer.cep || null,
      street: buyer.street || null,
      number: buyer.number || null,
      neighborhood: buyer.neighborhood || null,
      city: buyer.city || null,
      state: buyer.state || null,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('customers')
      .upsert(payload, { onConflict: 'store_id,cpf' })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao upsert customer:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      storeId: data.store_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone,
      email: data.email || undefined,
      cep: data.cep || undefined,
      street: data.street || undefined,
      number: data.number || undefined,
      neighborhood: data.neighborhood || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
    };
  },

  getCustomers: async (storeId: string): Promise<Customer[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error(error.message);
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      storeId: c.store_id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      name: c.name,
      cpf: c.cpf,
      phone: c.phone,
      email: c.email || undefined,
      cep: c.cep || undefined,
      street: c.street || undefined,
      number: c.number || undefined,
      neighborhood: c.neighborhood || undefined,
      city: c.city || undefined,
      state: c.state || undefined,
    }));
  },

  updateCustomer: async (customer: Customer): Promise<Customer> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');

    const updates = {
      name: customer.name,
      cpf: customer.cpf,
      phone: customer.phone,
      email: customer.email || null,
      cep: customer.cep || null,
      street: customer.street || null,
      number: customer.number || null,
      neighborhood: customer.neighborhood || null,
      city: customer.city || null,
      state: customer.state || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customer.id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      storeId: data.store_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone,
      email: data.email || undefined,
      cep: data.cep || undefined,
      street: data.street || undefined,
      number: data.number || undefined,
      neighborhood: data.neighborhood || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
    };
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');

    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) throw new Error(error.message);
  },
};



