/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Geist',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        // Reserved for the CV body only.
        'cv-sans': ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Semantic identity tokens
        canvas: '#FBFAF8', // page background — warm off-white
        paper: '#FFFFFF', // card surfaces
        ink: '#1A1A1A', // primary text (not pure black)
        muted: '#6B6862', // secondary text
        accent: {
          DEFAULT: '#3F7A55', // deep sage — CTA / link / interactive
          bright: '#5B9D75', // brighter sage — decoration
          soft: '#E9F1EB', // tinted backgrounds
          dark: '#2D5A3E', // hover
        },
        // Warm-neutral replacement for slate (subtler than the previous cream-heavy scale)
        slate: {
          50: '#FBFAF8',
          100: '#F5F2EC',
          200: '#EBE7DD',
          300: '#D8D2C4',
          400: '#A39E92',
          500: '#6B6862',
          600: '#4A4842',
          700: '#2E2D29',
          800: '#1F1E1B',
          900: '#1A1A1A',
        },
        // Replace blue with sage so existing bg-blue-600 / text-blue-600 inherit the new identity.
        blue: {
          50: '#EFF6F1',
          100: '#DEEDE2',
          200: '#BDDBC5',
          300: '#94C29F',
          400: '#6BA379',
          500: '#5B9D75',
          600: '#3F7A55',
          700: '#2D5A3E',
          800: '#1F4029',
          900: '#142B1B',
        },
        primary: {
          DEFAULT: '#3F7A55',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgb(20 20 20 / 0.04), 0 4px 16px rgb(20 20 20 / 0.04)',
        lift: '0 2px 4px rgb(20 20 20 / 0.05), 0 12px 32px rgb(20 20 20 / 0.06)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
