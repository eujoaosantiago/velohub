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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-96 object-cover bg-black"
        />

        {/* Canvas for Capture (Hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay Controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          {/* Header - Close Button */}
          <div className="flex justify-between items-center pointer-events-auto">
            <h3 className="text-white font-bold text-lg">Câmera</h3>
            <button
              onClick={onClose}
              className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="space-y-3 pointer-events-auto">
            {/* Zoom Control */}
            {cameraHasZoom && (
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <ZoomIn size={16} />
                  <span>Zoom</span>
                </div>
                <input
                  type="range"
                  min={cameraZoomRange.min}
                  max={cameraZoomRange.max}
                  step="0.1"
                  value={cameraZoom}
                  onChange={(e) => applyCameraZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs text-slate-400">{cameraZoom.toFixed(1)}x</span>
              </div>
            )}

            {/* Torch Control */}
            {cameraHasTorch && (
              <button
                onClick={toggleTorch}
                className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                  cameraTorchOn
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-slate-900/80 backdrop-blur-sm text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Zap size={18} />
                <span>{cameraTorchOn ? 'Desligar Flash' : 'Ligar Flash'}</span>
              </button>
            )}

            {/* Capture Button */}
            <button
              onClick={onCapture}
              disabled={isUploading}
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Camera size={20} />
                  Tirar Foto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
