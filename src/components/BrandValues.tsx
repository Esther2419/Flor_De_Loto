import React from 'react';
export default function BrandValues() {
  return (
    <section className="py-16 px-6 bg-white border-t border-[#C5A059]/10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          
          <div className="flex flex-col items-center group cursor-default">
            <div className="w-12 h-12 mb-4 text-[#C5A059] group-hover:scale-110 transition-transform duration-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </div>
            <h3 className="font-serif text-lg text-[#0A0A0A] mb-2">Frescura Garantizada</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Selección diaria del campo</p>
          </div>

          <div className="flex flex-col items-center group cursor-default">
            <div className="w-12 h-12 mb-4 text-[#C5A059] group-hover:scale-110 transition-transform duration-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.635m0 0c3.58 1.74 3.409 5.843 1.812 8.084m-5.32-8.514a3 3 0 10-6.02-1.428A4.5 4.5 0 015.02 5.02m13.784 12.028A2.25 2.25 0 0119.5 22.5c-1.24 0-2.25-1.01-2.25-2.25 0-.828.336-1.58.875-2.125" /></svg>
            </div>
            <h3 className="font-serif text-lg text-[#0A0A0A] mb-2">Diseño de Autor</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Arreglos únicos y modernos</p>
          </div>
          <div className="flex flex-col items-center group cursor-default">
            <div className="w-12 h-12 mb-4 text-[#C5A059] group-hover:scale-110 transition-transform duration-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
            </div>
            <h3 className="font-serif text-lg text-[#0A0A0A] mb-2">Atención Personal</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Cuidamos cada detalle</p>
          </div>

        </div>
      </div>
    </section>
  );
}