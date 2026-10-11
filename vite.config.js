import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

const plugins = [react()];

// Keep the Base44 dev plugin when this checkout is linked to a hosted app.
if (process.env.VITE_BASE44_APP_ID) {
  const { default: base44 } = await import("@base44/vite-plugin");
  plugins.unshift(
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === "true",
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true,
    })
  );
}

// Listen on every interface. The preview browser reaches this machine on its
// non-loopback address, so a 127.0.0.1-only bind is refused.
export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
});
