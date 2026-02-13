
import { Vehicle } from '@/shared/types';

/* =======================
   DATAS & FUSO HORÁRIO
======================= */

export const getBrazilDateISO = (): string => {
  // Pega a data LOCAL do sistema (sem conversões de timezone)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
  const day = String(now.getDate()).padStart(2, '0');
  
  // Retorna no formato ISO (YYYY-MM-DD)
  return `${year}-${month}-${day}`;
};

export const parseISODate = (value?: string): Date | null => {
  if (!value) return null;
  const cleaned = value.split('T')[0]?.split(' ')[0] || value;
  if (cleaned.includes('-')) {
    const [year, month, day] = cleaned.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const toLocalDateTimestamp = (value?: string): number => {
  const date = parseISODate(value);
  return date ? date.getTime() : 0;
};

export const formatDateBR = (value?: string, fallback = ''): string => {
  const date = parseISODate(value);
  return date ? date.toLocaleDateString('pt-BR') : fallback;
};

// Normaliza data do Supabase para formato YYYY-MM-DD (sem timezone)
export const normalizeDate = (value?: string): string => {
  if (!value) return getBrazilDateISO();
  // Remove timezone e hora: "2026-02-12T03:00:00.000Z" -> "2026-02-12"
  return value.split('T')[0]?.split(' ')[0] || value;
};

/* =======================
   FORMATAÇÃO DE MOEDA
======================= */

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Máscara estilo ATM (digita números, completa da direita para esquerda)
// Funciona bem em mobile também - sempre coloca o cursor na posição correta
export const maskCurrencyInput = (value: string): string => {
  const onlyDigits = value.replace(/\D/g, '');
  if (!onlyDigits) return '';

  const numberValue = parseInt(onlyDigits, 10) / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};

// Converte número (em reais) para formato masked para edição
// Ex: 1500 → "R$ 1.500,00"
export const numberToMaskedCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Converte "R$ 1.500,00" → 1500
export const parseCurrencyInput = (value: string): number => {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits, 10) / 100;
};

/* =======================
   MÁSCARAS DE INPUT
======================= */

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

export const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

// RENAVAM: suporta 9 dígitos (antigos, preenchidos com zeros) ou 11 dígitos (novos)
export const maskRenavam = (value: string) => {
  return value
    .replace(/\D/g, '')
    .slice(0, 11);
};

// CHASSI: VIN com 17 caracteres (números e letras maiúsculas)
export const maskChassis = (value: string) => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 17);
};

export const isValidPlate = (plate: string): boolean => {
  const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return false;
  return /^[A-Z]{3}\d{4}$/.test(cleaned) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleaned);
};

/* =======================
   CÁLCULOS FINANCEIROS
======================= */

// Soma todas as despesas do veículo
export const calculateTotalExpenses = (vehicle: Vehicle): number => {
  return vehicle.expenses.reduce((acc, curr) => acc + curr.amount, 0);
};

// Lucro projetado (antes da venda)
export const calculateProjectedProfit = (vehicle: Vehicle): number => {
  const totalCost = vehicle.purchasePrice + calculateTotalExpenses(vehicle);
  return vehicle.expectedSalePrice - totalCost;
};

// ✅ LUCRO REAL (PADRONIZADO)
export const calculateRealProfit = (vehicle: Vehicle): number => {
  // Tudo que entrou na venda (dinheiro + troca)
  const grossRevenue = vehicle.soldPrice || 0;

  // Soma todas as despesas reais (incluindo comissões que agora são salvas como expenses)
  const allExpenses = vehicle.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Custo total do veículo
  const totalCost = vehicle.purchasePrice + allExpenses;

  const profit = grossRevenue - totalCost;

  // Venda zerada / teste → nunca gera lucro
  if (grossRevenue <= 0) return 0;

  // Impede lucro impossível (venda abaixo do custo)
  if (grossRevenue < vehicle.purchasePrice) {
    return Math.min(profit, 0);
  }

  return profit;
};

// ROI
export const calculateROI = (profit: number, invested: number): number => {
  if (invested === 0) return 0;
  return (profit / invested) * 100;
};

/* =======================
   STATUS VISUAL
======================= */

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    case 'sold':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'reserved':
      return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    case 'preparation':
      return 'text-indigo-400 bg-indigo-500/20 border-indigo-500/40';
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

export const getStatusBorderColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'border-emerald-500/30 hover:border-emerald-500/50';
    case 'sold':
      return 'border-blue-500/30 hover:border-blue-500/50';
    case 'reserved':
      return 'border-amber-500/30 hover:border-amber-500/50';
    case 'preparation':
      return 'border-indigo-500/30 hover:border-indigo-500/50';
    default:
      return 'border-slate-800';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'available':
      return 'Em Estoque';
    case 'sold':
      return 'Vendido';
    case 'reserved':
      return 'Reservado';
    case 'preparation':
      return 'Preparação';
    default:
      return status;
  }
};

/* =======================
   VALIDAÇÃO CPF
======================= */

export const isValidCPF = (cpf: string): boolean => {
  if (!cpf) return false;

  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const values = cpf.split('').map(el => +el);

  const rest = (count: number) =>
    (values
      .slice(0, count - 12)
      .reduce((s, z, i) => s + z * (count - i), 0) *
      10) %
    11 %
    10;

  return rest(10) === values[9] && rest(11) === values[10];
};

export const fetchCepInfo = async (cep: string) => {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
  if (!response.ok) return null;
  const data = await response.json();
  if (data?.erro) return null;

  return {
    street: data.logradouro || '',
    neighborhood: data.bairro || '',
    city: data.localidade || '',
    state: data.uf || ''
  };
};



