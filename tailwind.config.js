/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        handwriting: ['"Dancing Script"', '"Caveat"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        cinzel: ['"Cinzel"', 'serif'],
      },
      colors: {
        gold: {
          50: '#fbf9f1',
          100: '#f5f0dc',
          200: '#ebdcb3',
          300: '#dfc282',
          400: '#d3a654',
          500: '#c58d34',
          600: '#ab7028',
          700: '#895223',
          800: '#704222',
          900: '#5e3720',
        },
        parchment: {
          50: '#fefdfa',
          100: '#fbf7ee',
          200: '#f5edda',
          300: '#ede0bf',
          400: '#e1cb9d',
        },
        wax: {
          red: '#8B1E1E',
          gold: '#C59B27',
          navy: '#1B2A4A',
          rose: '#A3485E',
          emerald: '#1C4A3A',
        }
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(234, 179, 8, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(234, 179, 8, 0.85)' },
        }
      }
    },
  },
  plugins: [],
}
