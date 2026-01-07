import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-crema px-4 text-center">
      
      {}
      <div className="space-y-8 max-w-3xl animate-in fade-in zoom-in duration-700">
        
        {}
        <h1 className="font-serif text-6xl md:text-8xl text-dorado font-bold tracking-tight drop-shadow-sm">
          Flor de Loto
        </h1>

        {}
        <p className="font-sans text-xl md:text-2xl text-negroSuave/80 max-w-lg mx-auto leading-relaxed">
          Donde la elegancia natural encuentra su diseño. <br />
          Arreglos exclusivos para momentos inolvidables.
        </p>
        
        {}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          
          {}
          <Link 
            href="/catalogo" 
            className="bg-dorado hover:bg-doradoMate text-white px-8 py-4 rounded-full transition-all font-sans font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Ver Catálogo
          </Link>

          {}
          <button 
            className="border-2 border-dorado text-dorado px-8 py-4 rounded-full hover:bg-dorado/10 transition-all font-sans font-semibold text-lg"
          >
            Contactar ahora
          </button>
        </div>
      </div>

      {}
      <footer className="absolute bottom-6 text-rosaViejo text-sm font-sans font-medium tracking-wide">
        © 2026 Flor de Loto • Cochabamba, Bolivia
      </footer>
      
    </main>
  );
}