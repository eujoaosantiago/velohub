
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

/**
 * Utilitário para redimensionar e comprimir imagens no navegador antes do upload.
 * Evita estourar o limite de banda e melhora performance.
 */
const compressImage = (file: File): Promise<{ blob: Blob; contentType: string; extension: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Aumentado levemente para qualidade HD
        const scaleSize = MAX_WIDTH / img.width;
        
        // Se a imagem for menor que o limite, mantém o tamanho
        const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        const height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Erro ao processar imagem"));
            return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        const canvasToBlob = (type: string, quality: number) =>
          new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));

        (async () => {
          let blob = await canvasToBlob('image/webp', 0.8);
          let contentType = 'image/webp';
          let extension = 'webp';

          if (!blob) {
            blob = await canvasToBlob('image/jpeg', 0.8);
            contentType = 'image/jpeg';
            extension = 'jpg';
          }

          if (!blob) {
            reject(new Error("Erro ao processar imagem"));
            return;
          }

          resolve({ blob, contentType, extension });
        })().catch(reject);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const StorageService = {
  uploadPhoto: async (file: File, storeId: string): Promise<string> => {
    // 1. Processamento e Compressão
    const { blob, contentType, extension } = await compressImage(file);

    // 2. Upload Seguro via Supabase
    if (isSupabaseConfigured() && supabase) {
        try {
            // SECURITY FIX: Usar UUID para evitar enumeração de arquivos
            const fileName = `${storeId}/${crypto.randomUUID()}.${extension}`;
            
            const { data, error } = await supabase.storage
                .from('vehicles')
                .upload(fileName, blob, {
                contentType,
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(fileName);
                
            return publicUrl;
        } catch (error) {
            console.error("Erro upload Supabase:", error);
            throw new Error("Falha no upload seguro da imagem.");
        }
    }

    // Se não estiver configurado, falha explicitamente para não criar falsos positivos em produção
    throw new Error("Storage não configurado. Verifique as variáveis de ambiente.");
  }
};
