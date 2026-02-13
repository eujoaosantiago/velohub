import { Vehicle, User } from '@/shared/types';
import { PLAN_CONFIG } from '@/shared/lib/plans';
import { normalizeDate } from '@/shared/lib/utils';
import { supabase } from '@/services/supabaseClient';
import { customerService } from '@/domains/customers/services/customerService';

export const vehicleService = {
  getVehicles: async (storeId: string): Promise<Vehicle[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      console.error('Erro ao buscar dados seguros:', error);
      throw new Error('Erro ao buscar dados seguros.');
    }

    return data.map((v: any) => ({
      ...v,
      storeId: v.store_id,
      purchasePrice: v.purchase_price,
      expectedSalePrice: v.expected_sale_price,
      fipePrice: v.fipe_price,
      soldPrice: v.sold_price,
      soldDate: v.sold_date ? normalizeDate(v.sold_date) : undefined,
      purchaseDate: v.created_at,
      renavam: v.renavam || '',
      chassis: v.chassis || '',
      expenses: v.expenses || [],
      optionals: v.optionals || [],
      paymentMethod: v.payment_method,
      customerId: v.customer_id || undefined,
      buyer: v.buyer_snapshot || v.buyer_old || undefined,
      buyerSnapshot: v.buyer_snapshot || undefined,
      warrantyDetails: v.warranty_details || undefined,
      reservationDetails: v.reservation_details || undefined,
      tradeInInfo: v.trade_in_info || undefined,
      saleCommission: v.sale_commission || 0,
      saleCommissionTo: v.sale_commission_to || '',
      ipvaPaid: v.ipva_paid,
      licensingPaid: v.licensing_paid,
    }));
  },

  getVehicleById: async (vehicleId: string): Promise<Vehicle & { storeName?: string; storeWhatsapp?: string }> => {
    if (!supabase) throw new Error('Conexao necessaria.');

    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError) {
      console.error('Erro ao buscar veiculo:', vehicleError);
      throw new Error(`Veiculo nao encontrado: ${vehicleError.message}`);
    }

    if (!vehicleData) {
      throw new Error('Veiculo nao encontrado.');
    }

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
        }
        if (userData.phone) {
          storeWhatsapp = userData.phone.replace(/\D/g, '');
        }
      }
    } catch (e) {
      console.warn('Nao foi possivel buscar dados da loja, usando defaults');
    }

    return {
      ...vehicleData,
      id: vehicleData.id,
      storeId: vehicleData.store_id,
      purchasePrice: vehicleData.purchase_price,
      expectedSalePrice: vehicleData.expected_sale_price,
      fipePrice: vehicleData.fipe_price,
      soldPrice: vehicleData.sold_price,
      soldDate: vehicleData.sold_date ? normalizeDate(vehicleData.sold_date) : undefined,
      purchaseDate: vehicleData.created_at,
      renavam: vehicleData.renavam || '',
      chassis: vehicleData.chassis || '',
      expenses: vehicleData.expenses || [],
      optionals: vehicleData.optionals || [],
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
      storeName,
      storeWhatsapp,
    };
  },

  createVehicle: async (vehicle: Vehicle, user: User): Promise<Vehicle> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');

    const vehicles = await vehicleService.getVehicles(user.storeId);
    const currentCount = vehicles.filter((v) => v.status !== 'sold').length;
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
      optionals: vehicle.optionals || [],
      ipva_paid: !!vehicle.ipvaPaid,
      licensing_paid: !!vehicle.licensingPaid,
    };

    const { data, error } = await supabase.from('vehicles').insert(dbVehicle).select().single();
    if (error) throw new Error(error.message);
    return { ...vehicle, id: data.id };
  },

  updateVehicle: async (vehicle: Vehicle): Promise<Vehicle> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');

    const buyerSnapshot = vehicle.buyerSnapshot || vehicle.buyer;
    let customerId = vehicle.customerId;

    if (vehicle.status === 'sold' && buyerSnapshot?.cpf && vehicle.storeId) {
      try {
        const customer = await customerService.upsertCustomer(vehicle.storeId, buyerSnapshot);
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
      sold_date: vehicle.soldDate ? normalizeDate(vehicle.soldDate) : null,
      payment_method: vehicle.paymentMethod,
      customer_id: customerId || null,
      buyer_snapshot: buyerSnapshot || null,
      photos: vehicle.photos,
      expenses: vehicle.expenses,
      optionals: vehicle.optionals || [],
      trade_in_info: vehicle.tradeInInfo,
      reservation_details: vehicle.reservationDetails,
      warranty_details: vehicle.warrantyDetails,
      ipva_paid: !!vehicle.ipvaPaid,
      licensing_paid: !!vehicle.licensingPaid,
      sale_commission: vehicle.saleCommission,
      sale_commission_to: vehicle.saleCommissionTo,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('vehicles').update(dbVehicle).eq('id', vehicle.id);
    if (error) throw new Error(error.message);
    return vehicle;
  },

  deleteVehicle: async (id: string, storeId: string): Promise<void> => {
    if (!supabase) throw new Error('Conexao segura necessaria.');
    const { error } = await supabase.from('vehicles').delete().eq('id', id).eq('store_id', storeId);
    if (error) throw new Error(error.message);
  },
};



