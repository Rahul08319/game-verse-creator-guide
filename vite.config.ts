import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// YouTube Playables Content-Security-Policy header (for local CSP validation).
// This mirrors the policy enforced by YouTube when your game is served on platform.
// Override your locally served index.html with this header in Chrome DevTools overrides
// to catch CSP violations as early as possible:
//   Chrome → F12 → Sources → Overrides → Enable + add override for index.html
// Reference:
//   https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide
const YT_PLAYABLES_CSP = [
  "default-src 'none'",
  "script-src 'report-sample' 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.youtube.com/game_api/v0 https://www.youtube.com/game_api/v0/ https://www.youtube.com/game_api/v1 https://www.youtube.com/game_api/v1/",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
  "connect-src 'self' blob: data:",
  "sandbox allow-pointer-lock allow-same-origin allow-scripts",
  "base-uri 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Apply the Playables CSP in dev so you can catch violations locally.
      // To suppress in dev if it blocks your workflow, remove this block and
      // use Chrome DevTools Overrides for index.html only.
      "Content-Security-Policy": YT_PLAYABLES_CSP,
    },
  },
  preview: {
    headers: {
      "Content-Security-Policy": YT_PLAYABLES_CSP,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
}));
