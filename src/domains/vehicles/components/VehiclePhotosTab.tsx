import React, { useEffect, useState } from 'react';
import { Vehicle } from '@/shared/types';
import { Camera, ChevronLeft, ChevronRight, RefreshCw, Star, Trash2, Upload } from 'lucide-react';

type CameraState = {
  isOpen: boolean;
  isUploading: boolean;
};

type UploadProgress = {
  total: number;
  done: number;
};

interface VehiclePhotosTabProps {
  formData: Vehicle;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isPhotoUploading: boolean;
  uploadProgress: UploadProgress;
  photoIndex: number;
  setPhotoIndex: React.Dispatch<React.SetStateAction<number>>;
  setCameraState: React.Dispatch<React.SetStateAction<CameraState>>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement> | Blob) => void;
  handlePhotoDelete: (index: number) => void;
  setFormData: React.Dispatch<React.SetStateAction<Vehicle>>;
  draggedPhotoIndex: number | null;
  setDraggedPhotoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  dragOverPhotoIndex: number | null;
  setDragOverPhotoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  markPhotoMoved: (index: number) => void;
  recentlyMovedIndex: number | null;
}

export const VehiclePhotosTab: React.FC<VehiclePhotosTabProps> = ({
  formData,
  fileInputRef,
  isPhotoUploading,
  uploadProgress,
  photoIndex,
  setPhotoIndex,
  setCameraState,
  handlePhotoUpload,
  handlePhotoDelete,
  setFormData,
  draggedPhotoIndex,
  setDraggedPhotoIndex,
  dragOverPhotoIndex,
  setDragOverPhotoIndex,
  markPhotoMoved,
  recentlyMovedIndex,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detecção simplificada de mobile/tablet para decidir entre Câmera Nativa ou Webcam
    const checkMobile = () => {
      const ua = navigator.userAgent.toLowerCase();
      // Verifica Android, iOS ou se é dispositivo touch (fallback)
      return /android|iphone|ipad|ipod/.test(ua) || (navigator.maxTouchPoints > 0 && /mobile|tablet/.test(ua));
    };
    setIsMobile(checkMobile());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Carregar da Galeria (Funciona em ambos) */}
        <label 
          className={`flex-1 p-6 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group ${isPhotoUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            className="hidden" 
            multiple 
            accept="image/*" 
            disabled={isPhotoUploading}
          />
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
            <Upload size={24} className="text-indigo-500" />
          </div>
          <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {isPhotoUploading ? 'Enviando...' : 'Carregar da Galeria'}
          </span>
        </label>

        {/* Câmera: Lógica Condicional (Nativa no Mobile, Webcam no Desktop) */}
        {isMobile ? (
          <label 
            className={`flex-1 p-6 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group ${isPhotoUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input 
              type="file" 
              onChange={handlePhotoUpload} 
              className="hidden" 
              capture="environment"
              accept="image/*" 
              disabled={isPhotoUploading}
            />
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Camera size={24} className="text-indigo-500" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {isPhotoUploading ? 'Aguarde...' : 'Tirar Foto (Nativo)'}
            </span>
          </label>
        ) : (
          <button
            onClick={() => setCameraState((prev) => ({ ...prev, isOpen: true }))}
            disabled={isPhotoUploading}
            className={`flex-1 p-6 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group ${isPhotoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Camera size={24} className="text-indigo-500" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {isPhotoUploading ? 'Aguarde...' : 'Usar Webcam'}
            </span>
          </button>
        )}
      </div>
      {isPhotoUploading && (
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Enviando imagens...</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {uploadProgress.done}/{uploadProgress.total}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-300"
              style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {formData.photos.length > 0 && (
        <div className="relative">
          <div
            className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as any)._startX = touch.clientX;
              (e.currentTarget as any)._startY = touch.clientY;
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              const startX = (e.currentTarget as any)._startX || 0;
              const startY = (e.currentTarget as any)._startY || 0;
              const diffX = touch.clientX - startX;
              const diffY = Math.abs(touch.clientY - startY);

              if (Math.abs(diffX) > 50 && diffY < 100) {
                if (diffX > 0) {
                  setPhotoIndex((prev) => (prev === 0 ? formData.photos.length - 1 : prev - 1));
                } else {
                  setPhotoIndex((prev) => (prev === formData.photos.length - 1 ? 0 : prev + 1));
                }
              }
            }}
          >
            {isPhotoUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 gap-3 rounded-lg">
                <RefreshCw className="text-indigo-400 animate-spin" size={36} />
                <div className="text-center">
                  <span className="text-white font-semibold block mb-1">Enviando imagens</span>
                  <span className="text-xs text-slate-300">
                    {uploadProgress.done}/{uploadProgress.total}
                  </span>
                </div>
                <div className="w-32 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
            <img src={formData.photos[photoIndex]} className="w-full h-full object-contain" alt={`Foto ${photoIndex + 1}`} />

            {formData.photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((prev) => (prev === 0 ? formData.photos.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 backdrop-blur-sm rounded-full text-white hover:bg-indigo-600 transition-all shadow-lg"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setPhotoIndex((prev) => (prev === formData.photos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 backdrop-blur-sm rounded-full text-white hover:bg-indigo-600 transition-all shadow-lg"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-white text-sm font-medium">
                {photoIndex + 1} / {formData.photos.length}
              </span>
            </div>

            <button
              onClick={() => handlePhotoDelete(photoIndex)}
              className="absolute top-4 right-4 p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 shadow-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>

            {photoIndex !== 0 && (
              <button
                onClick={() => {
                  const newPhotos = [...formData.photos];
                  const p = newPhotos.splice(photoIndex, 1)[0];
                  newPhotos.unshift(p);
                  setFormData({ ...formData, photos: newPhotos });
                  setPhotoIndex(0);
                }}
                className="absolute top-4 left-4 px-3 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-indigo-600 transition-colors shadow-lg flex items-center gap-2"
              >
                <Star size={16} /> Definir Capa
              </button>
            )}
          </div>

          {formData.photos.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {formData.photos.map((photo, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <button
                    draggable
                    onDragStart={() => setDraggedPhotoIndex(idx)}
                    onDragEnd={() => {
                      setDraggedPhotoIndex(null);
                      setDragOverPhotoIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverPhotoIndex(idx);
                    }}
                    onDrop={() => {
                      if (draggedPhotoIndex === null || draggedPhotoIndex === idx) return;
                      const newPhotos = [...formData.photos];
                      const [moved] = newPhotos.splice(draggedPhotoIndex, 1);
                      newPhotos.splice(idx, 0, moved);
                      setFormData({ ...formData, photos: newPhotos });
                      if (photoIndex === draggedPhotoIndex) setPhotoIndex(idx);
                      markPhotoMoved(idx);
                      setDraggedPhotoIndex(null);
                      setDragOverPhotoIndex(null);
                    }}
                    onClick={() => setPhotoIndex(idx)}
                    className={`flex-shrink-0 aspect-[4/3] w-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      idx === photoIndex
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    } ${dragOverPhotoIndex === idx ? 'ring-2 ring-amber-500/40 border-amber-500/60' : ''} ${
                      recentlyMovedIndex === idx ? 'animate-pop-in' : ''
                    }`}
                    title="Arraste para reordenar"
                  >
                    <img src={photo} className="w-full h-full object-cover" alt={`Miniatura ${idx + 1}`} />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (idx === 0) return;
                        const newPhotos = [...formData.photos];
                        const temp = newPhotos[idx - 1];
                        newPhotos[idx - 1] = newPhotos[idx];
                        newPhotos[idx] = temp;
                        setFormData({ ...formData, photos: newPhotos });
                        if (photoIndex === idx) setPhotoIndex(idx - 1);
                        if (photoIndex === idx - 1) setPhotoIndex(idx);
                        markPhotoMoved(idx - 1);
                      }}
                      className="p-1 rounded-full bg-slate-900/70 text-slate-300 hover:text-white"
                      title="Mover para esquerda"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (idx === formData.photos.length - 1) return;
                        const newPhotos = [...formData.photos];
                        const temp = newPhotos[idx + 1];
                        newPhotos[idx + 1] = newPhotos[idx];
                        newPhotos[idx] = temp;
                        setFormData({ ...formData, photos: newPhotos });
                        if (photoIndex === idx) setPhotoIndex(idx + 1);
                        if (photoIndex === idx + 1) setPhotoIndex(idx);
                        markPhotoMoved(idx + 1);
                      }}
                      className="p-1 rounded-full bg-slate-900/70 text-slate-300 hover:text-white"
                      title="Mover para direita"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {formData.photos.length === 0 && (
        <div className="py-16 text-center text-slate-500">
          <Camera size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma foto cadastrada</p>
          <p className="text-sm mt-1">Adicione fotos usando os botões acima</p>
        </div>
      )}
    </div>
  );
};
