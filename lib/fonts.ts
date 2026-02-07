/**
 * next/font/google - self-hosted fonts, no render-blocking requests.
 * CSS variables are applied to the element so Tailwind and global CSS can use them.
 */
import { Nunito_Sans, Inter, Poppins } from 'next/font/google';

export const nunitoSans = Nunito_Sans({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

/** Single className string to apply all font variables to html/body */
export const fontVariableClassNames = `${nunitoSans.variable} ${inter.variable} ${poppins.variable}`;
