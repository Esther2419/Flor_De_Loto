import type { Metadata } from "next";
import { Playfair_Display, Lato, Cinzel } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

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
  metadataBase: new URL('https://www.floreriaflordeloto.com'),
  title: {
    default: "Flor de Loto | Floristería Boutique en Cochabamba",
    template: "%s | Flor de Loto"
  },
  description: "Arreglos florales exclusivos, ramos de rosas y regalos personalizados en Cochabamba, Bolivia. La mejor calidad para tus momentos especiales.",
  keywords: ["Florería", "Cochabamba", "Flores", "Ramos", "Regalos", "Flor de Loto", "Bolivia", "Rosas", "Arreglos Florales", "Envío a domicilio"],
  authors: [{ name: "Flor de Loto" }],
  openGraph: {
    title: "Flor de Loto | Floristería Boutique",
    description: "Expresa tus sentimientos con los arreglos florales más exclusivos de Cochabamba.",
    url: 'https://www.floreriaflordeloto.com',
    siteName: 'Florería Flor de Loto',
    images: [
      {
        url: '/portada.jpg',
        width: 1200,
        height: 630,
        alt: 'Flor de Loto Floristería',
      },
    ],
    locale: 'es_BO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Flor de Loto | Floristería Boutique",
    description: "Arreglos florales exclusivos en Cochabamba.",
    images: ['/portada.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${lato.variable} ${cinzel.variable} bg-crema text-gris font-sans antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}