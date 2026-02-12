
import { Vehicle, User, StoreExpense, Customer, Buyer } from '../types';
import { PLAN_CONFIG } from '../lib/plans';
import { supabase } from '../lib/supabaseClient';

export const ApiService = {
    // --- CLIENTES ---
    upsertCustomer: async (storeId: string, buyer: Buyer): Promise<Customer> => {
        if (!supabase) throw new Error("Conexao segura necessaria.");
        if (!buyer?.cpf) throw new Error("CPF do cliente obrigatorio.");

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
            updated_at: now
        };

        console.log('📝 Upserting customer:', { storeId, cpf: buyer.cpf, name: buyer.name });
        const { data, error } = await supabase
            .from('customers')
            .upsert(payload, { onConflict: 'store_id,cpf' })
            .select('*')
            .single();

        if (error) {
            console.error('❌ Erro ao upsert customer:', error);
            throw new Error(error.message);
        }
        console.log('✅ Customer uperted:', { id: data.id, cpf: data.cpf });

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
            state: data.state || undefined
        };
    },
    getCustomers: async (storeId: string): Promise<Customer[]> => {
        if (!supabase) return [];

        console.log('🔍 Fetching customers for store:', storeId);
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao buscar clientes:', error);
            throw new Error(error.message);
        }
        console.log('✅ Fetched customers count:', data?.length || 0);

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
            state: c.state || undefined
        }));
    },
    updateCustomer: async (customer: Customer): Promise<Customer> => {
        if (!supabase) throw new Error("Conexao segura necessaria.");

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
            updated_at: new Date().toISOString()
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
            state: data.state || undefined
        };
    },
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
        renavam: v.renavam || '',
        chassis: v.chassis || '',
        expenses: v.expenses || [],
        paymentMethod: v.payment_method,
        customerId: v.customer_id || undefined,
        // Campos de venda / comprador
        buyer: v.buyer_snapshot || v.buyer_old || undefined,
        buyerSnapshot: v.buyer_snapshot || undefined,
        warrantyDetails: v.warranty_details || undefined,
        reservationDetails: v.reservation_details || undefined,
        tradeInInfo: v.trade_in_info || undefined,
        saleCommission: v.sale_commission || 0,
        saleCommissionTo: v.sale_commission_to || '',
        // Mapping boolean fields explicitly
        ipvaPaid: v.ipva_paid,
        licensingPaid: v.licensing_paid
    }));
  },

  getVehicleById: async (vehicleId: string): Promise<Vehicle & { storeName?: string; storeWhatsapp?: string }> => {
    if (!supabase) throw new Error("Conexão necessária.");

    console.log('🔍 Buscando veículo público:', vehicleId);

    // Primeira tentativa: busca simples do veículo
    const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
    if (vehicleError) {
        console.error("❌ Erro ao buscar veículo:", vehicleError);
        throw new Error(`Veículo não encontrado: ${vehicleError.message}`);
    }
    
    if (!vehicleData) {
        console.error("❌ Veículo não existe");
        throw new Error("Veículo não encontrado.");
    }

    console.log('✅ Veículo encontrado:', vehicleData.make, vehicleData.model);

    // Segunda tentativa: busca o nome e phone da loja (da tabela users)
    let storeName = 'Nossa Loja';
    let storeWhatsapp = '';
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('store_name, phone')
            .eq('store_id', vehicleData.store_id)
            .limit(1)
            .single();
        
        if (userData) {
            if (userData.store_name) {
                storeName = userData.store_name;
                console.log('✅ Loja encontrada:', storeName);
            }
            if (userData.phone) {
                // Remove formatação do phone para usar apenas dígitos no WhatsApp
                storeWhatsapp = userData.phone.replace(/\D/g, '');
                console.log('✅ Telefone encontrado:', storeWhatsapp);
            }
        }
    } catch (e) {
        console.warn('⚠️ Não foi possível buscar dados da loja, usando defaults');
    }

    return {
        ...vehicleData,
        id: vehicleData.id,
        storeId: vehicleData.store_id,
        purchasePrice: vehicleData.purchase_price,
        expectedSalePrice: vehicleData.expected_sale_price,
        fipePrice: vehicleData.fipe_price,
        soldPrice: vehicleData.sold_price,
        soldDate: vehicleData.sold_date,
        purchaseDate: vehicleData.created_at, 
        renavam: vehicleData.renavam || '',
        chassis: vehicleData.chassis || '',
        expenses: vehicleData.expenses || [],
        paymentMethod: vehicleData.payment_method,
        customerId: vehicleData.customer_id || undefined,
        buyer: vehicleData.buyer_snapshot || vehicleData.buyer_old || undefined,
        buyerSnapshot: vehicleData.buyer_snapshot || undefined,
        warrantyDetails: vehicleData.warranty_details || undefined,
        reservationDetails: vehicleData.reservation_details || undefined,
        tradeInInfo: vehicleData.trade_in_info || undefined,
        saleCommission: vehicleData.sale_commission || 0,
        saleCommissionTo: vehicleData.sale_commission_to || '',
        ipvaPaid: vehicleData.ipva_paid,
        licensingPaid: vehicleData.licensing_paid,
        storeName: storeName,
        storeWhatsapp: storeWhatsapp
    };
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
        renavam: vehicle.renavam,
        chassis: vehicle.chassis,
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

    const buyerSnapshot = vehicle.buyerSnapshot || vehicle.buyer;
    let customerId = vehicle.customerId;

    if (vehicle.status === 'sold' && buyerSnapshot?.cpf && vehicle.storeId) {
        try {
            const customer = await ApiService.upsertCustomer(vehicle.storeId, buyerSnapshot);
            customerId = customer.id;
        } catch (err) {
            console.error('Erro ao sincronizar cliente:', err);
        }
    }

    const dbVehicle = {
        make: vehicle.make,
        model: vehicle.model,
        version: vehicle.version,
        year: vehicle.year,
        plate: vehicle.plate,
        renavam: vehicle.renavam,
        chassis: vehicle.chassis,
        km: vehicle.km,
        status: vehicle.status,
        purchase_price: vehicle.purchasePrice,
        expected_sale_price: vehicle.expectedSalePrice,
        sold_price: vehicle.soldPrice,
        sold_date: vehicle.soldDate,
        payment_method: vehicle.paymentMethod,
        customer_id: customerId || null,
        buyer_snapshot: buyerSnapshot || null,
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
