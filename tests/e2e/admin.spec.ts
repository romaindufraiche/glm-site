import { expect, test, type Page, type Route } from '@playwright/test';

// L'API PHP n'est pas exécutée ici : ses réponses sont simulées (voir tests/php/demos.test.php pour le serveur).
const demo = {
  slug: 'garage-dupre',
  client: 'Garage Dupré',
  url: 'https://demo.glmprime.com/garage-dupre/',
  modifieLe: 1_791_370_000,
  version: 2,
  taille: 2_400_000,
  auteur: 'romain',
};

const etatConnecte = (demos = [demo]) => ({
  ok: true,
  connecte: true,
  csrf: 'jeton-csrf',
  utilisateur: 'romain',
  modeleUrl: 'https://demo.glmprime.com/{slug}/',
  limiteEnvoi: '256M',
  demos,
});

async function simulerApi(page: Page, gerer: (route: Route, action: string) => Promise<void>) {
  await page.route('**/admin/api.php*', async (route) => {
    const requete = route.request();
    const action =
      requete.method() === 'GET' ? 'etat' : /name="action"\r\n\r\n(\w+)/.exec(requete.postData() ?? '')?.[1];
    await gerer(route, action ?? '');
  });
}

test.describe('Espace équipe', () => {
  test('le lien « Se connecter » de la navigation y mène', async ({ page, isMobile }) => {
    await simulerApi(page, (route) => route.fulfill({ json: { ok: true, connecte: false, csrf: 'x' } }));
    await page.goto('/');
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Démos clients');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('refuse un mot de passe incorrect puis ouvre le tableau de bord', async ({ page }) => {
    let connecte = false;
    let csrfRecu = '';
    await simulerApi(page, async (route, action) => {
      if (action === 'etat')
        return route.fulfill({
          json: connecte ? etatConnecte() : { ok: true, connecte: false, csrf: 'jeton-csrf' },
        });
      csrfRecu = route.request().headers()['x-csrf'] ?? '';
      if ((route.request().postData() ?? '').includes('mauvais')) {
        return route.fulfill({
          status: 401,
          json: { ok: false, message: 'Identifiant ou mot de passe incorrect.' },
        });
      }
      connecte = true;
      return route.fulfill({ json: { ok: true } });
    });
    await page.goto('/admin/');

    await page.getByLabel('Identifiant', { exact: true }).fill('romain');
    await page.getByLabel('Mot de passe', { exact: true }).fill('mauvais');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('alert')).toHaveText('Identifiant ou mot de passe incorrect.');
    expect(csrfRecu).toBe('jeton-csrf');

    await page.getByLabel('Mot de passe', { exact: true }).fill('bon-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Connecté en tant que romain')).toBeVisible();
    await expect(page.getByRole('link', { name: demo.url })).toHaveAttribute('href', demo.url);
    await expect(page.getByText('Taille maximale acceptée par l’hébergement : 256M.')).toBeVisible();
  });

  test('publie une archive et affiche le lien de la démo', async ({ page }) => {
    let demos: (typeof demo)[] = [];
    let corps = '';
    await simulerApi(page, async (route, action) => {
      if (action === 'etat') return route.fulfill({ json: etatConnecte(demos) });
      corps = route.request().postData() ?? '';
      demos = [
        {
          ...demo,
          client: 'Boulangerie Été',
          slug: 'boulangerie-ete',
          url: 'https://demo.glmprime.com/boulangerie-ete/',
          version: 1,
        },
      ];
      return route.fulfill({ json: { ok: true, demo: demos[0] } });
    });
    await page.goto('/admin/');

    await page.getByLabel('Nom du client').fill('Boulangerie Été');
    await expect(page.getByLabel('Identifiant dans l’adresse')).toHaveValue('boulangerie-ete');
    await expect(page.getByText('https://demo.glmprime.com/boulangerie-ete/')).toBeVisible();

    await page.getByRole('button', { name: 'Publier la démo' }).click();
    await expect(page.getByRole('alert')).toHaveText('Ajoutez l’archive .zip du site.');

    await page.getByLabel('Archive du site (.zip)').setInputFiles({
      name: 'site.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('PK'),
    });
    await page.getByRole('button', { name: 'Publier la démo' }).click();
    await expect(
      page.getByText('Démo « Boulangerie Été » en ligne : https://demo.glmprime.com/boulangerie-ete/'),
    ).toBeFocused();
    expect(corps).toContain('boulangerie-ete');
    expect(corps).toContain('filename="site.zip"');
    await expect(page.getByRole('list').getByText('Boulangerie Été')).toBeVisible();
  });

  test('« Mettre à jour » prérempli le formulaire et signale le remplacement', async ({ page }) => {
    await simulerApi(page, (route) => route.fulfill({ json: etatConnecte() }));
    await page.goto('/admin/');
    await page.getByRole('button', { name: 'Publier une nouvelle version de la démo Garage Dupré' }).click();
    await expect(page.getByLabel('Nom du client')).toHaveValue('Garage Dupré');
    await expect(page.getByLabel('Identifiant dans l’adresse')).toHaveValue('garage-dupre');
    await expect(page.getByText('remplace la version en ligne')).toBeVisible();
  });

  test('supprime une démo après confirmation', async ({ page }) => {
    let demos = [demo];
    await simulerApi(page, async (route, action) => {
      if (action === 'supprimer') demos = [];
      return route.fulfill({ json: action === 'etat' ? etatConnecte(demos) : { ok: true } });
    });
    await page.goto('/admin/');
    page.once('dialog', (dialogue) => dialogue.accept());
    await page.getByRole('button', { name: 'Supprimer la démo Garage Dupré' }).click();
    await expect(page.getByText('Démo « Garage Dupré » supprimée.')).toBeVisible();
    await expect(page.getByText('Aucune démo pour le moment.')).toBeVisible();
  });

  test('signale une configuration absente sur le serveur', async ({ page }) => {
    await simulerApi(page, (route) =>
      route.fulfill({
        status: 500,
        json: { ok: false, message: 'L’espace équipe n’est pas encore configuré.' },
      }),
    );
    await page.goto('/admin/');
    await expect(page.getByRole('alert')).toHaveText('L’espace équipe n’est pas encore configuré.');
  });
});
