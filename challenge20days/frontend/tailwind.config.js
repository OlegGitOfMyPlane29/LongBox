/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
      },
      boxShadow: {
        pixel: "4px 4px 0 0 #0f172a",
        "pixel-sm": "2px 2px 0 0 #0f172a",
      },
    },
  },
  plugins: [],
};
