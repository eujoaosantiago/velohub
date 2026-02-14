
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Car, Users, DollarSign, LogOut, Menu, X, PlusCircle, UserCog, ShieldCheck, Settings, Sun, Moon, Wrench, MessageSquare } from 'lucide-react';
import { Page, User, checkPermission } from '@/shared/types';
import { AuthService } from '@/domains/auth/services/authService';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onAddVehicle: () => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onAddVehicle, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top when page changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Inicializar tema com base no localStorage ou sistema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDarkMode(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDarkMode(true);
    }
  };

  // Nav Items construction logic based on dynamic permissions
  const navItems = [
    { id: Page.DASHBOARD, label: 'Visão Geral', icon: <LayoutDashboard size={20} />, visible: true },
    { id: Page.VEHICLES, label: 'Estoque', icon: <Car size={20} />, visible: true },
    { id: Page.SALES, label: 'Vendas', icon: <DollarSign size={20} />, visible: user.role === 'owner' || checkPermission(user, 'view_analytics') },
    { id: Page.EXPENSES, label: 'Gestão de Gastos', icon: <Wrench size={20} />, visible: user.role === 'owner' || checkPermission(user, 'view_costs') },
    { id: Page.CUSTOMERS, label: 'Clientes', icon: <Users size={20} />, visible: checkPermission(user, 'view_customers') },
    { id: Page.TEAM, label: 'Equipe', icon: <UserCog size={20} />, visible: user.role === 'owner' },
    { id: Page.SUPPORT, label: 'Suporte', icon: <MessageSquare size={20} />, visible: true },
  ];

  const filteredNavItems = navItems.filter(item => item.visible);

  const handleLogout = () => {
      AuthService.logout();
      onLogout();
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="font-bold text-white text-lg">V</span>
          </div>
          <span className="font-bold text-lg tracking-wide text-slate-900 dark:text-white">VELO<span className="text-indigo-500">HUB</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300 p-1">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-0 z-40 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out md:translate-x-0 md:w-64 md:border-r md:border-slate-200 dark:md:border-slate-800 md:bg-white dark:md:bg-slate-900 md:h-screen md:sticky md:top-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full md:pt-0'}
      `}>
        <div className="hidden md:flex h-20 items-center px-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-white text-lg">V</span>
          </div>
          <span className="font-bold text-xl tracking-wide text-slate-900 dark:text-white">VELO<span className="text-indigo-500">HUB</span></span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600 p-4 space-y-2 md:mt-0">
          
          {currentPage !== Page.VEHICLES && (
            <button 
              onClick={() => {
                onAddVehicle();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-orange-600 text-white p-3 rounded-full font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all mb-6 flex-shrink-0"
            >
              <PlusCircle size={18} />
              <span>Novo Veículo</span>
            </button>
          )}

          <nav className="space-y-2">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  currentPage === item.id 
                    ? 'bg-slate-100 dark:bg-slate-800 text-indigo-500 border border-slate-200 dark:border-slate-700 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile & Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto space-y-3 p-4 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
           {/* Theme Toggle */}
           <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-200/50 dark:bg-slate-800/30 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
              <span className="text-sm font-medium flex items-center gap-2">
                  {isDarkMode ? <Moon size={16} /> : <Sun size={16} />} 
                  <span className="hidden sm:inline">{isDarkMode ? 'Modo Escuro' : 'Modo Claro'}</span>
              </span>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: isDarkMode ? '18px' : '2px' }}></div>
              </div>
          </button>

          <div 
              onClick={() => {
                  onNavigate(Page.PROFILE);
                  setIsMobileMenuOpen(false);
              }}
              className={`bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${currentPage === Page.PROFILE ? 'ring-1 ring-indigo-500' : ''}`}
          >
               <div className={`p-2 rounded-full shrink-0 ${user.role === 'owner' ? 'bg-indigo-500/20 text-indigo-500' : 'bg-slate-200 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400'}`}>
                  {user.role === 'owner' ? <ShieldCheck size={18} /> : <UserCog size={18} />}
               </div>
               <div className="overflow-hidden flex-1">
                  <p className="text-sm text-slate-900 dark:text-white font-medium truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role === 'owner' ? 'Proprietário' : 'Funcionário'}</p>
               </div>
               <Settings size={14} className="text-slate-500 flex-shrink-0" />
          </div>

          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors w-full">
            <LogOut size={20} className="flex-shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};



