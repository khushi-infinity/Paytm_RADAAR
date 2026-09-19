import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FDF8F0",
        butter: "#FFF3DC",
        peach: "#FF6B4A",
        coral: "#FF8A65",
        tomato: "#E5543A",
        leaf: "#3BB273",
        leafdeep: "#2E8F5D",
        sky: "#3D9BE9",
        skydeep: "#2C7CC0",
        sun: "#F5A623",
        ink: "#33302B",
        cocoa: "#6B6156",
        mist: "#F2ECE2",
        white: "#FFFFFF",
      },
      fontFamily: {
        round: ["Baloo 2", "Quicksand", "Comfortaa", "ui-rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 24px rgba(200, 170, 120, 0.18)",
        pop: "0 10px 30px rgba(229, 84, 58, 0.25)",
      },
      borderRadius: {
        blob: "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
