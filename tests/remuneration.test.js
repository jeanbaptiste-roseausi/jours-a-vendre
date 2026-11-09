// @vitest-environment jsdom
// Tests de la spécification 002 : onglet « Rémunération » (quatre calculs A, B, C, D).
//
// Contrat attendu du code (voir le rapport du testeur) :
//   - src/remuneration.js       : fonctions pures (contrôle des saisies, quatre calculs, durée)
//   - src/onglets.js            : initialiserOnglets(racine) branche les deux onglets
//   - src/page-remuneration.js  : initialiserRemuneration(racine) branche l'onglet « Rémunération »
//   - src/page.js               : initialiserPage(racine) de la 001, inchangée
//   - index.html                : onglets, panneaux et champs (identifiants décrits dans le rapport)
//
// Les modules sont chargés dynamiquement pour que chaque test échoue séparément,
// avec un message clair, tant que le code n'existe pas.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Chargement des modules à tester
// ---------------------------------------------------------------------------

const modules = import.meta.glob([
  '../src/remuneration.js',
  '../src/onglets.js',
  '../src/page-remuneration.js',
  '../src/page.js',
]);

async function charger(chemin) {
  if (!modules[chemin]) return { __erreur: new Error(`le fichier ${chemin} n'existe pas encore`) };
  try {
    return await modules[chemin]();
  } catch (cause) {
    return { __erreur: cause };
  }
}

const remuneration = await charger('../src/remuneration.js');
const onglets = await charger('../src/onglets.js');
const pageRemuneration = await charger('../src/page-remuneration.js');
const page001 = await charger('../src/page.js');

function fonction(module, chemin, nom) {
  const f = module[nom];
  if (typeof f !== 'function') {
    const cause = module.__erreur ? ` (${module.__erreur.message})` : '';
    throw new Error(`${chemin} doit exporter la fonction « ${nom} »${cause}`);
  }
  return f;
}
const dansRemu = (nom) => fonction(remuneration, 'src/remuneration.js', nom);

// ---------------------------------------------------------------------------
// Textes de la spécification
// ---------------------------------------------------------------------------

// Toutes les sortes d'espaces (normale, insécable, fine insécable) valent une espace simple.
const norm = (texte) => (texte ?? '').replace(/\s+/g, ' ').trim();

const OBLIGATOIRE = 'Ce champ est obligatoire.';
const INVALIDE = 'Valeur invalide.';
const ABSORBE_RESERVE = 'Votre réserve absorbe toute la trésorerie.';
const ABSORBE_FRAIS = "Vos frais absorbent tout votre chiffre d'affaires.";

const L = {
  calcul: 'Calcul',
  taux: 'Taux de prélèvements (%)',
  tresorerie: 'Trésorerie disponible (€)',
  reserve: 'Réserve à garder',
  uniteReserve: 'Unité de la réserve',
  deja: 'Nette déjà versée (€)',
  objectif: 'Objectif de rémunération nette mensuelle (€)',
  jours: 'Jours facturés par mois',
  heures: 'Heures travaillées par jour',
  tarif: 'Tarif',
  tjm: 'TJM (€ HT)',
  tauxHoraire: 'Taux horaire (€ HT)',
  frais: 'Frais (€ HT)',
  periodicite: 'Périodicité des frais',
  net: 'Rémunération nette mensuelle (€)',
};

const AIDES = {
  taux: 'Part des prélèvements, comptée sur le net, de 0 à 200 %.',
  tresorerie: "Ce que vous avez sur le compte aujourd'hui, 0 ou plus.",
  reserve: 'Un montant, ou de 0 à 100 % de la trésorerie. Laissez vide si aucune.',
  deja: 'Rémunération nette déjà versée cette année, 0 ou plus. Laissez vide si aucune.',
  objectif: 'Ce que vous voulez toucher par mois, plus de 0 €.',
  jours: 'Nombre de jours facturés dans un mois, de 1 à 31.',
  heures: "Nombre d'heures facturées dans une journée, de 1 à 24.",
  tjm: 'Taux journalier moyen facturé à vos clients, plus de 0 €.',
  tauxHoraire: "Prix d'une heure facturée à vos clients, plus de 0 €.",
  frais: "Dépenses de l'activité, hors rémunération, 0 ou plus. Laissez vide s'il n'y en a pas.",
  net: 'Ce que vous voulez vous verser chaque mois, plus de 0 €.',
};

const CALCULS = {
  a: 'Combien me verser',
  b: 'Quel tarif pratiquer',
  c: 'Combien je gagnerais',
  d: 'Combien de temps je tiens',
};

// Champs de saisie texte visibles, par calcul (et par mode pour C). Les sélecteurs n'y figurent pas.
const TEXTES = {
  a: ['taux', 'tresorerie', 'reserve', 'deja'],
  b: ['taux', 'objectif', 'jours', 'heures', 'frais'],
  cJour: ['taux', 'tjm', 'jours', 'frais'],
  cHeure: ['taux', 'tauxHoraire', 'heures', 'jours', 'frais'],
  d: ['taux', 'tresorerie', 'net', 'frais'],
};

// Libellés de tous les champs visibles (sélecteurs compris), par calcul (et par mode pour C).
const VISIBLES = {
  a: ['calcul', 'taux', 'tresorerie', 'reserve', 'uniteReserve', 'deja'],
  b: ['calcul', 'taux', 'objectif', 'jours', 'heures', 'frais', 'periodicite'],
  cJour: ['calcul', 'taux', 'tarif', 'tjm', 'jours', 'frais', 'periodicite'],
  cHeure: ['calcul', 'taux', 'tarif', 'tauxHoraire', 'heures', 'jours', 'frais', 'periodicite'],
  d: ['calcul', 'taux', 'tresorerie', 'net', 'frais', 'periodicite'],
};

// ---------------------------------------------------------------------------
// Utilitaires de page
// ---------------------------------------------------------------------------

// Sous jsdom, import.meta.url n'est pas une URL « file » : on part de la racine du projet.
const corpsHtml = new DOMParser().parseFromString(
  readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8'),
  'text/html',
).body.innerHTML;

function ouvrirPage() {
  document.body.innerHTML = corpsHtml;
  fonction(page001, 'src/page.js', 'initialiserPage')(document);
  fonction(onglets, 'src/onglets.js', 'initialiserOnglets')(document);
  fonction(pageRemuneration, 'src/page-remuneration.js', 'initialiserRemuneration')(document);
}

const sansMasque = (element) => !element.closest('[hidden]');

function panneau() {
  const p = document.getElementById('panneau-remuneration');
  if (!p) throw new Error('Panneau #panneau-remuneration absent de index.html');
  return p;
}

function panneauJours() {
  const p = document.getElementById('panneau-jours');
  if (!p) throw new Error('Panneau #panneau-jours absent de index.html');
  return p;
}

function groupe(cle) {
  const g = panneau().querySelector(`[data-calcul="${cle}"]`);
  if (!g) throw new Error(`Groupe [data-calcul="${cle}"] absent du panneau Rémunération`);
  return g;
}

// --- Onglets ---

function onglet(texte) {
  const trouve = [...document.querySelectorAll('[role="tab"]')].find((e) => norm(e.textContent) === texte);
  if (!trouve) throw new Error(`Onglet « ${texte} » absent (role="tab")`);
  return trouve;
}
const ouvrirOnglet = (texte) => onglet(texte).click();
const ouvrirRemuneration = () => ouvrirOnglet('Rémunération');
const ouvrirJours = () => ouvrirOnglet('Jours à vendre');

// --- Champs de l'onglet « Rémunération » (toujours ceux qui sont visibles) ---

const etiquettes = (texte, racine) =>
  [...racine.querySelectorAll('label')].filter((l) => norm(l.textContent) === texte);

function etiquetteVisible(texte) {
  const trouvees = etiquettes(texte, panneau()).filter(sansMasque);
  if (trouvees.length !== 1) {
    throw new Error(`Il faut exactement un <label> visible « ${texte} » dans l'onglet Rémunération (trouvé : ${trouvees.length})`);
  }
  return trouvees[0];
}

function champDe(label) {
  const element = label.htmlFor ? document.getElementById(label.htmlFor) : label.control;
  if (!element) throw new Error(`Le <label> « ${norm(label.textContent)} » n'est associé à aucun champ (attribut for)`);
  return element;
}

const champ = (libelle) => champDe(etiquetteVisible(libelle));
const champDans = (calcul, libelle) => {
  const trouvees = etiquettes(libelle, groupe(calcul));
  if (trouvees.length !== 1) throw new Error(`Il faut exactement un <label> « ${libelle} » dans le calcul ${calcul} (trouvé : ${trouvees.length})`);
  return champDe(trouvees[0]);
};

// Éléments reliés au champ par aria-describedby : l'aide, et le message d'erreur (role="alert").
function descriptions(element) {
  const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  const liés = ids.map((id) => document.getElementById(id)).filter(Boolean);
  return {
    aides: liés.filter((e) => e.getAttribute('role') !== 'alert'),
    erreurs: liés.filter((e) => e.getAttribute('role') === 'alert'),
  };
}

