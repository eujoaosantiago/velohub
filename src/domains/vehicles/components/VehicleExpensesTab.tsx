import React from 'react';
import { Expense, ExpenseCategory } from '@/shared/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Edit2, Trash2, X } from 'lucide-react';

type ExpenseData = {
  desc: string;
  amount: string;
  category: ExpenseCategory;
  employeeName: string;
};

type ExpenseCategoryOption = {
  id: ExpenseCategory;
  label: string;
};

interface VehicleExpensesTabProps {
  expenseData: ExpenseData;
  setExpenseData: React.Dispatch<React.SetStateAction<ExpenseData>>;
  editingExpenseId: string | null;
  handleAddExpense: () => void;
  handleCancelEditExpense: () => void;
  handleEditExpense: (expense: Expense) => void;
  handleDeleteExpense: (expenseId: string) => void;
  activeExpenseFilter: ExpenseCategory | 'all';
  setActiveExpenseFilter: React.Dispatch<React.SetStateAction<ExpenseCategory | 'all'>>;
  filteredExpenses: Expense[];
  categories: ExpenseCategoryOption[];
  totalExpensesValue: number;
  originalExpenses: Expense[];
  formatCurrency: (value: number) => string;
  formatDateBR: (value?: string) => string;
  maskCurrencyInput: (value: string) => string;
}

export const VehicleExpensesTab: React.FC<VehicleExpensesTabProps> = ({
  expenseData,
  setExpenseData,
  editingExpenseId,
  handleAddExpense,
  handleCancelEditExpense,
  handleEditExpense,
  handleDeleteExpense,
  activeExpenseFilter,
  setActiveExpenseFilter,
  filteredExpenses,
  categories,
  totalExpensesValue,
  originalExpenses,
  formatCurrency,
  formatDateBR,
  maskCurrencyInput,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title={editingExpenseId ? 'Editar Gasto' : 'Adicionar Gasto'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={expenseData.category}
              onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value as ExpenseCategory })}
              className="w-full select-premium text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Valor (R$)"
              className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm font-bold"
              value={expenseData.amount}
              onChange={(e) => setExpenseData({ ...expenseData, amount: maskCurrencyInput(e.target.value) })}
            />
          </div>

          {expenseData.category === 'salary' && (
            <div className="animate-fade-in">
              <label className="text-xs text-slate-400 mb-1 block">Nome do Vendedor/Funcionário</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                value={expenseData.employeeName}
                onChange={(e) => setExpenseData({ ...expenseData, employeeName: e.target.value })}
              />
            </div>
          )}

          <input
            type="text"
            placeholder="Descrição (ex: Troca de óleo)"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
            value={expenseData.desc}
            onChange={(e) => setExpenseData({ ...expenseData, desc: e.target.value })}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddExpense} className="flex-1">
              {editingExpenseId ? 'Atualizar' : 'Adicionar'}
            </Button>
            {editingExpenseId && (
              <Button variant="ghost" onClick={handleCancelEditExpense} className="px-3">
                <X size={18} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card title={`Total: ${formatCurrency(totalExpensesValue)}`}>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setActiveExpenseFilter('all')}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              activeExpenseFilter === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveExpenseFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                activeExpenseFilter === cat.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredExpenses.map((exp) => {
            const categoryLabel = categories.find((c) => c.id === exp.category)?.label || 'Outros';
            const isNewExpense = !originalExpenses.find((e) => e.id === exp.id);

            return (
              <div
                key={exp.id}
                className={`group flex justify-between items-center p-2 rounded border ${
                  isNewExpense ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-800'
                }`}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{exp.description}</span>
                    {isNewExpense && <span className="text-[10px] bg-emerald-500 text-white px-1 rounded">Novo</span>}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 text-xs">
                      {categoryLabel} • {formatDateBR(exp.date)}
                    </span>
                    {exp.employeeName && <span className="text-indigo-400 text-xs font-bold">• {exp.employeeName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-sm">{formatCurrency(exp.amount)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleEditExpense(exp)}
                      className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredExpenses.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum gasto encontrado.</p>}
        </div>
      </Card>
    </div>
  );
};
