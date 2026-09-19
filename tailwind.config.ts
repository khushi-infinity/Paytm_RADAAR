import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FDF8F0",
        butter: "#FFF3DC",
        /* trust-blue system */
        royal: "#1B4FA8",
        navyblue: "#0E2F66",
        skybright: "#4A7EF0",
        blueink: "#233D6B",
        bluesoft: "#D9E6FB",
        bluemist: "#EDF3FD",
        orange: "#F96A3C",
        tomato: "#F96A3C",
        mint: "#3EC98F",
        leaf: "#3EC98F",
        leafdeep: "#2FA374",
        sky: "#4A7EF0",
        skydeep: "#2C63D9",
        sun: "#FFC24B",
        ink: "#1D2B4F",
        cocoa: "#5C6C8C",
        mist: "#EDF3FD",
        white: "#FFFFFF",
      },
      fontFamily: {
        round: ["Baloo 2", "Quicksand", "Comfortaa", "ui-rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 24px rgba(16, 52, 128, 0.18)",
        pop: "0 10px 30px rgba(249, 106, 60, 0.35)",
        lift: "0 18px 40px rgba(16, 52, 128, 0.28)",
      },
      borderRadius: {
        blob: "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
