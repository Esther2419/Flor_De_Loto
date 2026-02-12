"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { uploadPaymentQR, deletePaymentQR } from "@/app/actions/admin";
import { Trash2, Upload, Image as ImageIcon, Loader2, X, Check } from "lucide-react";
import Image from "next/image";

export default function QRManager({ initialQR }: { initialQR: string | null }) {
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(initialQR);
  
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setQrUrl(initialQR);
  }, [initialQR]);

  const onCropComplete = useCallback((_un: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImageToCrop(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Tamaño máximo recomendado para un QR
    const maxSize = 800;
    let width = pixelCrop.width;
    let height = pixelCrop.height;

    if (width > maxSize) {
      const ratio = maxSize / width;
      width = maxSize;
      height = height * ratio;
    }

    canvas.width = width;
    canvas.height = height;

    ctx?.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      width,
      height
    );

    return new Promise((resolve, reject) => {
      // Optimizamos: webp con calidad 0.8 es perfecto para lectura de QR y muy liviano
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Error al crear blob"));
          return;
        }
        resolve(blob);
      }, "image/webp", 0.8);
    });
  };

  const handleUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setLoading(true);

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      // El nombre termina en .webp para coincidir con el contentType del servidor
      const file = new File([croppedBlob], "qr_pago.webp", { type: "image/webp" });
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadPaymentQR(formData);
      if (res.success && res.url) {
        setQrUrl(res.url);
        setImageToCrop(null);
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Error al procesar la imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar el QR actual?")) return;
    setLoading(true);
    const res = await deletePaymentQR();
    if (res.success) setQrUrl(null);
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6 relative overflow-hidden">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <ImageIcon className="text-[#C5A059]" size={28} />
          Código QR de Pago
        </h3>
        <p className="text-sm text-gray-500 italic">Encuadra bien el código para que sea legible.</p>
      </div>

      {qrUrl ? (
        <div className="space-y-6">
          <div className="relative w-56 h-56 mx-auto border-2 border-gray-50 rounded-3xl overflow-hidden bg-white shadow-inner">
            <Image src={qrUrl} alt="QR" fill className="object-contain p-2" unoptimized />
          </div>
          <div className="flex justify-center gap-3">
            <label className="cursor-pointer bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg">
              <Upload size={18} className="text-[#C5A059]" />
              <span className="font-bold text-xs uppercase tracking-widest">Cambiar</span>
              <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
            </label>
            <button onClick={handleDelete} className="bg-red-50 text-red-500 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-red-100 transition-all border border-red-100">
              <Trash2 size={18} />
              <span className="font-bold text-xs uppercase tracking-widest">Borrar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50/50">
          <label className="cursor-pointer flex flex-col items-center group">
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} className="text-[#C5A059]" />
            </div>
            <span className="text-sm font-bold text-gray-600 uppercase tracking-tighter">Subir nuevo QR</span>
            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
          </label>
        </div>
      )}

      {/* Modal de Recorte (Cropper) */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-xl aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="mt-8 flex gap-4 w-full max-w-xs">
            <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl hover:bg-white/20 flex items-center justify-center gap-2">
              <X size={20} /> Cancelar
            </button>
            <button onClick={handleUpload} disabled={loading} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl hover:bg-[#b38f4d] flex items-center justify-center gap-2 font-bold">
              {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Confirmar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}