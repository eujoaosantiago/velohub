import { StoreExpense } from '@/shared/types';
import { normalizeDate } from '@/shared/lib/utils';
import { supabase } from '@/services/supabaseClient';

export const storeExpenseService = {
  getStoreExpenses: async (storeId: string): Promise<StoreExpense[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('store_expenses')
      .select('*')
      .eq('store_id', storeId);

    if (error) return [];

    return (data || []).map((e: any) => ({
      ...e,
      date: normalizeDate(e.date),
      storeId: e.store_id,
      createdAt: e.created_at,
      updatedAt: e.created_at,
    }));
  },

  createStoreExpense: async (expense: StoreExpense): Promise<StoreExpense> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');

    const dbExpense = {
      store_id: expense.storeId,
      description: expense.description,
      amount: expense.amount,
      date: normalizeDate(expense.date),
      category: expense.category,
      paid: expense.paid,
    };

    const { data, error } = await supabase.from('store_expenses').insert(dbExpense).select().single();
    if (error) throw new Error(error.message);
    return { ...expense, id: data.id };
  },

  updateStoreExpense: async (expense: StoreExpense): Promise<StoreExpense> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');

    if (!expense.id) {
      throw new Error('ID da despesa e obrigatorio para atualizacao');
    }

    const dbExpense = {
      description: expense.description,
      amount: expense.amount,
      date: normalizeDate(expense.date),
      category: expense.category,
      paid: expense.paid,
    };

    const { error } = await supabase
      .from('store_expenses')
      .update(dbExpense)
      .eq('id', expense.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return expense;
  },

  deleteStoreExpense: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');
    const { error } = await supabase.from('store_expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};



