import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";

// Configuracion de las fuentes
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair", //Tailwind
  display: 'swap',
});

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ["latin"], 
  variable: "--font-lato",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Flor de Loto | Floristería Boutique",
  description: "Arreglos florales exclusivos para momentos inolvidables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${lato.variable} bg-crema text-negroSuave font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}