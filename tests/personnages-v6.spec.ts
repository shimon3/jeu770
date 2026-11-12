import { test, expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __770: any
    __avatarV6?: { clip: string; modele: string; etat: string; echelle: number; brasFermes: number; amplitudeBalancementBras: number; pistesBrasAdoucies: number; pistesMainsCourseFixees: number; courseCorrigeeSource: boolean; source: string }
    __pnjV6?: Map<string, { etat: string; vitesse: number; clip: string | null; brasFermes: number; pistesBrasAdoucies: number; pistesMainsCourseFixees: number }>
  }
}

async function demarrer(page: Page, recherche = '') {
  await page.addInitScript(() => localStorage.clear())
  await page.goto(`/${recherche}`)
  await page.waitForFunction(() => !!window.__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => window.__770.store.getState().ecran === 'jeu')
}

test.describe('Personnages hassidiques v6', () => {
  test.skip(({ isMobile }) => isMobile, 'un contrôle PC suffit')

  test('le joueur utilise v6sym et anime repos, marche et course', async ({ page }) => {
    await demarrer(page)
    await page.evaluate(() => {
      window.__770.teleporter(-20, 0.9, 9)
      window.__770.store.getState().set({ pause: false, panneau: null, siege: null })
    })

    await expect.poll(() => page.evaluate(() => window.__avatarV6?.modele)).toBe('v6sym')
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.clip)).toBe('Idle_11')
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.brasFermes)).toBe(2)
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.amplitudeBalancementBras)).toBe(0.3)
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.pistesBrasAdoucies)).toBe(8)
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.pistesMainsCourseFixees)).toBe(0)
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.courseCorrigeeSource)).toBe(true)
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.source)).toBe('/models/hasidic_man_v6_player.glb')

    await page.keyboard.down('KeyW')
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.clip), { timeout: 10_000 }).toBe('Walking')
    await page.keyboard.down('ShiftLeft')
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.clip), { timeout: 10_000 }).toBe('Running')
    await page.keyboard.up('KeyW')
    await page.keyboard.up('ShiftLeft')
    await expect.poll(() => page.evaluate(() => window.__avatarV6?.clip), { timeout: 10_000 }).toBe('Idle_11')
  })

  test('les 40 PNJ adultes utilisent v6sym avec des animations indépendantes', async ({ page }) => {
    await demarrer(page)
    await page.evaluate(() => {
      window.__770.teleporter(22.1, -2.5, -6)
      window.__770.store.getState().set({ pause: false, panneau: null, siege: null })
    })

    await expect.poll(() => page.evaluate(() => [...(window.__pnjV6?.keys() ?? [])].filter((id) => !id.includes('-voyageur-')).length), { timeout: 30_000 }).toBe(40)
    await expect.poll(() => page.evaluate(() => [...(window.__pnjV6?.values() ?? [])].every((p) => p.brasFermes === 2))).toBe(true)
    await expect.poll(() => page.evaluate(() => [...(window.__pnjV6?.values() ?? [])].every((p) => p.pistesBrasAdoucies === 12))).toBe(true)
    await expect.poll(() => page.evaluate(() => [...(window.__pnjV6?.values() ?? [])].every((p) => p.pistesMainsCourseFixees === 2))).toBe(true)
    // Les voyageurs du bus (rue/Bus.tsx) vont et viennent : non comptés
    const ids = await page.evaluate(() => [...(window.__pnjV6?.keys() ?? [])].filter((id) => !id.includes('-voyageur-')).sort())
    // 21 hommes qui étudient en havrouta (grand-zal/EtudeZal.tsx)
    const etude = Array.from({ length: 21 }, (_, k) => `etude-${k + 1}`)
    expect(ids).toEqual(
      [
        'adulte-rue-1',
        'adulte-rue-2',
        'adulte-rue-3',
        'adulte-rue-4',
        'pnj-assis-1',
        'pnj-assis-2',
        'pnj-assis-3',
        'pnj-assis-4',
        'pnj-balancement-1',
        'pnj-balancement-2',
        'pnj-entree-interieur',
        'pnj-entree-zal',
        'pnj-etudiant',
        'pnj-marcheur-1',
        'pnj-marcheur-2',
        'pnj-kiosque',
        'pnj-mivtsaim',
        'pnj-trottoir',
        'pnj-zal',
        ...etude,
      ].sort(),
    )
    await expect.poll(() => page.evaluate(() => [...(window.__pnjV6?.entries() ?? [])].filter(([id, p]) => !id.includes('-voyageur-') && p.etat === 'assis').length)).toBe(26)
    await expect.poll(() => page.evaluate(() => [...(window.__pnjV6?.values() ?? [])].filter((p) => p.etat === 'balancement').length)).toBe(2)
    await expect.poll(
      () => page.evaluate(() => [...(window.__pnjV6?.entries() ?? [])].filter(([, p]) => p.etat === 'marche' && p.clip === 'Walking').map(([id]) => id)),
      // 38 PNJ adultes en rendu logiciel (SwiftShader) : images lentes, marge large
      { timeout: 30_000 },
    ).not.toEqual([])
  })

  test('les paramètres de retour arrière conservent les anciens personnages', async ({ page }) => {
    await demarrer(page, '?avatar=ancien&pnj=ancien')
    await page.waitForTimeout(1000)
    expect(await page.evaluate(() => window.__avatarV6)).toBeUndefined()
    expect(await page.evaluate(() => [...(window.__pnjV6?.keys() ?? [])].filter((id) => !id.includes('-voyageur-')).length)).toBe(0)
  })
})
