import { expect, test, type Page } from '@playwright/test';

async function remplir(page: Page) {
  await page.getByLabel('Nom', { exact: true }).fill('Camille Martin');
  await page.getByLabel('E-mail', { exact: true }).fill('camille@entreprise.fr');
  await page.getByLabel('Sujet', { exact: true }).selectOption('Automatisation & IA');
  await page
    .getByLabel('Message', { exact: true })
    .fill('Bonjour, nous voulons automatiser nos relances clients.');
}

test.describe('Formulaire de contact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#contact');
  });

  test('affiche une erreur précise par champ et place le focus sur le premier', async ({ page }) => {
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByLabel('Nom', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Nom', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Indiquez votre nom.')).toBeVisible();
    await expect(page.getByText('Indiquez votre adresse e-mail.')).toBeVisible();
    await expect(page.getByText('Choisissez un sujet.')).toBeVisible();
    await expect(page.getByText('Écrivez votre message.')).toBeVisible();
    await expect(page.getByLabel('Entreprise (facultatif)', { exact: true })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await page.getByLabel('E-mail', { exact: true }).fill('camille@');
    await page.getByLabel('E-mail', { exact: true }).blur();
    await expect(page.getByText(/Saisissez une adresse e-mail valide/)).toBeVisible();
  });

  test('confirme l’envoi avec « Message envoyé »', async ({ page }) => {
    let corps = '';
    await page.route('**/contact.php', async (route) => {
      corps = route.request().postData() ?? '';
      await route.fulfill({ json: { ok: true } });
    });
    await remplir(page);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();

    await expect(page.getByText('Message envoyé')).toBeVisible();
    await expect(page.getByRole('status')).toBeFocused();
    expect(corps).toContain('camille@entreprise.fr');

    await page.getByRole('button', { name: 'Écrire un autre message' }).click();
    await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('');
  });

  test('affiche les erreurs renvoyées par le serveur', async ({ page }) => {
    await page.route('**/contact.php', (route) =>
      route.fulfill({
        status: 422,
        json: { ok: false, erreurs: { email: 'Adresse refusée par le serveur.' } },
      }),
    );
    await remplir(page);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Adresse refusée par le serveur.')).toBeVisible();
    await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
  });

  test('en cas d’échec, garde la saisie et propose l’e-mail direct', async ({ page }) => {
    await page.route('**/contact.php', (route) => route.fulfill({ status: 502, json: { ok: false } }));
    await remplir(page);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    const alerte = page.getByRole('alert');
    await expect(alerte).toContainText('n’a pas pu être envoyé');
    await expect(alerte).toContainText('Vous pouvez aussi nous écrire à');
    await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Camille Martin');
    await expect(page.getByRole('button', { name: 'Envoyer le message' })).toBeEnabled();
  });
});
