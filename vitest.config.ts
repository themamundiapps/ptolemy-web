import { defineConfig } from "vitest/config";

// Next.js's own tsconfig.json sets "jsx": "preserve" for its SWC compiler,
// which esbuild (vitest's transform) can't parse -- override it here only
// for the test runner. Doesn't affect `next build`/`next dev`, which never
// read this file.
export default defineConfig({
  oxc: {
    jsx: "automatic",
  },
});
