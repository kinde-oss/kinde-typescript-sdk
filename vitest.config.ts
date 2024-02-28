import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ["*.ts"]
    },
    root: "./lib",
    // exclude: ["./lib/models"]
  },
  
})