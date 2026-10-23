import { expect, test, type Page } from '@playwright/test';

/** Amène la visite à une progression précise d’une section épinglée. */
async function aller(page: Page, section: string, progression: number) {
  await page.waitForFunction(() => '__visite' in window);
  await page.evaluate(
    ([s, p]) =>
      (window as unknown as { __visite: { aller(s: string, p: number): void } }).__visite.aller(s, p),
    [section, progression] as const,
  );
}

test.describe('Page d’accueil', () => {
  test('affiche le message principal et toutes les sections, sans erreur', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('pageerror', (erreur) => erreurs.push(erreur.message));
    await page.goto('/');

    await expect(page).toHaveTitle('GLM · Architectes de la tech');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'On conçoit et on construit les systèmes numériques des entreprises.',
    );
    await expect(page.locator('h1')).toHaveCount(1);
    for (const id of ['ouverture', 'methode', 'projets', 'equipe', 'tascru', 'vision', 'contact']) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
    // Le chargeur s’efface et rend la main au défilement.
    await expect(page.locator('html')).not.toHaveClass(/chargement/, { timeout: 10_000 });
    expect(erreurs).toEqual([]);
  });

  test('présente les vrais projets avec leur description, sans exemple', async ({ page }) => {
    await page.goto('/');
    const cartes = page.locator('#anneau .projet');
    expect(await cartes.count()).toBeGreaterThan(0);
    await expect(page.locator('.projets__compte')).toHaveText(
      `01 / ${String(await cartes.count()).padStart(2, '0')}`,
    );
    for (const carte of await cartes.all()) {
      await expect(carte.locator('h3')).toHaveCount(1);
      await expect(carte.locator('.projet__description')).not.toBeEmpty();
      expect(await carte.locator('.projet__points li').count()).toBeGreaterThan(0);
      // Chaque carte montre une capture ou une illustration animée.
      expect(await carte.locator('img, svg[role="img"]').count()).toBeGreaterThan(0);
    }
    await expect(page.getByText('Exemple', { exact: true })).toHaveCount(0);
    await expect(page.locator('#anneau')).not.toContainText('[client]');
  });

  test('le survol d’une carte projet lance son animation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Survol testé sur desktop');
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/chargement/, { timeout: 10_000 });
    await aller(page, '#projets', 0.1);
    const carte = page.locator('#anneau .projet').first();
    await expect(carte).not.toHaveClass(/est-active/);
    await page.mouse.move(0, 0);
    const boite = await carte.boundingBox();
    if (!boite) throw new Error('Carte introuvable');
    await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
    await expect(carte).toHaveClass(/est-active/);
  });

  test('l’anneau des projets tourne avec le défilement', async ({ page }) => {
    await page.goto('/');
    await aller(page, '#projets', 0.05);
    await expect(page.locator('#compte')).toHaveText('01');
    await aller(page, '#projets', 0.95);
    const total = await page.locator('#anneau .projet').count();
    await expect(page.locator('#compte')).toHaveText(String(total).padStart(2, '0'));
  });

  test('présente la série vidéo « T’as cru ? » avec des miniatures d’épisodes', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#tascru');
    await expect(section.getByRole('heading', { level: 2 })).toContainText('T’as cru');
    await expect(section).toContainText('Une vidéo par jour');
    await expect(section.getByRole('img', { name: /^Miniature T’as cru/ })).toHaveCount(4);
    await expect(section.getByRole('link', { name: /Voir les vidéos sur LinkedIn/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/glmprime/',
    );
  });

  test('les photos de l’équipe sont floues, puis nettes au survol de la fiche', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Survol testé sur desktop');
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/chargement/, { timeout: 10_000 });
    await aller(page, '#equipe', 0.6);
    const fiche = page.locator('.associe').last();
    const photo = fiche.locator('img');
    await expect(fiche).toBeVisible();
    expect(await photo.evaluate((img) => getComputedStyle(img).filter)).toContain('blur(3px)');
    await fiche.locator('.associe__fiche').hover();
    await expect.poll(() => photo.evaluate((img) => getComputedStyle(img).filter)).toContain('blur(0px)');
  });

  test('propose un lien d’évitement au premier appui sur Tab', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Navigation clavier testée sur desktop');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  });

  test('ne charge aucune ressource d’un autre site', async ({ page }) => {
    const tiers: string[] = [];
    page.on('request', (requete) => {
      if (!requete.url().startsWith('http://127.0.0.1:4322')) tiers.push(requete.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(tiers).toEqual([]);
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('mouvement réduit : tout le contenu s’affiche à plat, sans 3D', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/statique/);
    await expect(page.locator('#chargeur')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Trois associés, une seule équipe.' })).toBeVisible();
  });

  test('les pages légales sont accessibles depuis le pied de page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pied').getByRole('link', { name: 'Mentions légales' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales');
    await page.goto('/confidentialite/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Politique de confidentialité');
  });
});

test.describe('Navigation mobile des pages de texte', () => {
  test('le menu s’ouvre, se ferme avec Échap et rend le focus au bouton', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Menu replié uniquement sur mobile');
    await page.goto('/mentions-legales/');
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
