/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include deployment env so Tailwind picks up classes there too (excluding node_modules)
    './deployment/app/**/*.{js,ts,jsx,tsx,mdx,html}',
    './deployment/components/**/*.{js,ts,jsx,tsx,mdx,html}',
    './deployment/pages/**/*.{js,ts,jsx,tsx,mdx,html}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A3D2D',
          dark: '#0F2A1E',
          light: '#2D5A42',
        },
        accent: {
          DEFAULT: '#B8A77E',
          dark: '#9A8A66',
          light: '#D4C9A8',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-nunito-sans)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'soft': '0 2px 8px -2px rgb(0 0 0 / 0.08)',
        'elevated': '0 4px 16px -4px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'refined': '8px',
        'card': '12px',
      },
    },
  },
  plugins: [],
}; 