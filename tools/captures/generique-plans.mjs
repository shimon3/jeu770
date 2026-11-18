// Plans 2 à 4 du générique (18/11/2026) : vues rendues par le jeu lui-même
// (aucune photo, aucun portrait), en WebP 1600×900.
// Usage : node tools/captures/generique-plans.mjs <url> <dossier>
// Puis copier les fichiers voulus vers public/assets/generique-N.webp.
// L'URL peut forcer un soir de 'Hanouka (&hanouka=8) pour la hanoukia.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1&hanouka=8'
const dossier = process.argv[3] || 'test-results/generique-plans'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1700,1000', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.addInitScript(() => { localStorage.clear(); localStorage.setItem('770-brooklyn-graphismes', 'haute') })
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
// Joueur hors champ ; on laisse aux passants le temps de se répartir
await p.evaluate(() => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(-3, 0.9, 30) })
await p.waitForTimeout(Number(process.env.ATTENTE || 12000))
const vues = [
  // [nom, position caméra, point visé, fov]
  ['rue', [-21, 1.75, 9.4], [6, 2.2, 7.6], 55],
  ['hanoukia', [-3.5, 1.2, 15.5], [0, 5.6, 22], 50],
  ['maisons', [-36, 1.7, 13.5], [-52, 3.6, 3], 50],
]
for (const [nom, pos, cible, fov] of vues) {
  const img = await p.evaluate(([pos, cible, fov]) => {
    const w = window.__770
    const cam = w.camera.clone()
    cam.fov = fov
    cam.aspect = w.gl.domElement.width / w.gl.domElement.height
    cam.updateProjectionMatrix()
    cam.position.set(...pos)
    cam.lookAt(...cible)
    cam.updateMatrixWorld(true)
    // Sans les repères de mission (matériau doré lumineux)
    const caches = []
    w.scene.traverse((o) => { if (o.isMesh && o.visible && o.material?.color?.getHexString?.() === 'ffd23a') { o.visible = false; caches.push(o) } })
    w.gl.setRenderTarget(null)
    w.gl.render(w.scene, cam)
    const url = w.gl.domElement.toDataURL('image/webp', 0.78)
    for (const o of caches) o.visible = true
    return url
  }, [pos, cible, fov])
  fs.writeFileSync(`${dossier}/${nom}.webp`, Buffer.from(img.split(',')[1], 'base64'))
  await p.waitForTimeout(300)
}
console.log('fait')
await b.close()
