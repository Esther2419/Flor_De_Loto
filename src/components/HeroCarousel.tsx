"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const slides = [
    {
      id: 1,
      image: "/portada1.jpg",
      title: "Colección 2026",
      subtitle: "Elegancia Natural",
      desc: "Diseños exclusivos que transforman espacios."
    },
    {
      id: 2,
      image: "/portada2.jpg",
      title: "Bodas y Eventos",
      subtitle: "Momentos Inolvidables",
      desc: "Creamos la atmósfera perfecta para tu día especial."
    },
    {
      id: 3,
      image: "/portada3.jpg",
      title: "Regalos Únicos",
      subtitle: "Detalles que Enamoran",
      desc: "Expresa tus sentimientos con el lenguaje de las flores."
    },
    {
      id: 4,
      image: "/portada.jpg",
      title: "Momentos Inolvidables",
      subtitle: "Elegancia en cada pétalo",
      desc: "Diseños exclusivos que transforman tus sentimientos en arte floral."
    },
  ];

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setCurrentSlide((prevIndex) =>
          prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        ),
      5000
    );
    return () => {
      resetTimeout();
    };
  }, [currentSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    if (isRightSwipe) setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="relative h-[25vh] md:h-[35vh] w-full overflow-hidden bg-negro group transition-all duration-300"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* --- IMÁGENES DE FONDO --- */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover brightness-[0.6]"
            priority={index === 0}
          />
        </div>
      ))}

      {/* --- TEXTO SUPERPUESTO --- */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`transition-all duration-1000 transform ${
              index === currentSlide 
                ? "translate-y-0 opacity-100 delay-300" 
                : "translate-y-8 opacity-0"
            } absolute w-full`}
          >
            {/* Tamaños de texto ajustados para móvil y PC */}
            <h2 className="font-serif text-2xl md:text-5xl text-[#F3E5AB] drop-shadow-md tracking-wide italic mb-1 md:mb-2">
              {slide.title}
            </h2>
            
            <p className="text-white/90 font-sans tracking-[0.2em] text-[10px] md:text-sm uppercase mb-2 md:mb-4">
              {slide.subtitle}
            </p>
            
            <div className="w-10 md:w-16 h-[1px] bg-[#C5A059] mx-auto mb-2 md:mb-4" />
            
            <p className="text-white/80 font-serif text-xs md:text-base italic max-w-lg mx-auto px-4 md:px-0 line-clamp-2 md:line-clamp-none">
              {slide.desc}
            </p>
          </div>
        ))}
      </div>

      {/* --- PUNTITOS DE NAVEGACIÓN --- */}
      <div className="absolute bottom-3 md:bottom-6 left-0 right-0 flex justify-center gap-2 md:gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 md:h-2 rounded-full transition-all duration-500 cursor-pointer ${
              index === currentSlide ? "bg-[#C5A059] w-6 md:w-8" : "bg-white/30 hover:bg-white w-1.5 md:w-2"
            }`}
            aria-label={`Ir a diapositiva ${index + 1}`}
          />
        ))}
      </div>

      {/* --- UBICACIÓN --- */}
      <div className="absolute bottom-5 right-5 z-20 md:bottom-8 md:right-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm border border-[#C5A059]/50 rounded-full shadow-xl transition-transform hover:scale-105 cursor-default">
          <MapPin className="w-3 h-3 text-[#C5A059] md:w-4 md:h-4" />
          <span className="text-[10px] font-bold tracking-widest text-white uppercase md:text-xs">
            Cochabamba - Bolivia
          </span>
        </div>
      </div>
    </div>
  );
}