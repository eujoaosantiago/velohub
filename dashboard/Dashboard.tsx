
import React, { useMemo, useState } from 'react';
import { StatCard, Card } from '../components/ui/Card';
import { DollarSign, TrendingUp, AlertCircle, Clock, PieChart as PieChartIcon, Lock, Crown, MessageSquare, Send, CheckCircle2, Building2, Car, ShoppingBag, Plus, BadgeCheck, Filter } from 'lucide-react';
import { Vehicle, User, checkPermission, Page } from '../types';
import { formatCurrency, calculateRealProfit } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { getPlanLimits } from '../lib/plans';
import { Button } from '../components/ui/Button';
import { useVelohub } from '../contexts/VelohubContext';
import { VehicleSelectorModal } from '../components/VehicleSelectorModal';
import { QuickSaleModal } from '../components/QuickSaleModal';
import { ApiService } from '../services/api';
import { supabase } from '../lib/supabaseClient';

interface DashboardProps {
  vehicles: Vehicle[];
  user?: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ vehicles, user }) => {
  const { navigateTo, refreshData } = useVelohub();
  
  // States for Quick Sale Flow
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [vehicleForSale, setVehicleForSale] = useState<Vehicle | null>(null);
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

  // --- REAL TIME CALCULATIONS ---
  
  const availableVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'preparation' || v.status === 'reserved');
  const soldVehicles = vehicles.filter(v => v.status === 'sold');
  
  // 1. KPI Cards
  const totalInventoryValue = availableVehicles.reduce((acc, v) => acc + v.purchasePrice, 0);
  const potentialRevenue = availableVehicles.reduce((acc, v) => acc + v.expectedSalePrice, 0);
  const potentialProfit = potentialRevenue - totalInventoryValue;
  
  const totalRealProfit = soldVehicles.reduce((acc, v) => acc + calculateRealProfit(v), 0);

  // Attention Logic: Cars in stock > 60 days
  const attentionVehicles = availableVehicles.filter(v => {
    const daysInStock = Math.floor((new Date().getTime() - new Date(v.purchaseDate).getTime()) / (1000 * 3600 * 24));
    return daysInStock > 60;
  });

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
            if (!v.soldDate) return false;
            try {
                // Parse correto da data ISO para evitar problemas de timezone
                if (v.soldDate.includes('-')) {
                    const [year, month, day] = v.soldDate.split('-').map(Number);
                    if (year && month && day) {
                        const soldAt = new Date(year, month - 1, day);
                        if (soldAt < chartStart || soldAt > chartEnd) return false;
                        if (chartBrand !== 'all' && v.make !== chartBrand) return false;
                        return true;
                    }
                }
                return false;
            } catch {
                return false;
            }
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

    // 2. Dynamic Profit Chart Data (By Month)
    const profitChartData = useMemo(() => {
        const data: Record<string, number> = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        buildMonthKeys(chartStart, chartEnd).forEach((key) => {
            data[key] = 0;
        });

        filteredChartVehicles.forEach((v) => {
            if (v.soldDate) {
                try {
                    // Parse correto da data ISO para evitar problemas de timezone
                    if (v.soldDate.includes('-')) {
                        const [year, month, day] = v.soldDate.split('-').map(Number);
                        if (year && month && day) {
                            const date = new Date(year, month - 1, day);
                            const monthName = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
                            if (data.hasOwnProperty(monthName)) {
                                data[monthName] += calculateRealProfit(v);
                            }
                        }
                    }
                } catch {
                    // Ignora datas inválidas
                }
            }
        });

        return Object.entries(data).map(([name, profit]) => ({ name, profit }));
    }, [filteredChartVehicles, chartStart, chartEnd]);

  // 3. Dynamic Inventory Composition (By Make/Marca)
  const inventoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    availableVehicles.forEach(v => {
        const make = v.make || 'Outros';
        counts[make] = (counts[make] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); 
  }, [availableVehicles]);

  // Velo Palette for Charts
  const COLORS = ['#ff6035', '#757474', '#ece8e8', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const showAdvancedReports = user ? getPlanLimits(user).showAdvancedReports : true;

  // Support Form State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  const handleSendSupport = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supportMessage.trim()) return;

      setIsSendingSupport(true);
      
      try {
          if (supabase) {
              const { error } = await supabase.functions.invoke('send-support', {
                  body: {
                      name: user?.name || 'Usuário',
                      email: user?.email || '',
                      subject: supportSubject,
                      message: supportMessage,
                      isClient: true
                  }
              });
              if (error) {
                  console.error("Function Error:", error);
                  throw new Error("Falha ao contactar servidor.");
              }
          } else {
              // Local mode fallback simulation
              await new Promise(resolve => setTimeout(resolve, 1500));
          }

          setSupportSent(true);
          setSupportSubject('');
          setSupportMessage('');
          
          setTimeout(() => setSupportSent(false), 5000);
      } catch (err) {
          console.error("Erro ao enviar suporte:", err);
          alert("Não foi possível enviar sua mensagem agora. Por favor, tente novamente ou envie um email para suporte@velohub.com");
      } finally {
          setIsSendingSupport(false);
      }
  };

  const handleConfirmQuickSale = async (vehicleId: string, saleData: Partial<Vehicle>, tradeInVehicle?: Vehicle) => {
      if (!vehicleForSale) return;
      
      const updatedVehicle = { ...vehicleForSale, ...saleData };
      
      try {
          await ApiService.updateVehicle(updatedVehicle);
          
          if (tradeInVehicle && user) {
              await ApiService.createVehicle(tradeInVehicle, user);
          }
          
          await refreshData();
          setVehicleForSale(null); // Fecha o modal após o sucesso (ou mostra contrato dentro dele)
      } catch (err) {
          alert("Erro ao registrar venda.");
      }
  };

  const isOwner = user?.role === 'owner';
  const canViewCosts = checkPermission(user || null, 'view_costs');
  const canViewAnalytics = checkPermission(user || null, 'view_analytics');
  const canManageSales = checkPermission(user || null, 'manage_sales');

  // Custom Tick Formatter to handle small and large numbers gracefully
  const yAxisTickFormatter = (value: number) => {
      if (value === 0) return '0';
      if (value < 1000) return value.toFixed(2); // Small values like 0.01
      if (value >= 1000 && value < 1000000) return `${(value / 1000).toFixed(0)}k`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      return value.toString();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      
      {/* --- MODALS DE FLUXO DE VENDA --- */}
      {showVehicleSelector && (
          <VehicleSelectorModal 
              vehicles={vehicles} 
              onClose={() => setShowVehicleSelector(false)}
              onSelect={(vehicle) => {
                  setShowVehicleSelector(false);
                  setVehicleForSale(vehicle);
              }}
          />
      )}

      {vehicleForSale && (
          <QuickSaleModal 
              vehicle={vehicleForSale}
              allVehicles={vehicles} // Passando lista completa para busca de cliente
              onClose={() => setVehicleForSale(null)}
              onConfirmSale={handleConfirmQuickSale}
          />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                Visão Geral
            </h1>
            
            {/* Store Name Badge - Enhanced for Employees */}
            {user?.storeName && (
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs md:text-sm font-medium text-slate-400">
                        {isOwner ? 'Proprietário em' : 'Colaborador em'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 text-xs md:text-sm font-bold shadow-sm max-w-[200px] truncate">
                        <Building2 size={14} className="shrink-0" />
                        <span className="truncate">{user.storeName}</span>
                        {!isOwner && <BadgeCheck size={14} className="text-emerald-500 ml-1 shrink-0" />}
                    </span>
                </div>
            )}
            
            <p className="text-slate-400 mt-2 text-sm md:text-base">
                {isOwner ? "Resumo financeiro e operacional." : "Acompanhamento de vendas."}
            </p>
        </div>

        {/* Quick Action Button for Sales */}
        {canManageSales && (
            <Button 
                onClick={() => setShowVehicleSelector(true)} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 border-transparent focus:ring-emerald-500 w-full md:w-auto justify-center" 
                icon={<DollarSign size={18} />}
            >
                Realizar Venda
            </Button>
        )}
      </div>

      {/* KPI Cards - Grid adaptativo: 1 (mobile) -> 2 (tablet) -> 4 (desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewCosts ? (
            <StatCard 
                label="Capital Investido"
                value={formatCurrency(totalInventoryValue)}
                icon={<DollarSign size={24} />}
                subValue={`${availableVehicles.length} carros em estoque`}
            />
        ) : (
            <StatCard 
                label="Veículos em Estoque"
                value={availableVehicles.length.toString()}
                icon={<Car size={24} />}
                subValue="Disponíveis para venda"
            />
        )}

        {canViewCosts ? (
            <StatCard 
                label="Lucro Líquido (Total)"
                value={formatCurrency(totalRealProfit)}
                icon={<TrendingUp size={24} />}
                trend="up"
                subValue={`${soldVehicles.length} vendas realizadas`}
            />
        ) : (
            <StatCard 
                label="Vendas Realizadas"
                value={soldVehicles.length.toString()}
                icon={<ShoppingBag size={24} />}
                trend="up"
                subValue="Total acumulado"
            />
        )}

        {canViewCosts ? (
            <StatCard 
                label="Lucro Projetado (Estoque)"
                value={formatCurrency(potentialProfit)}
                icon={<TrendingUp size={24} />}
                subValue="Se vender estoque atual"
            />
        ) : (
            <StatCard 
                label="Valor em Estoque"
                value={formatCurrency(potentialRevenue)} 
                icon={<DollarSign size={24} />}
                subValue="Preço de venda somado"
            />
        )}

        <StatCard 
          label="Pontos de Atenção"
          value={attentionVehicles.length.toString()}
          icon={<AlertCircle size={24} />}
          trend={attentionVehicles.length > 0 ? "down" : "neutral"}
          subValue="Carros parados > 60 dias"
        />
      </div>

            {/* Chart Filters */}
            {canViewAnalytics && (
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
                                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            )}

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Financeiro: Só aparece se tiver permissão 'view_analytics' */}
        {canViewAnalytics && (
                        <Card title={`Evolução do Lucro (${periodLabelMap[chartPeriod]})`} className="lg:col-span-2 relative overflow-hidden min-h-[350px]">
                {!showAdvancedReports && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 border border-indigo-500/30 rounded-2xl">
                        <div className="bg-indigo-500/20 p-4 rounded-full mb-3">
                            <Lock size={32} className="text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Relatório Exclusivo Pro</h3>
                        <p className="text-slate-400 max-w-sm mb-4">
                            Faça upgrade do seu plano para visualizar a evolução do seu lucro e métricas avançadas de ROI.
                        </p>
                        <button className="bg-gradient-to-r from-indigo-500 to-orange-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-indigo-500/40 transition-all flex items-center gap-2">
                            <Crown size={16} /> Fazer Upgrade Agora
                        </button>
                    </div>
                )}
                
                {filteredChartVehicles.length > 0 ? (
                    <div className="h-64 md:h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={profitChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff6035" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ff6035" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                                stroke="#64748b" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={yAxisTickFormatter}
                                width={35}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [formatCurrency(value), "Lucro"]}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="profit" 
                                stroke="#ff6035" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorProfit)" 
                            />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 md:h-72 w-full flex flex-col items-center justify-center text-slate-500">
                        <TrendingUp size={48} className="mb-2 opacity-20" />
                        <p>Realize sua primeira venda para ver o gráfico.</p>
                    </div>
                )}
            </Card>
        )}

        <Card title="Estoque por Marca" className={!canViewAnalytics ? 'lg:col-span-3' : ''}>
            {availableVehicles.length > 0 ? (
                <>
                <div className="h-64 md:h-72 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={inventoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        {d.name} ({d.value})
                    </div>
                    ))}
                </div>
                </>
            ) : (
                <div className="h-64 md:h-72 w-full flex flex-col items-center justify-center text-slate-500">
                    <PieChartIcon size={48} className="mb-2 opacity-20" />
                    <p>Cadastre veículos para ver a composição.</p>
                </div>
            )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Precisa de Atenção" className="lg:col-span-2 border-l-4 border-l-amber-500">
            {/* Scroll lateral em mobile para tabelas */}
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full text-left min-w-[500px]">
                    <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                        <th className="pb-3 font-medium pl-2">Veículo</th>
                        <th className="pb-3 font-medium">Dias em Estoque</th>
                        {canViewCosts && <th className="pb-3 font-medium">Valor Investido</th>}
                        <th className="pb-3 font-medium text-right pr-2">Sugestão</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {attentionVehicles.length > 0 ? attentionVehicles.map(vehicle => {
                        const daysInStock = Math.floor((new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 3600 * 24));
                        return (
                        <tr key={vehicle.id} className="text-sm">
                            <td className="py-4 font-medium text-white pl-2">
                                {vehicle.make} {vehicle.model}
                                <span className="block text-xs text-slate-500">{vehicle.plate}</span>
                            </td>
                            <td className="py-4 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-amber-500" />
                                    {daysInStock} dias
                                </div>
                            </td>
                            {canViewCosts && <td className="py-4 text-slate-300">{formatCurrency(vehicle.purchasePrice)}</td>}
                            <td className="py-4 text-right pr-2">
                            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20 whitespace-nowrap">
                                Baixar preço 5%
                            </span>
                            </td>
                        </tr>
                        );
                    }) : (
                        <tr>
                        <td colSpan={canViewCosts ? 4 : 3} className="py-8 text-center text-slate-500">
                            Nenhum veículo com alerta de tempo de estoque (60+ dias).
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
          </Card>

          <Card title="Fale com o Suporte">
              {supportSent ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4">
                          <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">Mensagem Enviada!</h3>
                      <p className="text-slate-400 text-sm">Nossa equipe responderá em breve no seu email cadastrado.</p>
                      <Button variant="ghost" className="mt-6" onClick={() => setSupportSent(false)}>Nova Mensagem</Button>
                  </div>
              ) : (
                <form onSubmit={handleSendSupport} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Assunto</label>
                        <select 
                            value={supportSubject}
                            onChange={(e) => setSupportSubject(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:ring-indigo-500"
                        >
                            <option value="">Selecione um tópico...</option>
                            <option value="duvida">Dúvida sobre o sistema</option>
                            <option value="financeiro">Financeiro / Assinatura</option>
                            <option value="bug">Relatar um problema</option>
                            <option value="sugestao">Sugestão de melhoria</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Mensagem</label>
                        <textarea 
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:ring-indigo-500 h-32 resize-none"
                            placeholder="Como podemos te ajudar hoje?"
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
                        <MessageSquare size={12} /> Resposta em até 24h úteis
                    </p>
                </form>
              )}
          </Card>
      </div>
    </div>
  );
};
