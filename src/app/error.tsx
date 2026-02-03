"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500 pt-32">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm">
        <AlertCircle className="text-red-400" size={40} />
      </div>
      <h2 className="text-3xl font-serif italic text-zinc-900 mb-3">Algo salió mal</h2>
      <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Ha ocurrido un error inesperado al cargar la página.
      </p>
      <button
        onClick={() => reset()}
        className="bg-[#0A0A0A] text-[#C5A059] py-4 px-8 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all shadow-xl flex items-center gap-2"
      >
        <RefreshCcw size={16} /> Intentar de nuevo
      </button>
    </div>
  );
}