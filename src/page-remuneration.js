// Comportement de l'onglet « Rémunération » (spécification 002) : choix du calcul, contrôle
// des saisies au clic sur « Calculer », affichage des résultats, effacement des résultats
// et des messages dès qu'une saisie change.
// Aucune saisie n'est enregistrée : ni localStorage, ni sessionStorage.
import { formaterMontant } from './calcul.js';
import {
  MESSAGES_REMUNERATION,
  calculerDureeTenue,
  calculerNetProjete,
  calculerTarifAPratiquer,
  calculerVersement,
  formaterDuree,
  validerSaisie,
} from './remuneration.js';

const ZERO_OU_PLUS = { min: 0 };
const PLUS_DE_ZERO = { min: 0, minExclu: true };
const FACULTATIF = { obligatoire: false, min: 0 };
const JOURS = { min: 1, max: 31 };
const HEURES = { min: 1, max: 24 };
const TAUX = { min: 0, max: 200 };
const TAUX_PAR_DEFAUT = '45';

// Champs de chaque calcul : `mode` limite un champ à un mode de tarif du calcul C.
const CHAMPS = {
  a: [
    { id: 'remu-a-tresorerie', cle: 'tresorerie', regles: ZERO_OU_PLUS },
    {
      id: 'remu-a-reserve',
      cle: 'reserve',
      regles: (element) =>
        element('remu-a-unite-reserve').value === 'pourcent' ? { ...FACULTATIF, max: 100 } : FACULTATIF,
    },
    { id: 'remu-a-deja', cle: 'dejaVerse', regles: FACULTATIF },
  ],
  b: [
    { id: 'remu-b-objectif', cle: 'objectif', regles: PLUS_DE_ZERO },
    { id: 'remu-b-jours', cle: 'jours', regles: JOURS },
    { id: 'remu-b-heures', cle: 'heures', regles: HEURES },
    { id: 'remu-b-frais', cle: 'frais', regles: FACULTATIF },
  ],
  c: [
    { id: 'remu-c-tjm', cle: 'tjm', mode: 'jour', regles: PLUS_DE_ZERO },
    { id: 'remu-c-taux-horaire', cle: 'tauxHoraire', mode: 'heure', regles: PLUS_DE_ZERO },
    { id: 'remu-c-heures', cle: 'heures', mode: 'heure', regles: HEURES },
    { id: 'remu-c-jours', cle: 'jours', regles: JOURS },
    { id: 'remu-c-frais', cle: 'frais', regles: FACULTATIF },
  ],
  d: [
    { id: 'remu-d-tresorerie', cle: 'tresorerie', regles: ZERO_OU_PLUS },
    { id: 'remu-d-net', cle: 'net', regles: PLUS_DE_ZERO },
    { id: 'remu-d-frais', cle: 'frais', regles: FACULTATIF },
  ],
};

// Sélecteurs remis à leur valeur de départ à l'ouverture de la page.
const SELECTEURS_PAR_DEFAUT = {
  'remu-calcul': 'a',
  'remu-a-unite-reserve': 'euro',
  'remu-b-periodicite': 'mois',
  'remu-c-tarif': 'jour',
  'remu-c-periodicite': 'mois',
  'remu-d-periodicite': 'mois',
};

