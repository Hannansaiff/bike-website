/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        carbon: '#16171b',
        graphite: '#23252b',
        steel: '#3a3d45',
        fog: '#9a9ea8',
        bone: '#f4f4f1',
        ignite: { DEFAULT: '#ff5b1f', 400: '#ff7a47', 600: '#e8470d', 700: '#c23a0a' },
        tail: '#e5172f',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: { site: '82rem' },
      boxShadow: {
        lift: '0 18px 40px -18px rgba(0,0,0,0.65)',
        glow: '0 0 0 1px rgba(255,91,31,0.35), 0 12px 30px -12px rgba(255,91,31,0.45)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
};
