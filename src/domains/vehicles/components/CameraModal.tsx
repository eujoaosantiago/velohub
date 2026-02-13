import React, { useState, useEffect } from 'react';
import { X, Camera, Zap, ZoomIn, Loader, RotateCcw } from 'lucide-react';

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
  videoTrackRef?: React.RefObject<MediaStreamTrack | null>;
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
  videoTrackRef,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [frozenImageDataUrl, setFrozenImageDataUrl] = useState<string | null>(null);

  // Turn off torch and cleanup when modal closes
  useEffect(() => {
    return () => {
      // Turn off torch if it's on when component unmounts
      if (cameraTorchOn) {
        // Call toggleTorch to turn it off
        setTimeout(() => {
          try {
            if (videoTrackRef?.current) {
              const constraints = { advanced: [{ torch: false } as any] } as MediaTrackConstraints;
              videoTrackRef.current.applyConstraints(constraints);
            }
          } catch (err) {
            console.error('Error turning off torch:', err);
          }
        }, 100);
      }
    };
  }, [cameraTorchOn, videoTrackRef]);

  // Close modal when upload completes
  useEffect(() => {
    if (isPreview && !isUploading && isUploading !== undefined) {
      // Upload just completed
      const timer = setTimeout(() => {
        onClose();
        setIsPreview(false);
        setFrozenImageDataUrl(null);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isPreview, isUploading, onClose]);

  const handleCapture = async () => {
    // Capture current frame to frozen image
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth || 1280;
        canvasRef.current.height = videoRef.current.videoHeight || 720;
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Get data URL for preview
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setFrozenImageDataUrl(dataUrl);
      }
    }

    // Go to preview state (not uploading yet)
    setIsPreview(true);
  };

  const handleRetake = () => {
    setIsPreview(false);
    setFrozenImageDataUrl(null);
  };

  const handleConfirmCapture = () => {
    // Now actually trigger the upload
    onCapture();
  };

  const handleClose = () => {
    // Turn off torch if active
    if (cameraTorchOn && videoTrackRef?.current) {
      try {
        const constraints = { advanced: [{ torch: false } as any] } as MediaTrackConstraints;
        videoTrackRef.current.applyConstraints(constraints);
      } catch (err) {
        console.error('Error turning off torch:', err);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black animate-fade-in md:flex md:items-center md:justify-center md:p-4 md:bg-black/95 md:backdrop-blur-sm">
      {/* iPhone-style Camera Layout */}
      <div className="md:relative md:max-w-2xl md:rounded-3xl md:overflow-hidden md:shadow-2xl w-full h-full flex flex-col">
        {/* Video Stream Container - Full screen on mobile, contained on desktop */}
        <div className="relative flex-1 md:flex-none md:aspect-[9/16] md:max-h-[90vh] w-full bg-black overflow-hidden">
          {/* Video Stream - Hidden when in preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isPreview ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* Preview Image - Shows when photo is ready for approval */}
          {isPreview && frozenImageDataUrl && (
            <img
              src={frozenImageDataUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}

          {/* Canvas for Capture (Hidden) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10">
            {/* Close Button */}
            <button
              onClick={handleClose}
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
            {cameraHasTorch && !isPreview && !isUploading && (
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
          {/* Zoom Control - Horizontal slider (only when not in preview) */}
          {cameraHasZoom && !isPreview && !isUploading && (
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

          {/* ===== PREVIEW STATE CONTROLS ===== */}
          {isPreview && !isUploading && (
            <>
              {/* Preview Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                {/* Retake Button */}
                <button
                  onClick={handleRetake}
                  className="flex-1 p-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-medium transition-all active:scale-95 md:flex-none md:px-6"
                  title="Tirar outra foto"
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw size={18} />
                    <span className="md:hidden">Refazer</span>
                    <span className="hidden md:inline">Tirar outra</span>
                  </span>
                </button>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmCapture}
                  className="flex-1 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium transition-all active:scale-95 md:flex-none md:px-6"
                  title="Confirmar foto"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Camera size={18} />
                    <span className="md:hidden">Usar Foto</span>
                    <span className="hidden md:inline">Confirmar</span>
                  </span>
                </button>
              </div>

              {/* Preview Info */}
              <p className="text-center text-sm text-slate-300 font-medium">
                Aprove a foto ou tire outra
              </p>
            </>
          )}

          {/* ===== UPLOADING STATE CONTROLS ===== */}
          {isUploading && (
            <>
              <div className="flex items-center justify-center">
                <button
                  disabled
                  className="relative transition-all opacity-50 cursor-not-allowed"
                >
                  {/* Outer circle with glow */}
                  <div className="w-16 h-16 rounded-full border-4 border-white/20">
                    {/* Inner capture circle */}
                    <div className="absolute inset-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500">
                      {/* Loading spinner */}
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader size={24} className="text-white animate-spin" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Uploading Info */}
              <p className="text-center text-sm text-slate-300 font-medium flex items-center justify-center gap-1">
                <Loader size={14} className="animate-spin" />
                Enviando foto...
              </p>
            </>
          )}

          {/* ===== CAMERA READY STATE CONTROLS ===== */}
          {!isPreview && !isUploading && (
            <>
              {/* Capture Button - Circular Apple-style */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleCapture}
                  className="relative transition-all active:scale-95"
                  title="Tirar foto"
                >
                  {/* Outer circle with glow */}
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 hover:border-white/40 transition-colors relative">
                    {/* Inner capture circle */}
                    <div className="absolute inset-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition-colors">
                      {/* Camera icon */}
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Status Text */}
              <p className="text-center text-xs text-slate-400">
                {cameraTorchOn ? '💡 Flash ligado' : ''}
                {cameraZoom > 1 ? (cameraTorchOn ? ` • ` : '') + `Zoom ${cameraZoom.toFixed(1)}x` : ''}
                {!cameraTorchOn && cameraZoom <= 1 ? 'Pronto para fotografar' : ''}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
