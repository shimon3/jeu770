import { defineConfig } from '@playwright/test'

// Tests d'ergonomie mobile en ÉMULATION tactile (Chromium). Ils ne
// remplacent pas un essai sur un vrai téléphone Android.
// Lancement : npm run test:mobile

const android = (width: number, height: number) => ({
  viewport: { width, height },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
})

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5179',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npx vite --port 5179 --strictPort',
    url: 'http://localhost:5179',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'portrait-360x641', use: android(360, 641) },
    { name: 'portrait-360x780', use: android(360, 780) },
    { name: 'portrait-375x667', use: android(375, 667) },
    { name: 'portrait-390x844', use: android(390, 844) },
    { name: 'paysage-641x360', use: android(641, 360) },
    { name: 'paysage-844x390', use: android(844, 390) },
    { name: 'pc-1280x720', use: { viewport: { width: 1280, height: 720 } } },
  ],
})
