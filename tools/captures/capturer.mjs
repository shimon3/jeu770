// Captures du jeu avec le vrai processeur graphique (Chrome installé).
// Usage : node tools/captures/capturer.mjs <url> <dossier>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const dossier = process.argv[3] || 'test-results/captures'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
if (process.env.NIVEAU) await p.addInitScript((n) => localStorage.setItem('770-brooklyn-graphismes', n), process.env.NIVEAU)
const erreurs = []
p.on('response', (r) => r.status() >= 400 && erreurs.push(r.status() + ' ' + r.url()))
p.on('pageerror', (e) => erreurs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()))
const t0 = Date.now()
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 120000 })
const pret = Date.now() - t0
await p.screenshot({ path: `${dossier}/00-accueil.png` })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.waitForTimeout(2500)
const seul = process.env.VUE
const vues = [
  ['01-depart', null],
  ['02-facade', [4, 0.9, 16, 0]],
  ['03-rue-ouest', [-20, 0.9, 9, 1.57]],
  ['04-magasins', [44, 0.9, 6, 0]],
  ['05-zal', [18, -3.3, -6, 0]],
  ['06-hall', [0, 0.9, -2, 0]],
  ['07-chaliah', [13, 0.9, 9.5, 0]],
  ['08-panneau', [-15, 0.9, 7.5, 0]],
]
for (const [nom, pos] of vues) {
  if (seul && !nom.startsWith(seul)) continue
  if (pos) await p.evaluate(([x, y, z, yaw]) => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(x, y, z, yaw) }, pos)
  await p.waitForTimeout(1800)
  await p.screenshot({ path: `${dossier}/${nom}.png` })
}
// Images par seconde mesurées sur 3 s dans la rue
await p.evaluate(() => window.__770.teleporter(7, 1, 10.5, 0))
await p.waitForTimeout(800)
const ips = await p.evaluate(() => new Promise((r) => { let n = 0; const t = performance.now(); const f = () => { n++; performance.now() - t < 3000 ? requestAnimationFrame(f) : r(Math.round(n / 3)) }; requestAnimationFrame(f) }))
const q = await p.evaluate(() => ({ appels: window.__770.gl.info.render.calls, triangles: window.__770.gl.info.render.triangles }))
console.log(JSON.stringify({ pretMs: pret, ips, q, erreurs: erreurs.slice(0, 8) }, null, 1))
await b.close()
