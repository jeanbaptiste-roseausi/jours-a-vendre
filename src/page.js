// Comportement de la page (spécification 001) : contrôle des saisies au clic sur
// « Calculer », affichage des résultats, changement de mode de tarif, effacement
// des résultats et des messages dès qu'une saisie change.
// Aucune saisie n'est enregistrée : ni localStorage, ni sessionStorage.
import {
  MESSAGES,
  calculer,
  formaterJours,
  formaterMontant,
  formaterRythme,
  validerHeures,
  validerMois,
  validerMontant,
} from './calcul.js';

// Champs de saisie, avec leur contrôle et le mode dans lequel ils comptent (null : les deux).
const CHAMPS = [
  { id: 'charges', cle: 'charges', mode: null, valider: (t) => validerMontant(t) },
  {
    id: 'chiffre-affaires',
    cle: 'chiffreAffaires',
    mode: null,
    valider: (t) => validerMontant(t, { obligatoire: false, zeroAutorise: true }),
  },
  { id: 'tjm', cle: 'tjm', mode: 'jour', valider: (t) => validerMontant(t) },
  { id: 'taux-horaire', cle: 'tauxHoraire', mode: 'heure', valider: (t) => validerMontant(t) },
  { id: 'heures', cle: 'heures', mode: 'heure', valider: validerHeures },
  { id: 'mois', cle: 'mois', mode: null, valider: validerMois },
];

/** Branche le comportement sur la page. `racine` est le document qui contient le formulaire. */
export function initialiserPage(racine) {
  const element = (id) => racine.getElementById(id);
  const formulaire = element('calculateur');
  const tarif = element('tarif');
  const groupes = { jour: element('groupe-jour'), heure: element('groupe-heure') };
  const zoneResultats = element('resultats');
  const sorties = {
    montant: element('resultat-montant'),
    jours: element('resultat-jours'),
    rythme: element('resultat-rythme'),
    couvertes: element('resultat-couvertes'),
  };

  const champs = CHAMPS.map((definition) => ({
    ...definition,
    saisie: element(definition.id),
    message: element(`${definition.id}-erreur`),
  }));

  const modeChoisi = () => (tarif.value === 'heure' ? 'heure' : 'jour');
  const compte = (champ) => champ.mode === null || champ.mode === modeChoisi();

  function afficherErreur(champ, texte) {
    champ.message.textContent = texte ?? '';
    if (texte) champ.saisie.setAttribute('aria-invalid', 'true');
    else champ.saisie.removeAttribute('aria-invalid');
  }

  function effacerResultats() {
    zoneResultats.hidden = true;
    for (const sortie of Object.values(sorties)) sortie.textContent = '';
  }

  function appliquerMode() {
    const mode = modeChoisi();
    groupes.jour.hidden = mode !== 'jour';
    groupes.heure.hidden = mode !== 'heure';
    // Les messages des champs devenus masqués sont effacés (les saisies, elles, sont conservées).
    for (const champ of champs) if (!compte(champ)) afficherErreur(champ, null);
    effacerResultats();
  }

  function lancerCalcul() {
    const valeurs = { mode: modeChoisi() };
    let valide = true;
    for (const champ of champs) {
      if (!compte(champ)) {
        afficherErreur(champ, null);
        continue;
      }
      const { valeur, erreur } = champ.valider(champ.saisie.value);
      afficherErreur(champ, erreur);
      if (erreur) valide = false;
      else valeurs[champ.cle] = valeur;
    }

    if (!valide) {
      effacerResultats();
      return;
    }

    const resultat = calculer(valeurs);
    sorties.montant.textContent = formaterMontant(resultat.montantRestant);
    sorties.jours.textContent = formaterJours(resultat.jours);
    sorties.rythme.textContent = formaterRythme(resultat.rythme);
    sorties.couvertes.textContent = resultat.chargesCouvertes ? MESSAGES.couvertes : '';
    zoneResultats.hidden = false;
  }

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    lancerCalcul();
  });

  formulaire.addEventListener('input', (evenement) => {
    if (evenement.target === tarif) return; // traité par l'événement « change »
    const champ = champs.find((c) => c.saisie === evenement.target);
    if (champ) afficherErreur(champ, null);
    effacerResultats();
  });

  tarif.addEventListener('change', appliquerMode);

  // État d'ouverture : mode « par jour », aucun résultat, aucun message.
  tarif.value = 'jour';
  appliquerMode();
}
