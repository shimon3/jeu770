import { test, expect, type Page, type CDPSession } from '@playwright/test'

// Ergonomie mobile du jeu, en ÉMULATION tactile Chromium (voir
// playwright.config.ts). Le serveur de développement expose `window.__770`
// (téléportation, état), absent du build de production.

type Rect = { left: number; top: number; right: number; bottom: number; nom: string }

declare global {
  interface Window {
    __770: any
    __verrous: number
  }
}

const estPc = (nom: string) => nom.startsWith('pc')
const portraitPrincipal = 'portrait-360x641'

async function demarrer(page: Page) {
  // Compte les demandes de verrouillage du pointeur
  await page.addInitScript(() => {
    window.__verrous = 0
    const orig = Element.prototype.requestPointerLock
    Element.prototype.requestPointerLock = function (...a: unknown[]) {
      window.__verrous++
      // @ts-expect-error appel d'origine
      return orig.apply(this, a)
    }
    try {
      localStorage.clear()
    } catch {
      /* stockage indisponible */
    }
  })
  await page.goto('/')
  await page.waitForFunction(() => !!window.__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => window.__770.store.getState().ecran === 'jeu')
}

async function etat<T>(page: Page, f: string): Promise<T> {
  return page.evaluate(f) as Promise<T>
}

async function rect(page: Page, sel: string): Promise<Rect[]> {
  return page.$$eval(sel, (els, s) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null || getComputedStyle(e).position === 'fixed')
      .map((e, i) => {
        const r = e.getBoundingClientRect()
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, nom: `${s}#${i}` }
      }),
  sel)
}

const chevauche = (a: Rect, b: Rect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1

async function verifierDisposition(page: Page) {
  const vp = page.viewportSize()!
  const joy = await rect(page, '.joystick-base')
  const btns = await rect(page, '.tbtn')
  const menu = await rect(page, '.tactile-menu')
  const hud = [...(await rect(page, '.hud-zone')), ...(await rect(page, '.hud-mission'))]
  expect(joy.length).toBe(1)
  expect(btns.length).toBeGreaterThanOrEqual(4)
  expect(menu.length).toBe(1)
  // Tout dans le viewport
  for (const r of [...joy, ...btns, ...menu, ...hud]) {
    expect(r.left, r.nom).toBeGreaterThanOrEqual(0)
    expect(r.top, r.nom).toBeGreaterThanOrEqual(0)
    expect(r.right, r.nom).toBeLessThanOrEqual(vp.width + 0.5)
    expect(r.bottom, r.nom).toBeLessThanOrEqual(vp.height + 0.5)
  }
  // Aucun chevauchement entre commandes et HUD
  const commandes = [...joy, ...btns, ...menu]
  for (let i = 0; i < commandes.length; i++) for (let j = i + 1; j < commandes.length; j++) expect(chevauche(commandes[i], commandes[j]), `${commandes[i].nom} / ${commandes[j].nom}`).toBe(false)
  for (const c of commandes) for (const h of hud) expect(chevauche(c, h), `${c.nom} / ${h.nom}`).toBe(false)
}

// --- Gestes tactiles multipoints via le protocole Chrome DevTools ---
type Point = { x: number; y: number; id: number }
async function toucher(cdp: CDPSession, type: 'touchStart' | 'touchMove' | 'touchEnd', points: Point[]) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id })) })
}
async function centreJoystick(page: Page) {
  const [b] = await rect(page, '.joystick-base')
  return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, r: (b.right - b.left) / 2 }
}
async function pousserJoystick(page: Page, cdp: CDPSession, dx: number, dy: number, ms: number) {
  const c = await centreJoystick(page)
  await toucher(cdp, 'touchStart', [{ x: c.x, y: c.y, id: 1 }])
  await toucher(cdp, 'touchMove', [{ x: c.x + dx * c.r, y: c.y + dy * c.r, id: 1 }])
  await page.waitForTimeout(ms)
  await toucher(cdp, 'touchEnd', [])
}
const pos = (page: Page) => etat<[number, number, number]>(page, 'window.__770.joueur.position.slice()')
async function teleporter(page: Page, x: number, y: number, z: number, yaw = 0) {
  await page.evaluate(([x, y, z, yaw]) => {
    const s = window.__770.store.getState()
    s.set({ pause: false, panneau: null, siege: null })
    window.__770.teleporter(x, y, z)
    window.__770.etat.yaw = yaw
    window.__770.etat.tSouris = performance.now() + 1e6 // pas de recentrage automatique pendant le test
  }, [x, y, z, yaw])
  await page.waitForTimeout(600)
}

