
import React, { useMemo, useState } from 'react';
import { Vehicle } from '../types';
import { Card, StatCard } from '../components/ui/Card';
import { formatCurrency, calculateTotalExpenses, calculateRealProfit, calculateROI } from '../lib/utils';
import { Search, Calendar, User, DollarSign, TrendingUp, Filter, BarChart3, PieChart as PieIcon, Award, Eye, Lock, Crown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { AuthService } from '../services/auth';
import { getPlanLimits } from '../lib/plans';
import { useVelohub } from '../contexts/VelohubContext';
import { Page } from '../types';

interface SalesListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
}

export const SalesList: React.FC<SalesListProps> = ({ vehicles, onSelectVehicle }) => {
  const [searchTerm, setSearchTerm] = useState('');
    const [chartPeriod, setChartPeriod] = useState<
        | 'last_3'
        | 'last_6'
        | 'last_12'
        | 'this_month'
        | 'last_month'
        | 'this_quarter'
        | 'this_year'
    >('last_6');
    const [chartBrand, setChartBrand] = useState<string>('all');
  const { navigateTo } = useVelohub();
  const currentUser = AuthService.getCurrentUser();
  const planLimits = currentUser ? getPlanLimits(currentUser) : null;
  const canViewCharts = planLimits?.showAdvancedReports ?? false;
  
  // Filter only sold vehicles
  const soldVehicles = useMemo(() => vehicles.filter(v => v.status === 'sold').sort((a, b) => {
    return new Date(b.soldDate || '').getTime() - new Date(a.soldDate || '').getTime();
  }), [vehicles]);

    const parseSoldDate = (value?: string) => {
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

  const filteredSales = soldVehicles.filter(v => {
    const term = searchTerm.toLowerCase();
        const saleDate = parseSoldDate(v.soldDate)?.toLocaleDateString('pt-BR') || '';
    const priceStr = v.soldPrice ? v.soldPrice.toString() : '';
    
    return (
      v.make.toLowerCase().includes(term) || 
      v.model.toLowerCase().includes(term) ||
      v.version.toLowerCase().includes(term) ||
      v.year.toString().includes(term) ||
      v.color.toLowerCase().includes(term) ||
      v.plate.toLowerCase().includes(term) ||
      (v.buyer?.name || '').toLowerCase().includes(term) ||
      saleDate.includes(term) ||
      priceStr.includes(term)
    );
  });

  // --- METRICS CALCULATION ---
  const totalRevenue = soldVehicles.reduce((acc, v) => acc + (v.soldPrice || 0), 0);
  const totalProfit = soldVehicles.reduce((acc, v) => acc + calculateRealProfit(v), 0);
  const totalInvested = soldVehicles.reduce((acc, v) => acc + v.purchasePrice + calculateTotalExpenses(v), 0);
  
  const averageRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const averageTicket = soldVehicles.length > 0 ? totalRevenue / soldVehicles.length : 0;
  const averageMargin = soldVehicles.length > 0 ? totalProfit / soldVehicles.length : 0;

    const periodLabelMap: Record<string, string> = {
        last_3: 'Ultimos 3 meses',
        last_6: 'Ultimos 6 meses',
        last_12: 'Ultimos 12 meses',
        this_month: 'Este mes',
        last_month: 'Mes anterior',
        this_quarter: 'Trimestre atual',
        this_year: 'Ano atual',
    };

    const getChartDateRange = (period: typeof chartPeriod) => {
        const now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth(), 1);
        let end = new Date(now);

        if (period === 'last_3' || period === 'last_6' || period === 'last_12') {
            const monthsBack = period === 'last_3' ? 2 : period === 'last_6' ? 5 : 11;
            start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        } else if (period === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period === 'this_quarter') {
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), quarterStart, 1);
        } else if (period === 'this_year') {
            start = new Date(now.getFullYear(), 0, 1);
        }

        return { start, end };
    };

    const chartBrands = useMemo(() => {
        const unique = Array.from(new Set(soldVehicles.map((v) => v.make).filter(Boolean)));
        return ['all', ...unique.sort((a, b) => a.localeCompare(b))];
    }, [soldVehicles]);

    const { start: chartStart, end: chartEnd } = useMemo(
        () => getChartDateRange(chartPeriod),
        [chartPeriod],
    );


    const filteredChartVehicles = useMemo(() => {
        return soldVehicles.filter((v) => {
            const soldAt = parseSoldDate(v.soldDate);
            if (!soldAt) return false;
            if (soldAt < chartStart || soldAt > chartEnd) return false;
            if (chartBrand !== 'all' && v.make !== chartBrand) return false;
            return true;
        });
    }, [soldVehicles, chartStart, chartEnd, chartBrand]);

    const buildMonthKeys = (start: Date, end: Date) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const keys: string[] = [];
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        while (cursor <= endMonth) {
            const key = `${months[cursor.getMonth()]}/${cursor.getFullYear().toString().slice(2)}`;
            keys.push(key);
            cursor.setMonth(cursor.getMonth() + 1);
        }

        return keys;
    };

    // --- CHART DATA: Revenue vs Profit (Monthly) ---
    const timelineData = useMemo(() => {
        const data: Record<string, { name: string; revenue: number; profit: number }> = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        buildMonthKeys(chartStart, chartEnd).forEach((key) => {
            data[key] = { name: key, revenue: 0, profit: 0 };
        });

        filteredChartVehicles.forEach((v) => {
            const soldAt = parseSoldDate(v.soldDate);
            if (!soldAt) return;
            const key = `${months[soldAt.getMonth()]}/${soldAt.getFullYear().toString().slice(2)}`;
            if (data[key]) {
                data[key].revenue += v.soldPrice || 0;
                data[key].profit += calculateRealProfit(v);
            }
        });

        return Object.values(data);
    }, [filteredChartVehicles, chartStart, chartEnd]);

    const profitSeriesColor = useMemo(() => {
        const total = timelineData.reduce((acc, item) => acc + item.profit, 0);
        return total >= 0 ? '#22c55e' : '#ef4444';
    }, [timelineData]);

  // --- CHART DATA: Top Brands ---
  const brandData = useMemo(() => {
      const counts: Record<string, number> = {};
      soldVehicles.forEach(v => {
          counts[v.make] = (counts[v.make] || 0) + 1;
      });
      return Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5
  }, [soldVehicles]);

    const COLORS = [
        'rgb(var(--velo-orange))',
        'rgb(var(--velo-platinum))',
        'rgb(var(--velo-jet))',
        'rgb(var(--velo-black))',
        'rgb(var(--velo-orange))',
    ];

  const yAxisTickFormatter = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1000 && value < 1000000) return `${(value / 1000).toFixed(0)}k`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toString();
  };

  const LockedOverlay = ({ title }: { title: string }) => (
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 border border-slate-700/50 rounded-2xl">
          <div className="bg-indigo-500/10 p-4 rounded-full mb-3 border border-indigo-500/20">
              <Lock size={24} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-slate-400 text-sm max-w-xs mb-4">
              Disponível nos planos <strong>Pro</strong> e <strong>Enterprise</strong>.
          </p>
          <button 
            onClick={() => navigateTo(Page.PROFILE)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm transition-all"
          >
              <Crown size={14} /> Fazer Upgrade
          </button>
      </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Inteligência Comercial</h1>
        <p className="text-slate-400 text-sm md:text-base">Métricas de performance para escalar sua operação.</p>
      </div>

      {/* Strategic KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
              label="Faturamento Total" 
              value={formatCurrency(totalRevenue)} 
              icon={<DollarSign size={24} />} 
              subValue={`${soldVehicles.length} carros vendidos`}
              helpText="Soma de todas as vendas realizadas no período, sem descontar custos."
          />
          <StatCard 
              label="Lucro Líquido Real" 
              value={formatCurrency(totalProfit)} 
              icon={<TrendingUp size={24} />} 
              highlight={totalProfit >= 0 ? 'positive' : 'negative'}
              trend="up"
              subValue="Após todos os custos"
              helpText="O dinheiro que realmente sobrou no bolso: Valor Venda - (Custo Compra + Gastos)."
          />
          <StatCard 
              label="ROI Médio (Retorno)" 
              value={`${averageRoi.toFixed(1)}%`} 
              icon={<Award size={24} />} 
              subValue="Sobre capital investido"
              helpText="Return on Investment. Indica quanto você ganhou de lucro para cada real investido no estoque."
          />
          <StatCard 
              label="Ticket Médio" 
              value={formatCurrency(averageTicket)} 
              icon={<BarChart3 size={24} />} 
              subValue={`Margem méd: ${formatCurrency(averageMargin)}`}
              helpText="Valor médio de venda por carro. Ajuda a entender o perfil do seu público."
          />
      </div>

      {/* Chart Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Filter size={16} />
              Filtros dos graficos
          </div>
          <div className="flex flex-wrap gap-3">
              <label className="text-xs text-slate-400 flex flex-col gap-1">
                  Periodo
                  <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value as typeof chartPeriod)}
                      className="select-premium text-sm"
                  >
                      {Object.entries(periodLabelMap).map(([value, label]) => (
                          <option key={value} value={value}>
                              {label}
                          </option>
                      ))}
                  </select>
              </label>
              <label className="text-xs text-slate-400 flex flex-col gap-1">
                  Marca
                  <select
                      value={chartBrand}
                      onChange={(e) => setChartBrand(e.target.value)}
                      className="select-premium text-sm"
                  >
                      {chartBrands.map((brand) => (
                          <option key={brand} value={brand}>
                              {brand === 'all' ? 'Todas' : brand}
                          </option>
                      ))}
                  </select>
              </label>
          </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Profit Chart */}
          <Card
              title={`Evolução Financeira (${periodLabelMap[chartPeriod]})`}
              className="lg:col-span-2 relative overflow-hidden min-h-[350px]"
          >
              {!canViewCharts && <LockedOverlay title="Análise Financeira Avançada" />}
              <div className={`h-64 md:h-80 w-full ${!canViewCharts ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="rgb(var(--velo-jet))" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="rgb(var(--velo-jet))" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={profitSeriesColor} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={profitSeriesColor} stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--velo-jet))" vertical={false} opacity={0.3} />
                          <XAxis dataKey="name" stroke="rgb(var(--velo-jet))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgb(var(--velo-jet))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: 'rgb(var(--velo-black))', borderColor: 'rgb(var(--velo-jet))', borderRadius: '12px', color: 'rgb(var(--velo-platinum))' }}
                              formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'Faturamento' : 'Lucro']}
                              labelStyle={{ color: 'rgb(var(--velo-platinum))' }}
                          />
                          <Area type="monotone" dataKey="revenue" name="revenue" stroke="rgb(var(--velo-jet))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                          <Area type="monotone" dataKey="profit" name="profit" stroke={profitSeriesColor} fillOpacity={1} fill="url(#colorProf)" strokeWidth={3} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          {/* Top Brands Chart */}
          <Card title="Marcas Mais Vendidas" className="relative overflow-hidden min-h-[350px]">
              {!canViewCharts && <LockedOverlay title="Ranking de Marcas" />}
              <div className={`h-64 md:h-80 w-full ${!canViewCharts ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgb(var(--velo-jet))" opacity={0.3} />
                          <XAxis type="number" stroke="rgb(var(--velo-jet))" hide />
                          <YAxis dataKey="name" type="category" stroke="rgb(var(--velo-platinum))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                          <Tooltip 
                              cursor={{fill: 'rgb(var(--velo-jet))', opacity: 0.2}}
                              contentStyle={{ backgroundColor: 'rgb(var(--velo-black))', borderColor: 'rgb(var(--velo-jet))', borderRadius: '8px', color: 'rgb(var(--velo-platinum))' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {brandData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </Card>
      </div>

      {/* SALES TABLE */}
      <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-bold text-white">Histórico de Vendas</h2>
              <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar (Marca, Cor, Valor, Cliente...)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
          </div>

          <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-sm bg-slate-900/50">
                            <th className="px-6 py-4 font-medium pl-6">Data</th>
                            <th className="px-6 py-4 font-medium">Veículo</th>
                            <th className="px-6 py-4 font-medium">Cliente</th>
                            <th className="px-6 py-4 font-medium text-right">Valor Venda</th>
                            <th className="px-6 py-4 font-medium text-right">ROI</th>
                            <th className="px-6 py-4 font-medium text-right">Lucro</th>
                            <th className="px-6 py-4 font-medium text-center pr-6">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredSales.length > 0 ? filteredSales.map(sale => {
                            const profit = calculateRealProfit(sale);
                            const invested = sale.purchasePrice + calculateTotalExpenses(sale);
                            const roi = calculateROI(profit, invested);
                            const isProfitPositive = profit > 0;

                            return (
                                <tr key={sale.id} className="text-sm hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap pl-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-500" />
                                            {sale.soldDate
                                                ? (parseSoldDate(sale.soldDate)?.toLocaleDateString('pt-BR') || 'Data inválida')
                                                : 'Data não informada'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => onSelectVehicle(sale.id)}
                                                className="text-white font-medium text-left hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
                                            >
                                                {sale.make} {sale.model}
                                            </button>
                                            <span className="text-xs text-slate-500">{sale.version} • {sale.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-500" />
                                            {sale.buyer?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white text-right">
                                        {formatCurrency(sale.soldPrice!)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-xs font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {roi.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            isProfitPositive 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {formatCurrency(profit)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center pr-6">
                                        <button 
                                            onClick={() => onSelectVehicle(sale.id)}
                                            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1 mx-auto bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20"
                                        >
                                            <Eye size={12} />
                                            Ver Ficha
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    Nenhuma venda encontrada para os filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </Card>
      </div>
    </div>
  );
};
