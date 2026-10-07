import {
  estEtatEspace,
  formaterDate,
  formaterTaille,
  messageErreur,
  slugDemo,
  slugValide,
  urlDemo,
  type Demo,
  type EtatEspace,
} from '../lib/demos';

/**
 * Espace équipe (/admin/) : connexion, publication d’une archive avec barre de progression,
 * liste des démos (copier le lien, mettre à jour, supprimer). Toutes les données passent par api.php.
 */
const API = '/admin/api.php';

interface Reponse {
  statut: number;
  corps: unknown;
}

function lireJson(texte: string): unknown {
  try {
    return JSON.parse(texte);
  } catch {
    return null;
  }
}

export function initEspaceEquipe(): void {
  const racine = document.querySelector<HTMLElement>('[data-admin]');
  if (!racine) return;
  const el = <T extends HTMLElement>(nom: string): T => {
    const trouve = racine.querySelector<T>(`[data-admin-${nom}]`);
    if (!trouve) throw new Error(`Élément manquant : data-admin-${nom}`);
    return trouve;
  };

  const chargement = el('chargement');
  const indisponible = el('indisponible');
  const connexion = el<HTMLFormElement>('connexion');
  const erreurConnexion = el('erreur-connexion');
  const boutonConnexion = el<HTMLButtonElement>('bouton-connexion');
  const tableau = el('tableau');
  const utilisateur = el('utilisateur');
  const deconnexion = el<HTMLButtonElement>('deconnexion');
  const publication = el<HTMLFormElement>('publication');
  const champClient = el<HTMLInputElement>('client');
  const champSlug = el<HTMLInputElement>('slug');
  const champArchive = el<HTMLInputElement>('archive');
  const apercu = el('apercu');
  const remplace = el('remplace');
  const limite = el('limite');
  const erreurPublication = el('erreur-publication');
  const boutonPublier = el<HTMLButtonElement>('bouton-publier');
  const progression = el<HTMLProgressElement>('progression');
  const progressionTexte = el('progression-texte');
  const succes = el('succes');
  const compte = el('compte');
  const vide = el('vide');
  const liste = el<HTMLUListElement>('liste');

  let csrf = '';
  let modeleUrl = 'https://demo.glmprime.com/{slug}/';
  let demos: Demo[] = [];
  let slugModifie = false;

  const afficher = (zone: HTMLElement, message: string | null): void => {
    zone.textContent = message ?? '';
    zone.hidden = !message;
  };

  /** Requête vers l’API ; XMLHttpRequest pour suivre la progression de l’envoi des archives. */
  const appeler = (
    methode: 'GET' | 'POST',
    corps?: FormData,
    surProgression?: (pourcent: number) => void,
  ): Promise<Reponse> =>
    new Promise((resoudre) => {
      const xhr = new XMLHttpRequest();
      xhr.open(methode, methode === 'GET' ? `${API}?action=etat` : API);
      xhr.setRequestHeader('Accept', 'application/json');
      if (methode === 'POST') xhr.setRequestHeader('X-CSRF', csrf);
      if (surProgression) {
        xhr.upload.addEventListener('progress', (evenement) => {
          if (evenement.lengthComputable)
            surProgression(Math.round((evenement.loaded / evenement.total) * 100));
        });
      }
      xhr.addEventListener('load', () => resoudre({ statut: xhr.status, corps: lireJson(xhr.responseText) }));
      xhr.addEventListener('error', () => resoudre({ statut: 0, corps: null }));
      xhr.send(corps ?? null);
    });

  const action = (nom: string, champs: Record<string, string | File> = {}): FormData => {
    const donnees = new FormData();
    donnees.set('action', nom);
    for (const [cle, valeur] of Object.entries(champs)) donnees.set(cle, valeur);
    return donnees;
  };

  /* ---------- Aperçu du lien ---------- */
  const majApercu = (): void => {
    const slug = champSlug.value;
    apercu.textContent = slug ? urlDemo(modeleUrl, slug) : '—';
    remplace.hidden = !demos.some((demo) => demo.slug === slug);
  };

  champClient.addEventListener('input', () => {
    if (!slugModifie) champSlug.value = slugDemo(champClient.value);
    majApercu();
  });

  champSlug.addEventListener('input', () => {
    slugModifie = champSlug.value !== '';
    champSlug.value = champSlug.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    majApercu();
  });

  /* ---------- Liste des démos ---------- */
  const bouton = (libelle: string, nomAccessible: string, danger = false): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = danger ? 'demo__action demo__action--danger' : 'demo__action';
    b.textContent = libelle;
    b.setAttribute('aria-label', nomAccessible);
    return b;
  };

  const afficherDemos = (): void => {
    compte.textContent = String(demos.length);
    vide.hidden = demos.length > 0;
    liste.replaceChildren(
      ...demos.map((demo) => {
        const item = document.createElement('li');
        item.className = 'demo';

        const infos = document.createElement('div');
        infos.className = 'demo__infos';
        const client = document.createElement('span');
        client.className = 'demo__client';
        client.textContent = demo.client;
        const lien = document.createElement('a');
        lien.className = 'demo__lien';
        lien.href = demo.url;
        lien.target = '_blank';
        lien.rel = 'noopener noreferrer';
        lien.textContent = demo.url;
        const meta = document.createElement('span');
        meta.className = 'demo__meta';
        meta.textContent = [
          `Mise à jour le ${formaterDate(demo.modifieLe)}`,
          demo.version ? `version ${demo.version}` : null,
          demo.taille ? formaterTaille(demo.taille) : null,
          demo.auteur ? `par ${demo.auteur}` : null,
        ]
          .filter(Boolean)
          .join(' · ');
        infos.append(client, lien, meta);

        const actions = document.createElement('div');
        actions.className = 'demo__actions';
        const copier = bouton('Copier le lien', `Copier le lien de la démo ${demo.client}`);
        copier.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(demo.url);
            copier.textContent = 'Lien copié';
          } catch {
            copier.textContent = 'Copie impossible';
          }
          window.setTimeout(() => (copier.textContent = 'Copier le lien'), 2000);
        });
        const mettreAJour = bouton('Mettre à jour', `Publier une nouvelle version de la démo ${demo.client}`);
        mettreAJour.addEventListener('click', () => {
          champClient.value = demo.client;
          champSlug.value = demo.slug;
          slugModifie = true;
          majApercu();
          publication.scrollIntoView({ block: 'start' });
          champArchive.focus();
        });
        const supprimer = bouton('Supprimer', `Supprimer la démo ${demo.client}`, true);
        supprimer.addEventListener('click', async () => {
          if (
            !window.confirm(
              `Supprimer définitivement la démo « ${demo.client} » ? Le lien ne fonctionnera plus.`,
            )
          )
            return;
          const { statut, corps } = await appeler('POST', action('supprimer', { slug: demo.slug }));
          if (statut === 200) {
            afficher(succes, `Démo « ${demo.client} » supprimée.`);
            await charger();
          } else {
            afficher(succes, null);
            afficher(indisponible, messageErreur(corps));
          }
        });
        actions.append(copier, mettreAJour, supprimer);

        item.append(infos, actions);
        return item;
      }),
    );
    majApercu();
  };

  /* ---------- État de la session ---------- */
  const appliquerEtat = (etat: EtatEspace): void => {
    csrf = etat.csrf ?? '';
    chargement.hidden = true;
    connexion.hidden = etat.connecte;
    tableau.hidden = !etat.connecte;
    if (!etat.connecte) return;
    utilisateur.textContent = etat.utilisateur ?? '';
    modeleUrl = etat.modeleUrl ?? modeleUrl;
    limite.textContent = etat.limiteEnvoi
      ? `Taille maximale acceptée par l’hébergement : ${etat.limiteEnvoi}.`
      : '';
    demos = etat.demos ?? [];
    afficherDemos();
  };

  const charger = async (): Promise<void> => {
    const { corps } = await appeler('GET');
    if (estEtatEspace(corps)) {
      afficher(indisponible, null);
      appliquerEtat(corps);
    } else {
      chargement.hidden = true;
      afficher(indisponible, messageErreur(corps));
    }
  };

  /* ---------- Connexion / déconnexion ---------- */
  connexion.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const donnees = new FormData(connexion);
    if (!String(donnees.get('identifiant')).trim() || !String(donnees.get('motDePasse'))) {
      afficher(erreurConnexion, 'Indiquez votre identifiant et votre mot de passe.');
      return;
    }
    donnees.set('action', 'connexion');
    boutonConnexion.disabled = true;
    const { statut, corps } = await appeler('POST', donnees);
    boutonConnexion.disabled = false;
    if (statut === 200) {
      afficher(erreurConnexion, null);
      connexion.reset();
      await charger();
      champClient.focus();
    } else {
      afficher(erreurConnexion, messageErreur(corps));
    }
  });

  deconnexion.addEventListener('click', async () => {
    await appeler('POST', action('deconnexion'));
    afficher(succes, null);
    await charger();
  });

  /* ---------- Publication ---------- */
  publication.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    afficher(succes, null);
    const archive = champArchive.files?.[0];
    const client = champClient.value.trim();
    const slug = champSlug.value || slugDemo(client);
    let probleme: string | null = null;
    if (!client) probleme = 'Indiquez le nom du client.';
    else if (!slugValide(slug))
      probleme = 'L’identifiant ne doit contenir que des minuscules, chiffres et tirets.';
    else if (!archive) probleme = 'Ajoutez l’archive .zip du site.';
    else if (!archive.name.toLowerCase().endsWith('.zip'))
      probleme = 'Le site doit être envoyé en archive .zip.';
    champClient.toggleAttribute('aria-invalid', !client);
    champArchive.toggleAttribute('aria-invalid', !archive);
    if (probleme || !archive) {
      afficher(erreurPublication, probleme);
      return;
    }
    const existante = demos.find((demo) => demo.slug === slug);
    if (
      existante &&
      !window.confirm(`Remplacer la démo en ligne « ${existante.client} » par cette version ?`)
    )
      return;

    afficher(erreurPublication, null);
    boutonPublier.disabled = true;
    progression.hidden = false;
    progression.value = 0;
    const { statut, corps } = await appeler(
      'POST',
      action('publier', { client, slug, archive }),
      (pourcent) => {
        progression.value = pourcent;
        progressionTexte.textContent = pourcent < 100 ? `Envoi… ${pourcent} %` : 'Mise en ligne…';
      },
    );
    boutonPublier.disabled = false;
    progression.hidden = true;
    progressionTexte.textContent = '';

    const demo = (corps as { demo?: Demo } | null)?.demo;
    if (statut === 200 && demo) {
      publication.reset();
      slugModifie = false;
      await charger();
      afficher(succes, `Démo « ${demo.client} » en ligne : ${demo.url}`);
      succes.focus();
    } else {
      afficher(erreurPublication, messageErreur(corps));
    }
  });

  void charger();
}