test.describe('Commandes tactiles', () => {
  test('disposition dans le viewport, sans chevauchement (FR puis HE)', async ({ page }, info) => {
    test.skip(estPc(info.project.name), 'mobile uniquement')
    await demarrer(page)
    await verifierDisposition(page)
    await page.evaluate(() => window.__770.store.getState().set({ langue: 'he' }))
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await verifierDisposition(page)
    // Dans le grand Zal, l'étiquette de zone est plus longue (badges)
    await teleporter(page, 22.1, -2.5, -6.0)
    await expect.poll(() => etat<string>(page, 'window.__770.store.getState().zone')).toBe('grand-zal')
    await verifierDisposition(page)
    await page.evaluate(() => window.__770.store.getState().set({ langue: 'fr' }))
    await verifierDisposition(page)
    // Invite d'interaction : au-dessus des commandes
    await page.evaluate(() => window.__770.store.getState().set({ langue: 'fr' }))
    await teleporter(page, 2.6, 0.9, 8.1)
    await expect(page.locator('.hud-action')).toBeVisible()
    const [invite] = await rect(page, '.hud-action')
    for (const c of [...(await rect(page, '.joystick-base')), ...(await rect(page, '.tbtn'))]) expect(chevauche(invite, c), c.nom).toBe(false)
    await page.screenshot({ path: `test-results/${info.project.name}.png` })
  })

  test('aucun verrouillage du pointeur, pas de pause au démarrage', async ({ page }, info) => {
    test.skip(estPc(info.project.name), 'mobile uniquement')
    await demarrer(page)
    // Tapotements réels : sur la zone caméra, puis tout en haut (directement sur la scène 3D)
    const vp = page.viewportSize()!
    await page.touchscreen.tap(vp.width * 0.75, vp.height * 0.6)
    await page.touchscreen.tap(vp.width / 2, 60)
    await page.waitForTimeout(300)
    expect(await etat<number>(page, 'window.__verrous')).toBe(0)
    expect(await etat<boolean>(page, 'window.__770.store.getState().pause')).toBe(false)
  })

  test('joystick dans les 4 directions', async ({ page }, info) => {
    test.skip(info.project.name !== portraitPrincipal && info.project.name !== 'paysage-641x360', 'tests fonctionnels sur deux formats')
    await demarrer(page)
    const cdp = await page.context().newCDPSession(page)
    // yaw 0 : la caméra regarde vers -z ; haut = -z, droite = +x
    const cas: [string, number, number, number, number][] = [
      ['haut', 0, -1, 2, -1],
      ['bas', 0, 1, 2, 1],
      ['droite', 1, 0, 0, 1],
      ['gauche', -1, 0, 0, -1],
    ]
    for (const [nom, dx, dy, axe, signe] of cas) {
      await teleporter(page, -20, 0.9, 9.0)
      const a = await pos(page)
      await pousserJoystick(page, cdp, dx, dy, 1500)
      const b = await pos(page)
      expect((b[axe] - a[axe]) * signe, `direction ${nom}`).toBeGreaterThan(0.4)
    }
    // Relâché : le joystick revient au centre et le joueur s'arrête
    expect(await etat<boolean>(page, 'document.querySelector(".joystick-bouton").style.transform.includes("0px, 0px")')).toBe(true)
    const a = await pos(page)
    await page.waitForTimeout(800)
    const b = await pos(page)
    expect(Math.hypot(b[0] - a[0], b[2] - a[2])).toBeLessThan(0.05)
  })

  test('caméra au doigt, et joystick + caméra avec deux doigts', async ({ page }, info) => {
    test.skip(info.project.name !== portraitPrincipal && info.project.name !== 'paysage-641x360', 'tests fonctionnels sur deux formats')
    await demarrer(page)
    const cdp = await page.context().newCDPSession(page)
    const vp = page.viewportSize()!
    await teleporter(page, -20, 0.9, 9.0)
    const y0 = await etat<number>(page, 'window.__770.etat.yaw')
    const cx = vp.width * 0.75
    const cy = vp.height * 0.55
    await toucher(cdp, 'touchStart', [{ x: cx, y: cy, id: 2 }])
    for (let i = 1; i <= 8; i++) await toucher(cdp, 'touchMove', [{ x: cx - i * 10, y: cy, id: 2 }])
    await toucher(cdp, 'touchEnd', [])
    await page.waitForTimeout(400)
    expect(Math.abs((await etat<number>(page, 'window.__770.etat.yaw')) - y0)).toBeGreaterThan(0.2)
    // Deux doigts simultanés
    const j = await centreJoystick(page)
    const a = await pos(page)
    const y1 = await etat<number>(page, 'window.__770.etat.yaw')
    await toucher(cdp, 'touchStart', [{ x: j.x, y: j.y, id: 3 }])
    await toucher(cdp, 'touchMove', [{ x: j.x, y: j.y - j.r, id: 3 }])
    await toucher(cdp, 'touchStart', [
      { x: j.x, y: j.y - j.r, id: 3 },
      { x: cx, y: cy, id: 4 },
    ])
    for (let i = 1; i <= 10; i++) {
      await toucher(cdp, 'touchMove', [
        { x: j.x, y: j.y - j.r, id: 3 },
        { x: cx + i * 8, y: cy, id: 4 },
      ])
      await page.waitForTimeout(80)
    }
    await toucher(cdp, 'touchEnd', [])
    const b = await pos(page)
    expect(Math.hypot(b[0] - a[0], b[2] - a[2]), 'déplacement pendant la rotation').toBeGreaterThan(0.4)
    expect(Math.abs((await etat<number>(page, 'window.__770.etat.yaw')) - y1), 'rotation pendant le déplacement').toBeGreaterThan(0.2)
  })

  test('boutons E, F, V, J, menu et reprise ; saut seulement là où il est permis', async ({ page }, info) => {
    test.skip(info.project.name !== portraitPrincipal && info.project.name !== 'paysage-641x360', 'tests fonctionnels sur deux formats')
    await demarrer(page)
    const S = 'window.__770.store.getState()'
    // E : parler au PNJ du trottoir (démarre une mission, sauvegardée)
    await teleporter(page, -2.6, 0.9, 8.9)
    await expect.poll(() => etat<string | null>(page, `${S}.cible`)).toBe('pnj-trottoir')
    await page.locator('.tbtn[data-action="e"]').tap()
    expect(await etat<string>(page, `${S}.panneau && ${S}.panneau.type`)).toBe('dialogue')
    // Le panneau couvre l'écran : on le ferme avec son bouton, comme un joueur
    await page.locator('.panneau button').tap()
    expect(await etat<unknown>(page, `${S}.panneau`)).toBeNull()
    expect(await etat<string>(page, 'localStorage.getItem("770-brooklyn-sauvegarde-v1")')).toContain('decouvrir-770')
    // J : journal
    await page.locator('.tbtn[data-action="j"]').tap()
    expect(await etat<string>(page, `${S}.panneau && ${S}.panneau.type`)).toBe('journal')
    await page.locator('.panneau button').tap()
    // V : vue
    await page.locator('.tbtn[data-action="v"]').tap()
    expect(await etat<string>(page, `${S}.vue`)).toBe('1re')
    await page.locator('.tbtn[data-action="v"]').tap()
    expect(await etat<string>(page, `${S}.vue`)).toBe('3e')
    // F : ouvrir la porte du 770 avec E, la fermer avec F
    await teleporter(page, 0, 1.9, 1.0)
    await expect.poll(() => etat<string | null>(page, `${S}.cible`)).toBe('porte-principale')
    await page.locator('.tbtn[data-action="e"]').tap()
    await expect.poll(() => etat<string>(page, `${S}.interactifs.get("porte-principale").labelCle()`)).toBe('Fermer la porte')
    await page.locator('.tbtn[data-action="f"]').tap()
    await expect.poll(() => etat<string>(page, `${S}.interactifs.get("porte-principale").labelCle()`)).toBe('Ouvrir la porte')
    // Saut : présent dehors, absent dans le grand Zal (lieu de calme)
    await expect(page.locator('.tbtn[data-action="saut"]')).toBeVisible()
    await teleporter(page, 22.1, -2.5, -6.0)
    await expect.poll(() => etat<string>(page, `${S}.zone`)).toBe('grand-zal')
    await expect(page.locator('.tbtn[data-action="saut"]')).toHaveCount(0)
    // Menu puis reprise
    await page.locator('.tactile-menu').tap()
    expect(await etat<boolean>(page, `${S}.pause`)).toBe(true)
    await page.getByRole('button', { name: 'Reprendre' }).tap()
    expect(await etat<boolean>(page, `${S}.pause`)).toBe(false)
    await expect(page.locator('.joystick-base')).toBeVisible()
    expect(await etat<number>(page, 'window.__verrous')).toBe(0)
  })

  test('escalier du hall au joystick', async ({ page }, info) => {
    test.skip(info.project.name !== portraitPrincipal, 'un format suffit')
    await demarrer(page)
    const cdp = await page.context().newCDPSession(page)
    await teleporter(page, 2.45, 1.9, -1.4, 0)
    const a = await pos(page)
    await pousserJoystick(page, cdp, 0, -1, 5000)
    const b = await pos(page)
    expect(b[1] - a[1], 'montée').toBeGreaterThan(0.4)
  })
})

test('PC : aucune régression (pas de commandes tactiles, verrouillage demandé)', async ({ page }, info) => {
  test.skip(!estPc(info.project.name), 'PC uniquement')
  await demarrer(page)
  await expect(page.locator('.tactile')).toHaveCount(0)
  await expect(page.locator('.hud-aide')).toBeVisible()
  expect(await etat<number>(page, 'window.__verrous')).toBeGreaterThan(0)
})
