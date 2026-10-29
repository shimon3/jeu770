import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const racine = path.resolve(import.meta.dirname, '../..')
const video = path.join(racine, 'artifacts', 'comparatif-run-avant-apres.mp4')
if (!fs.existsSync(video)) throw new Error(`Vidéo absente : ${video}`)

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
})

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.setContent(`
    <style>html,body{margin:0;background:#000;overflow:hidden}video{width:1280px;height:720px}</style>
    <video muted playsinline src="http://localhost:5179/artifacts/comparatif-run-avant-apres.mp4"></video>
  `)
  await page.waitForFunction(() => {
    const v = document.querySelector('video')
    return v && v.readyState >= 2 && Number.isFinite(v.duration)
  }, null, { timeout: 30_000 })
  const meta = await page.locator('video').evaluate((v) => ({
    duration: v.duration,
    width: v.videoWidth,
    height: v.videoHeight,
    error: v.error?.message ?? null,
  }))
  for (const [nom, temps] of [
    ['face-a', 0.8], ['face', 1.8], ['face-b', 2.8],
    ['profil-a', 4.4], ['profil', 5.8], ['profil-b', 6.9],
    ['dos-a', 8.4], ['dos', 9.8], ['dos-b', 11.1],
  ]) {
    await page.locator('video').evaluate((v, t) => new Promise((resolve, reject) => {
      v.currentTime = t
      v.onseeked = resolve
      v.onerror = () => reject(v.error)
    }), temps)
    await page.screenshot({ path: path.join(racine, 'artifacts', `mp4-verifie-${nom}.png`) })
  }
  const lecture = await page.locator('video').evaluate((v) => new Promise((resolve) => {
    v.currentTime = 0
    v.onended = () => resolve({ ended: v.ended, currentTime: v.currentTime, error: v.error?.message ?? null })
    v.play()
  }))
  console.log(JSON.stringify({ ...meta, lecture }, null, 2))
} finally {
  await browser.close()
}
