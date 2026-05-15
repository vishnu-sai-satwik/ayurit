export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#1D9E75", // The core AyurIT green from the spec
        accentLight: "#E1F5EE",
        accentBorder: "#5DCAA5"
      }
    },
  },
  plugins: [],
}