import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        dark: {
          primary: '#0f1117',
          secondary: '#1a1d27',
          card: '#1e2130',
          hover: '#252840',
          border: '#2a2d3e',
          'border-light': '#363a52',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(79,142,247,0.25)',
        'glow-sm': '0 0 12px rgba(79,142,247,0.15)',
        card: '0 4px 16px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gradient-1': 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 100%)',
        'gradient-2': 'linear-gradient(135deg, #22c55e 0%, #4f8ef7 100%)',
        'gradient-3': 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'scale-in': 'scaleIn 0.2s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 6px rgba(34, 197, 94, 0)' },
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}

export default config
