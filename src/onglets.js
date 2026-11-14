// Onglets de la page (spécification 002) : un seul panneau visible à la fois.

/** Branche les onglets. `racine` est le document qui contient les éléments role="tab". */
export function initialiserOnglets(racine) {
  const onglets = [...racine.querySelectorAll('[role="tab"]')];
  const panneauDe = (onglet) => racine.getElementById(onglet.getAttribute('aria-controls'));

  function activer(ongletChoisi) {
    for (const onglet of onglets) {
      const actif = onglet === ongletChoisi;
      const panneau = panneauDe(onglet);
      if (!actif && !panneau.hidden) {
        // Quitter un onglet efface ses résultats, comme une modification de saisie :
        // chaque formulaire efface les siens quand il reçoit cet événement.
        panneau.querySelector('form').dispatchEvent(new Event('input', { bubbles: true }));
      }
      onglet.setAttribute('aria-selected', String(actif));
      panneau.hidden = !actif;
    }
  }

  for (const onglet of onglets) onglet.addEventListener('click', () => activer(onglet));

  // À l'ouverture, le premier onglet est actif.
  activer(onglets[0]);
}
