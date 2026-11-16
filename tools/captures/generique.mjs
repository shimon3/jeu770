// Image du générique : vues de la façade du 770 rendues par le jeu lui-même
// (aucune photo, aucun portrait). Usage : node tools/captures/generique.mjs <url> <dossier>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const dossier = process.argv[3] || 'test-results/generique'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1700,1000', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.addInitScript(() => { localStorage.clear(); localStorage.setItem('770-brooklyn-graphismes', 'haute') })
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 120000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
// Le joueur reste près (PNJ animés, ombres) mais hors champ
await p.evaluate(() => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(-3, 0.9, 30) })
await p.waitForTimeout(5000)
const vues = [
  ['e', [-6.5, 1.55, 15.5], [0.6, 5.3, -3], 47],
  ['f', [-5, 1.5, 17.5], [0.4, 5.6, -3], 42],
  ['g', [-7.5, 1.6, 14], [1.2, 5.0, -3], 50],
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
    // Sans les flèches de suivi (matériau doré lumineux)
    const caches = []
    w.scene.traverse((o) => { if (o.isMesh && o.visible && o.material?.color?.getHexString?.() === 'ffd23a') { o.visible = false; caches.push(o) } })
    w.gl.setRenderTarget(null)
    w.gl.render(w.scene, cam)
    const url = w.gl.domElement.toDataURL('image/jpeg', 0.86)
    for (const o of caches) o.visible = true
    return url
  }, [pos, cible, fov])
  fs.writeFileSync(`${dossier}/${nom}.jpg`, Buffer.from(img.split(',')[1], 'base64'))
  await p.waitForTimeout(300)
}
console.log('fait')
await b.close()
