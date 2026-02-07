// src/app/admin/pagos/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Trash2, HardDrive, Calendar, Loader2 } from "lucide-react";
import { getBucketFiles, deleteBucketFile } from "./actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminPagosPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    getBucketFiles().then((data) => {
      setFiles(data);
      setInitializing(false);
    });
  }, []);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    const fileName = fileToDelete;
    setFileToDelete(null); // Cerrar modal
    setLoading(fileName); // Mostrar carga en la tarjeta
    
    const res = await deleteBucketFile(fileName);
    
    if (res.success) {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
    } else {
      alert("Error al eliminar la imagen");
    }
    setLoading(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif italic text-gray-800">Gestión de Comprobantes</h1>
          <p className="text-gray-400 text-sm mt-1">Elimina comprobantes antiguos para liberar espacio.</p>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                <HardDrive size={20} />
            </div>
            <div>
                <p className="text-xs text-gray-400">Gestión directa de imágenes en el servidor ({files.length} archivos)</p>
            </div>
        </div>

        {initializing ? (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-gray-300" size={32} />
            </div>
        ) : files.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-gray-400 italic">No hay archivos en el bucket.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {files.map((file) => (
                <div key={file.name} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-square relative bg-gray-50">
                    <Image 
                        src={file.publicUrl} 
                        alt={file.name} 
                        fill 
                        className="object-cover"
                    />
                    {/* Overlay con fecha */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 backdrop-blur-sm">
                        <p className="text-[10px] text-white flex items-center gap-1">
                            <Calendar size={10} />
                            {file.created_at ? format(new Date(file.created_at), "dd MMM yy, HH:mm", { locale: es }) : "Sin fecha"}
                        </p>
                    </div>
                    </div>
                    
                    <button 
                    onClick={() => setFileToDelete(file.name)}
                    disabled={loading === file.name}
                    className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                    title="Eliminar archivo"
                    >
                    {loading === file.name ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Trash2 size={14} />
                    )}
                    </button>
                </div>
                ))}
            </div>
        )}

        {/* Modal de Confirmación Personalizado */}
        {fileToDelete && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Fondo oscuro con desenfoque */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={() => setFileToDelete(null)}
            />
            
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-gray-100 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={32} />
                </div>
                
                <h3 className="text-2xl font-serif italic text-gray-800 mb-2">¿Eliminar Imagen?</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                ¿Estás seguro de eliminar esta imagen permanentemente del servidor? Esta acción no se puede deshacer.
                </p>

                <div className="flex flex-col gap-3">
                <button 
                    onClick={confirmDelete}
                    className="bg-red-500 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                    Sí, Eliminar
                </button>
                <button 
                    onClick={() => setFileToDelete(null)}
                    className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-700 transition-colors"
                >
                    Cancelar
                </button>
                </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
}
