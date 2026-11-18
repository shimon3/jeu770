// Promenade libre (19/11/2026) : le joueur posé en divers endroits de la ville
// reste debout sur un sol (ne tombe pas) et ne traverse pas les limites.
// Usage : node tools/captures/verifier-promenade.mjs <url>
import { chromium } from '@playwright/test'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => localStorage.clear())
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
const points = [
  ['chaussée centrale', 0, 35], ['terre-plein sud', 10, 48], ['contre-allée sud', -20, 54], ['trottoir sud', 0, 61],
  ['courette sud', 12, 65.5], ['rue transversale est', 90, 30], ['trottoir transversal ouest', -96, 10],
  ['bout ouest', -80, 8], ['bout est', 75, 9], ['trottoir devant magasins', 62, 9],
]
const res = []
for (const [nom, x, z] of points) {
  await p.evaluate(([x, z]) => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(x, 1.2, z) }, [x, z])
  await p.waitForTimeout(2500)
  const pos = await p.evaluate(() => [...window.__770.joueur.position])
  res.push({ nom, ok: pos[1] > -0.6 && pos[1] < 1.5, pos: pos.map((v) => Math.round(v * 100) / 100) })
}
for (const r of res) console.log((r.ok ? 'OK    ' : 'ECHEC ') + r.nom + ' ' + r.pos.join(' '))
await b.close()
