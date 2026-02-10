
export type VehicleStatus = 'available' | 'sold' | 'reserved' | 'preparation';
export type UserRole = 'owner' | 'employee';
export type PlanType = 'free' | 'trial' | 'starter' | 'pro' | 'enterprise';

export interface BaseEntity {
  id: string;
  storeId: string; // MULTI-TENANCY KEY
  createdAt: string; // AUDIT
  updatedAt: string; // AUDIT
}

export interface UserPermissions {
    view_costs: boolean;        // Ver preço de compra, margem e lucro
    view_customers: boolean;    // Acessar menu de clientes
    view_analytics: boolean;    // Ver gráficos de faturamento e dashboard financeiro
    edit_sale_price: boolean;   // Alterar preço de venda do carro
    manage_sales: boolean;      // Marcar como vendido
    share_vehicles: boolean;    // Compartilhar link público do veículo
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  storeName?: string;
  cnpj?: string;
  phone?: string;
  cep?: string;   // Novo campo
  city?: string;  
  state?: string; 
  password?: string; 
  // Subscription fields
  plan: PlanType;
  trialEndsAt?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  stripeCustomerId?: string;
  // Permissions (Only relevant for employees)
  permissions?: UserPermissions;
  // Customization
  contractTemplate?: string; // Texto personalizado do contrato
}

// CMV - Custo da Mercadoria Vendida (Gasto no Carro)
export type ExpenseCategory = 'maintenance' | 'bodywork' | 'tires' | 'document' | 'marketing' | 'salary' | 'other';

// OPEX - Despesas Operacionais (Gasto da Loja)
export type OpexCategory = 'rent' | 'utilities' | 'payroll' | 'marketing_store' | 'software' | 'taxes' | 'office' | 'other';

export interface Expense {
  id: string;
  vehicleId: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  employeeName?: string; // Para comissões
}

export interface StoreExpense extends BaseEntity {
    description: string;
    amount: number;
    date: string;
    category: OpexCategory;
    paid: boolean;
}

export interface Buyer {
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface WarrantyDetails {
    time: string; // ex: "90 dias"
    km: string;   // ex: "3.000 km"
}

// Detalhes da Reserva
export interface ReservationDetails {
    reservedBy: string;
    reservedByPhone?: string; // Novo campo
    signalValue: number;
    reservationDate: string;
}

export interface Vehicle extends BaseEntity {
  make: string;
  model: string;
  version: string;
  year: number;
  plate: string;
  km: number;
  fuel: string;
  transmission: string;
  color: string;
  status: VehicleStatus;
  purchasePrice: number;
  purchaseDate: string;
  expectedSalePrice: number;
  fipePrice: number;
  // Documentation Status
  ipvaPaid?: boolean;
  licensingPaid?: boolean;
  // Sales Data
  soldPrice?: number;
  soldDate?: string;
  paymentMethod?: string;
  saleCommission?: number; // Valor da comissão
  saleCommissionTo?: string; // Nome do funcionário que recebeu
  buyer?: Buyer;
  warrantyDetails?: WarrantyDetails;
  // Trade In Snapshot (Carro que entrou na troca)
  tradeInInfo?: {
      make: string;
      model: string;
      plate: string;
      value: number;
  };
  // Reservation Data
  reservationDetails?: ReservationDetails;
  // Media & Extras
  photos: string[];
  expenses: Expense[];
  notes?: string;
}

export interface DashboardMetrics {
  totalInventoryValue: number;
  totalVehicles: number;
  totalProfitMonth: number;
  avgDaysInStock: number;
}

export enum Page {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD', // Nova página
  DASHBOARD = 'DASHBOARD',
  VEHICLES = 'VEHICLES',
  VEHICLE_DETAIL = 'VEHICLE_DETAIL',
  SALES = 'SALES',
  EXPENSES = 'EXPENSES', 
  CUSTOMERS = 'CUSTOMERS',
  TEAM = 'TEAM',
  PROFILE = 'PROFILE',
  // Novas páginas públicas
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  SUPPORT = 'SUPPORT',
  PUBLIC_SHARE = 'PUBLIC_SHARE'
}

// --- PERMISSION HELPER ---
export const checkPermission = (user: User | null, permission: keyof UserPermissions): boolean => {
    if (!user) return false;
    // Donos têm acesso total sempre
    if (user.role === 'owner') return true;
    // Funcionários dependem da configuração
    return !!user.permissions?.[permission];
};
