import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e', timeout:60000, expect:{timeout:10000}, fullyParallel:false, workers:1,
  use:{baseURL:'http://localhost:5173',browserName:'chromium',viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],screenshot:'only-on-failure'},
  webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:!process.env.CI,timeout:30000},
});
