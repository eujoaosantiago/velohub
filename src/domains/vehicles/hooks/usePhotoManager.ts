import { useEffect, useRef, useState } from 'react';
import { Vehicle } from '@/shared/types';
import { StorageService } from '@/domains/vehicles/services/storageService';

type CameraState = {
  isOpen: boolean;
  isUploading: boolean;
};

type UploadProgress = {
  total: number;
  done: number;
};

type UsePhotoManagerParams = {
  vehicle: Vehicle;
  formData: Vehicle;
  setFormData: React.Dispatch<React.SetStateAction<Vehicle>>;
  onUpdate: (updatedVehicle: Vehicle) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
  isNew: boolean;
  activeTab: string;
};

export const usePhotoManager = ({
  vehicle,
  formData,
  setFormData,
  onUpdate,
  showToast,
  isNew,
  activeTab,
}: UsePhotoManagerParams) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>({ isOpen: false, isUploading: false });
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ total: 0, done: 0 });
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [dragOverPhotoIndex, setDragOverPhotoIndex] = useState<number | null>(null);
  const [recentlyMovedIndex, setRecentlyMovedIndex] = useState<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraZoomRange, setCameraZoomRange] = useState<{ min: number; max: number }>({ min: 1, max: 1 });
  const [cameraHasZoom, setCameraHasZoom] = useState(false);
  const [cameraTorchOn, setCameraTorchOn] = useState(false);
  const [cameraHasTorch, setCameraHasTorch] = useState(false);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const lastSavedPhotosRef = useRef<string>(JSON.stringify(vehicle.photos || []));
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const prevTabRef = useRef<string>('overview');

  const markPhotoMoved = (index: number) => {
    setRecentlyMovedIndex(index);
    if (moveTimerRef.current) {
      window.clearTimeout(moveTimerRef.current);
    }
    moveTimerRef.current = window.setTimeout(() => {
      setRecentlyMovedIndex(null);
    }, 300);
  };

  const savePhotoOrder = async () => {
    const currentPhotos = JSON.stringify(formData.photos || []);
    if (currentPhotos === lastSavedPhotosRef.current) return;
    try {
      await onUpdate({ ...formData, photos: formData.photos });
      lastSavedPhotosRef.current = currentPhotos;
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar ordem das fotos.', 'error');
    }
  };

  useEffect(() => {
    const previousTab = prevTabRef.current;
    if (previousTab === 'photos' && activeTab !== 'photos') {
      if (!isNew && !isPhotoUploading) {
        void savePhotoOrder();
      }
    }
    prevTabRef.current = activeTab;
  }, [activeTab, isNew, isPhotoUploading]);

  useEffect(() => {
    if (!isNew && !isPhotoUploading && activeTab !== 'photos') {
      void savePhotoOrder();
    }
  }, [activeTab, isNew, isPhotoUploading, formData.photos]);

  useEffect(() => {
    if (photoIndex >= formData.photos.length) {
      setPhotoIndex(0);
    }
  }, [formData.photos.length, photoIndex]);

  const compressImage = async (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Nao foi possivel criar contexto do canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const baseName = file.name.replace(/\.[^/.]+$/, '') || 'photo';
          const canvasToBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));

          (async () => {
            let blob = await canvasToBlob('image/webp', quality);
            let fileType = 'image/webp';
            let extension = 'webp';

            if (!blob) {
              blob = await canvasToBlob('image/jpeg', quality);
              fileType = 'image/jpeg';
              extension = 'jpg';
            }

            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }

            const compressedFile = new File([blob], `${baseName}.${extension}`, {
              type: fileType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          })().catch(reject);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement> | Blob) => {
    setCameraState((prev) => ({ ...prev, isUploading: true }));
    setIsPhotoUploading(true);
    try {
      let files: File[] = [];

      if (e instanceof Blob) {
        files = [new File([e], 'camera.webp', { type: 'image/webp' })];
      } else {
        const target = (e as React.ChangeEvent<HTMLInputElement>).target;
        if (target.files && target.files.length > 0) {
          files = Array.from(target.files);
        } else {
          setCameraState((prev) => ({ ...prev, isUploading: false }));
          setIsPhotoUploading(false);
          setUploadProgress({ total: 0, done: 0 });
          return;
        }
      }

      const newUrls: string[] = [];
      setUploadProgress({ total: files.length, done: 0 });

      for (const f of files) {
        const compressedFile = await compressImage(f);
        const url = await StorageService.uploadPhoto(compressedFile, vehicle.storeId);
        newUrls.push(url);
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }

      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...newUrls] }));
      setPhotoIndex(0);
    } catch (err) {
      showToast('Erro ao enviar foto.', 'error');
      throw err;
    } finally {
      setCameraState((prev) => ({ ...prev, isUploading: false }));
      setIsPhotoUploading(false);
      setUploadProgress({ total: 0, done: 0 });
    }
  };

  const handlePhotoDelete = async (index: number) => {
    setFormData((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    setPhotoIndex((prev) => {
      const newLength = formData.photos.length - 1;
      if (newLength === 0) return 0;
      if (prev >= newLength) return newLength - 1;
      return prev;
    });
  };

  useEffect(() => {
    if (!cameraState.isOpen) {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoTrackRef.current = null;
      setCameraTorchOn(false);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        videoTrackRef.current = track;
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        const zoomCap = (capabilities as any).zoom;
        const torchCap = (capabilities as any).torch;

        if (zoomCap) {
          setCameraHasZoom(true);
          setCameraZoomRange({ min: zoomCap.min || 1, max: zoomCap.max || 1 });
          setCameraZoom(zoomCap.min || 1);
        } else {
          setCameraHasZoom(false);
          setCameraZoomRange({ min: 1, max: 1 });
          setCameraZoom(1);
        }

        setCameraHasTorch(!!torchCap);
      } catch (err) {
        console.error(err);
        showToast('Nao foi possivel acessar a camera.', 'error');
        setCameraState((prev) => ({ ...prev, isOpen: false }));
      }
    };

    void startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoTrackRef.current = null;
      setCameraTorchOn(false);
    };
  }, [cameraState.isOpen, showToast]);

  const toggleCameraTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      const constraints = { advanced: [{ torch: !cameraTorchOn } as any] } as MediaTrackConstraints;
      await videoTrackRef.current.applyConstraints(constraints);
      setCameraTorchOn((prev) => !prev);
    } catch (err) {
      console.error(err);
    }
  };

  const applyCameraZoom = async (value: number) => {
    if (!videoTrackRef.current) return;
    try {
      const constraints = { advanced: [{ zoom: value } as any] } as MediaTrackConstraints;
      await videoTrackRef.current.applyConstraints(constraints);
      setCameraZoom(value);
    } catch (err) {
      console.error(err);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await handlePhotoUpload(blob);
    }, 'image/webp', 0.92);
  };

  return {
    fileInputRef,
    cameraState,
    setCameraState,
    isPhotoUploading,
    uploadProgress,
    draggedPhotoIndex,
    setDraggedPhotoIndex,
    dragOverPhotoIndex,
    setDragOverPhotoIndex,
    recentlyMovedIndex,
    markPhotoMoved,
    cameraZoom,
    cameraZoomRange,
    cameraHasZoom,
    cameraTorchOn,
    cameraHasTorch,
    toggleCameraTorch,
    applyCameraZoom,
    capturePhoto,
    videoRef,
    canvasRef,
    videoTrackRef,
    photoIndex,
    setPhotoIndex,
    handlePhotoUpload,
    handlePhotoDelete,
  };
};
