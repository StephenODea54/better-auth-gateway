import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import process from "node:process";
import { defineConfig } from "vite";

const config = defineConfig(({ command }) => ({
  plugins: [
    ...command === "serve" ? [devtools()] : [],
    nitro(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: { tsconfigPaths: true },
  server: {
    host: true,
    port: 3000,
    watch: process.env.VITE_USE_POLLING
      ? { interval: 300, usePolling: true }
      : undefined,
  },
}));

export default config;
