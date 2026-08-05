import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest config for the wholesale (and future) test suites.
 *
 *  - `jsdom` so React Testing Library can render components.
 *  - JSX is transformed by Vitest's built-in esbuild using the automatic runtime
 *    (React 19) — no @vitejs/plugin-react needed, which also sidesteps the
 *    Vite 6 (bundled by Vitest) vs. plugin-react (wants Vite 7) version clash.
 *  - `@/*` alias mirrors tsconfig so tests import the same way app code does.
 */
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    // Dummy public env so modules that construct a Supabase browser client at
    // import time (lib/supabase/client) don't throw. Tests mock the client, so
    // these values are never used for a real request.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
