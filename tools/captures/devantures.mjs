// Captures des cinq devantures de magasins, en vue à la première personne.
// Usage : node tools/captures/devantures.mjs <url> <dossier>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const dossier = process.argv[3] || 'test-results/devantures'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const erreurs = []
p.on('pageerror', (e) => erreurs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()))
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 120000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.waitForTimeout(2000)
const aller = async (nom, pos) => {
  await p.evaluate(([x, y, z, yaw]) => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(x, y, z, yaw) }, pos)
  await p.waitForTimeout(1600)
  await p.screenshot({ path: `${dossier}/${nom}.png` })
}
// Vue d'ensemble (3e personne), puis chaque magasin de près (1re personne)
await aller('0-ensemble', [50, 0.9, 12, 0])
await p.keyboard.press('KeyV')
const L = 19.4 / 5
const noms = ['pizzeria', 'glacier', 'vetements', 'chemises', 'chapeaux']
for (let i = 0; i < 5; i++) await aller(`${i + 1}-${noms[i]}`, [40.2 + L * (i + 0.5) - 0.3, 0.9, 3.6, 0])
await aller('6-trottoir', [39.5, 0.9, 1.6, -1.2])
console.log(JSON.stringify({ erreurs: erreurs.slice(0, 8) }))
await b.close()
