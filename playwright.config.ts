import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout sur le site construit (npm run build), servi par « astro preview ».
// Le script PHP n'est pas exécuté ici : ses réponses sont simulées (voir tests/php pour le serveur).

// CHROMIUM_PATH (facultatif) : utiliser un Chromium déjà installé plutôt que celui de Playwright.
const chemin = process.env['CHROMIUM_PATH'];
const launchOptions = chemin ? { executablePath: chemin } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions } },
  ],
  webServer: {
    command: 'npx astro preview --host 127.0.0.1 --port 4322 --ignore-lock',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: !process.env['CI'],
  },
});
