// Vues libres de la ville (caméra placée à la main, rendu du jeu lui-même).
// Usage : node tools/captures/vues-ville.mjs <url> <dossier>
// Chaque vue : [nom, position caméra, point visé, fov]. VUES=nom1,nom2 pour filtrer.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const dossier = process.argv[3] || 'test-results/ville'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript((n) => { localStorage.clear(); localStorage.setItem('770-brooklyn-graphismes', n) }, process.env.NIVEAU || 'haute')
const erreurs = []
p.on('response', (r) => r.status() >= 400 && erreurs.push(r.status() + ' ' + r.url()))
p.on('pageerror', (e) => erreurs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()))
const t0 = Date.now()
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 180000 })
const pret = Date.now() - t0
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.evaluate(() => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(-3, 0.9, 30) })
await p.waitForTimeout(6000)
const toutes = [
  ['ouest', [-30, 1.7, 15], [-55, 4, 2], 60],
  ['perron', [-48, 1.6, 9.5], [-44, 2.5, 1], 55],
  ['sud', [0, 1.7, 14], [0, 6, 64], 62],
  ['hanoukia', [0, 1.7, 13.5], [0, 4.5, 22], 55],
  ['angle-est', [52, 1.7, 14], [70, 6, 0], 60],
  ['trottoir', [-14, 1.7, 10.5], [10, 1.4, 8.6], 62],
  ['trottoir-est', [12, 1.7, 9.5], [50, 1.4, 9], 62],
  ['policier', [-5.6, 1.5, 12.6], [-7.6, 1.0, 10.4], 45],
  ['photo', [1.2, 1.5, 7.9], [1.2, 1.0, 10.3], 45],
  ['bochurs', [24.2, 1.5, 12.2], [24.1, 1.0, 9.2], 45],
  ['magasins', [50, 1.7, 13], [50, 2.6, 0], 60],
  ['voiture', [-42.5, 1.5, 16.5], [-46, 0.6, 13.2], 50],
  ['facade-sud', [-10, 1.7, 50], [-10, 6, 67], 60],
  ['tank', [9.5, 1.7, 18.5], [4, 1.2, 13.6], 55],
  ['chaussee', [-6, 1.7, 23.5], [14, 1, 33], 60],
]
const filtre = process.env.VUES?.split(',')
for (const [nom, pos, cible, fov] of toutes) {
  if (filtre && !filtre.includes(nom)) continue
  const img = await p.evaluate(([pos, cible, fov]) => {
    const w = window.__770
    const cam = w.camera.clone()
    cam.fov = fov
    cam.aspect = w.gl.domElement.width / w.gl.domElement.height
    cam.updateProjectionMatrix()
    cam.position.set(...pos)
    cam.lookAt(...cible)
    cam.updateMatrixWorld(true)
    w.gl.setRenderTarget(null)
    w.gl.render(w.scene, cam)
    return w.gl.domElement.toDataURL('image/jpeg', 0.85)
  }, [pos, cible, fov])
  fs.writeFileSync(`${dossier}/${nom}.jpg`, Buffer.from(img.split(',')[1], 'base64'))
}
await p.evaluate(() => window.__770.teleporter(7, 1, 10.5, 0))
await p.waitForTimeout(1500)
const ips = await p.evaluate(() => new Promise((r) => { let n = 0; const t = performance.now(); const f = () => { n++; performance.now() - t < 3000 ? requestAnimationFrame(f) : r(Math.round(n / 3)) }; requestAnimationFrame(f) }))
const q = await p.evaluate(() => ({ appels: window.__770.gl.info.render.calls, triangles: window.__770.gl.info.render.triangles }))
console.log(JSON.stringify({ pretMs: pret, ips, q, erreurs: erreurs.slice(0, 10) }, null, 1))
await b.close()
