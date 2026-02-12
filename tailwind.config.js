
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./auth/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./customers/**/*.{js,ts,jsx,tsx}",
    "./dashboard/**/*.{js,ts,jsx,tsx}",
    "./expenses/**/*.{js,ts,jsx,tsx}",
    "./landing/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./sales/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./vehicles/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-top': 'slideInTop 0.5s ease-out',
        'shrink-width': 'shrinkWidth 5s linear forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradientX 15s ease infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pop-in': 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'shine': 'shine 1.5s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInTop: {
          '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        shrinkWidth: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        gradientX: {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(15px)' },
        }
      },
      colors: {
        slate: {
          50: 'rgb(var(--color-slate-50) / <alpha-value>)',
          100: 'rgb(var(--color-slate-100) / <alpha-value>)', 
          200: 'rgb(var(--color-slate-200) / <alpha-value>)',
          300: 'rgb(var(--color-slate-300) / <alpha-value>)',
          400: 'rgb(var(--color-slate-400) / <alpha-value>)',
          500: 'rgb(var(--color-slate-500) / <alpha-value>)', 
          600: 'rgb(var(--color-slate-600) / <alpha-value>)',
          700: 'rgb(var(--color-slate-700) / <alpha-value>)',
          800: 'rgb(var(--color-slate-800) / <alpha-value>)',
          850: 'rgb(var(--color-slate-850) / <alpha-value>)',
          900: 'rgb(var(--color-slate-900) / <alpha-value>)', 
          950: 'rgb(var(--color-slate-950) / <alpha-value>)',
        },
        // Mapeamento correto para a identidade Visual "Velo Orange"
        indigo: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd4c6',
          300: '#ffb29b',
          400: '#ff8363',
          500: '#ff6035', // Velo Orange (Base)
          600: '#ed4618', // Hover
          700: '#c5340d',
          800: '#a32d0f',
          900: '#832811',
          950: '#471104',
        },
        // Paletas auxiliares mapeadas para a identidade VeloHub
        emerald: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd4c6',
          300: '#ffb29b',
          400: '#ff8363',
          500: '#ff6035',
          600: '#ed4618',
          700: '#c5340d',
          800: '#a32d0f',
          900: '#832811',
          950: '#471104',
        },
        rose: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd4c6',
          300: '#ffb29b',
          400: '#ff8363',
          500: '#ff6035',
          600: '#ed4618',
          700: '#c5340d',
          800: '#a32d0f',
          900: '#832811',
          950: '#471104',
        },
        amber: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd4c6',
          300: '#ffb29b',
          400: '#ff8363',
          500: '#ff6035',
          600: '#ed4618',
          700: '#c5340d',
          800: '#a32d0f',
          900: '#832811',
          950: '#471104',
        },
        purple: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd4c6',
          300: '#ffb29b',
          400: '#ff8363',
          500: '#ff6035',
          600: '#ed4618',
          700: '#c5340d',
          800: '#a32d0f',
          900: '#832811',
          950: '#471104',
        },
        blue: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd4c6',
          300: '#ffb29b',
          400: '#ff8363',
          500: '#ff6035',
          600: '#ed4618',
          700: '#c5340d',
          800: '#a32d0f',
          900: '#832811',
          950: '#471104',
        },
        // Alias para facilitar
        primary: {
          500: '#ff6035',
          600: '#ed4618',
        }
      }
    }
  }
}
