import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <Trash2 size={24} />,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-500',
      buttonClass: 'bg-rose-500 hover:bg-rose-600 text-white'
    },
    warning: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      buttonClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
    },
    info: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
      buttonClass: 'bg-indigo-500 hover:bg-indigo-600 text-white'
    }
  };

  const style = variantStyles[variant];
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede propagação de evento que poderia reabrir modais se houver sobreposição
    
    // Evita múltiplos cliques
    if (isLoading || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Suporta onConfirm síncrono ou assíncrono (Promise)
      await Promise.resolve(onConfirm());
    } catch (error) {
      console.error("Erro na confirmacao:", error);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative animate-pop-in" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors z-10"
          disabled={isLoading || isProcessing}
        >
          <X size={18} />
        </button>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`${style.iconBg} ${style.iconColor} p-3 rounded-full shrink-0`}>
              {style.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1"
              disabled={isLoading || isProcessing}
            >
              {cancelText}
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm} 
              className={`flex-1 ${style.buttonClass}`}
              disabled={isLoading || isProcessing}
            >
              {(isLoading || isProcessing) ? 'Processando...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};



