import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const racine = path.resolve(import.meta.dirname, '../..')
const destination = path.join(racine, 'artifacts')
fs.mkdirSync(destination, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.goto('http://localhost:5179/tools/run-review/index.html')
  await page.waitForFunction(() => window.__runReview?.ready, null, { timeout: 60_000 })

  for (const [nom, temps] of [['face', 1.8], ['profil', 5.8], ['dos', 9.8]]) {
    await page.evaluate((t) => window.__runReview.renderAt(t), temps)
    await page.screenshot({ path: path.join(destination, `comparatif-run-${nom}.png`) })
  }

  const telechargement = page.waitForEvent('download', { timeout: 30_000 })
  const meta = await page.evaluate(() => window.__runReview.enregistrer())
  const fichier = await telechargement
  const sortie = path.join(destination, fichier.suggestedFilename())
  await fichier.saveAs(sortie)
  console.log(JSON.stringify({ ...meta, sortie }, null, 2))
} finally {
  await browser.close()
}
