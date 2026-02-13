
import React from 'react';
import { X, Link as LinkIcon, Facebook, Twitter, Linkedin, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';

interface ShareModalProps {
  vehicleId: string;
  vehicleModel: string;
  onClose: () => void;
  photoUrl?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ vehicleId, vehicleModel, onClose, photoUrl }) => {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${window.location.origin}?vid=${vehicleId}`;
  const shareText = `Confira este ${vehicleModel} incrível que temos em estoque!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageIcon />, // Custom Icon below
      color: 'bg-[#25D366] hover:bg-[#20bd5a]',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook size={20} fill="currentColor" />,
      color: 'bg-[#1877F2] hover:bg-[#166fe5]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X (Twitter)',
      icon: <Twitter size={20} fill="currentColor" />,
      color: 'bg-black hover:bg-slate-900 border border-slate-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={20} fill="currentColor" />,
      color: 'bg-[#0A66C2] hover:bg-[#0958a8]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <h3 className="text-lg font-bold text-white">Compartilhar Veículo</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            {photoUrl && (
                <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                    <img src={photoUrl} alt={vehicleModel} className="w-full h-full object-cover" />
                </div>
            )}
            
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
                <p className="text-sm text-slate-300 mb-1 font-medium">{vehicleModel}</p>
                <p className="text-xs text-slate-500">Escolha onde deseja postar</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((social) => (
                    <a 
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${social.color} text-white p-3 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-transform active:scale-95`}
                    >
                        {social.icon}
                        {social.name}
                    </a>
                ))}
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500 font-bold">Ou copie o link</span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-slate-400 text-center">
                    Ideal para <strong>Instagram Stories, Bio e TikTok</strong>
                </p>
                <div className="flex gap-2">
                    <input 
                        readOnly 
                        value={shareUrl} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none"
                    />
                    <Button onClick={handleCopy} className={`min-w-[100px] ${copied ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
                        {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
);



