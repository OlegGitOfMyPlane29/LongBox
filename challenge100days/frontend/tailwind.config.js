/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        block: {
          bg: '#2f3b2f',
          panel: '#4b5d3f',
          accent: '#7f5f3f',
          muted: '#5d5d5d',
          text: '#f3f0d7',
          fail: '#8c3b2f',
          success: '#3f7f3f',
        },
      },
      boxShadow: {
        block: '6px 6px 0 0 rgba(0,0,0,0.45)',
      },
      fontFamily: {
        pixel: ['"Trebuchet MS"', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