/** Branche le comportement de l'onglet. `racine` est le document qui contient le formulaire. */
export function initialiserRemuneration(racine) {
  const element = (id) => racine.getElementById(id);
  const formulaire = element('formulaire-remuneration');
  const selecteurCalcul = element('remu-calcul');
  const selecteurTarif = element('remu-c-tarif');
  const taux = element('remu-taux');
  const zone = element('remu-resultats');
  const groupesMode = { jour: element('remu-c-groupe-jour'), heure: element('remu-c-groupe-heure') };
  const ecrire = (id, texte) => {
    element(id).textContent = texte;
  };

  const preparer = (definition) => ({
    ...definition,
    saisie: element(definition.id),
    message: element(`${definition.id}-erreur`),
  });
  const champTaux = preparer({ id: 'remu-taux', cle: 'taux', regles: TAUX });
  const champsParCalcul = Object.fromEntries(
    Object.entries(CHAMPS).map(([calcul, definitions]) => [calcul, definitions.map(preparer)]),
  );
  const tousLesChamps = [champTaux, ...Object.values(champsParCalcul).flat()];

  const champsComptes = () => {
    const mode = selecteurTarif.value;
    return [
      champTaux,
      ...champsParCalcul[selecteurCalcul.value].filter((champ) => !champ.mode || champ.mode === mode),
    ];
  };

  // Pour chaque calcul : ce qu'il calcule à partir des saisies contrôlées, et ce qu'il affiche.
  const CALCULS = {
    a: (v) => {
      const r = calculerVersement({
        ...v,
        reserve: element('remu-a-reserve').value.trim() === '' ? null : v.reserve,
        uniteReserve: element('remu-a-unite-reserve').value,
      });
      ecrire('remu-a-sans-encore', formaterMontant(r.sansReserve.encoreAVerser));
      ecrire('remu-a-sans-total', formaterMontant(r.sansReserve.total));
      ecrire('remu-a-avec-encore', formaterMontant(r.avecReserve.encoreAVerser));
      ecrire('remu-a-avec-total', formaterMontant(r.avecReserve.total));
      ecrire('remu-a-message', r.reserveAbsorbeTout ? MESSAGES_REMUNERATION.reserveAbsorbe : '');
    },
    b: (v) => {
      const r = calculerTarifAPratiquer({ ...v, periodicite: element('remu-b-periodicite').value });
      ecrire('remu-b-tjm', formaterMontant(r.tjm));
      ecrire('remu-b-taux-horaire', formaterMontant(r.tauxHoraire));
    },
    c: (v) => {
      const r = calculerNetProjete({
        ...v,
        mode: selecteurTarif.value,
        periodicite: element('remu-c-periodicite').value,
      });
      ecrire('remu-c-mensuel', formaterMontant(r.netMensuel));
      ecrire('remu-c-annuel', formaterMontant(r.netAnnuel));
      ecrire('remu-c-message', r.fraisAbsorbent ? MESSAGES_REMUNERATION.fraisAbsorbent : '');
    },
    d: (v) => {
      const r = calculerDureeTenue({ ...v, periodicite: element('remu-d-periodicite').value });
      ecrire('remu-d-sortie', formaterMontant(r.sortieMensuelle));
      ecrire('remu-d-duree', formaterDuree(r.dureeMois));
    },
  };

  function afficherErreur(champ, texte) {
    champ.message.textContent = texte ?? '';
    if (texte) champ.saisie.setAttribute('aria-invalid', 'true');
    else champ.saisie.removeAttribute('aria-invalid');
  }

  function effacerResultats() {
    zone.hidden = true;
    for (const sortie of zone.querySelectorAll('dd, .message-resultat')) sortie.textContent = '';
    for (const bloc of zone.querySelectorAll('[data-resultats]')) bloc.hidden = true;
  }

  // Montre les champs du calcul et du mode choisis, et efface ce qui n'est plus valable.
  function appliquerChoix() {
    const calcul = selecteurCalcul.value;
    for (const groupe of formulaire.querySelectorAll('[data-calcul]')) {
      groupe.hidden = groupe.dataset.calcul !== calcul;
    }
    const mode = selecteurTarif.value;
    groupesMode.jour.hidden = mode !== 'jour';
    groupesMode.heure.hidden = mode !== 'heure';

    const comptes = champsComptes();
    for (const champ of tousLesChamps) if (!comptes.includes(champ)) afficherErreur(champ, null);
    effacerResultats();
  }

  function lancerCalcul() {
    const valeurs = {};
    let toutEstValide = true;
    for (const champ of champsComptes()) {
      const regles = typeof champ.regles === 'function' ? champ.regles(element) : champ.regles;
      const { valeur, erreur } = validerSaisie(champ.saisie.value, regles);
      afficherErreur(champ, erreur);
      if (erreur) toutEstValide = false;
      else valeurs[champ.cle] = valeur;
    }

    effacerResultats();
    if (!toutEstValide) return;

    const calcul = selecteurCalcul.value;
    CALCULS[calcul](valeurs);
    zone.querySelector(`[data-resultats="${calcul}"]`).hidden = false;
    zone.hidden = false;
  }

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    lancerCalcul();
  });

  formulaire.addEventListener('input', (evenement) => {
    const champ = tousLesChamps.find((c) => c.saisie === evenement.target);
    if (champ) afficherErreur(champ, null);
    effacerResultats();
  });

  selecteurCalcul.addEventListener('change', appliquerChoix);
  selecteurTarif.addEventListener('change', appliquerChoix);

  // État d'ouverture : même après un rechargement, rien de ce qui a été saisi n'est repris.
  for (const [id, valeur] of Object.entries(SELECTEURS_PAR_DEFAUT)) element(id).value = valeur;
  taux.value = TAUX_PAR_DEFAUT;
  appliquerChoix();
}
