import { ExpenseCategory, VehicleStatus } from '@/shared/types';

type StatusOption = {
  value: VehicleStatus;
  label: string;
  color: string;
};

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'maintenance', label: 'Manutencao' },
  { id: 'bodywork', label: 'Funilaria' },
  { id: 'tires', label: 'Pneus' },
  { id: 'document', label: 'Documentacao' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'salary', label: 'Comissao (Despesa)' },
  { id: 'other', label: 'Outros' },
];

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'available', label: 'Em Estoque', color: 'bg-emerald-500 text-white' },
  { value: 'reserved', label: 'Reservado', color: 'bg-amber-500 text-white' },
  { value: 'preparation', label: 'Preparacao', color: 'bg-indigo-500 text-white' },
];

export const OPTIONAL_FEATURES: string[] = [
  'Ar condicionado',
  'Direcao hidraulica',
  'Direcao eletrica',
  'Vidro eletrico',
  'Trava eletrica',
  'Airbag',
  'ABS',
  'Bancos de couro',
  'Multimidia',
  'Sensor de estacionamento',
  'Camera de re',
  'Rodas de liga leve',
  'Piloto automatico',
  'Teto solar',
  'Farol de neblina',
  'Controle de estabilidade',
];
