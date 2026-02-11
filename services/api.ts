
import { Vehicle, User, StoreExpense } from '../types';
import { PLAN_CONFIG } from '../lib/plans';
import { supabase } from '../lib/supabaseClient';

export const ApiService = {
  // --- VEÍCULOS ---

  getVehicles: async (storeId: string): Promise<Vehicle[]> => {
    if (!supabase) return []; // Retorna vazio se não conectado, não expõe dados locais

    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('store_id', storeId); 
        
    if (error) {
        console.error("Erro de Segurança/API:", error);
        throw new Error("Erro ao buscar dados seguros.");
    }
    
    return data.map((v: any) => ({
        ...v,
        storeId: v.store_id,
        purchasePrice: v.purchase_price,
        expectedSalePrice: v.expected_sale_price,
        fipePrice: v.fipe_price,
        soldPrice: v.sold_price,
        soldDate: v.sold_date,
        purchaseDate: v.created_at, 
        expenses: v.expenses || [],
        paymentMethod: v.payment_method,
        // Mapping boolean fields explicitly
        ipvaPaid: v.ipva_paid,
        licensingPaid: v.licensing_paid
    }));
  },

  createVehicle: async (vehicle: Vehicle, user: User): Promise<Vehicle> => {
    if (!supabase) throw new Error("Conexão segura necessária.");

    // Validação de Limites (Backend deveria validar isso via Trigger/Function também)
    const vehicles = await ApiService.getVehicles(user.storeId);
    const currentCount = vehicles.filter(v => v.status !== 'sold').length;
    const limits = PLAN_CONFIG[user.plan];
    
    if (currentCount >= limits.maxVehicles) {
        throw new Error(`Limite do plano ${user.plan.toUpperCase()} atingido.`);
    }

    const dbVehicle = {
        store_id: user.storeId,
        make: vehicle.make,
        model: vehicle.model,
        version: vehicle.version,
        year: vehicle.year,
        plate: vehicle.plate,
        km: vehicle.km,
        fuel: vehicle.fuel,
        transmission: vehicle.transmission,
        color: vehicle.color,
        status: vehicle.status,
        purchase_price: vehicle.purchasePrice,
        expected_sale_price: vehicle.expectedSalePrice,
        fipe_price: vehicle.fipePrice,
        photos: vehicle.photos,
        expenses: vehicle.expenses,
        ipva_paid: !!vehicle.ipvaPaid, // Ensure boolean
        licensing_paid: !!vehicle.licensingPaid // Ensure boolean
    };

    const { data, error } = await supabase.from('vehicles').insert(dbVehicle).select().single();
    if (error) throw new Error(error.message);
    return { ...vehicle, id: data.id };
  },

  updateVehicle: async (vehicle: Vehicle): Promise<Vehicle> => {
    if (!supabase) throw new Error("Conexão segura necessária.");

    const dbVehicle = {
        make: vehicle.make,
        model: vehicle.model,
        version: vehicle.version,
        year: vehicle.year,
        plate: vehicle.plate,
        km: vehicle.km,
        status: vehicle.status,
        purchase_price: vehicle.purchasePrice,
        expected_sale_price: vehicle.expectedSalePrice,
        sold_price: vehicle.soldPrice,
        sold_date: vehicle.soldDate,
        payment_method: vehicle.paymentMethod,
        buyer: vehicle.buyer,
        photos: vehicle.photos,
        expenses: vehicle.expenses,
        trade_in_info: vehicle.tradeInInfo,
        reservation_details: vehicle.reservationDetails,
        warranty_details: vehicle.warrantyDetails,
        ipva_paid: !!vehicle.ipvaPaid, // Ensure boolean
        licensing_paid: !!vehicle.licensingPaid, // Ensure boolean
        sale_commission: vehicle.saleCommission,
        sale_commission_to: vehicle.saleCommissionTo,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('vehicles')
        .update(dbVehicle)
        .eq('id', vehicle.id);
        
    if (error) throw new Error(error.message);
    return vehicle;
  },

  deleteVehicle: async (id: string, storeId: string): Promise<void> => {
    if (!supabase) throw new Error("Conexão segura necessária.");
    // RLS garantirá que user só delete da sua store_id
    const { error } = await supabase.from('vehicles').delete().eq('id', id).eq('store_id', storeId);
    if (error) throw new Error(error.message);
  },

  // --- OPEX (DESPESAS DA LOJA) ---

  getStoreExpenses: async (storeId: string): Promise<StoreExpense[]> => {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('store_expenses')
        .select('*')
        .eq('store_id', storeId);
      
      if (error) return [];
      
      return data.map((e: any) => ({
          ...e,
          storeId: e.store_id,
          createdAt: e.created_at,
          updatedAt: e.created_at
      }));
  },

  createStoreExpense: async (expense: StoreExpense): Promise<StoreExpense> => {
      if (!supabase) throw new Error("Conexão segura necessária.");

      const dbExpense = {
          store_id: expense.storeId,
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
          category: expense.category,
          paid: expense.paid
      };
      const { data, error } = await supabase.from('store_expenses').insert(dbExpense).select().single();
      if (error) throw new Error(error.message);
      return { ...expense, id: data.id };
  },

  deleteStoreExpense: async (id: string): Promise<void> => {
      if (!supabase) throw new Error("Conexão segura necessária.");
      const { error } = await supabase.from('store_expenses').delete().eq('id', id);
      if (error) throw new Error(error.message);
  },

  seedInitialData: (user: User) => {
     // Removed secure violation risk
  }
};
