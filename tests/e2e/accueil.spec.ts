import { expect, test } from '@playwright/test';

test.describe('Page d’accueil', () => {
  test('affiche le message principal et une structure de titres correcte', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('pageerror', (erreur) => erreurs.push(erreur.message));
    await page.goto('/');

    await expect(page).toHaveTitle('GLM · Architectes de la tech');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'On conçoit et on construit les systèmes numériques des entreprises.',
    );
    await expect(page.locator('h1')).toHaveCount(1);
    for (const titre of ['Expertises', 'Projets', 'Méthode', 'Équipe', 'Actualités', 'Vision', 'Contact']) {
      await expect(page.locator('section').filter({ hasText: titre }).first()).toBeVisible();
    }
    expect(erreurs).toEqual([]);
  });

  test('propose un lien d’évitement au premier appui sur Tab', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Navigation clavier testée sur desktop');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  });

  test('ne charge aucun contenu tiers sans consentement', async ({ page }) => {
    const tiers: string[] = [];
    page.on('request', (requete) => {
      if (!requete.url().startsWith('http://127.0.0.1:4322')) tiers.push(requete.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(tiers).toEqual([]);
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('les pages légales sont accessibles depuis le pied de page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Mentions légales' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales');
    await page.goto('/confidentialite/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Politique de confidentialité');
  });
});

test.describe('Navigation mobile', () => {
  test('le menu s’ouvre, se ferme avec Échap et rend le focus au bouton', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Menu replié uniquement sur mobile');
    await page.goto('/');
    const bouton = page.getByRole('button', { name: 'Menu' });
    await expect(bouton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeHidden();

    await bouton.click();
    await expect(page.getByRole('button', { name: 'Fermer' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(bouton).toHaveAttribute('aria-expanded', 'false');
    await expect(bouton).toBeFocused();
  });
});
