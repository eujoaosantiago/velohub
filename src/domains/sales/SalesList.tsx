
import React, { useEffect, useMemo, useState } from 'react';
import { Vehicle, StoreExpense, Page } from '@/shared/types';
import { Card, StatCard } from '@/components/ui/Card';
import { formatCurrency, calculateTotalExpenses, calculateRealProfit, calculateROI, formatDateBR, toLocalDateTimestamp, parseISODate } from '@/shared/lib/utils';
import { Search, Calendar, User, DollarSign, TrendingUp, Filter, BarChart3, PieChart as PieIcon, Award, Eye, Lock, Crown, Store, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, Line, Legend } from 'recharts';
import { AuthService } from '@/domains/auth/services/authService';
import { getPlanLimits } from '@/shared/lib/plans';
import { useVelohub } from '@/shared/contexts/VelohubContext';
import { storeExpenseService } from '@/domains/expenses/services/storeExpenseService';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ApiService } from '@/services/api';

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
        | 'all'
        | 'custom'
    >('last_6');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [chartBrand, setChartBrand] = useState<string>('all');
    type ChartMetricKey = 'revenue' | 'profit' | 'roi_stock' | 'roi_business' | 'ticket';
    const [chartMetrics, setChartMetrics] = useState<ChartMetricKey[]>(['revenue']);
    const [comparePrevPeriod, setComparePrevPeriod] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [storeExpenses, setStoreExpenses] = useState<StoreExpense[]>([]);
  const [isLoadingOpex, setIsLoadingOpex] = useState(false);
    const { navigateTo, refreshData } = useVelohub();
  const currentUser = AuthService.getCurrentUser();
    const [confirmDeleteSale, setConfirmDeleteSale] = useState<{ open: boolean; sale?: Vehicle }>(
        { open: false }
    );
    const [isDeletingSale, setIsDeletingSale] = useState(false);
  const planLimits = currentUser ? getPlanLimits(currentUser) : null;
  const canViewCharts = planLimits?.showAdvancedReports ?? false;
  
  // Carrega despesas OPEX da loja
  useEffect(() => {
    const loadStoreExpenses = async () => {
      if (!currentUser?.storeId) return;
      setIsLoadingOpex(true);
      try {
        const data = await storeExpenseService.getStoreExpenses(currentUser.storeId);
        setStoreExpenses(data);
      } catch (error) {
        console.error('Erro ao carregar OPEX:', error);
      } finally {
        setIsLoadingOpex(false);
      }
    };
    loadStoreExpenses();
  }, [currentUser?.storeId]);
  
  // Filter only sold vehicles
    const soldVehicles = useMemo(() => vehicles.filter(v => v.status === 'sold').sort((a, b) => {
        return toLocalDateTimestamp(b.soldDate) - toLocalDateTimestamp(a.soldDate);
    }), [vehicles]);

    const periodLabelMap: Record<string, string> = {
        last_3: 'Últimos 3 meses',
        last_6: 'Últimos 6 meses',
        last_12: 'Últimos 12 meses',
        this_month: 'Este mês',
        last_month: 'Mês anterior',
        this_quarter: 'Trimestre atual',
        this_year: 'Ano atual',
        all: 'Todo período',
        custom: 'Período customizado',
    };

    const periodOptions: Array<keyof typeof periodLabelMap> = [
        'this_month',
        'last_month',
        'this_quarter',
        'this_year',
        'last_3',
        'last_6',
        'last_12',
        'all',
        'custom',
    ];

    const getChartDateRange = (period: typeof chartPeriod) => {
        const now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth(), 1);
        let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (period === 'all') {
            const soldDates = soldVehicles
                .map((v) => parseISODate(v.soldDate))
                .filter((d): d is Date => !!d);
            if (soldDates.length) {
                const timestamps = soldDates.map((d) => d.getTime());
                start = new Date(Math.min(...timestamps));
                end = new Date(Math.max(...timestamps));
            }
        } else if (period === 'custom') {
            if (customStartDate) {
                const [y, m, d] = customStartDate.split('-').map(Number);
                start = new Date(y, m - 1, d);
            }
            if (customEndDate) {
                const [y, m, d] = customEndDate.split('-').map(Number);
                end = new Date(y, m - 1, d);
            }
        } else if (period === 'last_3' || period === 'last_6' || period === 'last_12') {
            const monthsBack = period === 'last_3' ? 2 : period === 'last_6' ? 5 : 11;
            start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        } else if (period === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period === 'this_quarter') {
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), quarterStart, 1);
            end = new Date(now.getFullYear(), quarterStart + 3, 0);
        } else if (period === 'this_year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        }

        return { start, end };
    };

    const chartBrands = useMemo(() => {
        const unique = Array.from(new Set(soldVehicles.map((v) => v.make).filter(Boolean)));
        return ['all', ...unique.sort((a, b) => a.localeCompare(b))];
    }, [soldVehicles]);

    const metricConfig: Record<
        ChartMetricKey,
        { label: string; color: string; type: 'currency' | 'percent' }
    > = {
        revenue: { label: 'Faturamento', color: 'rgb(var(--velo-orange))', type: 'currency' },
        profit: { label: 'Lucro', color: 'rgb(var(--velo-platinum))', type: 'currency' },
        ticket: { label: 'Ticket médio', color: 'rgb(var(--velo-jet))', type: 'currency' },
        roi_stock: { label: 'ROI estoque', color: 'rgb(var(--velo-black))', type: 'percent' },
        roi_business: { label: 'ROI negócio', color: 'rgb(var(--velo-orange))', type: 'percent' },
    };

    const toggleMetric = (metric: ChartMetricKey) => {
        setChartMetrics((prev) =>
            prev.includes(metric) ? prev.filter((item) => item !== metric) : [...prev, metric],
        );
    };

    const { start: chartStart, end: chartEnd } = useMemo(
        () => getChartDateRange(chartPeriod),
        [chartPeriod, customStartDate, customEndDate, soldVehicles],
    );

    const filteredSales = useMemo(() => {
        const term = searchTerm.toLowerCase();

        return soldVehicles.filter((v) => {
            const saleDate = formatDateBR(v.soldDate, '');
            const priceStr = v.soldPrice ? v.soldPrice.toString() : '';

            return (
                (v.make || '').toLowerCase().includes(term) ||
                (v.model || '').toLowerCase().includes(term) ||
                (v.version || '').toLowerCase().includes(term) ||
                v.year.toString().includes(term) ||
                (v.color || '').toLowerCase().includes(term) ||
                (v.plate || '').toLowerCase().includes(term) ||
                (v.buyer?.name || '').toLowerCase().includes(term) ||
                saleDate.includes(term) ||
                priceStr.includes(term)
            );
        });
    }, [soldVehicles, searchTerm]);

    const handleDeleteSale = async (sale: Vehicle) => {
        setIsDeletingSale(true);
        try {
            const updatedVehicle: Vehicle = {
                ...sale,
                status: 'available',
                soldPrice: undefined,
                soldDate: undefined,
                paymentMethod: undefined,
                paymentDetails: undefined,
                saleCommission: undefined,
                saleCommissionTo: undefined,
                buyer: undefined,
                buyerSnapshot: undefined,
                customerId: undefined,
                warrantyDetails: undefined,
                tradeInInfo: undefined,
            };

            await ApiService.updateVehicle(updatedVehicle);
            await refreshData();
        } finally {
            setIsDeletingSale(false);
            setConfirmDeleteSale({ open: false });
        }
    };

    const chartBaseVehicles = useMemo(() => {
        if (chartBrand === 'all') return soldVehicles;
        return soldVehicles.filter((v) => v.make === chartBrand);
    }, [soldVehicles, chartBrand]);


    const filteredChartVehicles = useMemo(() => {
        return chartBaseVehicles.filter((v) => {
            const soldAt = parseISODate(v.soldDate);
            if (!soldAt) return false;
            if (soldAt < chartStart || soldAt > chartEnd) return false;
            return true;
        });
    }, [chartBaseVehicles, chartStart, chartEnd]);

    const filteredChartExpenses = useMemo(() => {
        return storeExpenses.filter((e) => {
            const expenseDate = parseISODate(e.date);
            if (!expenseDate) return false;
            if (expenseDate < chartStart || expenseDate > chartEnd) return false;
            return true;
        });
    }, [storeExpenses, chartStart, chartEnd]);

  // --- METRICS CALCULATION (BASED ON FILTERS) ---
  const filteredRevenue = filteredChartVehicles.reduce((acc, v) => acc + (v.soldPrice || 0), 0);
  const filteredProfit = filteredChartVehicles.reduce((acc, v) => acc + calculateRealProfit(v), 0);
  const filteredInvested = filteredChartVehicles.reduce(
      (acc, v) => acc + v.purchasePrice + calculateTotalExpenses(v),
      0,
  );
  const filteredOpex = useMemo(() => {
      if (!storeExpenses.length) return 0;
      return storeExpenses.reduce((acc, e) => {
          const expenseDate = parseISODate(e.date);
          if (!expenseDate) return acc;
          if (expenseDate < chartStart || expenseDate > chartEnd) return acc;
          return acc + e.amount;
      }, 0);
  }, [storeExpenses, chartStart, chartEnd]);

  const stockRoi = filteredInvested > 0 ? (filteredProfit / filteredInvested) * 100 : 0;
  const businessProfit = filteredProfit - filteredOpex;
  const totalBusinessInvestment = filteredInvested + filteredOpex;
  const businessRoi = totalBusinessInvestment > 0 ? (businessProfit / totalBusinessInvestment) * 100 : 0;

  const averageTicket = filteredChartVehicles.length > 0 ? filteredRevenue / filteredChartVehicles.length : 0;
  const averageMargin = filteredChartVehicles.length > 0 ? filteredProfit / filteredChartVehicles.length : 0;

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

    const getDayKey = (date: Date, includeYear: boolean) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        if (!includeYear) return `${day}/${month}`;
        const year = date.getFullYear().toString().slice(2);
        return `${day}/${month}/${year}`;
    };

    const buildDayKeys = (start: Date, end: Date, includeYear: boolean) => {
        const keys: string[] = [];
        const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        while (cursor <= endDate) {
            keys.push(getDayKey(cursor, includeYear));
            cursor.setDate(cursor.getDate() + 1);
        }

        return keys;
    };

    const getMonthKey = (date: Date) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
    };

    const getPreviousRange = (start: Date, end: Date, daily: boolean) => {
        if (daily) {
            const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            const days = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
            const prevEnd = new Date(startDate);
            prevEnd.setDate(prevEnd.getDate() - 1);
            const prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - (days - 1));
            return { start: prevStart, end: prevEnd };
        }

        const months =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) +
            1;
        const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
        const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - (months - 1), 1);
        return { start: prevStart, end: prevEnd };
    };

    const buildBuckets = (
        vehicles: Vehicle[],
        keys: string[],
        dateKey: (date: Date) => string,
        expenses: StoreExpense[],
    ) => {
        const buckets: Record<
            string,
            { revenue: number; profit: number; invested: number; count: number; opex: number }
        > = {};

        keys.forEach((key) => {
            buckets[key] = { revenue: 0, profit: 0, invested: 0, count: 0, opex: 0 };
        });

        vehicles.forEach((v) => {
            const soldAt = parseISODate(v.soldDate);
            if (!soldAt) return;
            const key = dateKey(soldAt);
            const bucket = buckets[key];
            if (!bucket) return;
            bucket.revenue += v.soldPrice || 0;
            bucket.profit += calculateRealProfit(v);
            bucket.invested += v.purchasePrice + calculateTotalExpenses(v);
            bucket.count += 1;
        });

        expenses.forEach((e) => {
            const expenseDate = parseISODate(e.date);
            if (!expenseDate) return;
            const key = dateKey(expenseDate);
            const bucket = buckets[key];
            if (!bucket) return;
            bucket.opex += e.amount;
        });

        return buckets;
    };

    const getMetricValue = (
        bucket: { revenue: number; profit: number; invested: number; count: number; opex: number },
        metric: ChartMetricKey,
    ) => {
        if (metric === 'revenue') return bucket.revenue;
        if (metric === 'profit') return bucket.profit;
        if (metric === 'ticket') return bucket.count > 0 ? bucket.revenue / bucket.count : 0;
        if (metric === 'roi_stock') {
            return bucket.invested > 0 ? (bucket.profit / bucket.invested) * 100 : 0;
        }
        const businessBase = bucket.invested + bucket.opex;
        const businessProfitValue = bucket.profit - bucket.opex;
        return businessBase > 0 ? (businessProfitValue / businessBase) * 100 : 0;
    };

    const chartSeriesData = useMemo(() => {
        const useDailyKeys =
            chartPeriod === 'this_month' || chartPeriod === 'last_month' || chartPeriod === 'custom';
        const includeYear = chartPeriod === 'custom' ? true : chartStart.getFullYear() !== chartEnd.getFullYear();
        const keys = useDailyKeys
            ? buildDayKeys(chartStart, chartEnd, includeYear)
            : buildMonthKeys(chartStart, chartEnd);
        const currentDateKey = (date: Date) =>
            useDailyKeys ? getDayKey(date, includeYear) : getMonthKey(date);

        const currentBuckets = buildBuckets(filteredChartVehicles, keys, currentDateKey, filteredChartExpenses);

        const prevValues: Record<ChartMetricKey, number[]> = {
            revenue: [],
            profit: [],
            roi_stock: [],
            roi_business: [],
            ticket: [],
        };
        if (comparePrevPeriod) {
            const prevRange = getPreviousRange(chartStart, chartEnd, useDailyKeys);
            const prevIncludeYear = chartPeriod === 'custom'
                ? true
                : prevRange.start.getFullYear() !== prevRange.end.getFullYear();
            const prevKeys = useDailyKeys
                ? buildDayKeys(prevRange.start, prevRange.end, prevIncludeYear)
                : buildMonthKeys(prevRange.start, prevRange.end);
            const prevDateKey = (date: Date) =>
                useDailyKeys ? getDayKey(date, prevIncludeYear) : getMonthKey(date);
            const prevBuckets = buildBuckets(filteredChartVehicles, prevKeys, prevDateKey, filteredChartExpenses);
            chartMetrics.forEach((metric) => {
                prevValues[metric] = prevKeys.map((key) => getMetricValue(prevBuckets[key], metric));
            });
        }

        return keys.map((key, index) => {
            const entry: Record<string, number | string> = { name: key };
            chartMetrics.forEach((metric) => {
                entry[`value_${metric}`] = getMetricValue(currentBuckets[key], metric);
                if (comparePrevPeriod) {
                    entry[`prev_${metric}`] = prevValues[metric][index] ?? 0;
                }
            });
            return entry;
        });
    }, [
        chartPeriod,
        chartStart,
        chartEnd,
        chartBaseVehicles,
        chartMetrics,
        comparePrevPeriod,
        storeExpenses,
    ]);

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

      const allPercentMetrics = chartMetrics.length > 0 && chartMetrics.every((metric) => metricConfig[metric].type === 'percent');

      const yAxisTickFormatter = (value: number) => {
        if (allPercentMetrics) {
            return `${value.toFixed(0)}%`;
        }
        if (value === 0) return '0';
        if (value >= 1000 && value < 1000000) return `${(value / 1000).toFixed(0)}k`;
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        return value.toString();
    };

      const formatMetricValue = (value: number, metric: ChartMetricKey) => {
          if (metricConfig[metric].type === 'percent') {
              return `${value.toFixed(1)}%`;
          }
          return formatCurrency(value);
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
            <ConfirmModal
                isOpen={confirmDeleteSale.open}
                onClose={() => setConfirmDeleteSale({ open: false })}
                onConfirm={() => confirmDeleteSale.sale && handleDeleteSale(confirmDeleteSale.sale)}
                title="Excluir venda?"
                message="Esta acao remove a venda do historico e devolve o veiculo para o estoque."
                confirmText="Excluir venda"
                cancelText="Cancelar"
                variant="danger"
                isLoading={isDeletingSale}
            />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Inteligência Comercial</h1>
        <p className="text-slate-400 text-sm md:text-base">Métricas de performance para escalar sua operação.</p>
      </div>

      {/* Strategic KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
              label="Faturamento Total" 
              value={formatCurrency(filteredRevenue)} 
              icon={<DollarSign size={24} />} 
              subValue={`${filteredChartVehicles.length} vendas no periodo`}
              helpText="Soma das vendas no periodo e filtros selecionados, sem descontar custos."
          />
          <StatCard 
              label="Lucro Líquido (Veículos)" 
              value={formatCurrency(filteredProfit)} 
              icon={<TrendingUp size={24} />} 
              highlight={filteredProfit >= 0 ? 'positive' : 'negative'}
              trend="up"
              subValue={`${periodLabelMap[chartPeriod]}${chartBrand !== 'all' ? ` • ${chartBrand}` : ''}`}
              helpText="Lucro dos veículos no periodo filtrado: Venda - (Compra + Despesas dos Carros). Não inclui OPEX."
          />
          <StatCard 
              label="ROI do Estoque" 
              value={`${stockRoi.toFixed(1)}%`} 
              icon={<Award size={24} />} 
              highlight={stockRoi >= 0 ? 'positive' : 'negative'}
              subValue={`Investimento: ${formatCurrency(filteredInvested)}`}
              helpText="Retorno sobre investimento no estoque usando apenas as vendas do periodo filtrado."
          />
          <StatCard 
              label="ROI do Negócio" 
              value={isLoadingOpex ? '...' : `${businessRoi.toFixed(1)}%`} 
              icon={<Store size={24} />} 
              highlight={businessRoi >= 0 ? 'positive' : 'negative'}
              subValue={`OPEX: ${formatCurrency(filteredOpex)}`}
              helpText="Retorno REAL do negocio no periodo filtrado, incluindo OPEX (aluguel, luz, salarios, etc)."
          />
          <StatCard 
              label="Ticket Médio" 
              value={formatCurrency(averageTicket)} 
              icon={<BarChart3 size={24} />} 
              subValue={`Margem: ${formatCurrency(averageMargin)}`}
              helpText="Valor medio de venda por carro no periodo filtrado."
          />
      </div>

      {/* Chart Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                  <Filter size={18} className="text-indigo-400" />
                  <h3 className="text-white font-semibold">Filtros Avançados de Análise</h3>
              </div>
              <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                  {showAdvancedFilters ? 'Ocultar' : 'Expandir'}
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="text-xs text-slate-400 flex flex-col gap-1.5">
                  <span className="font-medium">Período</span>
                  <select
                      value={chartPeriod}
                      onChange={(e) => {
                          const value = e.target.value as typeof chartPeriod;
                          setChartPeriod(value);
                          if (value !== 'custom') {
                              setCustomStartDate('');
                              setCustomEndDate('');
                          }
                      }}
                      className="select-premium text-sm"
                  >
                      {periodOptions.map((value) => (
                          <option key={value} value={value}>
                              {periodLabelMap[value]}
                          </option>
                      ))}
                  </select>
              </label>

              <label className="text-xs text-slate-400 flex flex-col gap-1.5">
                  <span className="font-medium">Marca</span>
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

          {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
                  {chartPeriod === 'custom' && (
                      <>
                          <label className="text-xs text-slate-400 flex flex-col gap-1.5">
                              <span className="font-medium">Data Inicial</span>
                              <input
                                  type="date"
                                  value={customStartDate}
                                  onChange={(e) => setCustomStartDate(e.target.value)}
                                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </label>
                          <label className="text-xs text-slate-400 flex flex-col gap-1.5">
                              <span className="font-medium">Data Final</span>
                              <input
                                  type="date"
                                  value={customEndDate}
                                  onChange={(e) => setCustomEndDate(e.target.value)}
                                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </label>
                      </>
                  )}

                  <div className="md:col-span-2 lg:col-span-2">
                      <div className="flex flex-wrap gap-2">
                          {Object.entries(metricConfig).map(([value, config]) => {
                              const metric = value as ChartMetricKey;
                              const isChecked = chartMetrics.includes(metric);
                              return (
                                  <button
                                      key={value}
                                      onClick={() => toggleMetric(metric)}
                                      className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 border ${
                                          isChecked
                                              ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                              : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                                      }`}
                                  >
                                      {config.label}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-2 flex flex-wrap gap-2">
                      <button
                          onClick={() => setComparePrevPeriod((prev) => !prev)}
                          className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 border ${
                              comparePrevPeriod
                                  ? 'bg-amber-400 text-slate-900 border-amber-400'
                                  : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                          }`}
                      >
                          Comparar período anterior
                      </button>
                      <button
                          onClick={() => {
                              setChartPeriod('last_6');
                              setChartBrand('all');
                              setChartMetrics(['revenue']);
                              setComparePrevPeriod(false);
                              setCustomStartDate('');
                              setCustomEndDate('');
                          }}
                          className="px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 border bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white"
                      >
                          Limpar filtros
                      </button>
                  </div>
              </div>
          )}
      </Card>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Profit Chart */}
          <Card
              title={`Evolucao ${chartMetrics.map((metric) => metricConfig[metric].label).join(' + ')} (${periodLabelMap[chartPeriod]})`}
              className="lg:col-span-2 relative overflow-hidden min-h-[350px]"
          >
              {!canViewCharts && <LockedOverlay title="Análise Financeira Avançada" />}
              <div className={`h-64 md:h-80 w-full ${!canViewCharts ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              {chartMetrics.map((metric) => (
                                  <linearGradient key={metric} id={`colorMetric_${metric}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={metricConfig[metric].color} stopOpacity={0.3} />
                                      <stop offset="95%" stopColor={metricConfig[metric].color} stopOpacity={0} />
                                  </linearGradient>
                              ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--velo-jet))" vertical={false} opacity={0.3} />
                          <XAxis dataKey="name" stroke="rgb(var(--velo-jet))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgb(var(--velo-jet))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: 'rgb(var(--velo-black))', borderColor: 'rgb(var(--velo-jet))', borderRadius: '12px', color: 'rgb(var(--velo-platinum))' }}
                              formatter={(value, _name, item) => {
                                  const dataKey = typeof item?.dataKey === 'string' ? item.dataKey : String(item?.dataKey ?? '');
                                  const rawName = dataKey.replace('prev_', '').replace('value_', '') as ChartMetricKey;
                                  const label = metricConfig[rawName]?.label || _name;
                                  const prefix = dataKey.startsWith('prev_') ? 'Periodo anterior - ' : '';
                                  return [formatMetricValue(Number(value), rawName), `${prefix}${label}`];
                              }}
                              labelStyle={{ color: 'rgb(var(--velo-platinum))' }}
                          />
                          <Legend />
                          {chartMetrics.map((metric) => (
                              <Area
                                  key={metric}
                                  type="monotone"
                                  dataKey={`value_${metric}`}
                                  name={metricConfig[metric].label}
                                  stroke={metricConfig[metric].color}
                                  fillOpacity={0.55}
                                  fill={`url(#colorMetric_${metric})`}
                                  strokeWidth={2.5}
                              />
                          ))}
                          {comparePrevPeriod &&
                              chartMetrics.map((metric) => (
                                  <Line
                                      key={`prev_${metric}`}
                                      type="monotone"
                                      dataKey={`prev_${metric}`}
                                      name={`Periodo anterior - ${metricConfig[metric].label}`}
                                      stroke={metricConfig[metric].color}
                                      strokeOpacity={0.45}
                                      strokeDasharray="4 6"
                                      strokeWidth={2}
                                      dot={false}
                                  />
                              ))}
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
                                                ? (formatDateBR(sale.soldDate, 'Data invalida') || 'Data invalida')
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
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => onSelectVehicle(sale.id)}
                                                className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20"
                                            >
                                                <Eye size={12} />
                                                Ver Ficha
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteSale({ open: true, sale })}
                                                className="text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20"
                                            >
                                                <Trash2 size={12} />
                                                Excluir
                                            </button>
                                        </div>
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



