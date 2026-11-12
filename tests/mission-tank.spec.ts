import { test, expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __770: any
    __conduite?: { active: boolean; vehicule: string | null; x: number; z: number; vitesse: number }
    __vehicules?: Record<string, (x: number, z: number) => void>
  }
}

async function demarrer(page: Page) {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  await page.waitForFunction(() => !!window.__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => window.__770.store.getState().ecran === 'jeu')
}

const etape = (page: Page) => page.evaluate(() => window.__770.store.getState().missions['mitzvah-tank'] ?? null)

test.describe('Mission « Mitzvah Tank »', () => {
  test.skip(({ isMobile }) => isMobile, 'un contrôle PC suffit')

  test('monter, trois arrêts avec chrono, retour devant le 770', async ({ page }) => {
    await demarrer(page)
    // Mission confiée (comme après le dialogue avec le responsable des mivtsaïm)
    await page.evaluate(() => {
      const s = window.__770.store.getState()
      s.set({ pause: false, panneau: null, siege: null, missions: { 'mitzvah-tank': { etat: 'active', etape: 0 } } })
      window.__770.teleporter(6.5, 0.9, 11.8)
    })
    await page.waitForTimeout(2500)
    await page.keyboard.press('KeyE')
    await expect.poll(() => etape(page), { timeout: 10_000 }).toEqual({ etat: 'active', etape: 1 })
    await expect.poll(() => page.evaluate(() => window.__conduite?.vehicule)).toBe('mitzvah-tank')
    await expect(page.locator('.chrono-mission')).toBeVisible()
    // Les trois arrêts puis le retour : le tank est posé dans chaque colonne
    const cibles: [number, number][] = [[-20, 13.4], [26, 25.8], [-40, 25.8], [5, 13.2]]
    for (let i = 0; i < cibles.length; i++) {
      await page.evaluate(([x, z]) => window.__vehicules!['mitzvah-tank'](x, z), cibles[i])
      if (i < 3) await expect.poll(() => etape(page), { timeout: 15_000 }).toEqual({ etat: 'active', etape: i + 2 })
    }
    await expect.poll(() => etape(page), { timeout: 15_000 }).toEqual({ etat: 'terminee', etape: 5 })
    await expect(page.locator('.chrono-mission')).toBeHidden()
  })

  test('chrono écoulé : la mission est remise à zéro', async ({ page }) => {
    await demarrer(page)
    await page.evaluate(() => window.__770.store.getState().set({ pause: false, missions: { 'mitzvah-tank': { etat: 'active', etape: 2 } } }))
    await expect(page.locator('.chrono-mission')).toBeVisible({ timeout: 10_000 })
    // Fin du chrono avancée dans le passé
    await page.evaluate(async () => {
      const m = await import('/src/missions/MissionTank.tsx')
      m.useChronoMission.setState({ fin: performance.now() - 1 })
    })
    await expect.poll(() => etape(page), { timeout: 10_000 }).toBeNull()
    await expect(page.locator('.chrono-mission')).toBeHidden()
  })
})