function aide(libelle) {
  const { aides } = descriptions(champ(libelle));
  if (aides.length !== 1) {
    throw new Error(`« ${libelle} » doit avoir exactement un élément d'aide relié par aria-describedby (trouvé : ${aides.length})`);
  }
  return aides[0];
}

const texteErreur = (element) =>
  descriptions(element).erreurs.map((e) => (e.hidden ? '' : norm(e.textContent))).join(' ').trim();

// Message d'erreur du champ visible, ou '' s'il n'y en a pas.
const erreur = (libelle) => texteErreur(champ(libelle));
// Message d'erreur d'un champ, même si son calcul est masqué.
const erreurDans = (calcul, libelle) => texteErreur(champDans(calcul, libelle));

const valeur = (libelle) => champ(libelle).value;
const selection = (libelle) => norm(champ(libelle).selectedOptions[0]?.textContent);
const choix = (libelle) => [...champ(libelle).options].map((o) => norm(o.textContent));

function saisir(libelle, texte) {
  const element = champ(libelle);
  element.value = texte;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function choisir(libelle, texteOption) {
  const selecteur = champ(libelle);
  const option = [...selecteur.options].find((o) => norm(o.textContent) === texteOption);
  if (!option) throw new Error(`Le sélecteur « ${libelle} » n'a pas de choix « ${texteOption} »`);
  selecteur.value = option.value;
  selecteur.dispatchEvent(new Event('input', { bubbles: true }));
  selecteur.dispatchEvent(new Event('change', { bubbles: true }));
}

const choisirCalcul = (cle) => choisir(L.calcul, CALCULS[cle]);

function bouton() {
  const b = [...panneau().querySelectorAll('button')]
    .filter(sansMasque)
    .find((e) => norm(e.textContent) === 'Calculer');
  if (!b) throw new Error('Bouton « Calculer » visible absent de l\'onglet Rémunération');
  return b;
}
const calculer = () => bouton().click();

// Libellés des champs visibles (étiquettes sans ancêtre masqué), triés.
const libellesVisibles = () =>
  [...panneau().querySelectorAll('label')]
    .filter(sansMasque)
    .map((l) => norm(l.textContent))
    .sort();
const attenduVisibles = (cles) => cles.map((c) => L[c]).sort();

// Prépare un calcul : choisit le calcul, puis les sélecteurs, puis saisit (clés de `L`).
function utiliser(calcul, { tarif, unite, periodicite, ...saisies } = {}) {
  choisirCalcul(calcul);
  if (tarif) choisir(L.tarif, tarif);
  if (unite) choisir(L.uniteReserve, unite);
  if (periodicite) choisir(L.periodicite, periodicite);
  for (const [cle, texte] of Object.entries(saisies)) saisir(L[cle], texte);
}

// --- Résultats ---

function zoneResultats() {
  return panneau().querySelector('[role="region"][aria-label="Résultats de la rémunération"]');
}

function resultatsAffiches() {
  const zone = zoneResultats();
  return !!zone && sansMasque(zone) && norm(zone.textContent) !== '';
}

// La valeur suit son libellé : deux éléments frères consécutifs (par exemple <dt> puis <dd>).
function valeurApres(racine, libelle) {
  const element = [...racine.querySelectorAll('*')].find(
    (e) => e.children.length === 0 && norm(e.textContent) === libelle,
  );
  if (!element) throw new Error(`Libellé de résultat « ${libelle} » introuvable`);
  return norm(element.nextElementSibling?.textContent);
}

function resultat(libelle) {
  const zone = zoneResultats();
  if (!zone) throw new Error('Zone de résultats absente (role="region", aria-label="Résultats de la rémunération")');
  return valeurApres(zone, libelle);
}

function ligneA(nom) {
  const zone = zoneResultats();
  const ligne = zone?.querySelector(`[data-ligne="${nom}"]`);
  if (!ligne) throw new Error(`Ligne [data-ligne="${nom}"] absente de la zone de résultats`);
  return ligne;
}

const texteZone = () => norm(zoneResultats()?.textContent ?? '');

function verifierA({ sans, avec, absorbe = false }) {
  expect(resultatsAffiches()).toBe(true);
  const sansReserve = ligneA('sans-reserve');
  const avecReserve = ligneA('avec-reserve');
  expect(norm(sansReserve.textContent)).toContain('Sans réserve');
  expect(norm(avecReserve.textContent)).toContain('Avec réserve');
  expect(valeurApres(sansReserve, 'Encore à verser')).toBe(sans[0]);
  expect(valeurApres(sansReserve, "Total de l'année")).toBe(sans[1]);
  expect(valeurApres(avecReserve, 'Encore à verser')).toBe(avec[0]);
  expect(valeurApres(avecReserve, "Total de l'année")).toBe(avec[1]);
  expect(norm(avecReserve.textContent).includes(ABSORBE_RESERVE)).toBe(absorbe);
  expect(norm(sansReserve.textContent)).not.toContain(ABSORBE_RESERVE);
}

function verifierB(tjm, tauxHoraire) {
  expect(resultatsAffiches()).toBe(true);
  expect(resultat('TJM à pratiquer')).toBe(tjm);
  expect(resultat('Taux horaire à pratiquer')).toBe(tauxHoraire);
}

function verifierC(mensuel, annuel, absorbe = false) {
  expect(resultatsAffiches()).toBe(true);
  expect(resultat('Net mensuel')).toBe(mensuel);
  expect(resultat('Net annuel')).toBe(annuel);
  expect(texteZone().includes(ABSORBE_FRAIS)).toBe(absorbe);
}

function verifierD(sortie, duree) {
  expect(resultatsAffiches()).toBe(true);
  expect(resultat('Sortie mensuelle')).toBe(sortie);
  expect(resultat('Durée sans rentrée')).toBe(duree);
}

function verifierAucuneErreur(calcul, cles) {
  for (const cle of cles) {
    expect(erreur(L[cle]), `message sous « ${L[cle]} »`).toBe('');
  }
}

// --- Onglet « Jours à vendre » (spécification 001) ---

function champJours(libelle) {
  const label = etiquettes(libelle, panneauJours())[0];
  if (!label) throw new Error(`Champ « ${libelle} » absent de l'onglet Jours à vendre`);
  return champDe(label);
}

function saisirJours(libelle, texte) {
  const element = champJours(libelle);
  element.value = texte;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function resultatJours(libelle) {
  const zone = panneauJours().querySelector('[role="region"][aria-label="Résultats"]');
  if (!zone) throw new Error('Zone de résultats de la 001 absente');
  return valeurApres(zone, libelle);
}

function boutonJours() {
  const b = [...panneauJours().querySelectorAll('button')].find((e) => norm(e.textContent) === 'Calculer');
  if (!b) throw new Error('Bouton « Calculer » absent de l\'onglet Jours à vendre');
  return b;
}

function calculerJours001() {
  saisirJours('Charges annuelles (€ HT)', '60 000');
  saisirJours("Chiffre d'affaires déjà identifié (€ HT)", '34600');
  saisirJours('TJM (€ HT)', '550');
  saisirJours('Mois restants', '5');
  boutonJours().click();
  expect(resultatJours('Montant restant à couvrir')).toBe('25 400 €');
  expect(resultatJours('Jours restant à vendre')).toBe('47 jours');
  expect(resultatJours('Rythme mensuel')).toBe('10 jours par mois');
}

// Valeurs d'exemples de la spécification, saisies telles quelles (clés de `L`).
const BASE_A = { tresorerie: '29000', reserve: '5000', deja: '12000' };
const BASE_B = { objectif: '3000', frais: '500', jours: '15', heures: '7' };
const BASE_C_JOUR = { tjm: '400', jours: '15', frais: '500' };
const BASE_C_HEURE = { tarif: 'par heure', tauxHoraire: '70', heures: '7', jours: '10', frais: '6000', periodicite: 'par an' };
const BASE_D = { tresorerie: '30000', net: '3000', frais: '500' };

// ---------------------------------------------------------------------------
// Module src/remuneration.js : fonctions pures
// ---------------------------------------------------------------------------

describe('validerSaisie – contrôle d\'un nombre (CA16, CA17)', () => {
  const valider = (...args) => dansRemu('validerSaisie')(...args);

  it('CA16 – champ obligatoire vide : « Ce champ est obligatoire. »', () => {
    expect(valider('')).toEqual({ valeur: null, erreur: OBLIGATOIRE });
    expect(valider('   ')).toEqual({ valeur: null, erreur: OBLIGATOIRE });
  });

  it('CA16 – champ facultatif vide : valeur 0, aucune erreur', () => {
    expect(valider('', { obligatoire: false })).toEqual({ valeur: 0, erreur: null });
  });

  it.each(['abc', '12abc', '1,2,3'])('CA16 – « %s » n\'est pas un nombre : « Valeur invalide. »', (texte) => {
    expect(valider(texte)).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider(texte, { obligatoire: false })).toEqual({ valeur: null, erreur: INVALIDE });
  });

  it('CA16 – plus de 2 décimales : « Valeur invalide. »', () => {
    expect(valider('1000,555')).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider('1000.555')).toEqual({ valeur: null, erreur: INVALIDE });
  });

  it('CA16 – 2 décimales au maximum sont acceptées', () => {
    expect(valider('1000,55')).toEqual({ valeur: 1000.55, erreur: null });
  });

  it('CA17 – « 29 000,50 », « 29000.50 » et « 29000,50 » valent 29 000,50', () => {
    for (const texte of ['29 000,50', '29000.50', '29000,50']) {
      expect(valider(texte)).toEqual({ valeur: 29000.5, erreur: null });
    }
  });

  it('CA16 – borne basse incluse (min 0) : 0 accepté, négatif refusé', () => {
    expect(valider('0', { min: 0 })).toEqual({ valeur: 0, erreur: null });
    expect(valider('-0,01', { min: 0 })).toEqual({ valeur: null, erreur: INVALIDE });
  });

  it('CA16 – borne basse exclue (minExclu) : 0 refusé, 0,01 accepté', () => {
    expect(valider('0', { min: 0, minExclu: true })).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider('0,01', { min: 0, minExclu: true })).toEqual({ valeur: 0.01, erreur: null });
  });

  it('CA16 – taux de 0 à 200 inclus', () => {
    const options = { min: 0, max: 200 };
    expect(valider('0', options)).toEqual({ valeur: 0, erreur: null });
    expect(valider('45', options)).toEqual({ valeur: 45, erreur: null });
    expect(valider('200', options)).toEqual({ valeur: 200, erreur: null });
    expect(valider('200,01', options)).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider('250', options)).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider('-1', options)).toEqual({ valeur: null, erreur: INVALIDE });
  });

  it('CA16 – jours de 1 à 31 inclus', () => {
    const options = { min: 1, max: 31 };
    expect(valider('1', options)).toEqual({ valeur: 1, erreur: null });
    expect(valider('31', options)).toEqual({ valeur: 31, erreur: null });
    expect(valider('0', options)).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider('32', options)).toEqual({ valeur: null, erreur: INVALIDE });
  });

  it('CA16 – heures de 1 à 24 inclus', () => {
    const options = { min: 1, max: 24 };
    expect(valider('24', options)).toEqual({ valeur: 24, erreur: null });
    expect(valider('1', options)).toEqual({ valeur: 1, erreur: null });
    expect(valider('0,5', options)).toEqual({ valeur: null, erreur: INVALIDE });
    expect(valider('25', options)).toEqual({ valeur: null, erreur: INVALIDE });
  });

  it('CA16 – réserve en % de 0 à 100 inclus', () => {
    const options = { obligatoire: false, min: 0, max: 100 };
    expect(valider('100', options)).toEqual({ valeur: 100, erreur: null });
    expect(valider('150', options)).toEqual({ valeur: null, erreur: INVALIDE });
  });
});

