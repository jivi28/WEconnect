/** @type {import('tailwindcss').Config} */
export default {
  content: ['./mindmap.html', './src/mindmap/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#CC0000',
          redDark: '#A30000',
          redSoft: '#FBE6E6'
        },
        ink: '#1F1F1F',
        graydark: '#605D5C',
        graymed: '#959595',
        graylight: '#DEDEDE',
        soft: '#F6F6F6'
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif']
      },
      boxShadow: {
        node: '0 2px 8px rgba(31, 31, 31, 0.10)',
        nodeStrong: '0 6px 20px rgba(204, 0, 0, 0.18)',
        card: '0 12px 32px rgba(31, 31, 31, 0.12)'
      },
      keyframes: {
        nodeIn: {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        pulseLine: {
          '0%, 100%': { strokeOpacity: '1' },
          '50%': { strokeOpacity: '0.55' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        nodeIn: 'nodeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        pulseLine: 'pulseLine 1.6s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease-out backwards'
      }
    }
  },
  plugins: []
}
