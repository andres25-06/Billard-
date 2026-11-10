/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        groza: {
          900: '#12141F',
          800: '#232739',
          700: '#383E5C',
          600: '#4F5580',
          400: '#7B81A8',
          300: '#AFB4CE',
          100: '#E4E6F0',
          line: '#D6D9E8',
          surface: '#FFFFFF',
          soft: '#F3F4F9',
          ok: '#1FA37A',
          busy: '#E0535F',
          warn: '#D99A1E',
        }
      }
    },
  },
  plugins: [],
}
