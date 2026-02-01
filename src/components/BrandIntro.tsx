import React from 'react';

export default function BrandIntro() {
  return (
    <section className="py-8 px-6 bg-[#F9F6EE] text-center">
      <div className="max-w-3xl mx-auto">
        <span className="text-xs font-sans tracking-[0.3em] text-[#C5A059] uppercase mb-4 block animate-in fade-in slide-in-from-bottom-4">
          Nuestra Esencia
        </span>
        <h2 className="font-serif text-2xl md:text-4xl text-[#0A0A0A] italic mb-6 leading-tight">
          "Más que flores, <br />
          <span className="text-[#9f7321ff]">diseñamos emociones."</span>
        </h2>
        <p className="text-gray-600 font-light text-sm md:text-base leading-relaxed">
          En <strong>Flor de Loto</strong>, creemos que cada pétalo cuenta una historia. 
          No solo vendemos arreglos florales; creamos experiencias visuales y olfativas 
          que transforman espacios y conectan corazones. Desde Cochabamba para ti, 
          con la frescura del campo y la elegancia del arte.
        </p>
      </div>
    </section>
  );
}