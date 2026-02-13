import React, { useState, useEffect } from "react";
import { X, Camera, Zap, ZoomIn, Loader, RotateCcw } from "lucide-react";

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
  const [uploadStarted, setUploadStarted] = useState(false);

  // Turn off torch and cleanup when modal closes
  useEffect(() => {
    return () => {
      // Resume video if paused on unmount
      if (videoRef.current && videoRef.current.paused) {
        try {
          videoRef.current.play();
        } catch (err) {
          console.error("Error resuming video on unmount:", err);
        }
      }

      // Turn off torch if it's on when component unmounts
      if (cameraTorchOn && videoTrackRef?.current) {
        setTimeout(() => {
          try {
            const constraints = {
              advanced: [{ torch: false } as any],
            } as MediaTrackConstraints;
            videoTrackRef.current?.applyConstraints(constraints);
          } catch (err) {
            console.error("Error turning off torch:", err);
          }
        }, 100);
      }
    };
  }, [cameraTorchOn, videoTrackRef]);

  // Close modal when upload completes
  useEffect(() => {
    if (uploadStarted && isUploading === false) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          try {
            videoRef.current.play();
          } catch (err) {
            console.error("Error resuming video on close:", err);
          }
        }
        onClose();
        setIsPreview(false);
        setUploadStarted(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [uploadStarted, isUploading, onClose]);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 1. Capturar imagem para o Canvas
    if (canvas && video && video.readyState >= 2) {
      const ctx = canvas.getContext("2d");

      if (ctx) {
        try {
          // Garante que o canvas tenha o tamanho exato do vídeo
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;

          // Desenha o frame atual
          ctx.drawImage(video, 0, 0);
        } catch (err) {
          console.error("Error capturing image to canvas:", err);
        }
      }
    }

    // 2. Desligar o flash IMEDIATAMENTE
    if (cameraTorchOn) {
      toggleTorch(); // Atualiza UI
      if (videoTrackRef?.current) {
        try {
          const constraints = {
            advanced: [{ torch: false } as any],
          } as MediaTrackConstraints;
          await videoTrackRef.current.applyConstraints(constraints);
        } catch (err) {
          console.error("Error forcing torch off:", err);
        }
      }
    }

    // 3. Pausa o vídeo (opcional, já que vamos escondê-lo)
    if (video) {
      video.pause();
    }

    // 4. Ativa o modo Preview (que vai trocar o Vídeo pelo Canvas no HTML abaixo)
    setIsPreview(true);
  };

  const handleRetake = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
    setIsPreview(false);
    setUploadStarted(false);
  };

  const handleConfirmCapture = () => {
    setUploadStarted(true);
    onCapture();
  };

  const handleClose = () => {
    if (videoRef.current && videoRef.current.paused) {
      try {
        videoRef.current.play();
      } catch (err) {
        console.error("Error resuming video:", err);
      }
    }

    if (cameraTorchOn && videoTrackRef?.current) {
      try {
        const constraints = {
          advanced: [{ torch: false } as any],
        } as MediaTrackConstraints;
        videoTrackRef.current.applyConstraints(constraints);
      } catch (err) {
        console.error("Error turning off torch:", err);
      }
    }
    setIsPreview(false);
    setUploadStarted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black animate-fade-in md:flex md:items-center md:justify-center md:p-4 md:bg-black/95 md:backdrop-blur-sm">
      <div className="md:relative md:max-w-2xl md:rounded-3xl md:overflow-hidden md:shadow-2xl w-full h-full flex flex-col">
        <div className="relative flex-1 md:flex-none md:aspect-[9/16] md:max-h-[90vh] w-full bg-black overflow-hidden">
          
          {/* --- MUDANÇA AQUI --- */}
          {/* Se NÃO for preview, mostra o vídeo ao vivo */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isPreview ? 'hidden' : 'block'}`}
          />

          {/* Se FOR preview, mostra o canvas (foto estática) */}
          <canvas 
            ref={canvasRef} 
            className={`w-full h-full object-cover ${isPreview ? 'block' : 'hidden'}`} 
          />
          {/* -------------------- */}

          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-10">
            <button
              onClick={handleClose}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors active:scale-95 md:bg-slate-900/60 md:hover:bg-slate-900/80"
            >
              <X size={24} />
            </button>

            <h3 className="hidden md:block text-white font-bold text-lg">
              Câmera
            </h3>
            <div className="w-12" />
          </div>

          <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-3 z-10">
            {cameraHasTorch && !isPreview && !isUploading && (
              <button
                onClick={toggleTorch}
                className={`p-3 rounded-full backdrop-blur-md transition-colors active:scale-95 ${
                  cameraTorchOn
                    ? "bg-amber-500/80 text-white hover:bg-amber-600"
                    : "bg-black/40 text-white hover:bg-black/60 md:bg-slate-900/60 md:hover:bg-slate-900/80"
                }`}
                title={cameraTorchOn ? "Desligar Flash" : "Ligar Flash"}
              >
                <Zap size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 md:static bg-black/40 md:bg-slate-900/80 backdrop-blur-md md:backdrop-blur-sm border-t border-slate-700/20 md:border-t-0 p-4 md:p-6 space-y-3">
          {cameraHasZoom && !isPreview && !isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <ZoomIn size={16} />
                  <span>Zoom</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {cameraZoom.toFixed(1)}x
                </span>
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

          {isPreview && !isUploading && (
            <>
              <div className="flex items-center justify-center gap-4">
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

              <p className="text-center text-sm text-slate-300 font-medium">
                Aprove a foto ou tire outra
              </p>
            </>
          )}

          {isUploading && (
            <>
              <div className="flex items-center justify-center">
                <button
                  disabled
                  className="relative transition-all opacity-50 cursor-not-allowed"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-white/20">
                    <div className="absolute inset-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500">
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader size={24} className="text-white animate-spin" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-slate-300 font-medium flex items-center justify-center gap-1">
                <Loader size={14} className="animate-spin" />
                Enviando foto...
              </p>
            </>
          )}

          {!isPreview && !isUploading && (
            <>
              <div className="flex items-center justify-center">
                <button
                  onClick={handleCapture}
                  className="relative transition-all active:scale-95"
                  title="Tirar foto"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 hover:border-white/40 transition-colors relative">
                    <div className="absolute inset-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition-colors">
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-xs text-slate-400">
                {cameraTorchOn ? "💡 Flash ligado" : ""}
                {cameraZoom > 1
                  ? (cameraTorchOn ? ` • ` : "") +
                    `Zoom ${cameraZoom.toFixed(1)}x`
                  : ""}
                {!cameraTorchOn && cameraZoom <= 1
                  ? "Pronto para fotografar"
                  : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};