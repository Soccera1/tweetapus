#!/usr/bin/env bun

import("../src/index.js").catch((error) => {
  console.error("failed to start server:", error);
  process.exit(1);
});
