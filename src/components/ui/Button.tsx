
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis";
  
  // Note: indigo-xxx classes are now mapped to Velo Orange in index.html
  const variants = {
    primary: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-transparent focus:ring-indigo-500",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500 hover:border-slate-500",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 border border-transparent focus:ring-emerald-500",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 focus:ring-rose-500",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white",
    outline: "bg-transparent border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="flex-shrink-0 inline-flex">{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
};



