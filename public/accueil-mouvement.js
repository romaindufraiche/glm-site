// Chargé en tête de l’accueil, avant l’affichage : sans JavaScript, la page reste lisible à plat.
(function () {
  var racine = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Mouvement réduit : tout s’affiche à plat, sans chargeur ni épinglage.
    racine.classList.add('statique', 'sans-3d');
  } else {
    racine.classList.add('chargement');
  }
})();
