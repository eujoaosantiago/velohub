
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
    <div className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col ${className}`}>
      {(title || action) && (
        <div className="px-4 md:px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          {title && <h3 className="text-base md:text-lg font-semibold text-slate-100 truncate pr-2">{title}</h3>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 md:p-6 flex-1 min-w-0">
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
  helpText?: string;
}> = ({ label, value, subValue, icon, trend, helpText }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-lg hover:border-slate-700 transition-colors relative group min-w-0"
      onMouseLeave={() => setShowTooltip(false)}
    >
      
      {/* Tooltip Overlay */}
      {showTooltip && (
          <div className="absolute top-0 left-0 w-full h-full z-20 bg-slate-900/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-fade-in cursor-pointer" onClick={() => setShowTooltip(false)}>
              <p className="text-sm text-slate-300">{helpText}</p>
              <span className="text-[10px] text-indigo-400 mt-2 uppercase font-bold">Toque para fechar</span>
          </div>
      )}

      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="p-2.5 md:p-3 bg-slate-800/50 rounded-xl text-indigo-400 shrink-0">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] md:text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-2 ${
            trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 
            trend === 'down' ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '-'}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 relative">
            <p className="text-xs md:text-sm text-slate-400 font-medium truncate pr-4">{label}</p>
            {helpText && (
                <div
                  className="absolute right-0 top-0.5"
                  onMouseEnter={() => setShowTooltip(true)}
                  onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
                >
                    <HelpCircle 
                        size={14} 
                        className="text-slate-600 dark:text-slate-500 cursor-pointer hover:text-indigo-400 transition-colors" 
                    />
                </div>
            )}
        </div>
        {/* Responsive Text Sizing & Truncation */}
        <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate" title={value}>
            {value}
        </h4>
        {subValue && (
            <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate" title={subValue}>
                {subValue}
            </p>
        )}
      </div>
    </div>
  );
};
