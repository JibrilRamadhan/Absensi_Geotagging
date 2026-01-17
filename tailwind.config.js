/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'primary-orange': '#ff9244',
        'primary-orange-dark': '#f67f3c',
        'primary-orange-light': '#ffb380',

        // Secondary Colors
        'secondary-green': '#6b9b7a',
        'secondary-green-dark': '#557766',
        'secondary-green-light': '#8fb9a0',

        // Neutral Colors
        'neutral-white': '#ffffff',
        'neutral-light-gray': '#f5f5f5',
        'neutral-gray': '#e8e8e8',
        'neutral-dark-gray': '#999999',
        'neutral-dark': '#333333',
        'neutral-black': '#1a1a1a',

        // Accent Colors
        'accent-red': '#ff6b6b',
        'accent-yellow': '#ffd93d',
        'accent-blue': '#4a90e2',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
        md: '0 4px 8px rgba(0, 0, 0, 0.12)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      zIndex: {
        navbar: '1000',
        sidebar: '999',
        modal: '2000',
      },
    },
  },
  plugins: [],
}
