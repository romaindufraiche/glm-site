import { expect, test, type Page } from '@playwright/test';

/** Décalage vertical actuel d’une carte projet (valeur de translateY, en pixels). */
const decalage = (page: Page, index: number) =>
  page
    .locator('[data-projets-item]')
    .nth(index)
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);

test.describe('Défilement des projets', () => {
  test('desktop : section épinglée, la colonne de projets monte', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Défilement épinglé réservé au desktop');
    await page.goto('/');
    await expect(page.locator('[data-projets]')).toHaveClass(/is-epingle/);

    const { debut, distance } = await page.evaluate(() => {
      const piste = document.querySelector<HTMLElement>('[data-projets-piste]');
      const scene = piste?.firstElementChild as HTMLElement | null;
      if (!piste || !scene) throw new Error('Section Projets introuvable');
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16;
      return {
        debut: piste.getBoundingClientRect().top + window.scrollY - nav,
        distance: piste.offsetHeight - scene.offsetHeight,
      };
    });
    expect(distance).toBeGreaterThan(0);

    await page.evaluate((y) => window.scrollTo(0, y), debut);
    await expect.poll(() => decalage(page, 0)).toBeGreaterThan(0);
    const depart = await decalage(page, 0);

    // À la fin du trajet : toute la colonne est montée d’un seul bloc.
    await page.evaluate((y) => window.scrollTo(0, y), debut + distance);
    await expect.poll(() => decalage(page, 0)).toBeLessThan(depart - 100);
    // Les deux décalages sont lus au même instant : l’inertie peut encore être en cours.
    const [premier, quatrieme] = await page.evaluate(() =>
      [0, 3].map((i) => {
        const el = document.querySelectorAll<HTMLElement>('[data-projets-item]')[i];
        return el ? new DOMMatrix(getComputedStyle(el).transform).m42 : NaN;
      }),
    );
    expect(quatrieme).toBeCloseTo(premier ?? NaN, 0);
    await expect(page.locator('#projets-titre')).toBeInViewport();

    // Au-delà, la page reprend son défilement normal.
    await page.evaluate((y) => window.scrollTo(0, y), debut + distance + 600);
    await expect(page.locator('#methode')).toBeInViewport();
  });

  test('chaque projet présente son besoin, ce qu’il fait et ce qu’il change', async ({ page }) => {
    await page.goto('/');
    const cartes = page.locator('[data-projets-item] article');
    const nombre = await cartes.count();
    expect(nombre).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < nombre; i++) {
      await expect(cartes.nth(i).locator('dt')).toHaveText([
        'Le besoin',
        'Ce qu’il fait',
        'Ce que ça change',
      ]);
      await expect(cartes.nth(i).getByRole('img')).toHaveCount(1);
    }
    await expect(page.locator('.carte__exemple')).toHaveCount(0);
  });

  test('mobile et mouvement réduit : grille simple, aucune animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#projets');
    await expect(page.locator('[data-projets]')).not.toHaveClass(/is-epingle/);
    expect(await decalage(page, 0)).toBe(0);
    await expect(page.locator('[data-projets-item]').first()).toBeVisible();
  });
});
