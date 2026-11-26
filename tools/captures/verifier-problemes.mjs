// Vérification des corrections du 26/11/2026 (dossier problemes/) avec le
// vrai processeur graphique : nouveau joueur, foot des enfants, policier,
// discussions, tables du Zal, banderole, porte (E ouvre, F ferme).
// Usage : node tools/captures/verifier-problemes.mjs <url> <dossier>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const dossier = process.argv[3] || 'test-results/problemes'
const seul = process.env.VUE
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => localStorage.clear())
const erreurs = []
p.on('response', (r) => r.status() >= 400 && erreurs.push(r.status() + ' ' + r.url()))
p.on('pageerror', (e) => erreurs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()))
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.waitForTimeout(2500)

const aller = (x, y, z, yaw, cap) =>
  p.evaluate(([x, y, z, yaw, cap]) => {
    const w = window.__770
    w.store.getState().set({ pause: false, panneau: null })
    w.teleporter(x, y, z)
    if (yaw !== undefined && yaw !== null) w.etat.yaw = yaw
    if (cap !== undefined && cap !== null) w.etat.cap = cap
  }, [x, y, z, yaw, cap])
const photo = async (nom, attente = 1800) => {
  await p.waitForTimeout(attente)
  await p.screenshot({ path: `${dossier}/${nom}.png` })
}
const X = -53.6 // décalage du grand Zal

const vues = {
  joueur: async () => {
    await aller(4, 0.9, 15, 0, 0)
    await p.evaluate(() => (window.__770.etat.dist = 2.4))
    await photo('01-joueur-face', 2500)
    await aller(4, 0.9, 15, 0, Math.PI)
    await photo('02-joueur-dos')
    await p.keyboard.down('KeyW')
    await photo('03-joueur-marche', 900)
    await p.keyboard.down('ShiftLeft')
    await photo('04-joueur-course', 900)
    await p.keyboard.up('ShiftLeft')
    await p.keyboard.up('KeyW')
  },
  foot: async () => {
    await aller(-21, 0.9, 12.2, 0)
    await p.evaluate(() => (window.__770.etat.dist = 2.2))
    for (let i = 0; i < 4; i++) await photo(`10-foot-${i}`, 1500)
  },
  policier: async () => {
    await aller(0, 0.9, 13.5, 0)
    for (let i = 0; i < 3; i++) await photo(`20-policier-${i}`, 2500)
  },
  touriste: async () => {
    // Touriste foule-12 (x 56 → 32, z 10) : marche décontractée Meshy
    const pos = await p.evaluate(() => {
      let t = null
      window.__770.scene.traverse((o) => { if (!t && o.name === 'char1' && o.parent?.parent?.position && Math.abs(o.parent.parent.position.z - 10) < 0.3 && o.parent.parent.position.x > 30) t = o })
      return null
    })
    await aller(36, 0.9, 12.0, 0)
    await p.evaluate(() => (window.__770.etat.dist = 2))
    for (let i = 0; i < 4; i++) await photo(`25-touriste-${i}`, 1200)
  },
  hommes: async () => {
    await aller(-10, 0.9, 13, 0)
    for (let i = 0; i < 2; i++) await photo(`30-hommes-${i}`, 2500)
  },
  zal: async () => {
    await aller(21.5 + X, -2.5, -4, Math.PI)
    await photo('40-zal-tables', 3000)
    await aller(24 + X, -2.5, -10, 0)
    await p.evaluate(() => { window.__770.etat.pitch = 0.3; window.__770.etat.dist = 1.5 })
    await photo('41-zal-banderole', 4000)
    await aller(9.5 + X, -2.5, -16.5, -Math.PI / 2)
    await photo('42-zal-priere', 2500)
  },
  porte: async () => {
    // Collé à la porte du Zal (côté palier), E puis avancer vers le Zal
    await aller(21.6 + X, -2.5, -0.75, 0, Math.PI)
    await p.waitForTimeout(1500)
    const avant = await p.evaluate(() => [...window.__770.joueur.position])
    const cible = await p.evaluate(() => window.__770.store.getState().cible)
    await p.keyboard.press('KeyE')
    await p.waitForTimeout(1200)
    await photo('50-porte-ouverte', 200)
    const cibleApres = await p.evaluate(() => window.__770.store.getState().cible)
    await p.keyboard.down('KeyW')
    await p.waitForTimeout(1500)
    await p.keyboard.up('KeyW')
    const apres = await p.evaluate(() => [...window.__770.joueur.position])
    console.log('porte : cible avant E', cible, '| cible après E', cibleApres, '| z', avant[2].toFixed(2), '→', apres[2].toFixed(2))
    await p.keyboard.press('KeyF')
    await photo('51-porte-F', 1200)
  },
}
for (const [nom, f] of Object.entries(vues)) if (!seul || seul.split(',').includes(nom)) await f()
console.log('erreurs :', erreurs.length ? erreurs.slice(0, 10).join('\n') : 'aucune')
await b.close()
