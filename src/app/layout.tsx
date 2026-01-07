import type { Metadata } from "next";
import { Playfair_Display, Lato, Cinzel } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  display: 'swap',
});

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ["latin"], 
  variable: "--font-lato",
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flor de Loto | Floristería Boutique",
  description: "Arreglos florales exclusivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {}
      <body className={`${playfair.variable} ${lato.variable} ${cinzel.variable} bg-crema text-gris font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}