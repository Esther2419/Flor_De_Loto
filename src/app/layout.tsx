import type { Metadata } from "next";
import { Playfair_Display, Lato, Cinzel } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import CartSidebar from "@/components/CartSidebar";
import { ToastProvider } from "@/context/ToastContext";

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
  title: {
    default: "Flor de Loto | Floristería en Cochabamba",
    template: "%s | Flor de Loto"
  },
  description: "La mejor floristería en Cochabamba. Arreglos florales exclusivos, ramos de rosas, tulipanes y regalos personalizados con entrega a domicilio. Frescura y elegancia garantizada.",
  
  icons: {
    icon: '/LogoSinLetra.png',
    apple: '/LogoSinLetra.png',
    shortcut: '/LogoSinLetra.png',
  },

  openGraph: {
    title: "Flor de Loto | Floristería Boutique",
    description: "Arreglos florales exclusivos y frescos en Cochabamba.",
    url: 'https://www.floreriaflordeloto.com',
    siteName: 'Flor de Loto',
    images: [
      {
        url: '/LogoSinLetra.png',
        width: 800,
        height: 800,
      },
    ],
    locale: 'es_BO',
    type: 'website',
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
        <Providers>
          <ToastProvider>
            <CartSidebar />
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}