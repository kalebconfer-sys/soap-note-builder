/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0b9ca',
          400: '#8593ac',
          500: '#657592',
          600: '#505e79',
          700: '#414c62',
          800: '#384153',
          900: '#323947',
          950: '#21252e',
        },
        clinic: {
          50: '#eef8f7',
          100: '#d5eeeb',
          200: '#aeddd9',
          300: '#7cc5c1',
          400: '#4ba6a3',
          500: '#318b89',
          600: '#26706f',
          700: '#215a5a',
          800: '#1e484a',
          900: '#1c3d3f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
