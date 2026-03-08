import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: "public/manifest.json",
          dest: ".",
        },
        {
          src: "../../packages/model/src/model/*",
          dest: "model",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      // "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src/"),
      "@workspace/model": path.resolve(__dirname, "../../packages/model/src"),
      "@workspace/audio-processing": path.resolve(
        __dirname,
        "../../packages/audio-processing/src",
      ),
      "@workspace/data": path.resolve(__dirname, "../../packages/data/src"),
      "@workspace/styles": path.resolve(__dirname, "../../packages/styles/src"),
      "@workspace/fonts": path.resolve(__dirname, "../../packages/fonts"),
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        main: "./index.html",
        sandbox: "./sandbox.html",
        offscreen: "./offscreen.html",
      },
    },
  },
});
