import path from "node:path";
import { defineConfig } from "vitest/config";

// Next.js's own tsconfig.json sets "jsx": "preserve" for its SWC compiler,
// which esbuild (vitest's transform) can't parse -- override it here only
// for the test runner. Doesn't affect `next build`/`next dev`, which never
// read this file.
export default defineConfig({
  oxc: {
    jsx: "automatic",
  },
  resolve: {
    // Mirrors tsconfig.json's "@/*" -> "./*" path mapping, which Next's own
    // build reads natively but Vitest doesn't -- every test so far has used
    // relative imports only, so this never came up until a test needed to
    // import a component that itself imports via "@/...".
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
