// @vitest-environment jsdom
// Tests de la spécification 001 : calcul des jours restant à vendre et du rythme mensuel.
//
// Contrat attendu du code (voir le rapport du testeur) :
//   - src/calcul.js : fonctions pures (analyse, validation, calcul, mise en forme)
//   - src/page.js   : initialiserPage(racine) branche le comportement sur le document
//
// Les modules sont chargés dynamiquement pour que chaque test échoue séparément,
// avec un message clair, tant que le code n'existe pas.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TITRE = 'Combien de jours dois-je vendre ?';

// ---------------------------------------------------------------------------
// Chargement des modules à tester
// ---------------------------------------------------------------------------

// import.meta.glob ne renvoie rien tant que le fichier n'existe pas : pas d'erreur de résolution
// qui ferait échouer tout le fichier de tests d'un coup.
const modules = import.meta.glob(['../src/calcul.js', '../src/page.js']);

async function charger(chemin) {
  if (!modules[chemin]) return { __erreur: new Error(`le fichier ${chemin} n'existe pas encore`) };
  try {
    return await modules[chemin]();
  } catch (cause) {
    return { __erreur: cause };
  }
}

const calcul = await charger('../src/calcul.js');
const page = await charger('../src/page.js');

function fonction(module, chemin, nom) {
  const f = module[nom];
  if (typeof f !== 'function') {
    const cause = module.__erreur ? ` (${module.__erreur.message})` : '';
    throw new Error(`${chemin} doit exporter la fonction « ${nom} »${cause}`);
  }
  return f;
}
const dansCalcul = (nom) => fonction(calcul, 'src/calcul.js', nom);

// ---------------------------------------------------------------------------
// Utilitaires de texte
// ---------------------------------------------------------------------------

