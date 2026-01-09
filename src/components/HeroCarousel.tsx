"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

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
    <div className="relative h-[50vh] w-full overflow-hidden bg-negro group"
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
            <h2 className="font-serif text-4xl md:text-6xl text-[#F3E5AB] drop-shadow-md tracking-wide italic mb-2">
              {slide.title}
            </h2>
            <p className="text-white/90 font-sans tracking-[0.2em] text-sm md:text-base uppercase mb-4">
              {slide.subtitle}
            </p>
            <div className="w-16 h-[1px] bg-[#C5A059] mx-auto mb-4" />
            <p className="text-white/80 font-serif text-lg italic max-w-lg mx-auto">
              {slide.desc}
            </p>
          </div>
        ))}
      </div>

      {/* --- PUNTITOS DE NAVEGACIÓN (con delay) --- */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
              index === currentSlide ? "bg-[#C5A059] w-8" : "bg-white/30 hover:bg-white w-2"
            }`}
            aria-label={`Ir a diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}