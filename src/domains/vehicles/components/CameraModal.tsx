import React from 'react';
import { X, Camera, Zap, ZoomIn, Loader } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onCapture: () => void;
  isUploading: boolean;
  cameraZoom: number;
  cameraZoomRange: { min: number; max: number };
  cameraHasZoom: boolean;
  cameraTorchOn: boolean;
  cameraHasTorch: boolean;
  toggleTorch: () => void;
  applyCameraZoom: (value: number) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  videoRef,
  canvasRef,
  onCapture,
  isUploading,
  cameraZoom,
  cameraZoomRange,
  cameraHasZoom,
  cameraTorchOn,
  cameraHasTorch,
  toggleTorch,
  applyCameraZoom,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black animate-fade-in md:flex md:items-center md:justify-center md:p-4 md:bg-black/95 md:backdrop-blur-sm">
      {/* iPhone-style Camera Layout */}
      <div className="md:relative md:max-w-2xl md:rounded-3xl md:overflow-hidden md:shadow-2xl w-full h-full flex flex-col">
        {/* Video Stream Container - Full screen on mobile, contained on desktop */}
        <div className="relative flex-1 md:flex-none md:aspect-[9/16] md:max-h-[90vh] w-full bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Canvas for Capture (Hidden) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors active:scale-95 md:bg-slate-900/60 md:hover:bg-slate-900/80"
            >
              <X size={24} />
            </button>

            {/* Title (Desktop only) */}
            <h3 className="hidden md:block text-white font-bold text-lg">Câmera</h3>

            {/* Placeholder for alignment */}
            <div className="w-12" />
          </div>

          {/* Side Controls - Torch/Zoom (Right side for easy thumb access) */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-3 z-10">
            {/* Torch Control - Vertical Button */}
            {cameraHasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-3 rounded-full backdrop-blur-md transition-colors active:scale-95 ${
                  cameraTorchOn
                    ? 'bg-amber-500/80 text-white hover:bg-amber-600'
                    : 'bg-black/40 text-white hover:bg-black/60 md:bg-slate-900/60 md:hover:bg-slate-900/80'
                }`}
                title={cameraTorchOn ? 'Desligar Flash' : 'Ligar Flash'}
              >
                <Zap size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Controls Bar - Always visible, slides up on mobile */}
        <div className="absolute bottom-0 left-0 right-0 md:static bg-black/40 md:bg-slate-900/80 backdrop-blur-md md:backdrop-blur-sm border-t border-slate-700/20 md:border-t-0 p-4 md:p-6 space-y-3">
          {/* Zoom Control - Horizontal slider */}
          {cameraHasZoom && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <ZoomIn size={16} />
                  <span>Zoom</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{cameraZoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={cameraZoomRange.min}
                max={cameraZoomRange.max}
                step="0.1"
                value={cameraZoom}
                onChange={(e) => applyCameraZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600/40 hover:bg-slate-600/60 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Capture Button - Large & Primary */}
          <button
            onClick={onCapture}
            disabled={isUploading}
            className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl md:rounded-xl flex items-center justify-center gap-2 font-bold hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
          >
            {isUploading ? (
              <>
                <Loader size={20} className="animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Camera size={20} />
                <span className="md:hidden">Tirar Foto</span>
                <span className="hidden md:inline">Capturar</span>
              </>
            )}
          </button>

          {/* Info Text */}
          <p className="text-center text-xs text-slate-400">
            {cameraTorchOn ? '💡 Flash ligado' : ''}
            {cameraZoom > 1 ? ` • Zoom ${cameraZoom.toFixed(1)}x` : ''}
            {!cameraTorchOn && cameraZoom <= 1 ? 'Pronto para fotografar' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
