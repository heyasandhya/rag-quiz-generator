/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#68738a",
        brand: "#5856e8",
        soft: "#f7f8fc"
      },
      boxShadow: {
        card: "0 18px 60px rgba(28, 39, 76, 0.08)"
      }
    }
  },
  plugins: []
};
