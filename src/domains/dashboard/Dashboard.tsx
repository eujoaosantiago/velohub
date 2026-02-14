import React, { useMemo, useState, useCallback } from 'react';
import { 
  StatCard, Card 
} from '@/components/ui/Card';
import { 
  DollarSign, TrendingUp, AlertCircle, Clock, PieChart as PieChartIcon, 
  Lock, Crown, MessageSquare, Send, CheckCircle2, Building2, Car, 
  ShoppingBag, BadgeCheck, Filter 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

import { Vehicle, User, checkPermission } from '@/shared/types';
import { 
  formatCurrency, calculateRealProfit, maskCurrencyInput, 
  parseCurrencyInput, parseISODate 
} from '@/shared/lib/utils';
import { getPlanLimits } from '@/shared/lib/plans';
import { Button } from '@/components/ui/Button';
import { useVelohub } from '@/shared/contexts/VelohubContext';
import { VehicleSelectorModal } from '@/components/VehicleSelectorModal';
import { QuickSaleModal } from '@/components/QuickSaleModal';
import { vehicleService } from '@/domains/vehicles/services/vehicleService';
import { supabase } from '@/services/supabaseClient';

// --- Constantes e Helpers ---

const COLORS = ['#ff6035', '#757474', '#ece8e8', '#f59e0b', '#3b82f6', '#8b5cf6'];

const PERIOD_LABEL_MAP: Record<string, string> = {
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

type PeriodType = keyof typeof PERIOD_LABEL_MAP;

const getChartDateRange = (period: PeriodType, customStart: string, customEnd: string, soldVehicles: Vehicle[]) => {
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
    if (customStart) {
      const [y, m, d] = customStart.split('-').map(Number);
      start = new Date(y, m - 1, d);
    }
    if (customEnd) {
      const [y, m, d] = customEnd.split('-').map(Number);
      end = new Date(y, m - 1, d);
    }
  } else if (['last_3', 'last_6', 'last_12'].includes(period)) {
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

// --- Componente Principal ---

interface DashboardProps {
  vehicles: Vehicle[];
  user?: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ vehicles, user }) => {
  const { refreshData } = useVelohub();
  
  // --- Permissions & User State ---
  const isOwner = user?.role === 'owner';
  const canViewCosts = checkPermission(user || null, 'view_costs');
  const canViewAnalytics = checkPermission(user || null, 'view_analytics');
  const canManageSales = checkPermission(user || null, 'manage_sales');
  const showAdvancedReports = user ? getPlanLimits(user).showAdvancedReports : true;

  // --- UI States ---
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [vehicleForSale, setVehicleForSale] = useState<Vehicle | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // --- Filter States ---
  const [chartPeriod, setChartPeriod] = useState<PeriodType>('last_6');
  const [chartBrand, setChartBrand] = useState<string>('all');
  const [chartModel, setChartModel] = useState<string>('all');
  const [chartPaymentMethod, setChartPaymentMethod] = useState<string>('all');
  const [chartMinProfit, setChartMinProfit] = useState('');
  const [chartMaxProfit, setChartMaxProfit] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- Support Form States ---
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  // --- Memoized Data: Categorization ---
  const { availableVehicles, soldVehicles } = useMemo(() => {
    return {
      availableVehicles: vehicles.filter(v => ['available', 'preparation', 'reserved'].includes(v.status)),
      soldVehicles: vehicles.filter(v => v.status === 'sold')
    };
  }, [vehicles]);

  // --- Memoized Data: KPIs ---
  const kpiData = useMemo(() => {
    const totalInventoryValue = availableVehicles.reduce((acc, v) => {
      const purchasePrice = v.purchasePrice || 0;
      const expensesTotal = (v.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
      return acc + purchasePrice + expensesTotal + (v.saleCommission || 0);
    }, 0);

    const potentialRevenue = availableVehicles.reduce((acc, v) => acc + v.expectedSalePrice, 0);
    const totalRealProfit = soldVehicles.reduce((acc, v) => acc + calculateRealProfit(v), 0);

    // Attention Vehicles (Stock > 60 days)
    const attentionVehicles = availableVehicles.filter(v => {
      const purchaseDate = parseISODate(v.purchaseDate || v.createdAt);
      if (!purchaseDate) return false;
      const daysInStock = Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
      return daysInStock > 60;
    });

    return {
      totalInventoryValue,
      potentialRevenue,
      potentialProfit: potentialRevenue - totalInventoryValue,
      totalRealProfit,
      attentionVehicles
    };
  }, [availableVehicles, soldVehicles]);

  // --- Memoized Data: Chart Filters Lists ---
  const filterOptions = useMemo(() => {
    const brands = Array.from(new Set(soldVehicles.map(v => v.make).filter(Boolean))).sort();
    
    const filteredForModels = chartBrand === 'all' ? soldVehicles : soldVehicles.filter(v => v.make === chartBrand);
    const models = Array.from(new Set(filteredForModels.map(v => v.model).filter(Boolean))).sort();
    
    const paymentMethods = Array.from(new Set(soldVehicles.map(v => v.paymentMethod).filter(Boolean))).sort();

    return { brands, models, paymentMethods };
  }, [soldVehicles, chartBrand]);

  // --- Memoized Data: Chart Calculations ---
  const { profitChartData, inventoryChartData, filteredChartVehicles } = useMemo(() => {
    const { start, end } = getChartDateRange(chartPeriod, customStartDate, customEndDate, soldVehicles);

    // 1. Filtered Vehicles for Chart
    const filtered = soldVehicles.filter((v) => {
      const soldAt = parseISODate(v.soldDate);
      if (!soldAt || soldAt < start || soldAt > end) return false;
      if (chartBrand !== 'all' && v.make !== chartBrand) return false;
      if (chartModel !== 'all' && v.model !== chartModel) return false;
      if (chartPaymentMethod !== 'all' && v.paymentMethod !== chartPaymentMethod) return false;
      
      const profit = calculateRealProfit(v);
      if (chartMinProfit && profit < parseCurrencyInput(chartMinProfit)) return false;
      if (chartMaxProfit && profit > parseCurrencyInput(chartMaxProfit)) return false;
      return true;
    });

    // 2. Profit Data Construction
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const useDaily = ['this_month', 'last_month', 'custom'].includes(chartPeriod);
    const chartDataMap: Record<string, number> = {};
    
    filtered.forEach(v => {
        const soldAt = parseISODate(v.soldDate)!;
        let key = '';
        if (useDaily) {
            const day = String(soldAt.getDate()).padStart(2, '0');
            const month = String(soldAt.getMonth() + 1).padStart(2, '0');
            key = `${day}/${month}`;
             if (chartPeriod === 'custom' && start.getFullYear() !== end.getFullYear()) {
                 key += `/${soldAt.getFullYear().toString().slice(2)}`;
             }
        } else {
            key = `${months[soldAt.getMonth()]}/${soldAt.getFullYear().toString().slice(2)}`;
        }
        chartDataMap[key] = (chartDataMap[key] || 0) + calculateRealProfit(v);
    });

    const profitData = Object.entries(chartDataMap).map(([name, profit]) => ({ name, profit }));

    // 3. Inventory Pie Data
    const brandCounts: Record<string, number> = {};
    availableVehicles.forEach(v => {
      const make = v.make || 'Outros';
      brandCounts[make] = (brandCounts[make] || 0) + 1;
    });
    const inventoryData = Object.entries(brandCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      profitChartData: profitData, 
      inventoryChartData: inventoryData, 
      filteredChartVehicles: filtered 
    };
  }, [soldVehicles, availableVehicles, chartPeriod, customStartDate, customEndDate, chartBrand, chartModel, chartPaymentMethod, chartMinProfit, chartMaxProfit]);

  // --- Handlers ---

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim() || !user?.email) return;

    setIsSendingSupport(true);
    // FIX: Cast para 'any' para evitar erro de ImportMeta
    const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    const supportSecret = (import.meta as any).env.VITE_SUPPORT_SECRET;

    try {
      if (supabase && supabaseAnonKey && supportSecret) {
        const { error, data } = await supabase.functions.invoke('send-support', {
          body: {
            name: user.name || user.email,
            email: user.email,
            subject: supportSubject,
            message: supportMessage,
            isClient: true
          },
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "x-velohub-secret": supportSecret,
          },
        });
        if (error || data?.error) throw new Error(error?.message || data?.error);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setSupportSent(true);
      setSupportSubject('');
      setSupportMessage('');
      setTimeout(() => setSupportSent(false), 5000);
    } catch (err) {
      console.error("Support Error:", err);
      alert("Erro ao enviar mensagem. Tente novamente mais tarde.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  const handleConfirmQuickSale = useCallback(async (vehicleId: string, saleData: Partial<Vehicle>, tradeInVehicle?: Vehicle) => {
    if (!vehicleForSale) return;
    try {
      await vehicleService.updateVehicle({ ...vehicleForSale, ...saleData });
      if (tradeInVehicle && user) {
        await vehicleService.createVehicle(tradeInVehicle, user);
      }
      await refreshData();
      setVehicleForSale(null);
    } catch (err) {
      alert("Erro ao registrar venda.");
    }
  }, [vehicleForSale, user, refreshData]);

  // --- Render Helpers ---

  const yAxisTickFormatter = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toFixed(2);
  };

  const profitSeriesColor = useMemo(() => {
    const total = profitChartData.reduce((acc, item) => acc + item.profit, 0);
    return total >= 0 ? '#22c55e' : '#ef4444';
  }, [profitChartData]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* --- Modals --- */}
      {showVehicleSelector && (
        <VehicleSelectorModal 
          vehicles={vehicles} 
          onClose={() => setShowVehicleSelector(false)}
          onSelect={(v) => { setShowVehicleSelector(false); setVehicleForSale(v); }}
        />
      )}
      {vehicleForSale && (
        <QuickSaleModal 
          vehicle={vehicleForSale}
          allVehicles={vehicles}
          onClose={() => setVehicleForSale(null)}
          onConfirmSale={handleConfirmQuickSale}
        />
      )}

      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Visão Geral
          </h1>
          {user?.storeName && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                {isOwner ? 'Proprietário em' : 'Colaborador em'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-300 text-xs md:text-sm font-bold shadow-sm max-w-[200px] truncate">
                <Building2 size={14} className="shrink-0" />
                <span className="truncate">{user.storeName}</span>
                {!isOwner && <BadgeCheck size={14} className="text-emerald-500 ml-1 shrink-0" />}
              </span>
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
            {isOwner ? "Resumo financeiro e operacional." : "Acompanhamento de vendas."}
          </p>
        </div>
        {canManageSales && (
          <Button 
            onClick={() => setShowVehicleSelector(true)} 
            variant="success"
            className="w-full md:w-auto justify-center" 
            icon={<DollarSign size={18} />}
          >
            Realizar Venda
          </Button>
        )}
      </div>

      {/* --- KPIs Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewCosts ? (
          <>
            <StatCard 
              label="Capital Investido"
              value={formatCurrency(kpiData.totalInventoryValue)}
              icon={<DollarSign size={24} />}
              subValue={`${availableVehicles.length} carros em estoque`}
              helpText="Soma: Compra + Despesas + Comissões em aberto."
            />
            <StatCard 
              label="Lucro Líquido (Realizado)"
              value={formatCurrency(kpiData.totalRealProfit)}
              icon={<TrendingUp size={24} />}
              highlight={kpiData.totalRealProfit >= 0 ? 'positive' : 'negative'}
              subValue={`${soldVehicles.length} vendas`}
              helpText="Lucro consolidado de vendas finalizadas."
            />
            <StatCard 
              label="Lucro Projetado (Estoque)"
              value={formatCurrency(kpiData.potentialProfit)}
              icon={<TrendingUp size={24} />}
              highlight={kpiData.potentialProfit >= 0 ? 'positive' : 'negative'}
              subValue="Previsão se vender tudo hoje"
            />
          </>
        ) : (
          <>
            <StatCard 
              label="Veículos em Estoque"
              value={availableVehicles.length.toString()}
              icon={<Car size={24} />}
              subValue="Disponíveis para venda"
            />
            <StatCard 
              label="Vendas Realizadas"
              value={soldVehicles.length.toString()}
              icon={<ShoppingBag size={24} />}
              subValue="Total acumulado"
            />
            <StatCard 
              label="Valor em Estoque"
              value={formatCurrency(kpiData.potentialRevenue)} 
              icon={<DollarSign size={24} />}
              subValue="Preço de venda somado"
            />
          </>
        )}
        <StatCard 
          label="Pontos de Atenção"
          value={kpiData.attentionVehicles.length.toString()}
          icon={<AlertCircle size={24} />}
          trend={kpiData.attentionVehicles.length > 0 ? "down" : "neutral"}
          subValue="Estoque > 60 dias"
          helpText="Veículos com giro lento."
        />
      </div>

      {/* --- Advanced Filters --- */}
      {canViewAnalytics && (
        <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-indigo-500" />
              <h3 className="text-slate-900 dark:text-white font-semibold">Filtros de Análise</h3>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showAdvancedFilters ? 'Ocultar' : 'Expandir'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterSelect 
              label="Período" 
              value={chartPeriod} 
              // FIX: Adicionada tipagem explicita (v: string)
              onChange={(v: string) => {
                setChartPeriod(v as PeriodType);
                if (v !== 'custom') { setCustomStartDate(''); setCustomEndDate(''); }
              }} 
              options={Object.entries(PERIOD_LABEL_MAP).map(([k, v]) => ({ value: k, label: v }))}
            />
            <FilterSelect 
              label="Marca" 
              value={chartBrand} 
              // FIX: Adicionada tipagem explicita (v: string)
              onChange={(v: string) => { setChartBrand(v); setChartModel('all'); }} 
              options={[{ value: 'all', label: 'Todas' }, ...filterOptions.brands.map(b => ({ value: b, label: b }))]}
            />
            <FilterSelect 
              label="Modelo" 
              value={chartModel} 
              // FIX: Adicionada tipagem explicita (v: string)
              onChange={(v: string) => setChartModel(v)} 
              disabled={chartBrand === 'all'}
              options={[{ value: 'all', label: 'Todos' }, ...filterOptions.models.map(m => ({ value: m, label: m }))]}
            />
            <FilterSelect 
              label="Pagamento" 
              value={chartPaymentMethod} 
              // FIX: Adicionada tipagem explicita (v: string)
              onChange={(v: string) => setChartPaymentMethod(v)} 
              options={[{ value: 'all', label: 'Todos' }, ...filterOptions.paymentMethods.map(p => ({ value: p, label: p }))]}
            />
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              {chartPeriod === 'custom' && (
                <>
                  <DateInput label="Início" value={customStartDate} onChange={setCustomStartDate} />
                  <DateInput label="Fim" value={customEndDate} onChange={setCustomEndDate} />
                </>
              )}
              <CurrencyInput label="Lucro Mín." value={chartMinProfit} onChange={setChartMinProfit} />
              <CurrencyInput label="Lucro Máx." value={chartMaxProfit} onChange={setChartMaxProfit} />
              
              <div className="flex items-center justify-end md:col-span-2 lg:col-span-4 mt-2">
                <Button
                  onClick={() => {
                    setChartPeriod('last_6'); setChartBrand('all'); setChartModel('all');
                    setChartPaymentMethod('all'); setChartMinProfit(''); setChartMaxProfit('');
                    setCustomStartDate(''); setCustomEndDate('');
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}

          {canViewCosts && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                <span className="font-bold text-white">{filteredChartVehicles.length}</span> vendas no período.
              </span>
              {filteredChartVehicles.length > 0 && (
                <span className="text-emerald-400 font-medium">
                  Lucro Total: {formatCurrency(filteredChartVehicles.reduce((acc, v) => acc + calculateRealProfit(v), 0))}
                </span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* --- Charts Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Chart */}
        {canViewAnalytics && (
          <Card title={`Evolução do Lucro (${PERIOD_LABEL_MAP[chartPeriod]})`} className="lg:col-span-2 relative overflow-hidden min-h-[350px]">
            {!showAdvancedReports && (
               <UpgradeOverlay />
            )}
            
            {filteredChartVehicles.length > 0 ? (
              <div className="h-64 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={profitSeriesColor} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={profitSeriesColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={yAxisTickFormatter} width={35} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), "Lucro"]}
                    />
                    <Area type="monotone" dataKey="profit" stroke={profitSeriesColor} strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} message="Sem dados para o período selecionado." />
            )}
          </Card>
        )}

        {/* Inventory Pie Chart */}
        <Card title="Estoque por Marca" className={!canViewAnalytics ? 'lg:col-span-3' : ''}>
          {availableVehicles.length > 0 ? (
            <>
              <div className="h-64 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryChartData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inventoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs md:text-sm text-slate-400 mt-2">
                {inventoryChartData.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
             <EmptyState icon={PieChartIcon} message="Cadastre veículos para ver a composição." />
          )}
        </Card>
      </div>

      {/* --- Bottom Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Precisa de Atenção" className="lg:col-span-2 border-l-4 border-l-amber-500">
          <div className="w-full">
             <div className={`hidden md:grid ${canViewCosts ? 'md:grid-cols-4' : 'md:grid-cols-3'} border-b border-slate-800 text-slate-400 text-sm pb-3 px-2`}>
                <div className="font-medium">Veículo</div>
                <div className="font-medium">Dias em Estoque</div>
                {canViewCosts && <div className="font-medium">Valor Investido</div>}
                <div className="font-medium text-right">Sugestão</div>
             </div>
             <div className="divide-y divide-slate-800">
               {kpiData.attentionVehicles.length > 0 ? kpiData.attentionVehicles.map(vehicle => {
                  const purchaseDate = parseISODate(vehicle.purchaseDate || vehicle.createdAt);
                  const daysInStock = purchaseDate ? Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24)) : 0;
                  
                  return (
                    <div key={vehicle.id} className={`py-4 px-2 flex flex-col md:grid ${canViewCosts ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 md:gap-0 md:items-center text-sm`}>
                      <div className="md:col-span-1">
                        <span className="font-medium text-white block">{vehicle.make} {vehicle.model}</span>
                        <span className="text-xs text-slate-500">{vehicle.plate}</span>
                      </div>
                      <div className="md:col-span-1 flex items-center gap-2 text-slate-300">
                        <Clock size={14} className="text-amber-500 shrink-0" />
                        <span>{daysInStock} dias</span>
                      </div>
                      {canViewCosts && (
                        <div className="md:col-span-1 text-slate-300">
                          <span className="md:hidden text-slate-500 mr-2">Investido:</span>
                          {formatCurrency(vehicle.purchasePrice)}
                        </div>
                      )}
                      <div className="md:col-span-1 md:text-right">
                        <span className="inline-block text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20 whitespace-nowrap">
                          Baixar preço 5%
                        </span>
                      </div>
                    </div>
                  );
               }) : (
                 <div className="py-8 text-center text-slate-500">Nenhum veículo parado há mais de 60 dias.</div>
               )}
             </div>
          </div>
        </Card>

        {/* Support Form */}
        <Card title="Fale com o Suporte">
          {supportSent ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Mensagem Enviada!</h3>
              <Button variant="ghost" className="mt-6" onClick={() => setSupportSent(false)}>Nova Mensagem</Button>
            </div>
          ) : (
            <form onSubmit={handleSendSupport} className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Assunto</label>
                  <select 
                      value={supportSubject} 
                      onChange={(e) => setSupportSubject(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm"
                  >
                      <option value="">Selecione...</option>
                      <option value="duvida">Dúvida sobre o sistema</option>
                      <option value="financeiro">Financeiro / Assinatura</option>
                      <option value="bug">Relatar Problema</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mensagem</label>
                  <textarea 
                      value={supportMessage} 
                      onChange={(e) => setSupportMessage(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm h-32 resize-none"
                      placeholder="Como podemos ajudar?"
                      required
                  />
               </div>
               <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSendingSupport || !supportSubject} 
                  icon={isSendingSupport ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Send size={16} />}
               >
                 {isSendingSupport ? 'Enviando...' : 'Enviar Mensagem'}
               </Button>
               <p className="text-xs text-center text-slate-600 mt-2 flex items-center justify-center gap-1">
                 <MessageSquare size={12} /> Resposta em até 24h
               </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

// --- Sub-components for Cleaner JSX ---

const FilterSelect = ({ label, value, onChange, options, disabled = false }: any) => (
  <label className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5">
    <span className="font-medium">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </label>
);

const DateInput = ({ label, value, onChange }: any) => (
  <label className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5">
    <span className="font-medium">{label}</span>
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
  </label>
);

const CurrencyInput = ({ label, value, onChange }: any) => (
  <label className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5">
    <span className="font-medium">{label}</span>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(maskCurrencyInput(e.target.value))} 
      placeholder="R$ 0,00"
      className="bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" 
    />
  </label>
);

const UpgradeOverlay = () => (
  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 border border-indigo-500/30 rounded-2xl">
    <div className="bg-indigo-500/20 p-4 rounded-full mb-3">
      <Lock size={32} className="text-indigo-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">Relatório Exclusivo Pro</h3>
    <button className="bg-gradient-to-r from-indigo-500 to-orange-500 text-white font-bold py-2 px-6 rounded-full shadow-lg flex items-center gap-2">
      <Crown size={16} /> Fazer Upgrade Agora
    </button>
  </div>
);

const EmptyState = ({ icon: Icon, message }: any) => (
  <div className="h-64 md:h-72 w-full flex flex-col items-center justify-center text-slate-500">
    <Icon size={48} className="mb-2 opacity-20" />
    <p>{message}</p>
  </div>
);