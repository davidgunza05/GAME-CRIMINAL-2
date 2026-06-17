import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Crime Game Design Tokens ───
        crime: {
          black:    '#0A0A0F',
          surface:  '#111116',
          border:   '#222228',
          muted:    '#2A2A30',
          // Accent — crime scene red
          red:      '#C0392B',
          'red-dark': '#8B0000',
          'red-glow': '#3A0000',
          // Text
          'text-primary':   '#F0F0EB',
          'text-secondary': '#CCCCCC',
          'text-muted':     '#888888',
          'text-faint':     '#555555',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono:  ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'crime-gradient': 'linear-gradient(180deg, #1A0000 0%, #0A0A0F 100%)',
        'card-gradient':  'linear-gradient(135deg, rgba(139,0,0,0.15) 0%, #111116 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-red':  'pulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseRed: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      boxShadow: {
        'crime': '0 0 40px rgba(192, 57, 43, 0.15)',
        'crime-sm': '0 0 20px rgba(192, 57, 43, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
