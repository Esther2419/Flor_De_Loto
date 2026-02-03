import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500 pt-32">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
        <AlertCircle className="text-gray-300" size={40} />
      </div>
      <h2 className="text-3xl font-serif italic text-zinc-900 mb-3">Página no encontrada</h2>
      <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Es posible que el enlace sea incorrecto o que la página haya sido eliminada de nuestro catálogo.
      </p>
      <Link 
        href="/" 
        className="bg-[#0A0A0A] text-[#C5A059] py-4 px-8 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all shadow-xl"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}