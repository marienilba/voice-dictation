/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        wave: {
          to: {
            "margin-left": "-51%",
          },
        },
      },
    },
    animation: {
      wave: "wave 1.5s ease-in-out infinite",
    },
  },
  plugins: [],
};
