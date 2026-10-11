import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        cyberBlack: "#0a0a0c",
        cyberDark: "#121218",
        cyberYellow: "#facc15",
        cyberGreen: "#22c55e",
        cyberOrange: "#f97316",
        cyberRed: "#ef4444",
      },
      boxShadow: {
        "neon-yellow": "0 0 24px rgb(250 204 21 / 18%)",
        "neon-green": "0 0 24px rgb(34 197 94 / 18%)",
        "neon-orange": "0 0 24px rgb(249 115 22 / 18%)",
        "neon-red": "0 0 24px rgb(239 68 68 / 18%)",
      },
    },
  },
};

export default config;