describe('fraisDuMois (règle 2, CA9)', () => {
  it('CA9 – 500 par mois valent 500', () => {
    expect(dansRemu('fraisDuMois')(500, 'mois')).toBe(500);
  });

  it('CA9 – 6 000 par an valent 500 par mois', () => {
    expect(dansRemu('fraisDuMois')(6000, 'an')).toBe(500);
  });

  it('CA9 – des frais vides (0) valent 0', () => {
    expect(dansRemu('fraisDuMois')(0, 'mois')).toBe(0);
    expect(dansRemu('fraisDuMois')(0, 'an')).toBe(0);
  });

  it('CA22 – 1 000 par an valent un douzième, sans arrondi', () => {
    expect(dansRemu('fraisDuMois')(1000, 'an')).toBeCloseTo(83.3333333333, 8);
  });
});

describe('calculerVersement – calcul A (règles 6 à 9, CA4, CA5, CA6)', () => {
  const calculerVersement = (...args) => dansRemu('calculerVersement')(...args);

  it('CA4 – trésorerie 29 000, réserve 5 000 €, déjà versé 12 000', () => {
    expect(
      calculerVersement({ tresorerie: 29000, reserve: 5000, uniteReserve: 'euro', dejaVerse: 12000, taux: 45 }),
    ).toEqual({
      sansReserve: { encoreAVerser: 20000, total: 32000 },
      avecReserve: { encoreAVerser: 16551.72, total: 28551.72 },
      reserveAbsorbeTout: false,
    });
  });

  it('CA5 – trésorerie 29 000, réserve 10 %, rien de versé : 18 000', () => {
    expect(
      calculerVersement({ tresorerie: 29000, reserve: 10, uniteReserve: 'pourcent', dejaVerse: 0, taux: 45 }),
    ).toEqual({
      sansReserve: { encoreAVerser: 20000, total: 20000 },
      avecReserve: { encoreAVerser: 18000, total: 18000 },
      reserveAbsorbeTout: false,
    });
  });

  it('CA6 – réserve égale à la trésorerie : 0 avec réserve, et le signal d\'absorption', () => {
    expect(
      calculerVersement({ tresorerie: 10000, reserve: 10000, uniteReserve: 'euro', dejaVerse: 0, taux: 45 }),
    ).toEqual({
      sansReserve: { encoreAVerser: 6896.55, total: 6896.55 },
      avecReserve: { encoreAVerser: 0, total: 0 },
      reserveAbsorbeTout: true,
    });
  });

  it('CA6 – trésorerie à 0 sans réserve saisie (reserve : null) : tout à 0, pas d\'absorption', () => {
    expect(
      calculerVersement({ tresorerie: 0, reserve: null, uniteReserve: 'euro', dejaVerse: 0, taux: 45 }),
    ).toEqual({
      sansReserve: { encoreAVerser: 0, total: 0 },
      avecReserve: { encoreAVerser: 0, total: 0 },
      reserveAbsorbeTout: false,
    });
  });
});

describe('calculerTarifAPratiquer – calcul B (règles 10 à 12, CA7, CA8, CA9)', () => {
  const calculerTarif = (...args) => dansRemu('calculerTarifAPratiquer')(...args);

  it('CA7 – objectif 3 000, frais 500 par mois, 15 jours, 7 heures : 324 € et 46,20 €', () => {
    expect(calculerTarif({ objectif: 3000, frais: 500, periodicite: 'mois', jours: 15, heures: 7, taux: 45 })).toEqual({
      tjm: 324,
      tauxHoraire: 46.2,
    });
  });

  it('CA8 – divisions justes, non arrondies : taux 50, objectif 2 000, 10 jours, 6 heures : 300 € et 50 €', () => {
    expect(calculerTarif({ objectif: 2000, frais: 0, periodicite: 'mois', jours: 10, heures: 6, taux: 50 })).toEqual({
      tjm: 300,
      tauxHoraire: 50,
    });
  });

  it('CA9 – frais de 6 000 par an : même résultat que 500 par mois', () => {
    expect(calculerTarif({ objectif: 3000, frais: 6000, periodicite: 'an', jours: 15, heures: 7, taux: 45 })).toEqual({
      tjm: 324,
      tauxHoraire: 46.2,
    });
  });
});

describe('calculerNetProjete – calcul C (règles 13 à 16, CA10, CA11, CA12)', () => {
  const calculerNet = (...args) => dansRemu('calculerNetProjete')(...args);

  it('CA10 – par jour : TJM 400, 15 jours, frais 500 par mois : 3 793,10 € et 45 517,24 €', () => {
    expect(calculerNet({ mode: 'jour', tjm: 400, jours: 15, frais: 500, periodicite: 'mois', taux: 45 })).toEqual({
      netMensuel: 3793.1,
      netAnnuel: 45517.24,
      fraisAbsorbent: false,
    });
  });

  it('CA11 – par heure : 70 €, 7 heures, 10 jours, frais 6 000 par an : 3 034,48 € et 36 413,79 €', () => {
    expect(
      calculerNet({ mode: 'heure', tauxHoraire: 70, heures: 7, jours: 10, frais: 6000, periodicite: 'an', taux: 45 }),
    ).toEqual({ netMensuel: 3034.48, netAnnuel: 36413.79, fraisAbsorbent: false });
  });

  it('CA12 – frais égaux au chiffre d\'affaires (TJM 300, 2 jours, frais 600) : 0 € et 0 €', () => {
    expect(calculerNet({ mode: 'jour', tjm: 300, jours: 2, frais: 600, periodicite: 'mois', taux: 45 })).toEqual({
      netMensuel: 0,
      netAnnuel: 0,
      fraisAbsorbent: true,
    });
  });
});

