/**
 * Projets : défilement horizontal piloté par le défilement vertical de la page (desktop).
 *
 * La section est épinglée (position: sticky) dans une « piste » dont la hauteur vaut l’écran plus la
 * longueur du trajet horizontal : chaque pixel de défilement vertical fait avancer les projets d’un pixel.
 * Une légère inertie (interpolation vers la cible à chaque image) rend le mouvement fluide.
 *
 * Désactivé (grille simple) sur mobile/tablette et avec prefers-reduced-motion.
 */
const INERTIE = 0.14;
const CONDITION = '(min-width: 60.0625rem) and (prefers-reduced-motion: no-preference)';

export function initDefilementProjets(): void {
  const section = document.querySelector<HTMLElement>('[data-projets]');
  const piste = section?.querySelector<HTMLElement>('[data-projets-piste]');
  const liste = section?.querySelector<HTMLElement>('[data-projets-liste]');
  const barre = section?.querySelector<HTMLElement>('[data-projets-barre]');
  const courant = section?.querySelector<HTMLElement>('[data-projets-courant]');
  if (!section || !piste || !liste || !barre || !courant) return;

  const items = Array.from(liste.querySelectorAll<HTMLElement>('[data-projets-item]'));
  const total = items.length;
  const media = window.matchMedia(CONDITION);

  let trajet = 0; // longueur du défilement horizontal, en pixels
  let debut = 0; // position verticale (document) où la section s’épingle
  let cible = 0;
  let position = 0;
  let image = 0;
  let actif = false;

  const hauteurNav = (): number =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 72;

  const mesurer = (): void => {
    const fenetre = liste.parentElement;
    if (!fenetre) return;
    trajet = Math.max(0, liste.scrollWidth - fenetre.clientWidth);
    const scene = piste.firstElementChild as HTMLElement | null;
    piste.style.height = `${(scene?.offsetHeight ?? window.innerHeight) + trajet}px`;
    debut = piste.getBoundingClientRect().top + window.scrollY - hauteurNav();
    cible = calculerCible();
    position = cible;
    appliquer();
  };

  const calculerCible = (): number => Math.min(trajet, Math.max(0, window.scrollY - debut));

  const appliquer = (): void => {
    liste.style.transform = `translate3d(${-position}px, 0, 0)`;
    const progression = trajet > 0 ? position / trajet : 1;
    barre.style.clipPath = `inset(0 ${(1 - progression) * 100}% 0 0)`;

    // Cartes dans le cadre : pleinement visibles ; les autres sont atténuées.
    const fenetre = liste.parentElement?.getBoundingClientRect();
    let premiere = 0;
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const visible = fenetre ? rect.left >= fenetre.left - 2 && rect.right <= fenetre.right + 2 : true;
      item.classList.toggle('is-hors-champ', !visible);
      if (fenetre && premiere === 0 && rect.right > fenetre.left + rect.width / 2) premiere = index + 1;
    });
    const derniere = Math.min(total, premiere + 1);
    const format = (n: number): string => String(n).padStart(2, '0');
    courant.textContent =
      premiere === derniere ? format(premiere) : `${format(Math.max(1, premiere))}–${format(derniere)}`;
  };

  const boucle = (): void => {
    const ecart = cible - position;
    position = Math.abs(ecart) < 0.5 ? cible : position + ecart * INERTIE;
    appliquer();
    image = position === cible ? 0 : requestAnimationFrame(boucle);
  };

  const surDefilement = (): void => {
    if (!actif) return;
    cible = calculerCible();
    if (!image) image = requestAnimationFrame(boucle);
  };

  // Clavier : une carte qui reçoit le focus hors du cadre est amenée à l’écran.
  const surFocus = (event: FocusEvent): void => {
    if (!actif || !(event.target instanceof HTMLElement)) return;
    const item = event.target.closest<HTMLElement>('[data-projets-item]');
    const cadre = items[0]?.parentElement?.parentElement?.getBoundingClientRect();
    if (!item || !cadre) return;
    const rect = item.getBoundingClientRect();
    const marge = (items[0]?.getBoundingClientRect().left ?? cadre.left) - cadre.left + position;
    let decalage = 0;
    if (rect.left < cadre.left + marge) decalage = rect.left - (cadre.left + marge);
    else if (rect.right > cadre.right - marge) decalage = rect.right - (cadre.right - marge);
    if (decalage !== 0) {
      const voulu = Math.min(trajet, Math.max(0, position + decalage));
      window.scrollTo({ top: debut + voulu, behavior: 'auto' });
    }
  };

  const activer = (): void => {
    actif = true;
    section.classList.add('is-horizontal');
    mesurer();
  };

  const desactiver = (): void => {
    actif = false;
    cancelAnimationFrame(image);
    image = 0;
    section.classList.remove('is-horizontal');
    piste.style.height = '';
    liste.style.transform = '';
    items.forEach((item) => item.classList.remove('is-hors-champ'));
  };

  const appliquerCondition = (): void => (media.matches ? activer() : desactiver());

  window.addEventListener('scroll', surDefilement, { passive: true });
  window.addEventListener('resize', () => actif && mesurer());
  liste.addEventListener('focusin', surFocus);
  media.addEventListener('change', appliquerCondition);
  new ResizeObserver(() => actif && mesurer()).observe(liste);
  void document.fonts.ready.then(() => actif && mesurer());

  appliquerCondition();
}
