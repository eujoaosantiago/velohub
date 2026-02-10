
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

/**
 * Utilitário para redimensionar e comprimir imagens no navegador antes do upload.
 * Evita estourar o limite de banda e melhora performance.
 */
const compressImage = (file: File): Promise<string> => {
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
        
        // Comprime para JPEG com qualidade 0.8
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const StorageService = {
  uploadPhoto: async (file: File, storeId: string): Promise<string> => {
    // 1. Processamento e Compressão
    const compressedBase64 = await compressImage(file);

    // 2. Upload Seguro via Supabase
    if (isSupabaseConfigured() && supabase) {
        try {
            const res = await fetch(compressedBase64);
            const blob = await res.blob();
            
            // SECURITY FIX: Usar UUID para evitar enumeração de arquivos
            const fileExtension = 'jpg';
            const fileName = `${storeId}/${crypto.randomUUID()}.${fileExtension}`;
            
            const { data, error } = await supabase.storage
                .from('vehicles')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
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
