import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isDirty?: boolean;
  onClick: () => void;
}

export interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  title?: string;
  hideLabel?: boolean; // Hide label on small screens
  className?: string;
  dropdownContent?: React.ReactNode;
}

export interface PageHeaderProps {
  title?: string;
  description?: string;
  onBack?: () => void;
  tabs?: Tab[];
  activeTab?: string;
  actions?: ActionButton[];
  children?: React.ReactNode;
  className?: string;
  stickyOnMobile?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  onBack,
  tabs = [],
  activeTab,
  actions = [],
  children,
  className = '',
  stickyOnMobile = true,
  layout = 'horizontal',
}) => {
  const stickyClass = stickyOnMobile ? 'sticky' : '';

  return (
    <div className={`${stickyClass} top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-200 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 md:px-8 py-4">
          {/* Top Row: Navigation, Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            
            {/* Left Block: Back & Title */}
            <div className="flex items-start md:items-center gap-4 min-w-0">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  icon={<ArrowLeft size={20} />}
                  className="rounded-xl w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Voltar"
                />
              )}
              
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Right Block: Actions */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                {actions.map((action) => (
                  <div key={action.id} className="relative flex-shrink-0 group">
                    <Button
                      onClick={action.onClick}
                      variant={action.variant || 'primary'}
                      size={action.size || 'md'}
                      icon={action.icon}
                      disabled={action.disabled}
                      title={action.title}
                      className={`flex-shrink-0 ${
                        action.hideLabel 
                          ? 'w-10 h-10 p-0 rounded-xl justify-center' 
                          : '!px-3 md:!px-5 !py-2 md:!py-2.5 !text-xs md:!text-sm'
                      } ${action.className || ''}`}
                    >
                      {!action.hideLabel && (
                        <span className="whitespace-nowrap">{action.label}</span>
                      )}
                    </Button>
                    {action.dropdownContent}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row: Tabs */}
          {tabs.length > 0 && (
            <div className="flex items-center gap-6 mt-6 overflow-x-auto scrollbar-hide -mb-[17px] md:-mb-[17px] border-b border-transparent">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className={`group relative pb-4 px-1 flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap outline-none ${
                    activeTab === tab.id
                      ? 'text-indigo-600 dark:text-indigo-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.icon && (
                    <span className={`transition-colors ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-500' : 'text-slate-500 dark:text-slate-500 group-hover:text-indigo-600/70 dark:group-hover:text-indigo-500/70'}`}>
                      {tab.icon}
                    </span>
                  )}
                  {tab.label}
                  
                  {tab.isDirty && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-indigo-500/50 shadow-sm" />
                  )}

                  {/* Active Indicator Line */}
                  <span className={`absolute bottom-0 left-0 w-full h-[3px] rounded-t-full transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-indigo-500' : 'bg-transparent'
                  }`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Children (additional content like alerts) */}
      {children && <div className="max-w-7xl mx-auto px-4 md:px-8 pb-4">{children}</div>}
    </div>
  );
};

export default PageHeader;
