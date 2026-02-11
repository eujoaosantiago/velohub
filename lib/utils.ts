
import { Vehicle } from '../types';

/* =======================
   FORMATAÇÃO DE MOEDA
======================= */

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Máscara estilo ATM (digita números, completa da direita)
export const maskCurrencyInput = (value: string): string => {
  const onlyDigits = value.replace(/\D/g, '');
  if (!onlyDigits) return '';

  const numberValue = parseInt(onlyDigits, 10) / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
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

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
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
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'sold':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'reserved':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'preparation':
      return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
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
      return 'border-rose-500/30 hover:border-rose-500/50';
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
