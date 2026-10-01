import {
  validerChamp,
  validerContact,
  type ChampContact,
  type DonneesContact,
} from '../lib/validation-contact';

/**
 * Formulaire de contact : validation au fil de la saisie, envoi sans rechargement,
 * états « envoi en cours », « erreur » (avec nouvel essai possible) et « Message envoyé ».
 * Sans JavaScript, le formulaire est envoyé normalement à contact.php, qui redirige
 * vers une page de confirmation ou d’erreur.
 */
const CHAMPS: ChampContact[] = ['nom', 'email', 'entreprise', 'sujet', 'message'];

interface ReponseServeur {
  ok: boolean;
  erreurs?: Partial<Record<ChampContact, string>>;
  message?: string;
}

function estReponseServeur(valeur: unknown): valeur is ReponseServeur {
  return (
    typeof valeur === 'object' && valeur !== null && typeof (valeur as { ok?: unknown }).ok === 'boolean'
  );
}

export function initFormulaireContact(): void {
  const racine = document.querySelector<HTMLElement>('[data-formulaire]');
  const form = racine?.querySelector<HTMLFormElement>('[data-formulaire-form]');
  const alerte = racine?.querySelector<HTMLElement>('[data-formulaire-alerte]');
  const succes = racine?.querySelector<HTMLElement>('[data-formulaire-succes]');
  const bouton = racine?.querySelector<HTMLButtonElement>('[data-formulaire-bouton]');
  const libelleBouton = racine?.querySelector<HTMLElement>('[data-formulaire-bouton-libelle]');
  if (!racine || !form || !alerte || !succes || !bouton || !libelleBouton) return;

  const libelleInitial = libelleBouton.textContent ?? 'Envoyer le message';
  const emailDirect = racine.closest('[data-email-direct]')?.getAttribute('data-email-direct') ?? '';

  const element = (champ: ChampContact) =>
    form.elements.namedItem(champ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

  const afficherErreur = (champ: ChampContact, message: string | undefined): void => {
    const el = element(champ);
    const zone = form.querySelector<HTMLElement>(`[data-erreur-pour="${champ}"]`);
    if (!el || !zone) return;
    zone.textContent = message ?? '';
    if (message) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  };

  const lireDonnees = (): DonneesContact => {
    const valeur = (champ: ChampContact) => element(champ)?.value ?? '';
    return {
      nom: valeur('nom'),
      email: valeur('email'),
      entreprise: valeur('entreprise'),
      sujet: valeur('sujet'),
      message: valeur('message'),
    };
  };

  const afficherAlerte = (message: string | null): void => {
    alerte.textContent = message ?? '';
    alerte.hidden = message === null;
  };

  const setEnvoi = (enCours: boolean): void => {
    bouton.disabled = enCours;
    bouton.setAttribute('aria-busy', String(enCours));
    libelleBouton.textContent = enCours ? 'Envoi en cours…' : libelleInitial;
  };

  // Validation au fil de l’eau : à la sortie d’un champ, puis à chaque frappe une fois l’erreur affichée.
  CHAMPS.forEach((champ) => {
    const el = element(champ);
    if (!el) return;
    el.addEventListener('blur', () => {
      if (el.value.trim() !== '' || el.hasAttribute('aria-invalid'))
        afficherErreur(champ, validerChamp(champ, el.value));
    });
    el.addEventListener('input', () => {
      if (el.hasAttribute('aria-invalid')) afficherErreur(champ, validerChamp(champ, el.value));
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    afficherAlerte(null);

    const erreurs = validerContact(lireDonnees());
    CHAMPS.forEach((champ) => afficherErreur(champ, erreurs[champ]));
    const premiereErreur = CHAMPS.find((champ) => erreurs[champ]);
    if (premiereErreur) {
      element(premiereErreur)?.focus();
      return;
    }

    setEnvoi(true);
    try {
      const reponse = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const corps: unknown = await reponse.json().catch(() => null);

      if (reponse.ok && estReponseServeur(corps) && corps.ok) {
        form.reset();
        form.hidden = true;
        succes.hidden = false;
        succes.focus();
        return;
      }

      if (estReponseServeur(corps) && corps.erreurs) {
        const erreursServeur = corps.erreurs;
        CHAMPS.forEach((champ) => afficherErreur(champ, erreursServeur[champ]));
        const premiere = CHAMPS.find((champ) => erreursServeur[champ]);
        if (premiere) element(premiere)?.focus();
        return;
      }

      const message =
        estReponseServeur(corps) && corps.message
          ? corps.message
          : 'Le message n’a pas pu être envoyé. Réessayez dans quelques instants.';
      throw new Error(message);
    } catch (erreur) {
      const base =
        erreur instanceof Error && erreur.message && !(erreur instanceof TypeError)
          ? erreur.message
          : 'Le message n’a pas pu être envoyé : vérifiez votre connexion et réessayez.';
      afficherAlerte(emailDirect ? `${base} Vous pouvez aussi nous écrire à ${emailDirect}.` : base);
      alerte.focus();
    } finally {
      setEnvoi(false);
    }
  });

  racine.querySelector<HTMLButtonElement>('[data-formulaire-nouveau]')?.addEventListener('click', () => {
    succes.hidden = true;
    form.hidden = false;
    element('nom')?.focus();
  });
}