describe('calculerDureeTenue – calcul D (règles 17 et 18, CA13, CA14, CA22)', () => {
  const calculerDuree = (...args) => dansRemu('calculerDureeTenue')(...args);

  it.each([
    ['CA13', 'cas courant', { tresorerie: 30000, net: 3000, frais: 500, periodicite: 'mois', taux: 45 }, 4850, 6.1],
    ['CA14', 'division juste', { tresorerie: 29000, net: 2000, frais: 0, periodicite: 'mois', taux: 45 }, 2900, 10],
    ['CA14', 'trésorerie à 0', { tresorerie: 0, net: 2000, frais: 0, periodicite: 'mois', taux: 45 }, 2900, 0],
    ['CA9', 'frais de 6 000 par an', { tresorerie: 30000, net: 3000, frais: 6000, periodicite: 'an', taux: 45 }, 4850, 6.1],
    ['CA22', 'sortie exacte 4 433,3333', { tresorerie: 30000, net: 3000, frais: 1000, periodicite: 'an', taux: 45 }, 4433.34, 6.7],
  ])('%s – %s', (_ca, _nom, entree, sortieMensuelle, dureeMois) => {
    expect(calculerDuree(entree)).toEqual({ sortieMensuelle, dureeMois });
  });
});

describe('formaterDuree (section Affichage, CA13, CA14)', () => {
  it.each([
    [6.1, '6,1 mois'],
    [6.7, '6,7 mois'],
    [10, '10 mois'],
    [0, '0 mois'],
  ])('formaterDuree(%s) donne « %s »', (nombre, attendu) => {
    expect(norm(dansRemu('formaterDuree')(nombre))).toBe(attendu);
  });
});

// ---------------------------------------------------------------------------
// Comportement de la page (jsdom)
// ---------------------------------------------------------------------------

