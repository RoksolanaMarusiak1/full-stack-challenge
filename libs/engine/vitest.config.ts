import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run only the TypeScript sources. `tsc` (dev/build) also compiles the tests into
    // dist/, and without this filter every test would run twice.
    include: ["src/**/*.test.ts"],
  },
});
