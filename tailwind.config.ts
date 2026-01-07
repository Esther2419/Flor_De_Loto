import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rosaViejo: '#E5A1A6',
        crema: '#F9F6EE',
        negro: '#050505', 
        dorado: '#C5A059',
        gris: '#2D2D2D',
        verdeWhatsapp: '#25D366',
        goldDark: '#BF953F',
        goldLight: '#F3E5AB',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-lato)', 'sans-serif'],
        roman: ['var(--font-cinzel)', 'serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;