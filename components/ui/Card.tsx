
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  helpText?: string; // Novo prop para explicação
}> = ({ label, value, subValue, icon, trend, helpText }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-colors relative group">
      
      {/* Tooltip Overlay */}
      {showTooltip && (
          <div className="absolute top-0 left-0 w-full h-full z-20 bg-slate-900/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-fade-in" onClick={() => setShowTooltip(false)}>
              <p className="text-sm text-slate-300">{helpText}</p>
              <span className="text-[10px] text-indigo-400 mt-2 uppercase font-bold">Toque para fechar</span>
          </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-800/50 rounded-xl text-indigo-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 
            trend === 'down' ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '-'}
          </span>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1 relative">
            <p className="text-sm text-slate-400 font-medium">{label}</p>
            {helpText && (
                <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
                >
                    <HelpCircle 
                        size={14} 
                        className="text-slate-900 dark:text-white cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
                    />
                </div>
            )}
        </div>
        <h4 className="text-2xl font-bold text-white tracking-tight">{value}</h4>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );
};
