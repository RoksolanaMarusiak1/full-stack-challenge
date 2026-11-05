import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Vite only exposes .env to the browser bundle. Server code (the engine reads
  // process.env.DATABASE_URL and PUBLIC_URL) needs the values in process.env too.
  const env = loadEnv(mode, "../..", "");
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }

  return {
    envDir: "../..",
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    ssr: {
      noExternal: ["@url-shortener/engine"],
    },
    optimizeDeps: {
      include: ["@url-shortener/engine"],
    },
  };
});
