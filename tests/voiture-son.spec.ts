import { test, expect, type Page } from '@playwright/test'

// Compteur de vitesse, klaxon et haut-parleur du Mitzvah Tank (15/11/2026)
async function demarrer(page: Page) {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  await page.waitForFunction(() => !!(window as any).__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => (window as any).__770.store.getState().ecran === 'jeu')
}

test.describe('Voiture : compteur, klaxon, haut-parleur', () => {
  test.skip(({ isMobile }) => isMobile, 'un contrôle PC suffit')

  test('dans le tank : compteur, N allume et éteint le niggoun, H klaxonne', async ({ page }) => {
    test.setTimeout(400_000)
    const erreurs: string[] = []
    page.on('pageerror', (e) => erreurs.push(String(e)))
    await demarrer(page)
    await page.evaluate(() => {
      const w = window as any
      w.__770.store.getState().set({ pause: false, panneau: null, siege: null })
      w.__770.teleporter(6.5, 0.9, 11.8)
    })
    await page.waitForTimeout(2500)
    // Monter dans le tank directement (la touche E est couverte par mission-tank.spec)
    await page.evaluate(() => (window as any).__770.store.getState().interactifs.get('mitzvah-tank').action())
    await expect.poll(() => page.evaluate(() => (window as any).__770.store.getState().auVolant)).toBe('mitzvah-tank')
    await expect(page.locator('.hud-compteur')).toBeVisible()
    // Accélérer jusqu'à ce que le compteur bouge (lent sans GPU : on tient la touche)
    await page.keyboard.down('KeyW')
    await expect.poll(async () => Number(await page.locator('.hud-compteur-valeur').textContent()), { timeout: 60_000 }).toBeGreaterThan(0)
    await page.keyboard.up('KeyW')
    await page.keyboard.press('KeyN')
    const hp = () => page.evaluate(async () => (await import('/src/audio/vehicule.ts')).hautParleurActif())
    await expect.poll(hp).toBe(true)
    await page.keyboard.press('KeyH')
    await page.keyboard.press('KeyN')
    await expect.poll(hp).toBe(false)
    await page.keyboard.press('KeyE')
    await expect.poll(() => page.evaluate(() => (window as any).__770.store.getState().auVolant)).toBeNull()
    await expect(page.locator('.hud-compteur')).toBeHidden()
    expect(erreurs).toEqual([])
  })
  test('joystick : on pousse là où l\'on veut aller, vers le bas = marche arrière', async ({ page }) => {
    test.setTimeout(400_000)
    await demarrer(page)
    await page.evaluate(() => {
      const w = window as any
      w.__770.store.getState().set({ pause: false, panneau: null, siege: null })
      w.__770.teleporter(-13, 0.9, 11.8)
    })
    await page.waitForTimeout(2500)
    await page.evaluate(() => (window as any).__770.store.getState().interactifs.get('voiture-conduite').action())
    await expect.poll(() => page.evaluate(() => (window as any).__770.store.getState().auVolant)).toBe('voiture-conduite')
    const cap0 = await page.evaluate(() => (window as any).__conduite.cap)
    // Joystick poussé en haut à gauche : la voiture avance et tourne à gauche
    await page.evaluate(async () => {
      const m = await import('/src/player/entrees.ts')
      Object.assign(m.joystick, { actif: true, x: -0.6, y: 0.8 })
    })
    await expect.poll(() => page.evaluate(() => (window as any).__conduite.vitesse), { timeout: 30_000 }).toBeGreaterThan(1)
    await expect.poll(async () => (await page.evaluate(() => (window as any).__conduite.cap)) - cap0, { timeout: 30_000 }).toBeGreaterThan(0.05)
    // Joystick vers le bas : freinage puis marche arrière
    await page.evaluate(async () => {
      const m = await import('/src/player/entrees.ts')
      Object.assign(m.joystick, { actif: true, x: 0, y: -1 })
    })
    await expect.poll(() => page.evaluate(() => (window as any).__conduite.vitesse), { timeout: 60_000 }).toBeLessThan(-0.5)
    await page.evaluate(async () => {
      const m = await import('/src/player/entrees.ts')
      Object.assign(m.joystick, { actif: false, x: 0, y: 0 })
    })
  })
})
