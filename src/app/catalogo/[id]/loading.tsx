import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F6EE] z-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-xl pb-1">
          ❀
        </div>
      </div>
      <p className="mt-4 text-[#C5A059] font-serif italic animate-pulse">
        Cargando flores...
      </p>
    </div>
  );
}