describe('Page – onglet « Rémunération »', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    ouvrirPage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('Ouverture et onglets (CA1, CA21)', () => {
    it('CA1 – à l\'ouverture, « Jours à vendre » est actif et « Rémunération » est présent à côté', () => {
      const jours = onglet('Jours à vendre');
      const remu = onglet('Rémunération');
      expect(jours.getAttribute('aria-selected')).toBe('true');
      expect(remu.getAttribute('aria-selected')).toBe('false');
      expect(sansMasque(panneauJours())).toBe(true);
      expect(sansMasque(panneau())).toBe(false);
      expect(norm(document.querySelector('h1')?.textContent)).toBe('Combien de jours dois-je vendre ?');
    });

    it('CA1 – l\'onglet « Jours à vendre » reste conforme à la 001 : champs, aides et bouton', () => {
      for (const [libelle, texteAide] of [
        ['Charges annuelles (€ HT)', "Tout ce que vous devez encaisser sur l'année, rémunération comprise."],
        ["Chiffre d'affaires déjà identifié (€ HT)", 'Missions signées ou facturées. Laissez vide si aucune.'],
        ['TJM (€ HT)', 'Taux journalier moyen facturé à vos clients.'],
        ['Mois restants', 'Nombre de mois pour vendre ces jours, de 1 à 12.'],
      ]) {
        const element = champJours(libelle);
        expect(element.value).toBe('');
        expect(sansMasque(element)).toBe(true);
        const { aides } = descriptions(element);
        expect(norm(aides[0].textContent)).toBe(texteAide);
      }
      expect(boutonJours()).toBeTruthy();
    });

    it('CA21 – avec les onglets branchés, le calcul de la 001 donne toujours le même résultat (scénario, étape 12)', () => {
      calculerJours001();
    });

    it('CA1 – cliquer sur « Rémunération » montre son panneau et masque celui de « Jours à vendre »', () => {
      ouvrirRemuneration();
      expect(onglet('Rémunération').getAttribute('aria-selected')).toBe('true');
      expect(onglet('Jours à vendre').getAttribute('aria-selected')).toBe('false');
      expect(sansMasque(panneau())).toBe(true);
      expect(sansMasque(panneauJours())).toBe(false);
    });

    it('CA1 – cliquer sur « Jours à vendre » revient au premier panneau', () => {
      ouvrirRemuneration();
      ouvrirJours();
      expect(onglet('Jours à vendre').getAttribute('aria-selected')).toBe('true');
      expect(sansMasque(panneauJours())).toBe(true);
      expect(sansMasque(panneau())).toBe(false);
    });
  });

  describe('Ouverture de l\'onglet « Rémunération » (CA2)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA2 – le sélecteur « Calcul » propose les quatre calculs et s\'ouvre sur « Combien me verser »', () => {
      expect(choix(L.calcul)).toEqual(Object.values(CALCULS));
      expect(selection(L.calcul)).toBe('Combien me verser');
    });

    it('CA2 – le taux de prélèvements est à 45', () => {
      expect(valeur(L.taux)).toBe('45');
    });

    it.each([
      ['a', 'A', {}],
      ['b', 'B', {}],
      ['c', 'C par jour', {}],
      ['c', 'C par heure', { tarif: 'par heure' }],
      ['d', 'D', {}],
    ])('CA2 – calcul %s (%s) : champs vides en texte libre, libellés et aides exacts', (calcul, _nom, options) => {
      choisirCalcul(calcul);
      if (options.tarif) choisir(L.tarif, options.tarif);
      const cles = TEXTES[calcul === 'c' ? (options.tarif ? 'cHeure' : 'cJour') : calcul];
      for (const cle of cles) {
        const element = champ(L[cle]);
        expect(element.type, `type de « ${L[cle]} »`).toBe('text');
        expect(element.value, `valeur initiale de « ${L[cle]} »`).toBe(cle === 'taux' ? '45' : '');
        expect(norm(aide(L[cle]).textContent), `aide de « ${L[cle]} »`).toBe(AIDES[cle]);
      }
    });

    it('CA2 – valeurs initiales des sélecteurs : « en € », « par jour » et « par mois »', () => {
      expect(selection(L.uniteReserve)).toBe('en €');
      expect(choix(L.uniteReserve)).toEqual(['en €', 'en %']);
      choisirCalcul('b');
      expect(selection(L.periodicite)).toBe('par mois');
      expect(choix(L.periodicite)).toEqual(['par mois', 'par an']);
      choisirCalcul('c');
      expect(selection(L.tarif)).toBe('par jour');
      expect(choix(L.tarif)).toEqual(['par jour', 'par heure']);
      expect(selection(L.periodicite)).toBe('par mois');
      choisirCalcul('d');
      expect(selection(L.periodicite)).toBe('par mois');
    });

    it('CA2 – le bouton « Calculer » est présent, aucun résultat et aucun message d\'erreur', () => {
      expect(bouton()).toBeTruthy();
      expect(resultatsAffiches()).toBe(false);
      verifierAucuneErreur('a', TEXTES.a);
    });
  });

  describe('Champs affichés par calcul (CA3)', () => {
    beforeEach(() => ouvrirRemuneration());

    it.each([
      ['a', 'A', 'a'],
      ['b', 'B', 'b'],
      ['c', 'C par jour', 'cJour'],
      ['d', 'D', 'd'],
    ])('CA3 – calcul %s (%s) : seulement ses champs', (calcul, _nom, tableau) => {
      choisirCalcul(calcul);
      expect(libellesVisibles()).toEqual(attenduVisibles(VISIBLES[tableau]));
    });

    it('CA3 – dans C, le mode « par heure » remplace le TJM par le taux horaire et les heures', () => {
      choisirCalcul('c');
      choisir(L.tarif, 'par heure');
      expect(libellesVisibles()).toEqual(attenduVisibles(VISIBLES.cHeure));
      choisir(L.tarif, 'par jour');
      expect(libellesVisibles()).toEqual(attenduVisibles(VISIBLES.cJour));
    });

    it('CA14 – D ne propose aucun champ de réserve', () => {
      expect(etiquettes(L.reserve, groupe('d'))).toHaveLength(0);
      expect(etiquettes(L.uniteReserve, groupe('d'))).toHaveLength(0);
    });

    it('CA3 – la réserve et la nette déjà versée n\'existent que dans A ; les frais, pas dans A', () => {
      expect(etiquettes(L.frais, groupe('a'))).toHaveLength(0);
      for (const calcul of ['b', 'c', 'd']) {
        expect(etiquettes(L.reserve, groupe(calcul))).toHaveLength(0);
        expect(etiquettes(L.deja, groupe(calcul))).toHaveLength(0);
      }
    });
  });

  describe('A – Combien me verser (CA4, CA5, CA6)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA4 – trésorerie 29 000, réserve 5 000 €, déjà versé 12 000', () => {
      utiliser('a', BASE_A);
      calculer();
      verifierA({ sans: ['20 000 €', '32 000 €'], avec: ['16 551,72 €', '28 551,72 €'] });
      verifierAucuneErreur('a', TEXTES.a);
    });

    it('CA5 – réserve de 10 % sur 29 000, nette déjà versée vide comptée comme 0', () => {
      utiliser('a', { tresorerie: '29000', reserve: '10', unite: 'en %' });
      calculer();
      verifierA({ sans: ['20 000 €', '20 000 €'], avec: ['18 000 €', '18 000 €'] });
    });

    it('CA6 – réserve égale à la trésorerie : 0 € avec réserve et le message', () => {
      utiliser('a', { tresorerie: '10000', reserve: '10000' });
      calculer();
      verifierA({ sans: ['6 896,55 €', '6 896,55 €'], avec: ['0 €', '0 €'], absorbe: true });
    });

    it('CA6 – trésorerie à 0 sans réserve saisie : deux lignes à 0 €, sans le message', () => {
      utiliser('a', { tresorerie: '0' });
      calculer();
      verifierA({ sans: ['0 €', '0 €'], avec: ['0 €', '0 €'], absorbe: false });
      verifierAucuneErreur('a', TEXTES.a);
    });

    it('CA4 – le message d\'absorption n\'apparaît pas dans un cas courant', () => {
      utiliser('a', BASE_A);
      calculer();
      expect(document.body.textContent).not.toContain(ABSORBE_RESERVE);
    });
  });

  describe('B – Quel tarif pratiquer (CA7, CA8, CA9)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA7 – objectif 3 000, frais 500 par mois, 15 jours, 7 heures', () => {
      utiliser('b', BASE_B);
      calculer();
      verifierB('324 €', '46,20 €');
      verifierAucuneErreur('b', TEXTES.b);
    });

    it('CA8 – divisions justes : taux 50, objectif 2 000, frais vides, 10 jours, 6 heures', () => {
      utiliser('b', { taux: '50', objectif: '2000', jours: '10', heures: '6' });
      calculer();
      verifierB('300 €', '50 €');
    });

    it('CA9 – frais de 6 000 par an, comptés pour 500 par mois', () => {
      utiliser('b', { objectif: '3000', frais: '6000', periodicite: 'par an', jours: '15', heures: '7' });
      calculer();
      verifierB('324 €', '46,20 €');
    });
  });

  describe('C – Combien je gagnerais (CA10, CA11, CA12)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA10 – par jour : TJM 400, 15 jours, frais 500 par mois (arrondi seulement à la fin)', () => {
      utiliser('c', BASE_C_JOUR);
      calculer();
      verifierC('3 793,10 €', '45 517,24 €');
      verifierAucuneErreur('c', TEXTES.cJour);
    });

    it('CA11 – par heure : 70 €, 7 heures, 10 jours, frais 6 000 par an', () => {
      utiliser('c', BASE_C_HEURE);
      calculer();
      verifierC('3 034,48 €', '36 413,79 €');
      verifierAucuneErreur('c', TEXTES.cHeure);
    });

    it('CA12 – frais égaux au chiffre d\'affaires : 0 €, 0 € et le message', () => {
      utiliser('c', { tjm: '300', jours: '2', frais: '600' });
      calculer();
      verifierC('0 €', '0 €', true);
    });

    it('CA12 – le message n\'apparaît pas dans un cas courant', () => {
      utiliser('c', BASE_C_JOUR);
      calculer();
      expect(document.body.textContent).not.toContain(ABSORBE_FRAIS);
    });
  });

  describe('D – Combien de temps je tiens (CA13, CA14, CA22)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA13 – trésorerie 30 000, net 3 000, frais 500 par mois : « 4 850 € » et « 6,1 mois »', () => {
      utiliser('d', BASE_D);
      calculer();
      verifierD('4 850 €', '6,1 mois');
      verifierAucuneErreur('d', TEXTES.d);
    });

    it('CA14 – trésorerie 29 000, net 2 000 : « 2 900 € » et « 10 mois », sans décimale', () => {
      utiliser('d', { tresorerie: '29000', net: '2000' });
      calculer();
      verifierD('2 900 €', '10 mois');
    });

    it('CA14 – trésorerie à 0 : « 0 mois »', () => {
      utiliser('d', { tresorerie: '0', net: '2000' });
      calculer();
      verifierD('2 900 €', '0 mois');
      verifierAucuneErreur('d', TEXTES.d);
    });

    it('CA9 – frais de 6 000 par an : « 4 850 € » et « 6,1 mois »', () => {
      utiliser('d', { tresorerie: '30000', net: '3000', frais: '6000', periodicite: 'par an' });
      calculer();
      verifierD('4 850 €', '6,1 mois');
    });

    it('CA22 – frais de 1 000 par an : sortie au centime supérieur, durée sur le montant exact', () => {
      utiliser('d', { tresorerie: '30000', net: '3000', frais: '1000', periodicite: 'par an' });
      calculer();
      verifierD('4 433,34 €', '6,7 mois');
    });
  });

  describe('Taux de prélèvements commun (CA15)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA15 – le taux modifié dans A se retrouve dans B, C et D', () => {
      saisir(L.taux, '50');
      for (const calcul of ['b', 'c', 'd', 'a']) {
        choisirCalcul(calcul);
        expect(valeur(L.taux), `taux dans le calcul ${calcul}`).toBe('50');
      }
    });

    it('CA15 – le taux modifié dans D se retrouve dans A', () => {
      choisirCalcul('d');
      saisir(L.taux, '30');
      choisirCalcul('a');
      expect(valeur(L.taux)).toBe('30');
    });

    it('CA15 – B utilise le taux modifié ailleurs (taux 50 saisi dans A : 300 € et 50 €)', () => {
      saisir(L.taux, '50');
      utiliser('b', { objectif: '2000', jours: '10', heures: '6' });
      calculer();
      verifierB('300 €', '50 €');
    });

    it('CA15 – les quatre calculs utilisent le taux : à 50 %, 30 000 de trésorerie donnent 20 000 € à verser (A)', () => {
      saisir(L.taux, '50');
      utiliser('a', { tresorerie: '30000' });
      calculer();
      expect(resultatsAffiches()).toBe(true);
      expect(valeurApres(ligneA('sans-reserve'), 'Encore à verser')).toBe('20 000 €');
    });

    it('CA15 – C et D utilisent aussi le taux modifié', () => {
      saisir(L.taux, '50');
      // C : 3 000 de chiffre d'affaires, sans frais : 3 000 ÷ 1,5 = 2 000 par mois
      utiliser('c', { tjm: '1500', jours: '2' });
      calculer();
      expect(resultat('Net mensuel')).toBe('2 000 €');
      // D : sortie = 2 000 × 1,5 = 3 000
      utiliser('d', { tresorerie: '30000', net: '2000' });
      calculer();
      verifierD('3 000 €', '10 mois');
    });
  });

  describe('Cas d\'erreur (CA16)', () => {
    beforeEach(() => ouvrirRemuneration());

    // Chaque cas : calcul (ou mode), saisies, et message attendu par champ (clés de `L`).
    const CAS = [
      // Tableau « Exemples chiffrés / Erreurs » de la spécification
      { nom: 'A : trésorerie vide', calcul: 'a', cles: 'a', saisies: {}, attendu: { tresorerie: OBLIGATOIRE } },
      {
        nom: 'A : réserve de 150 % (hors bornes)',
        calcul: 'a', cles: 'a',
        saisies: { tresorerie: '29000', reserve: '150', unite: 'en %' },
        attendu: { reserve: INVALIDE },
      },
      {
        nom: 'B : jours 32 et heures vides (deux erreurs à la fois)',
        calcul: 'b', cles: 'b',
        saisies: { objectif: '3000', jours: '32' },
        attendu: { jours: INVALIDE, heures: OBLIGATOIRE },
      },
      {
        nom: 'D : rémunération nette à 0',
        calcul: 'd', cles: 'd',
        saisies: { tresorerie: '30000', net: '0' },
        attendu: { net: INVALIDE },
      },
      {
        nom: 'A : taux 250',
        calcul: 'a', cles: 'a',
        saisies: { taux: '250', tresorerie: '29000' },
        attendu: { taux: INVALIDE },
      },
      // Autres cas du tableau « Cas d'erreur » : non numérique, hors bornes, plus de 2 décimales
      { nom: 'A : taux vide', calcul: 'a', cles: 'a', saisies: { taux: '', tresorerie: '29000' }, attendu: { taux: OBLIGATOIRE } },
      { nom: 'A : taux négatif', calcul: 'a', cles: 'a', saisies: { taux: '-1', tresorerie: '29000' }, attendu: { taux: INVALIDE } },
      { nom: 'A : taux non numérique', calcul: 'a', cles: 'a', saisies: { taux: 'abc', tresorerie: '29000' }, attendu: { taux: INVALIDE } },
      { nom: 'A : trésorerie non numérique', calcul: 'a', cles: 'a', saisies: { tresorerie: 'abc' }, attendu: { tresorerie: INVALIDE } },
      { nom: 'A : trésorerie négative', calcul: 'a', cles: 'a', saisies: { tresorerie: '-100' }, attendu: { tresorerie: INVALIDE } },
      { nom: 'A : trésorerie avec 3 décimales', calcul: 'a', cles: 'a', saisies: { tresorerie: '29000,555' }, attendu: { tresorerie: INVALIDE } },
      { nom: 'A : réserve en € négative', calcul: 'a', cles: 'a', saisies: { tresorerie: '29000', reserve: '-5' }, attendu: { reserve: INVALIDE } },
      { nom: 'A : réserve non numérique', calcul: 'a', cles: 'a', saisies: { tresorerie: '29000', reserve: 'abc' }, attendu: { reserve: INVALIDE } },
      { nom: 'A : nette déjà versée négative', calcul: 'a', cles: 'a', saisies: { tresorerie: '29000', deja: '-1' }, attendu: { deja: INVALIDE } },
      { nom: 'A : nette déjà versée avec 3 décimales', calcul: 'a', cles: 'a', saisies: { tresorerie: '29000', deja: '1,234' }, attendu: { deja: INVALIDE } },
      {
        nom: 'A : trésorerie vide et réserve de 150 % (deux champs fautifs)',
        calcul: 'a', cles: 'a',
        saisies: { reserve: '150', unite: 'en %' },
        attendu: { tresorerie: OBLIGATOIRE, reserve: INVALIDE },
      },
      {
        nom: 'B : tout vide',
        calcul: 'b', cles: 'b', saisies: {},
        attendu: { objectif: OBLIGATOIRE, jours: OBLIGATOIRE, heures: OBLIGATOIRE },
      },
      { nom: 'B : objectif à 0', calcul: 'b', cles: 'b', saisies: { ...BASE_B, objectif: '0' }, attendu: { objectif: INVALIDE } },
      { nom: 'B : jours à 0', calcul: 'b', cles: 'b', saisies: { ...BASE_B, jours: '0' }, attendu: { jours: INVALIDE } },
      { nom: 'B : heures à 25', calcul: 'b', cles: 'b', saisies: { ...BASE_B, heures: '25' }, attendu: { heures: INVALIDE } },
      { nom: 'B : heures à 0,5', calcul: 'b', cles: 'b', saisies: { ...BASE_B, heures: '0,5' }, attendu: { heures: INVALIDE } },
      { nom: 'B : frais négatifs', calcul: 'b', cles: 'b', saisies: { ...BASE_B, frais: '-10' }, attendu: { frais: INVALIDE } },
      { nom: 'B : frais non numériques', calcul: 'b', cles: 'b', saisies: { ...BASE_B, frais: 'abc' }, attendu: { frais: INVALIDE } },
      { nom: 'C par jour : TJM à 0', calcul: 'c', cles: 'cJour', saisies: { ...BASE_C_JOUR, tjm: '0' }, attendu: { tjm: INVALIDE } },
      {
        nom: 'C par jour : tout vide',
        calcul: 'c', cles: 'cJour', saisies: {},
        attendu: { tjm: OBLIGATOIRE, jours: OBLIGATOIRE },
      },
      {
        nom: 'C par heure : tout vide',
        calcul: 'c', cles: 'cHeure', saisies: { tarif: 'par heure' },
        attendu: { tauxHoraire: OBLIGATOIRE, heures: OBLIGATOIRE, jours: OBLIGATOIRE },
      },
      {
        nom: 'C par heure : taux horaire à 0 et 25 heures',
        calcul: 'c', cles: 'cHeure',
        saisies: { ...BASE_C_HEURE, tauxHoraire: '0', heures: '25' },
        attendu: { tauxHoraire: INVALIDE, heures: INVALIDE },
      },
      { nom: 'C par jour : jours à 32', calcul: 'c', cles: 'cJour', saisies: { ...BASE_C_JOUR, jours: '32' }, attendu: { jours: INVALIDE } },
      { nom: 'C par jour : TJM avec 3 décimales', calcul: 'c', cles: 'cJour', saisies: { ...BASE_C_JOUR, tjm: '400,123' }, attendu: { tjm: INVALIDE } },
      {
        nom: 'D : tout vide',
        calcul: 'd', cles: 'd', saisies: {},
        attendu: { tresorerie: OBLIGATOIRE, net: OBLIGATOIRE },
      },
      { nom: 'D : trésorerie négative', calcul: 'd', cles: 'd', saisies: { ...BASE_D, tresorerie: '-1' }, attendu: { tresorerie: INVALIDE } },
      { nom: 'D : frais avec 3 décimales', calcul: 'd', cles: 'd', saisies: { ...BASE_D, frais: '10,123' }, attendu: { frais: INVALIDE } },
    ];

    it.each(CAS)('CA16 – $nom', ({ calcul, cles, saisies, attendu }) => {
      const { tarif, ...autres } = saisies;
      utiliser(calcul, { tarif, ...autres });
      calculer();
      expect(resultatsAffiches()).toBe(false);
      for (const cle of TEXTES[cles]) {
        expect(erreur(L[cle]), `message sous « ${L[cle]} »`).toBe(attendu[cle] ?? '');
      }
    });

    it('CA16 – un seul message par champ', () => {
      utiliser('a', { tresorerie: 'abc' });
      calculer();
      expect(descriptions(champ(L.tresorerie)).erreurs).toHaveLength(1);
      expect(erreur(L.tresorerie)).toBe(INVALIDE);
    });

    it('CA16 – le message s\'affiche juste sous le champ concerné (après lui, avant le champ suivant)', () => {
      utiliser('a', { tresorerie: '' });
      calculer();
      const message = descriptions(champ(L.tresorerie)).erreurs[0];
      expect(champ(L.tresorerie).compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(champ(L.reserve).compareDocumentPosition(message) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('CA16 – une fois la saisie corrigée, un nouveau clic efface le message et affiche les résultats', () => {
      utiliser('a', { ...BASE_A, tresorerie: '' });
      calculer();
      expect(erreur(L.tresorerie)).toBe(OBLIGATOIRE);
      saisir(L.tresorerie, '29000');
      calculer();
      verifierAucuneErreur('a', TEXTES.a);
      verifierA({ sans: ['20 000 €', '32 000 €'], avec: ['16 551,72 €', '28 551,72 €'] });
    });

    it.each([
      ['A : taux 200 (borne haute incluse)', 'a', { taux: '200', tresorerie: '29000' }],
      ['A : taux 0 (borne basse incluse)', 'a', { taux: '0', tresorerie: '29000' }],
      ['A : réserve de 100 % (borne haute incluse)', 'a', { tresorerie: '29000', reserve: '100', unite: 'en %' }],
      ['A : réserve de 0 % (borne basse incluse)', 'a', { tresorerie: '29000', reserve: '0', unite: 'en %' }],
      ['A : réserve de 150 en € (pas de borne haute en €)', 'a', { tresorerie: '29000', reserve: '150' }],
      ['A : trésorerie à 0 (borne basse incluse)', 'a', { tresorerie: '0' }],
      ['B : jours à 31 (borne haute incluse)', 'b', { ...BASE_B, jours: '31' }],
      ['B : jours à 1 (borne basse incluse)', 'b', { ...BASE_B, jours: '1' }],
      ['B : heures à 24 (borne haute incluse)', 'b', { ...BASE_B, heures: '24' }],
      ['B : heures à 1 (borne basse incluse)', 'b', { ...BASE_B, heures: '1' }],
      ['D : trésorerie à 0 (borne basse incluse)', 'd', { tresorerie: '0', net: '2000' }],
    ])('CA16 – %s : accepté, sans erreur', (_nom, calcul, saisies) => {
      utiliser(calcul, saisies);
      calculer();
      expect(resultatsAffiches()).toBe(true);
      verifierAucuneErreur(calcul, TEXTES[calcul]);
    });

    it('CA16 – un champ facultatif vide (réserve, nette déjà versée, frais) est compté comme 0, sans erreur', () => {
      utiliser('a', { tresorerie: '29000' });
      calculer();
      expect(resultatsAffiches()).toBe(true);
      verifierAucuneErreur('a', TEXTES.a);
      utiliser('b', { objectif: '2000', taux: '50', jours: '10', heures: '6' });
      calculer();
      expect(resultatsAffiches()).toBe(true);
      verifierAucuneErreur('b', TEXTES.b);
    });

    it('CA16 – les champs d\'un autre calcul, vides ou invalides, sont ignorés', () => {
      utiliser('b', { objectif: 'abc', jours: 'abc', heures: '99', frais: '-5' });
      utiliser('d', { tresorerie: 'abc', net: '0', frais: 'abc' });
      utiliser('a', { ...BASE_A, reserve: '5000' });
      calculer();
      verifierA({ sans: ['20 000 €', '32 000 €'], avec: ['16 551,72 €', '28 551,72 €'] });
      verifierAucuneErreur('a', TEXTES.a);
      for (const [calcul, cles] of [['b', TEXTES.b], ['d', TEXTES.d]]) {
        for (const cle of cles.filter((c) => c !== 'taux')) expect(erreurDans(calcul, L[cle])).toBe('');
      }
    });

    it('CA16 – les champs de l\'autre mode (C) sont ignorés : taux horaire « abc » et heures « 25 » laissés en mode « par jour »', () => {
      utiliser('c', { tarif: 'par heure', tauxHoraire: 'abc', heures: '25' });
      utiliser('c', { tarif: 'par jour', ...BASE_C_JOUR });
      calculer();
      verifierC('3 793,10 €', '45 517,24 €');
      expect(erreurDans('c', L.tauxHoraire)).toBe('');
      expect(erreurDans('c', L.heures)).toBe('');
    });

    it('CA16 – le TJM invalide laissé en mode « par heure » est ignoré', () => {
      utiliser('c', { tarif: 'par jour', tjm: 'abc' });
      utiliser('c', { ...BASE_C_HEURE });
      calculer();
      verifierC('3 034,48 €', '36 413,79 €');
      expect(erreurDans('c', L.tjm)).toBe('');
    });

    it('CA16 – la réserve de A n\'est contrôlée que dans A : D fonctionne avec une réserve de 150 % saisie dans A', () => {
      utiliser('a', { tresorerie: '29000', reserve: '150', unite: 'en %' });
      utiliser('d', BASE_D);
      calculer();
      verifierD('4 850 €', '6,1 mois');
    });
  });

  describe('Écritures acceptées (CA17)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA17 – « 29 000,50 », « 29000.50 » et « 29000,50 » donnent le même résultat', () => {
      const obtenus = [];
      for (const texte of ['29 000,50', '29000.50', '29000,50']) {
        utiliser('a', { tresorerie: texte });
        calculer();
        expect(resultatsAffiches()).toBe(true);
        obtenus.push([
          valeurApres(ligneA('sans-reserve'), 'Encore à verser'),
          valeurApres(ligneA('avec-reserve'), 'Encore à verser'),
        ]);
        verifierAucuneErreur('a', TEXTES.a);
      }
      expect(obtenus[1]).toEqual(obtenus[0]);
      expect(obtenus[2]).toEqual(obtenus[0]);
      expect(obtenus[0][0]).not.toBe('');
    });

    it('CA17 – la virgule et le point sont aussi acceptés dans les autres calculs (D)', () => {
      const obtenus = [];
      for (const net of ['3 000,00', '3000.00', '3000,00']) {
        utiliser('d', { tresorerie: '30000', net, frais: '500' });
        calculer();
        obtenus.push([resultat('Sortie mensuelle'), resultat('Durée sans rentrée')]);
      }
      expect(obtenus).toEqual([['4 850 €', '6,1 mois'], ['4 850 €', '6,1 mois'], ['4 850 €', '6,1 mois']]);
    });
  });

  describe('Effacement des résultats et des messages (CA18)', () => {
    beforeEach(() => ouvrirRemuneration());

    it.each([
      ['A', 'a', {}, BASE_A, ['taux', 'tresorerie', 'reserve', 'deja']],
      ['B', 'b', {}, BASE_B, ['taux', 'objectif', 'jours', 'heures', 'frais']],
      ['C par jour', 'c', {}, BASE_C_JOUR, ['taux', 'tjm', 'jours', 'frais']],
      ['C par heure', 'c', { tarif: 'par heure' }, BASE_C_HEURE, ['taux', 'tauxHoraire', 'heures', 'jours', 'frais']],
      ['D', 'd', {}, BASE_D, ['taux', 'tresorerie', 'net', 'frais']],
    ])('CA18 – %s : modifier un champ efface les résultats', (_nom, calcul, options, base, cles) => {
      for (const cle of cles) {
        utiliser(calcul, { ...options, ...base });
        calculer();
        expect(resultatsAffiches(), `résultats avant de modifier « ${L[cle]} »`).toBe(true);
        saisir(L[cle], cle === 'taux' ? '40' : '777');
        expect(resultatsAffiches(), `résultats après avoir modifié « ${L[cle]} »`).toBe(false);
      }
    });

    it('CA18 – modifier un sélecteur du calcul (unité de la réserve, périodicité, tarif) efface les résultats', () => {
      utiliser('a', BASE_A);
      calculer();
      choisir(L.uniteReserve, 'en %');
      expect(resultatsAffiches()).toBe(false);

      utiliser('b', BASE_B);
      calculer();
      choisir(L.periodicite, 'par an');
      expect(resultatsAffiches()).toBe(false);

      utiliser('c', BASE_C_JOUR);
      calculer();
      choisir(L.tarif, 'par heure');
      expect(resultatsAffiches()).toBe(false);
    });

    it('CA18 – les résultats ne reviennent qu\'au prochain clic sur « Calculer »', () => {
      utiliser('a', BASE_A);
      calculer();
      saisir(L.reserve, '10000');
      expect(resultatsAffiches()).toBe(false);
      calculer();
      // La réserve a changé (10 000 au lieu de 5 000) : la ligne sans réserve garde ses valeurs d'origine.
      expect(resultatsAffiches()).toBe(true);
      expect(valeurApres(ligneA('sans-reserve'), 'Encore à verser')).toBe('20 000 €');
      expect(valeurApres(ligneA('sans-reserve'), "Total de l'année")).toBe('32 000 €');
      expect(valeurApres(ligneA('avec-reserve'), 'Encore à verser')).not.toBe('16 551,72 €');
    });

    it('CA18 – le message d\'absorption de la réserve est effacé avec les résultats', () => {
      utiliser('a', { tresorerie: '10000', reserve: '10000' });
      calculer();
      expect(texteZone()).toContain(ABSORBE_RESERVE);
      saisir(L.reserve, '1000');
      expect(resultatsAffiches()).toBe(false);
      expect(document.body.textContent).not.toContain(ABSORBE_RESERVE);
    });

    it('CA18 – le message « Vos frais absorbent… » est effacé avec les résultats', () => {
      utiliser('c', { tjm: '300', jours: '2', frais: '600' });
      calculer();
      expect(texteZone()).toContain(ABSORBE_FRAIS);
      saisir(L.frais, '100');
      expect(resultatsAffiches()).toBe(false);
      expect(document.body.textContent).not.toContain(ABSORBE_FRAIS);
    });

    it('CA18 – le message d\'un champ disparaît dès que ce champ est modifié, sans cliquer sur « Calculer »', () => {
      utiliser('a', { tresorerie: '' });
      calculer();
      expect(erreur(L.tresorerie)).toBe(OBLIGATOIRE);
      saisir(L.tresorerie, '5');
      expect(erreur(L.tresorerie)).toBe('');
      expect(resultatsAffiches()).toBe(false);
    });

    it.each([
      ['a', 'tresorerie', { tresorerie: '' }, '29000', OBLIGATOIRE],
      ['a', 'reserve', { tresorerie: '29000', reserve: '150', unite: 'en %' }, '10', INVALIDE],
      ['a', 'taux', { taux: '250', tresorerie: '29000' }, '45', INVALIDE],
      ['b', 'jours', { ...BASE_B, jours: '32' }, '15', INVALIDE],
      ['b', 'heures', { ...BASE_B, heures: '' }, '7', OBLIGATOIRE],
      ['c', 'tjm', { ...BASE_C_JOUR, tjm: '0' }, '400', INVALIDE],
      ['d', 'net', { ...BASE_D, net: '0' }, '3000', INVALIDE],
    ])('CA18 – calcul %s : le message sous « %s » disparaît à la modification de ce champ', (calcul, cle, saisies, nouvelle, message) => {
      utiliser(calcul, saisies);
      calculer();
      expect(erreur(L[cle])).toBe(message);
      saisir(L[cle], nouvelle);
      expect(erreur(L[cle])).toBe('');
    });

    it('CA18 – les contrôles se refont au prochain clic : une nouvelle faute affiche son message', () => {
      utiliser('d', { ...BASE_D, net: '0' });
      calculer();
      saisir(L.net, 'abc');
      expect(erreur(L.net)).toBe('');
      calculer();
      expect(erreur(L.net)).toBe(INVALIDE);
    });
  });

  describe('Conservation des saisies et effacement au changement (CA19)', () => {
    beforeEach(() => ouvrirRemuneration());

    it('CA19 – changer d\'onglet garde les saisies et efface les résultats', () => {
      utiliser('a', BASE_A);
      calculer();
      expect(resultatsAffiches()).toBe(true);
      ouvrirJours();
      ouvrirRemuneration();
      expect(resultatsAffiches()).toBe(false);
      expect(valeur(L.tresorerie)).toBe('29000');
      expect(valeur(L.reserve)).toBe('5000');
      expect(valeur(L.deja)).toBe('12000');
      expect(valeur(L.taux)).toBe('45');
    });

    it('CA19 – changer d\'onglet garde aussi les saisies de l\'onglet « Jours à vendre »', () => {
      saisirJours('Charges annuelles (€ HT)', '60000');
      ouvrirRemuneration();
      ouvrirJours();
      expect(champJours('Charges annuelles (€ HT)').value).toBe('60000');
    });

    it('CA19 – changer de calcul garde les saisies de chacun et efface les résultats', () => {
      utiliser('a', BASE_A);
      calculer();
      expect(resultatsAffiches()).toBe(true);
      choisirCalcul('b');
      expect(resultatsAffiches()).toBe(false);
      utiliser('b', BASE_B);
      choisirCalcul('d');
      utiliser('d', BASE_D);
      choisirCalcul('a');
      expect(valeur(L.tresorerie)).toBe('29000');
      expect(valeur(L.reserve)).toBe('5000');
      expect(valeur(L.deja)).toBe('12000');
      choisirCalcul('b');
      expect(valeur(L.objectif)).toBe('3000');
      expect(valeur(L.jours)).toBe('15');
      expect(valeur(L.heures)).toBe('7');
      expect(valeur(L.frais)).toBe('500');
      choisirCalcul('d');
      expect(valeur(L.tresorerie)).toBe('30000');
      expect(valeur(L.net)).toBe('3000');
    });

    it('CA19 – la trésorerie de A et celle de D sont indépendantes (scénario, étape 11)', () => {
      utiliser('a', { tresorerie: '10 000' });
      utiliser('d', { tresorerie: '30 000' });
      choisirCalcul('a');
      expect(valeur(L.tresorerie)).toBe('10 000');
    });

    it('CA19 – changer de mode (C) garde les saisies et efface les résultats', () => {
      utiliser('c', BASE_C_JOUR);
      calculer();
      expect(resultatsAffiches()).toBe(true);
      choisir(L.tarif, 'par heure');
      expect(resultatsAffiches()).toBe(false);
      saisir(L.tauxHoraire, '70,55');
      saisir(L.heures, '7,75');
      choisir(L.tarif, 'par jour');
      expect(valeur(L.tjm)).toBe('400');
      expect(valeur(L.jours)).toBe('15');
      expect(valeur(L.frais)).toBe('500');
      choisir(L.tarif, 'par heure');
      expect(valeur(L.tauxHoraire)).toBe('70,55');
      expect(valeur(L.heures)).toBe('7,75');
    });

    it('CA19 – changer de calcul efface les messages des champs devenus masqués', () => {
      utiliser('a', { tresorerie: '' });
      calculer();
      expect(erreur(L.tresorerie)).toBe(OBLIGATOIRE);
      choisirCalcul('b');
      expect(erreurDans('a', L.tresorerie)).toBe('');
      choisirCalcul('a');
      expect(erreur(L.tresorerie)).toBe('');
    });

    it('CA19 – changer de mode efface les messages des champs devenus masqués', () => {
      utiliser('c', { tarif: 'par heure', tauxHoraire: '0', heures: '25', jours: '10' });
      calculer();
      expect(erreur(L.tauxHoraire)).toBe(INVALIDE);
      expect(erreur(L.heures)).toBe(INVALIDE);
      choisir(L.tarif, 'par jour');
      expect(erreurDans('c', L.tauxHoraire)).toBe('');
      expect(erreurDans('c', L.heures)).toBe('');
      choisir(L.tarif, 'par heure');
      expect(erreur(L.tauxHoraire)).toBe('');
      expect(erreur(L.heures)).toBe('');
    });
  });

  describe('Aucune sauvegarde (CA20)', () => {
    it('CA20 – après un rechargement : « Jours à vendre » actif, champs vides, taux à 45, calcul sur « Combien me verser »', () => {
      ouvrirRemuneration();
      utiliser('a', BASE_A);
      saisir(L.taux, '30');
      calculer();
      utiliser('d', BASE_D);
      expect(selection(L.calcul)).toBe('Combien de temps je tiens');

      ouvrirPage(); // nouveau chargement de index.html + initialisations

      expect(onglet('Jours à vendre').getAttribute('aria-selected')).toBe('true');
      expect(onglet('Rémunération').getAttribute('aria-selected')).toBe('false');
      expect(sansMasque(panneauJours())).toBe(true);
      ouvrirRemuneration();
      expect(selection(L.calcul)).toBe('Combien me verser');
      expect(valeur(L.taux)).toBe('45');
      for (const calcul of ['a', 'b', 'c', 'd']) {
        choisirCalcul(calcul);
        for (const cle of TEXTES[calcul === 'c' ? 'cJour' : calcul].filter((c) => c !== 'taux')) {
          expect(valeur(L[cle]), `champ « ${L[cle]} » du calcul ${calcul}`).toBe('');
        }
      }
      choisirCalcul('c');
      choisir(L.tarif, 'par heure');
      expect(valeur(L.tauxHoraire)).toBe('');
      expect(valeur(L.heures)).toBe('');
      expect(resultatsAffiches()).toBe(false);
    });

    it('CA20 – rien n\'est écrit dans localStorage ni sessionStorage', () => {
      const ecritures = vi.spyOn(Storage.prototype, 'setItem');
      ouvrirRemuneration();
      utiliser('a', BASE_A);
      calculer();
      utiliser('c', BASE_C_HEURE);
      calculer();
      ouvrirJours();
      ouvrirRemuneration();

      expect(ecritures).not.toHaveBeenCalled();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      ouvrirPage();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('Scénario de bout en bout (treize étapes de la spécification)', () => {
    it('suit le scénario de la spécification, étape par étape', () => {
      // 1. Ouverture
      expect(onglet('Jours à vendre').getAttribute('aria-selected')).toBe('true');
      expect(onglet('Rémunération')).toBeTruthy();

      // 2. Onglet « Rémunération »
      ouvrirRemuneration();
      expect(selection(L.calcul)).toBe('Combien me verser');
      expect(valeur(L.taux)).toBe('45');
      for (const cle of ['tresorerie', 'reserve', 'deja']) expect(valeur(L[cle])).toBe('');
      expect(resultatsAffiches()).toBe(false);

      // 3. Clic sur « Calculer » sans rien saisir
      calculer();
      expect(erreur(L.tresorerie)).toBe(OBLIGATOIRE);
      expect(resultatsAffiches()).toBe(false);

      // 4. Cas courant
      saisir(L.tresorerie, '29 000');
      saisir(L.reserve, '5000');
      saisir(L.deja, '12 000');
      calculer();
      verifierA({ sans: ['20 000 €', '32 000 €'], avec: ['16 551,72 €', '28 551,72 €'] });

      // 5. Réserve égale à la trésorerie
      saisir(L.tresorerie, '10 000');
      saisir(L.reserve, '10 000');
      expect(resultatsAffiches()).toBe(false);
      calculer();
      expect(valeurApres(ligneA('avec-reserve'), 'Encore à verser')).toBe('0 €');
      expect(norm(ligneA('avec-reserve').textContent)).toContain(ABSORBE_RESERVE);

      // 6. B : jours à 32
      choisirCalcul('b');
      expect(valeur(L.taux)).toBe('45');
      saisir(L.objectif, '3 000');
      saisir(L.frais, '500');
      choisir(L.periodicite, 'par mois');
      saisir(L.jours, '32');
      saisir(L.heures, '7');
      calculer();
      expect(erreur(L.jours)).toBe(INVALIDE);
      expect(resultatsAffiches()).toBe(false);

      // 7. B : jours à 15
      saisir(L.jours, '15');
      calculer();
      verifierB('324 €', '46,20 €');

      // 8. C par jour
      choisirCalcul('c');
      saisir(L.tjm, '400');
      saisir(L.jours, '15');
      saisir(L.frais, '500');
      choisir(L.periodicite, 'par mois');
      calculer();
      verifierC('3 793,10 €', '45 517,24 €');

      // 9. C par heure
      choisir(L.tarif, 'par heure');
      saisir(L.tauxHoraire, '70');
      saisir(L.heures, '7');
      saisir(L.jours, '10');
      saisir(L.frais, '6 000');
      choisir(L.periodicite, 'par an');
      calculer();
      verifierC('3 034,48 €', '36 413,79 €');

      // 10. D
      choisirCalcul('d');
      saisir(L.tresorerie, '30 000');
      saisir(L.net, '3 000');
      saisir(L.frais, '500');
      choisir(L.periodicite, 'par mois');
      calculer();
      verifierD('4 850 €', '6,1 mois');

      // 11. Retour sur A
      choisirCalcul('a');
      expect(valeur(L.tresorerie)).toBe('10 000');
      expect(resultatsAffiches()).toBe(false);

      // 12. Onglet « Jours à vendre »
      ouvrirJours();
      calculerJours001();

      // 13. Rechargement
      ouvrirPage();
      expect(onglet('Jours à vendre').getAttribute('aria-selected')).toBe('true');
      for (const libelle of ['Charges annuelles (€ HT)', "Chiffre d'affaires déjà identifié (€ HT)", 'TJM (€ HT)', 'Mois restants']) {
        expect(champJours(libelle).value).toBe('');
      }
      ouvrirRemuneration();
      expect(selection(L.calcul)).toBe('Combien me verser');
      expect(valeur(L.taux)).toBe('45');
      for (const cle of ['tresorerie', 'reserve', 'deja']) expect(valeur(L[cle])).toBe('');
    });
  });
});
