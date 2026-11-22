// Parcours automatique des nouvelles missions de la rue (vrai Chrome, vrai
// processeur graphique). Usage : node tools/captures/verifier-missions.mjs [url]
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5198/?outils=1'
const dossier = 'test-results/missions'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const erreurs = []
p.on('pageerror', (e) => erreurs.push(String(e)))
await p.addInitScript(() => localStorage.clear())
await p.goto(url)
await p.waitForFunction(() => { const b = document.querySelector('.accueil button.principal'); return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.waitForTimeout(3000)

const etat = () => p.evaluate(() => { const s = window.__770.store.getState(); return { cible: s.cible, missions: s.missions, dollars: s.dollars, inv: s.inventaire, panneau: s.panneau?.type ?? null } })
const aller = async (x, y, z) => { await p.evaluate(([x, y, z]) => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null, siege: null }); w.teleporter(x, y, z) }, [x, y, z]); await p.waitForTimeout(700) }
const attendre = async (texte, test, ms = 15000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (test(await etat())) { console.log('OK  ', texte); return true } await p.waitForTimeout(200) }
  console.log('ÉCHEC', texte, JSON.stringify(await etat()).slice(0, 400)); process.exitCode = 1; return false
}
const e = async () => { await p.keyboard.press('KeyE'); await p.waitForTimeout(300) }
const parlerChaliah = async () => {
  await aller(-22.5, 0.9, 6.9)
  await attendre('chalia\'h à portée', (s) => s.cible === 'pnj-chaliah')
  await e()
}

// 1. Pièces de tsedaka
await parlerChaliah()
await attendre('mission pièces démarrée', (s) => s.missions['pieces-tsedaka']?.etat === 'active' && s.panneau === 'dialogue')
await p.screenshot({ path: `${dossier}/1-dialogue.png` })
await e()
const pieces = [[-39, 5.2], [-26, 7.4], [-18, 4.8], [-12, 7.0], [11, 8.9], [15.5, 4.6], [28, 6.8], [35, 5.0]]
await aller(pieces[0][0] + 4, 0.9, pieces[0][1] + 3)
await p.waitForTimeout(800)
await p.screenshot({ path: `${dossier}/2-piece-balise.png` })
for (const [i, [x, z]] of pieces.entries()) {
  await aller(x, 0.9, z)
  if (i < 7) await attendre(`pièce ${i + 1}/8`, (s) => s.missions['pieces-tsedaka']?.compte === i + 1)
}
await attendre('8 pièces : étape pouchké, tsedaka en poche', (s) => s.missions['pieces-tsedaka']?.etape === 1 && s.inv.includes('tsedaka'))
await aller(-0.9, 1.3, -1.3)
await attendre('pouchké à portée', (s) => s.cible === 'pouchke')
await p.screenshot({ path: `${dossier}/3-pouchke.png` })
await e()
await attendre('tsedaka donnée : étape retour', (s) => s.missions['pieces-tsedaka']?.etape === 2)
await parlerChaliah()
await attendre('mission pièces terminée (+5 $), affiches démarrée', (s) => s.missions['pieces-tsedaka']?.etat === 'terminee' && s.dollars === 10 && s.missions['affiches-farbrenguen']?.etat === 'active')
await e()

// 2. Affiches
for (const [i, [x, z]] of [[-15, 3.4], [-40, 3.4], [31, 3.4]].entries()) {
  await aller(x, 0.9, z + 1.2)
  await attendre(`panneau ${i + 1} à portée`, (s) => s.cible === `affiche-${i + 1}`)
  await e()
  await p.waitForTimeout(400)
  if (i === 0) await p.screenshot({ path: `${dossier}/4-affiche.png` })
}
await attendre('3 affiches : étape retour', (s) => s.missions['affiches-farbrenguen']?.etape === 1)
await parlerChaliah()
await attendre('mission affiches terminée (+4 $), plaques démarrée', (s) => s.missions['affiches-farbrenguen']?.etat === 'terminee' && s.dollars === 14 && s.missions['plaques-770']?.etat === 'active')
await e()

// 3. Plaques : première plaque (près du bureau)
await aller(-2.6, 1.3, -1.9)
await attendre('plaque du bureau à portée', (s) => s.cible === 'plaque-bureau')
await e()
await attendre('plaque lue : étape suivante', (s) => s.missions['plaques-770']?.etape === 1)
await e()

// Plan et journal
await aller(7, 1, 10.5)
await p.keyboard.press('KeyM')
await p.waitForTimeout(600)
await p.screenshot({ path: `${dossier}/5-plan.png` })
await p.keyboard.press('KeyM')
await p.keyboard.press('KeyJ')
await p.waitForTimeout(400)
await p.screenshot({ path: `${dossier}/6-journal.png` })
// Sauvegarde relue
const sauv = await p.evaluate(() => JSON.parse(localStorage.getItem('770-brooklyn-sauvegarde-v1') || 'null'))
console.log(sauv?.missions?.['affiches-farbrenguen']?.etat === 'terminee' ? 'OK   sauvegarde à jour' : 'ÉCHEC sauvegarde')
console.log('erreurs de page :', erreurs.length ? erreurs.slice(0, 5) : 'aucune')
await b.close()