// Toutes les sortes d'espaces (normale, insécable, fine insécable) valent une espace simple.
const norm = (texte) => (texte ?? '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// Utilitaires de page (repères : libellés, texte du bouton, rôles ARIA)
// ---------------------------------------------------------------------------

const LIBELLES = {
  charges: 'Charges annuelles (€ HT)',
  ca: "Chiffre d'affaires déjà identifié (€ HT)",
  tjm: 'TJM (€ HT)',
  taux: 'Taux horaire (€ HT)',
  heures: 'Heures travaillées par jour',
  mois: 'Mois restants',
  tarif: 'Tarif',
};

const AIDES = {
  charges: "Tout ce que vous devez encaisser sur l'année, rémunération comprise.",
  ca: 'Missions signées ou facturées. Laissez vide si aucune.',
  tjm: 'Taux journalier moyen facturé à vos clients.',
  taux: "Prix d'une heure facturée à vos clients.",
  heures: "Nombre d'heures facturées dans une journée, de 1 à 24.",
  mois: 'Nombre de mois pour vendre ces jours, de 1 à 12.',
};

const COUVERTES = 'Vos charges annuelles sont déjà couvertes.';
const OBLIGATOIRE = 'Ce champ est obligatoire.';
const NOMBRE = 'Saisissez un nombre.';
const NEGATIF = 'Le montant ne peut pas être négatif.';
const SUPERIEUR_A_0 = 'Le montant doit être supérieur à 0.';
const DECIMALES = '2 décimales au maximum.';
const MSG_HEURES = 'Saisissez un nombre de 1 à 24, avec 2 décimales au maximum.';
const MSG_MOIS = 'Saisissez un nombre entier de 1 à 12.';

// Sous jsdom, import.meta.url n'est pas une URL « file » : on part de la racine du projet,
// où Vitest est lancé par `npm test`.
const corpsHtml = new DOMParser().parseFromString(
  readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8'),
  'text/html',
).body.innerHTML;

function ouvrirPage() {
  document.body.innerHTML = corpsHtml;
  fonction(page, 'src/page.js', 'initialiserPage')(document);
}

function etiquette(cle) {
  const texte = LIBELLES[cle];
  const label = [...document.querySelectorAll('label')].find((l) => norm(l.textContent) === texte);
  if (!label) throw new Error(`Aucun <label> au texte exact « ${texte} » dans la page`);
  return label;
}

function champ(cle) {
  const label = etiquette(cle);
  const element = label.htmlFor ? document.getElementById(label.htmlFor) : label.control;
  if (!element) throw new Error(`Le <label> « ${LIBELLES[cle]} » n'est associé à aucun champ (attribut for)`);
  return element;
}

// Éléments reliés au champ par aria-describedby : l'aide, et le message d'erreur (role="alert").
function descriptions(cle) {
  const ids = (champ(cle).getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
  return {
    aides: elements.filter((e) => e.getAttribute('role') !== 'alert'),
    erreurs: elements.filter((e) => e.getAttribute('role') === 'alert'),
  };
}

function aide(cle) {
  const { aides } = descriptions(cle);
  if (aides.length !== 1) {
    throw new Error(`« ${LIBELLES[cle]} » doit avoir exactement un élément d'aide relié par aria-describedby (trouvé : ${aides.length})`);
  }
  return aides[0];
}

// Texte du message d'erreur du champ, ou '' s'il n'y en a pas.
function erreur(cle) {
  const { erreurs } = descriptions(cle);
  return erreurs.map((e) => (e.hidden ? '' : norm(e.textContent))).join(' ').trim();
}

const estMasque = (cle) => !!champ(cle).closest('[hidden]') && !!etiquette(cle).closest('[hidden]');
const estVisible = (cle) =>
  !champ(cle).closest('[hidden]') && !etiquette(cle).closest('[hidden]') && !aide(cle).closest('[hidden]');

function zoneResultats() {
  return document.querySelector('[role="region"][aria-label="Résultats"]');
}

function resultatsAffiches() {
  const zone = zoneResultats();
  return !!zone && !zone.closest('[hidden]') && norm(zone.textContent) !== '';
}

// La valeur suit son libellé : deux éléments frères consécutifs (par exemple <dt> puis <dd>).
function resultat(libelle) {
  const zone = zoneResultats();
  if (!zone) throw new Error('Zone de résultats absente (role="region", aria-label="Résultats")');
  const element = [...zone.querySelectorAll('*')].find(
    (e) => e.children.length === 0 && norm(e.textContent) === libelle,
  );
  if (!element) throw new Error(`Libellé de résultat « ${libelle} » introuvable dans la zone de résultats`);
  return norm(element.nextElementSibling?.textContent);
}

const messageCouvertes = () => norm(zoneResultats()?.textContent ?? '').includes(COUVERTES);

function saisir(cle, valeur) {
  const element = champ(cle);
  element.value = valeur;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function choisirTarif(texte) {
  const selecteur = champ('tarif');
  const option = [...selecteur.options].find((o) => norm(o.textContent) === texte);
  if (!option) throw new Error(`Le sélecteur « Tarif » n'a pas de choix « ${texte} »`);
  selecteur.value = option.value;
  selecteur.dispatchEvent(new Event('input', { bubbles: true }));
  selecteur.dispatchEvent(new Event('change', { bubbles: true }));
}

const tarifChoisi = () => norm(champ('tarif').selectedOptions[0]?.textContent);

function bouton() {
  const b = [...document.querySelectorAll('button')].find((e) => norm(e.textContent) === 'Calculer');
  if (!b) throw new Error('Bouton « Calculer » absent');
  return b;
}
const calculer = () => bouton().click();

const CLES_JOUR = ['charges', 'ca', 'tjm', 'mois'];
const CLES_HEURE = ['charges', 'ca', 'taux', 'heures', 'mois'];

// Remplit les champs fournis (y compris ceux de l'autre mode), puis choisit le mode.
function remplir({ tarif = 'par jour', ...valeurs }) {
  for (const [cle, valeur] of Object.entries(valeurs)) saisir(cle, valeur);
  if (tarif !== 'par jour') choisirTarif(tarif);
}

const BASE_JOUR = { charges: '60000', ca: '34600', tjm: '550', mois: '5' };
const BASE_HEURE = { tarif: 'par heure', charges: '60000', ca: '0', taux: '70', heures: '7', mois: '5' };

function verifierResultats({ montant, jours, rythme, couvertes = false }) {
  expect(resultatsAffiches()).toBe(true);
  expect(resultat('Montant restant à couvrir')).toBe(montant);
  expect(resultat('Jours restant à vendre')).toBe(jours);
  expect(resultat('Rythme mensuel')).toBe(rythme);
  expect(messageCouvertes()).toBe(couvertes);
}

function verifierAucuneErreur(cles) {
  for (const cle of cles) expect(erreur(cle), `message sous « ${LIBELLES[cle]} »`).toBe('');
}

// ---------------------------------------------------------------------------
// Module src/calcul.js : fonctions pures
// ---------------------------------------------------------------------------

describe('analyserNombre – écritures acceptées (CA7, CA20)', () => {
  it.each([
    ['25 000,50', 25000.5],
    ['25000.50', 25000.5],
    ['25000,50', 25000.5],
    ['5,0', 5],
    ['5.0', 5],
    ['-500', -500],
    ['  12 ', 12],
  ])('CA7 – « %s » vaut %s', (texte, attendu) => {
    expect(dansCalcul('analyserNombre')(texte)).toBe(attendu);
  });

  it.each(['', 'abc', '12abc'])('CA14 – « %s » n\'est pas un nombre (null)', (texte) => {
    expect(dansCalcul('analyserNombre')(texte)).toBeNull();
  });
});

describe('validerMontant – messages et priorité (CA14, CA19)', () => {
  it('CA14 – charges vides : « Ce champ est obligatoire. »', () => {
    expect(dansCalcul('validerMontant')('')).toEqual({ valeur: null, erreur: OBLIGATOIRE });
  });

  it('CA14 – montant non numérique : « Saisissez un nombre. »', () => {
    expect(dansCalcul('validerMontant')('abc')).toEqual({ valeur: null, erreur: NOMBRE });
  });

  it('CA14 – montant négatif : « Le montant ne peut pas être négatif. »', () => {
    expect(dansCalcul('validerMontant')('-500')).toEqual({ valeur: null, erreur: NEGATIF });
  });

  it('CA14 – montant égal à 0 : « Le montant doit être supérieur à 0. »', () => {
    expect(dansCalcul('validerMontant')('0')).toEqual({ valeur: null, erreur: SUPERIEUR_A_0 });
  });

  it('CA14 – plus de 2 décimales : « 2 décimales au maximum. »', () => {
    expect(dansCalcul('validerMontant')('1000,555')).toEqual({ valeur: null, erreur: DECIMALES });
  });

  it('CA7 – « 25 000,50 », « 25000.50 » et « 25000,50 » sont valides et valent 25 000,50', () => {
    for (const texte of ['25 000,50', '25000.50', '25000,50']) {
      expect(dansCalcul('validerMontant')(texte)).toEqual({ valeur: 25000.5, erreur: null });
    }
  });

  it('CA19 – « -1000,555 » n\'affiche que « Le montant ne peut pas être négatif. »', () => {
    expect(dansCalcul('validerMontant')('-1000,555')).toEqual({ valeur: null, erreur: NEGATIF });
  });

  it('CA19 – « 0,000 » (égal à 0 et trop de décimales) affiche « supérieur à 0 », qui précède « décimales »', () => {
    expect(dansCalcul('validerMontant')('0,000')).toEqual({ valeur: null, erreur: SUPERIEUR_A_0 });
  });

  it('CA5 – chiffre d\'affaires vide (non obligatoire) : valeur 0, aucune erreur', () => {
    expect(dansCalcul('validerMontant')('', { obligatoire: false })).toEqual({ valeur: 0, erreur: null });
  });

  it('CA6 – chiffre d\'affaires égal à 0 (zéro autorisé) : accepté', () => {
    expect(dansCalcul('validerMontant')('0', { zeroAutorise: true })).toEqual({ valeur: 0, erreur: null });
  });

  it('CA14 – chiffre d\'affaires négatif ou non numérique : mêmes messages', () => {
    const options = { obligatoire: false, zeroAutorise: true };
    expect(dansCalcul('validerMontant')('-500', options)).toEqual({ valeur: null, erreur: NEGATIF });
    expect(dansCalcul('validerMontant')('abc', options)).toEqual({ valeur: null, erreur: NOMBRE });
  });

  it('CA19 – chiffre d\'affaires « 0,000 » (zéro autorisé) : « 2 décimales au maximum. »', () => {
    const options = { obligatoire: false, zeroAutorise: true };
    expect(dansCalcul('validerMontant')('0,000', options)).toEqual({ valeur: null, erreur: DECIMALES });
  });
});

describe('validerHeures (CA12, CA14)', () => {
  it('CA14 – vide : « Ce champ est obligatoire. »', () => {
    expect(dansCalcul('validerHeures')('')).toEqual({ valeur: null, erreur: OBLIGATOIRE });
  });

  it.each(['abc', '0,5', '25', '7,125', '24,01'])(
    'CA14 – « %s » : message des heures par jour',
    (texte) => {
      expect(dansCalcul('validerHeures')(texte)).toEqual({ valeur: null, erreur: MSG_HEURES });
    },
  );

  it.each([
    ['7', 7],
    ['5,5', 5.5],
    ['7,75', 7.75],
    ['1', 1],
    ['24', 24],
  ])('CA12 – « %s » est valide et vaut %s', (texte, attendu) => {
    expect(dansCalcul('validerHeures')(texte)).toEqual({ valeur: attendu, erreur: null });
  });
});

describe('validerMois (CA14, CA20)', () => {
  it('CA14 – vide : « Ce champ est obligatoire. »', () => {
    expect(dansCalcul('validerMois')('')).toEqual({ valeur: null, erreur: OBLIGATOIRE });
  });

  it.each(['abc', '0', '13', '2,5'])('CA14 – « %s » : « Saisissez un nombre entier de 1 à 12. »', (texte) => {
    expect(dansCalcul('validerMois')(texte)).toEqual({ valeur: null, erreur: MSG_MOIS });
  });

  it.each([
    ['5', 5],
    ['5,0', 5],
    ['5.0', 5],
    ['3,0', 3],
    ['1', 1],
    ['12', 12],
  ])('CA20 – « %s » est valide et vaut %s', (texte, attendu) => {
    expect(dansCalcul('validerMois')(texte)).toEqual({ valeur: attendu, erreur: null });
  });
});

describe('calculerMontantRestant (règle 1, CA8)', () => {
  it.each([
    [60000, 34600, 25400],
    [45300, 20000, 25300],
    [48000, 0, 48000],
    [30000.5, 0, 30000.5],
    [10000, 9900, 100],
    [40000, 40000, 0],
    [40000, 42000, 0],
  ])('CA8 – charges %s, CA %s : %s', (charges, ca, attendu) => {
    expect(dansCalcul('calculerMontantRestant')(charges, ca)).toBe(attendu);
  });
});

describe('calculerTarifJournalier (règle 2, CA11, CA12, CA13)', () => {
  it('CA11 – 70 € × 7 h = 490 €', () => {
    expect(dansCalcul('calculerTarifJournalier')(70, 7)).toBeCloseTo(490, 10);
  });

  it('CA12 – 50 € × 5,5 h = 275 €', () => {
    expect(dansCalcul('calculerTarifJournalier')(50, 5.5)).toBeCloseTo(275, 10);
  });

  it('CA13 – 25 € × 24 h = 600 €', () => {
    expect(dansCalcul('calculerTarifJournalier')(25, 24)).toBeCloseTo(600, 10);
  });

  it('CA13 – 70,55 € × 7,25 h = 511,4875 € (sans arrondi)', () => {
    expect(dansCalcul('calculerTarifJournalier')(70.55, 7.25)).toBeCloseTo(511.4875, 10);
  });

  it('CA13 – 70,55 € × 7,75 h = 546,7625 € (sans arrondi au centime)', () => {
    expect(dansCalcul('calculerTarifJournalier')(70.55, 7.75)).toBeCloseTo(546.7625, 10);
  });
});

describe('calculerJours (règle 3, CA3, CA13)', () => {
  it.each([
    [25400, 550, 47],
    [25300, 550, 46],
    [48000, 400, 120],
    [30000.5, 500, 61],
    [100, 600, 1],
    [0, 500, 0],
    [25000.5, 500, 51],
    [25400, 490, 52],
    [25300, 275, 92],
  ])('CA3 – %s € à %s € par jour : %s jour(s)', (montant, tarif, attendu) => {
    expect(dansCalcul('calculerJours')(montant, tarif)).toBe(attendu);
  });

  it('CA13 – 2 187,05 € ÷ 546,7625 € = exactement 4 jours (pas 5)', () => {
    expect(dansCalcul('calculerJours')(2187.05, 546.7625)).toBe(4);
  });
});

describe('calculerRythme (règle 4, CA4)', () => {
  it.each([
    [47, 5, 10],
    [46, 6, 8],
    [120, 12, 10],
    [61, 12, 6],
    [1, 4, 1],
    [0, 3, 0],
    [51, 10, 6],
    [47, 6, 8],
    [52, 5, 11],
    [92, 6, 16],
    [4, 1, 4],
  ])('CA4 – %s jour(s) sur %s mois : rythme de %s', (jours, mois, attendu) => {
    expect(dansCalcul('calculerRythme')(jours, mois)).toBe(attendu);
  });
});

describe('calculer – ensemble du calcul (règles 1 à 5)', () => {
  it.each([
    ['CA2', { mode: 'jour', charges: 60000, chiffreAffaires: 34600, tjm: 550, mois: 5 }, 25400, 47, 10, false],
    ['CA3', { mode: 'jour', charges: 45300, chiffreAffaires: 20000, tjm: 550, mois: 6 }, 25300, 46, 8, false],
    ['CA5', { mode: 'jour', charges: 48000, chiffreAffaires: 0, tjm: 400, mois: 12 }, 48000, 120, 10, false],
    ['CA6', { mode: 'jour', charges: 30000.5, chiffreAffaires: 0, tjm: 500, mois: 12 }, 30000.5, 61, 6, false],
    ['CA9', { mode: 'jour', charges: 10000, chiffreAffaires: 9900, tjm: 600, mois: 4 }, 100, 1, 1, false],
    ['CA8', { mode: 'jour', charges: 40000, chiffreAffaires: 40000, tjm: 500, mois: 3 }, 0, 0, 0, true],
    ['CA8', { mode: 'jour', charges: 40000, chiffreAffaires: 42000, tjm: 500, mois: 3 }, 0, 0, 0, true],
    ['CA7', { mode: 'jour', charges: 25000.5, chiffreAffaires: 0, tjm: 500, mois: 10 }, 25000.5, 51, 6, false],
    ['CA11', { mode: 'heure', charges: 60000, chiffreAffaires: 34600, tauxHoraire: 70, heures: 7, mois: 5 }, 25400, 52, 11, false],
    ['CA12', { mode: 'heure', charges: 45300, chiffreAffaires: 20000, tauxHoraire: 50, heures: 5.5, mois: 6 }, 25300, 92, 16, false],
    ['CA9', { mode: 'heure', charges: 10000, chiffreAffaires: 9900, tauxHoraire: 25, heures: 24, mois: 4 }, 100, 1, 1, false],
    ['CA13', { mode: 'heure', charges: 2187.05, chiffreAffaires: 0, tauxHoraire: 70.55, heures: 7.75, mois: 1 }, 2187.05, 4, 4, false],
  ])('%s – %j', (_ca, entree, montantRestant, jours, rythme, chargesCouvertes) => {
    expect(dansCalcul('calculer')(entree)).toMatchObject({ montantRestant, jours, rythme, chargesCouvertes });
  });
});

describe('Mise en forme (section Affichage, CA6, CA9)', () => {
  it.each([
    [25400, '25 400 €'],
    [30000.5, '30 000,50 €'],
    [48000, '48 000 €'],
    [25000.5, '25 000,50 €'],
    [2187.05, '2 187,05 €'],
    [100, '100 €'],
    [0, '0 €'],
  ])('CA6 – formaterMontant(%s) donne « %s »', (nombre, attendu) => {
    expect(norm(dansCalcul('formaterMontant')(nombre))).toBe(attendu);
  });

  it.each([
    [0, '0 jour'],
    [1, '1 jour'],
    [2, '2 jours'],
    [47, '47 jours'],
    [120, '120 jours'],
  ])('CA9 – formaterJours(%s) donne « %s »', (nombre, attendu) => {
    expect(dansCalcul('formaterJours')(nombre)).toBe(attendu);
  });

  it.each([
    [0, '0 jour par mois'],
    [1, '1 jour par mois'],
    [2, '2 jours par mois'],
    [10, '10 jours par mois'],
  ])('CA9 – formaterRythme(%s) donne « %s »', (nombre, attendu) => {
    expect(dansCalcul('formaterRythme')(nombre)).toBe(attendu);
  });
});

// ---------------------------------------------------------------------------
// Comportement de la page (jsdom)
// ---------------------------------------------------------------------------

describe('Page – comportement', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    ouvrirPage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('Ouverture (CA1)', () => {
    it('CA1 – le sélecteur « Tarif » est sur « par jour » et propose « par jour » et « par heure »', () => {
      expect(tarifChoisi()).toBe('par jour');
      const choix = [...champ('tarif').options].map((o) => norm(o.textContent));
      expect(choix).toEqual(['par jour', 'par heure']);
    });

    it.each(CLES_JOUR)('CA1 – le champ « %s » est visible et vide, en texte libre', (cle) => {
      expect(estVisible(cle)).toBe(true);
      expect(champ(cle).value).toBe('');
      // type texte : la virgule, les espaces et « abc » doivent pouvoir être saisis tels quels
      expect(champ(cle).type).toBe('text');
    });

    it.each(CLES_JOUR)('CA1 – le champ « %s » a son libellé et son aide exacts', (cle) => {
      expect(norm(etiquette(cle).textContent)).toBe(LIBELLES[cle]);
      expect(norm(aide(cle).textContent)).toBe(AIDES[cle]);
    });

    it('CA1 – le bouton « Calculer » est présent', () => {
      expect(bouton()).toBeTruthy();
    });

    it('CA1 – aucun résultat n\'est affiché, aucun message d\'erreur non plus', () => {
      expect(resultatsAffiches()).toBe(false);
      verifierAucuneErreur(CLES_JOUR);
    });

    it('CA1 – le titre principal reste affiché', () => {
      expect(norm(document.querySelector('h1')?.textContent)).toBe(TITRE);
    });
  });

  describe('Mode « par jour » : exemples chiffrés', () => {
    it.each([
      ['CA2', 'cas courant', { ...BASE_JOUR }, '25 400 €', '47 jours', '10 jours par mois'],
      ['CA3', 'division juste, non arrondie', { charges: '45300', ca: '20000', tjm: '550', mois: '6' }, '25 300 €', '46 jours', '8 jours par mois'],
      ['CA4', 'rythme calculé sur les jours arrondis (47 ÷ 6)', { ...BASE_JOUR, mois: '6' }, '25 400 €', '47 jours', '8 jours par mois'],
      ['CA5', 'chiffre d\'affaires vide compté comme 0', { charges: '48000', ca: '', tjm: '400', mois: '12' }, '48 000 €', '120 jours', '10 jours par mois'],
      ['CA6', 'centimes affichés', { charges: '30000,50', ca: '0', tjm: '500', mois: '12' }, '30 000,50 €', '61 jours', '6 jours par mois'],
      ['CA9', 'singulier pour 1', { charges: '10000', ca: '9900', tjm: '600', mois: '4' }, '100 €', '1 jour', '1 jour par mois'],
    ])('%s – %s', (_ca, _nom, saisies, montant, jours, rythme) => {
      remplir(saisies);
      calculer();
      verifierResultats({ montant, jours, rythme });
      verifierAucuneErreur(CLES_JOUR);
    });

    it.each([
      ['CA7', '25 000,50'],
      ['CA7', '25000.50'],
      ['CA7', '25000,50'],
    ])('%s – les charges « %s » donnent 25 000,50 €, 51 jours, 6 jours par mois', (_ca, charges) => {
      remplir({ charges, ca: '0', tjm: '500', mois: '10' });
      calculer();
      verifierResultats({ montant: '25 000,50 €', jours: '51 jours', rythme: '6 jours par mois' });
    });

    it('CA20 – « 5,0 » dans les mois restants vaut 5', () => {
      remplir({ ...BASE_JOUR, mois: '5,0' });
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '47 jours', rythme: '10 jours par mois' });
      verifierAucuneErreur(CLES_JOUR);
    });

    it('CA20 – « 5.0 » dans les mois restants vaut 5', () => {
      remplir({ ...BASE_JOUR, mois: '5.0' });
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '47 jours', rythme: '10 jours par mois' });
      verifierAucuneErreur(CLES_JOUR);
    });
  });

  describe('Charges déjà couvertes (CA8)', () => {
    it.each([
      ['CA égal aux charges', { charges: '40000', ca: '40000', tjm: '500', mois: '3' }],
      ['CA supérieur aux charges', { charges: '40000', ca: '42000', tjm: '500', mois: '3' }],
    ])('CA8 – %s', (_nom, saisies) => {
      remplir(saisies);
      calculer();
      verifierResultats({ montant: '0 €', jours: '0 jour', rythme: '0 jour par mois', couvertes: true });
      verifierAucuneErreur(CLES_JOUR);
    });

    it('CA8 – le message « Vos charges annuelles sont déjà couvertes. » n\'apparaît pas dans un cas normal', () => {
      remplir(BASE_JOUR);
      calculer();
      expect(document.body.textContent).not.toContain(COUVERTES);
    });
  });

  describe('Mode « par heure » (CA10 à CA13)', () => {
    it('CA10 – en mode « par jour » : TJM visible, Taux horaire et Heures masqués', () => {
      expect(estVisible('tjm')).toBe(true);
      expect(estMasque('taux')).toBe(true);
      expect(estMasque('heures')).toBe(true);
    });

    it('CA10 – en mode « par heure » : TJM masqué, Taux horaire et Heures visibles, vides, avec libellés et aides exacts', () => {
      choisirTarif('par heure');
      expect(estMasque('tjm')).toBe(true);
      for (const cle of ['taux', 'heures']) {
        expect(estVisible(cle)).toBe(true);
        expect(champ(cle).value).toBe('');
        expect(champ(cle).type).toBe('text');
        expect(norm(etiquette(cle).textContent)).toBe(LIBELLES[cle]);
        expect(norm(aide(cle).textContent)).toBe(AIDES[cle]);
      }
      for (const cle of ['charges', 'ca', 'mois']) expect(estVisible(cle)).toBe(true);
    });

    it('CA10 – en revenant en mode « par jour », c\'est de nouveau l\'inverse', () => {
      choisirTarif('par heure');
      choisirTarif('par jour');
      expect(estVisible('tjm')).toBe(true);
      expect(estMasque('taux')).toBe(true);
      expect(estMasque('heures')).toBe(true);
    });

    it.each([
      ['CA11', 'cas courant', { ...BASE_HEURE, ca: '34600' }, '25 400 €', '52 jours', '11 jours par mois'],
      ['CA12', 'heures décimales et division juste', { ...BASE_HEURE, charges: '45300', ca: '20000', taux: '50', heures: '5,5', mois: '6' }, '25 300 €', '92 jours', '16 jours par mois'],
      ['CA9', 'cas limite de 24 heures, singulier', { ...BASE_HEURE, charges: '10000', ca: '9900', taux: '25', heures: '24', mois: '4' }, '100 €', '1 jour', '1 jour par mois'],
      ['CA13', 'tarif journalier non arrondi', { ...BASE_HEURE, charges: '2187,05', ca: '0', taux: '70,55', heures: '7,75', mois: '1' }, '2 187,05 €', '4 jours', '4 jours par mois'],
    ])('%s – %s', (_ca, _nom, saisies, montant, jours, rythme) => {
      remplir(saisies);
      calculer();
      verifierResultats({ montant, jours, rythme });
      verifierAucuneErreur(CLES_HEURE);
    });
  });

  describe('Cas d\'erreur (CA14, CA19)', () => {
    // Chaque ligne : saisies (en plus ou à la place d'une base valide) et messages attendus par champ.
    const CAS = [
      // Tableau « Exemples chiffrés / Erreurs » de la spécification
      { nom: 'TJM égal à 0', base: BASE_JOUR, saisies: { tjm: '0' }, attendu: { tjm: SUPERIEUR_A_0 } },
      {
        nom: 'charges vides et 13 mois : deux erreurs à la fois',
        base: BASE_JOUR,
        saisies: { charges: '', ca: '1000', tjm: '500', mois: '13' },
        attendu: { charges: OBLIGATOIRE, mois: MSG_MOIS },
      },
      {
        nom: 'CA négatif et TJM non numérique',
        base: BASE_JOUR,
        saisies: { ca: '-500', tjm: 'abc' },
        attendu: { ca: NEGATIF, tjm: NOMBRE },
      },
      {
        nom: 'charges avec 3 décimales',
        base: BASE_JOUR,
        saisies: { charges: '1000,555', ca: '0', tjm: '500' },
        attendu: { charges: DECIMALES },
      },
      {
        nom: 'charges « -1000,555 » : un seul message, le négatif d\'abord (CA19)',
        base: BASE_JOUR,
        saisies: { charges: '-1000,555', ca: '0', tjm: '500' },
        attendu: { charges: NEGATIF },
      },
      {
        nom: 'par heure : taux horaire à 0 et 25 heures',
        base: BASE_HEURE,
        saisies: { taux: '0', heures: '25' },
        attendu: { taux: SUPERIEUR_A_0, heures: MSG_HEURES },
      },
      {
        nom: 'par heure : 7,125 heures',
        base: BASE_HEURE,
        saisies: { heures: '7,125' },
        attendu: { heures: MSG_HEURES },
      },
      {
        nom: 'par heure : heures vides',
        base: BASE_HEURE,
        saisies: { heures: '' },
        attendu: { heures: OBLIGATOIRE },
      },
      // Tableau « Cas d'erreur » : lignes non couvertes par les exemples ci-dessus
      {
        nom: 'tout vide en mode par jour (scénario, étape 2) : rien sous le CA',
        base: {},
        saisies: {},
        attendu: { charges: OBLIGATOIRE, tjm: OBLIGATOIRE, mois: OBLIGATOIRE },
      },
      {
        nom: 'tout vide en mode par heure : rien sous le CA',
        base: { tarif: 'par heure' },
        saisies: {},
        attendu: { charges: OBLIGATOIRE, taux: OBLIGATOIRE, heures: OBLIGATOIRE, mois: OBLIGATOIRE },
      },
      { nom: 'charges non numériques', base: BASE_JOUR, saisies: { charges: 'abc' }, attendu: { charges: NOMBRE } },
      { nom: 'taux horaire non numérique', base: BASE_HEURE, saisies: { taux: 'abc' }, attendu: { taux: NOMBRE } },
      { nom: 'charges négatives', base: BASE_JOUR, saisies: { charges: '-500' }, attendu: { charges: NEGATIF } },
      { nom: 'TJM négatif', base: BASE_JOUR, saisies: { tjm: '-500' }, attendu: { tjm: NEGATIF } },
      { nom: 'charges égales à 0', base: BASE_JOUR, saisies: { charges: '0' }, attendu: { charges: SUPERIEUR_A_0 } },
      { nom: 'CA avec 3 décimales', base: BASE_JOUR, saisies: { ca: '1000,555' }, attendu: { ca: DECIMALES } },
      { nom: 'TJM avec 3 décimales', base: BASE_JOUR, saisies: { tjm: '500,123' }, attendu: { tjm: DECIMALES } },
      { nom: 'taux horaire avec 3 décimales', base: BASE_HEURE, saisies: { taux: '70,555' }, attendu: { taux: DECIMALES } },
      { nom: 'heures non numériques', base: BASE_HEURE, saisies: { heures: 'abc' }, attendu: { heures: MSG_HEURES } },
      { nom: 'heures inférieures à 1', base: BASE_HEURE, saisies: { heures: '0,5' }, attendu: { heures: MSG_HEURES } },
      { nom: 'mois vides', base: BASE_JOUR, saisies: { mois: '' }, attendu: { mois: OBLIGATOIRE } },
      { nom: 'mois non numériques', base: BASE_JOUR, saisies: { mois: 'abc' }, attendu: { mois: MSG_MOIS } },
      { nom: 'mois non entiers', base: BASE_JOUR, saisies: { mois: '2,5' }, attendu: { mois: MSG_MOIS } },
      { nom: 'mois inférieurs à 1', base: BASE_JOUR, saisies: { mois: '0' }, attendu: { mois: MSG_MOIS } },
      { nom: 'mois supérieurs à 12', base: BASE_JOUR, saisies: { mois: '13' }, attendu: { mois: MSG_MOIS } },
    ];

    it.each(CAS)('CA14 – $nom', ({ base, saisies, attendu }) => {
      remplir({ ...base, ...saisies });
      const cles = base.tarif === 'par heure' ? CLES_HEURE : CLES_JOUR;
      calculer();
      expect(resultatsAffiches()).toBe(false);
      for (const cle of cles) {
        expect(erreur(cle), `message sous « ${LIBELLES[cle]} »`).toBe(attendu[cle] ?? '');
      }
    });

    it('CA14 – un seul message par champ, même avec plusieurs fautes (CA19)', () => {
      remplir({ ...BASE_JOUR, charges: '-1000,555' });
      calculer();
      expect(descriptions('charges').erreurs).toHaveLength(1);
      expect(erreur('charges')).toBe(NEGATIF);
    });

    it('CA14 – le message s\'affiche juste sous le champ concerné (après le champ, avant le champ suivant)', () => {
      remplir({ ...BASE_JOUR, charges: '' });
      calculer();
      const message = descriptions('charges').erreurs[0];
      const ordre = champ('charges').compareDocumentPosition(message);
      expect(ordre & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      const suivant = champ('ca').compareDocumentPosition(message);
      expect(suivant & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('CA14 – une fois les saisies corrigées, un nouveau calcul efface les erreurs et affiche les résultats', () => {
      remplir({ ...BASE_JOUR, tjm: '0' });
      calculer();
      expect(erreur('tjm')).toBe(SUPERIEUR_A_0);
      saisir('tjm', '550');
      calculer();
      verifierAucuneErreur(CLES_JOUR);
      verifierResultats({ montant: '25 400 €', jours: '47 jours', rythme: '10 jours par mois' });
    });
  });

  describe('Champs de l\'autre mode ignorés (CA15)', () => {
    it('CA15 – par heure, « abc » laissé dans le TJM : calcul fait, aucun message', () => {
      remplir({ ...BASE_HEURE, ca: '34600', tjm: 'abc' });
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '52 jours', rythme: '11 jours par mois' });
      verifierAucuneErreur([...CLES_HEURE, 'tjm']);
    });

    it('CA15 – par heure, TJM vide : aucune erreur', () => {
      remplir({ ...BASE_HEURE, ca: '34600' });
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '52 jours', rythme: '11 jours par mois' });
      verifierAucuneErreur([...CLES_HEURE, 'tjm']);
    });

    it('CA15 – par jour, taux horaire « abc » et heures « 25 » laissés dans l\'autre mode : calcul fait, aucun message', () => {
      remplir({ ...BASE_JOUR, taux: 'abc', heures: '25' });
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '47 jours', rythme: '10 jours par mois' });
      verifierAucuneErreur([...CLES_JOUR, 'taux', 'heures']);
    });

    it('CA15 – par jour, taux horaire et heures vides : aucune erreur', () => {
      remplir(BASE_JOUR);
      calculer();
      verifierAucuneErreur([...CLES_JOUR, 'taux', 'heures']);
    });

    it('CA15 – un TJM seul à 0 en mode par heure n\'empêche pas le calcul', () => {
      remplir({ ...BASE_HEURE, ca: '34600', tjm: '0' });
      calculer();
      expect(resultatsAffiches()).toBe(true);
      expect(erreur('tjm')).toBe('');
    });
  });

  describe('Conservation des saisies au changement de mode (CA16)', () => {
    it('CA16 – le TJM saisi est toujours là après « par heure » puis « par jour »', () => {
      saisir('tjm', '550');
      choisirTarif('par heure');
      choisirTarif('par jour');
      expect(champ('tjm').value).toBe('550');
    });

    it('CA16 – le taux horaire et les heures saisis sont toujours là après « par jour » puis « par heure »', () => {
      choisirTarif('par heure');
      saisir('taux', '70,55');
      saisir('heures', '7,75');
      choisirTarif('par jour');
      choisirTarif('par heure');
      expect(champ('taux').value).toBe('70,55');
      expect(champ('heures').value).toBe('7,75');
    });

    it('CA16 – les champs communs (charges, CA, mois) sont conservés', () => {
      remplir({ charges: '60000', ca: '34600', mois: '5' });
      choisirTarif('par heure');
      choisirTarif('par jour');
      expect(champ('charges').value).toBe('60000');
      expect(champ('ca').value).toBe('34600');
      expect(champ('mois').value).toBe('5');
    });
  });

  describe('Effacement des résultats (CA17)', () => {
    beforeEach(() => {
      remplir(BASE_JOUR);
      calculer();
      expect(resultatsAffiches()).toBe(true);
    });

    it.each([
      ['charges', '61000'],
      ['ca', '30000'],
      ['tjm', '600'],
      ['mois', '6'],
    ])('CA17 – modifier « %s » efface les résultats', (cle, valeur) => {
      saisir(cle, valeur);
      expect(resultatsAffiches()).toBe(false);
    });

    it('CA17 – changer de mode efface les résultats', () => {
      choisirTarif('par heure');
      expect(resultatsAffiches()).toBe(false);
    });

    it('CA17 – les résultats ne reviennent qu\'au prochain clic sur « Calculer »', () => {
      saisir('mois', '6');
      expect(resultatsAffiches()).toBe(false);
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '47 jours', rythme: '8 jours par mois' });
    });

    it('CA17 – le message « charges déjà couvertes » est effacé avec les résultats', () => {
      saisir('ca', '60000');
      calculer();
      expect(messageCouvertes()).toBe(true);
      saisir('ca', '1000');
      expect(resultatsAffiches()).toBe(false);
      expect(document.body.textContent).not.toContain(COUVERTES);
    });
  });

  describe('Effacement des messages d\'erreur (CA21)', () => {
    it('CA21 – le message d\'un champ disparaît dès que ce champ est modifié, sans cliquer sur « Calculer »', () => {
      remplir({ ...BASE_JOUR, tjm: '0' });
      calculer();
      expect(erreur('tjm')).toBe(SUPERIEUR_A_0);
      saisir('tjm', '5');
      expect(erreur('tjm')).toBe('');
      expect(resultatsAffiches()).toBe(false);
    });

    it.each([
      ['charges', { charges: '' }, '5', OBLIGATOIRE],
      ['ca', { ca: '-500' }, '10', NEGATIF],
      ['mois', { mois: '13' }, '5', MSG_MOIS],
    ])('CA21 – le message sous « %s » disparaît à la modification de ce champ', (cle, saisies, nouvelle, message) => {
      remplir({ ...BASE_JOUR, ...saisies });
      calculer();
      expect(erreur(cle)).toBe(message);
      saisir(cle, nouvelle);
      expect(erreur(cle)).toBe('');
    });

    it('CA21 – les contrôles se refont au prochain clic : une nouvelle faute affiche son message', () => {
      remplir({ ...BASE_JOUR, tjm: '0' });
      calculer();
      saisir('tjm', 'abc');
      expect(erreur('tjm')).toBe('');
      calculer();
      expect(erreur('tjm')).toBe(NOMBRE);
    });

    it('CA21 – changer de mode efface les messages des champs qui deviennent masqués (TJM)', () => {
      remplir({ ...BASE_JOUR, tjm: 'abc' });
      calculer();
      expect(erreur('tjm')).toBe(NOMBRE);
      choisirTarif('par heure');
      expect(erreur('tjm')).toBe('');
      choisirTarif('par jour');
      expect(erreur('tjm')).toBe('');
    });

    it('CA21 – changer de mode efface les messages des champs qui deviennent masqués (taux horaire et heures)', () => {
      remplir({ ...BASE_HEURE, taux: '0', heures: '25' });
      calculer();
      expect(erreur('taux')).toBe(SUPERIEUR_A_0);
      expect(erreur('heures')).toBe(MSG_HEURES);
      choisirTarif('par jour');
      expect(erreur('taux')).toBe('');
      expect(erreur('heures')).toBe('');
      choisirTarif('par heure');
      expect(erreur('taux')).toBe('');
      expect(erreur('heures')).toBe('');
    });
  });

  describe('Aucune sauvegarde (CA18)', () => {
    it('CA18 – après un rechargement, tous les champs sont vides et le sélecteur est sur « par jour »', () => {
      remplir({ ...BASE_HEURE, tjm: '550', ca: '34600' });
      calculer();
      expect(resultatsAffiches()).toBe(true);

      ouvrirPage(); // nouveau chargement de index.html + initialiserPage

      expect(tarifChoisi()).toBe('par jour');
      for (const cle of ['charges', 'ca', 'tjm', 'taux', 'heures', 'mois']) {
        expect(champ(cle).value, `champ « ${LIBELLES[cle]} »`).toBe('');
      }
      expect(estVisible('tjm')).toBe(true);
      expect(estMasque('taux')).toBe(true);
      expect(resultatsAffiches()).toBe(false);
      verifierAucuneErreur(CLES_HEURE);
    });

    it('CA18 – rien n\'est écrit dans localStorage ni sessionStorage', () => {
      const ecritures = vi.spyOn(Storage.prototype, 'setItem');
      remplir({ ...BASE_HEURE, tjm: '550', ca: '34600' });
      calculer();
      choisirTarif('par jour');
      saisir('tjm', '600');
      calculer();

      expect(ecritures).not.toHaveBeenCalled();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      ouvrirPage();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('Scénario de bout en bout (douze étapes de la spécification)', () => {
    it('suit le scénario de la spécification, étape par étape', () => {
      // 1. Ouverture
      expect(tarifChoisi()).toBe('par jour');
      for (const cle of CLES_JOUR) {
        expect(estVisible(cle)).toBe(true);
        expect(champ(cle).value).toBe('');
        expect(norm(aide(cle).textContent)).toBe(AIDES[cle]);
      }
      expect(bouton()).toBeTruthy();
      expect(resultatsAffiches()).toBe(false);

      // 2. Clic sur « Calculer » sans rien saisir
      calculer();
      expect(erreur('charges')).toBe(OBLIGATOIRE);
      expect(erreur('tjm')).toBe(OBLIGATOIRE);
      expect(erreur('mois')).toBe(OBLIGATOIRE);
      expect(erreur('ca')).toBe('');
      expect(resultatsAffiches()).toBe(false);

      // 3. TJM à 0
      saisir('charges', '60 000');
      saisir('ca', '34600');
      saisir('tjm', '0');
      saisir('mois', '5');
      calculer();
      expect(erreur('tjm')).toBe(SUPERIEUR_A_0);
      expect(resultatsAffiches()).toBe(false);

      // 4. TJM à 550
      saisir('tjm', '550');
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '47 jours', rythme: '10 jours par mois' });
      verifierAucuneErreur(CLES_JOUR);

      // 5. Six mois
      saisir('mois', '6');
      expect(resultatsAffiches()).toBe(false);
      calculer();
      expect(resultat('Jours restant à vendre')).toBe('47 jours');
      expect(resultat('Rythme mensuel')).toBe('8 jours par mois');

      // 6. Mode « par heure »
      choisirTarif('par heure');
      expect(resultatsAffiches()).toBe(false);
      expect(estMasque('tjm')).toBe(true);
      for (const cle of ['taux', 'heures']) {
        expect(estVisible(cle)).toBe(true);
        expect(champ(cle).value).toBe('');
        expect(norm(aide(cle).textContent)).toBe(AIDES[cle]);
      }

      // 7. Heures à 25
      saisir('taux', '70');
      saisir('heures', '25');
      calculer();
      expect(erreur('heures')).toBe(MSG_HEURES);
      expect(resultatsAffiches()).toBe(false);

      // 8. Heures à 7, mois à 5
      saisir('heures', '7');
      saisir('mois', '5');
      calculer();
      verifierResultats({ montant: '25 400 €', jours: '52 jours', rythme: '11 jours par mois' });

      // 9. Retour en mode « par jour »
      choisirTarif('par jour');
      expect(champ('tjm').value).toBe('550');
      expect(resultatsAffiches()).toBe(false);
      calculer();
      expect(resultat('Jours restant à vendre')).toBe('47 jours');
      expect(resultat('Rythme mensuel')).toBe('10 jours par mois');

      // 10. Charges déjà couvertes
      saisir('ca', '60 000');
      calculer();
      verifierResultats({ montant: '0 €', jours: '0 jour', rythme: '0 jour par mois', couvertes: true });

      // 11. Centimes
      saisir('charges', '30 000,50');
      saisir('ca', '0');
      saisir('tjm', '500');
      saisir('mois', '12');
      calculer();
      verifierResultats({ montant: '30 000,50 €', jours: '61 jours', rythme: '6 jours par mois' });

      // 12. Rechargement
      ouvrirPage();
      expect(tarifChoisi()).toBe('par jour');
      for (const cle of ['charges', 'ca', 'tjm', 'taux', 'heures', 'mois']) {
        expect(champ(cle).value).toBe('');
      }
    });
  });
});
