import { supabase } from "./supabase";
import imageCompression from "browser-image-compression";

/**
 * Sube un archivo al bucket correspondiente y retorna la URL pública.
 */
export async function uploadToBucket(file: File, bucketName: string) {
  try {
    // 1. Compresión (Máximo 1MB, resolución 2K)
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);

    // 2. Generar nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).slice(2, 11)}-${Date.now()}.${fileExt}`;

    // 3. Subida
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressedFile);

    if (uploadError) throw uploadError;

    // 4. Retornar URL pública
    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error en uploadToBucket (${bucketName}):`, error);
    return null;
  }
}

/**
 * Opcional: Elimina un archivo del bucket para mantener limpia la nube.
 */
export async function deleteFromBucket(url: string, bucketName: string) {
  try {
    const fileName = url.split('/').pop();
    if (!fileName) return;
    await supabase.storage.from(bucketName).remove([fileName]);
  } catch (error) {
    console.error("Error al eliminar archivo del bucket:", error);
  }
}