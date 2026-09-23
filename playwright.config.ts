import { defineConfig } from "@playwright/test";

const external = process.env.TEST_BASE_URL;
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: ".test-results",
  use: {
    baseURL: external ?? "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  ...(external
    ? {}
    : {
        webServer: {
          command:
            "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
          url: "http://127.0.0.1:3100",
          reuseExistingServer: false,
          env: {
            OPENAI_API_KEY: "",
            OPENAI_MODEL: "",
            NEXT_TELEMETRY_DISABLED: "1",
          },
          timeout: 30000,
        },
      }),
});
