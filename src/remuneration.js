// Calculs de la spécification 002 : contrôle des saisies et quatre calculs de rémunération.
// Fonctions pures, sans accès à la page, pour être testées directement.
//
// Précision : les saisies ont au plus 2 décimales. Les calculs se font donc sur des
// fractions d'entiers exactes, et les arrondis seulement sur les résultats (règle 3).
// Une division qui tombe juste n'est ainsi jamais arrondie (règle 4).
import { MESSAGES, analyserNombre, nombreDeDecimales, sansEspaces } from './calcul.js';

export const MESSAGES_REMUNERATION = {
  invalide: 'Valeur invalide.',
  reserveAbsorbe: 'Votre réserve absorbe toute la trésorerie.',
  fraisAbsorbent: "Vos frais absorbent tout votre chiffre d'affaires.",
};

const valide = (valeur) => ({ valeur, erreur: null });
const invalide = (erreur) => ({ valeur: null, erreur });

/**
 * Contrôle d'une saisie numérique : un seul message par champ.
 * `min` et `max` sont inclus ; avec `minExclu`, `min` est exclu.
 */
export function validerSaisie(texte, { obligatoire = true, min, max, minExclu = false } = {}) {
  if (sansEspaces(texte) === '') return obligatoire ? invalide(MESSAGES.obligatoire) : valide(0);
  const nombre = analyserNombre(texte);
  if (nombre === null || !Number.isFinite(nombre * 100) || nombreDeDecimales(texte) > 2) {
    return invalide(MESSAGES_REMUNERATION.invalide);
  }
  const sousLeMin = min !== undefined && (minExclu ? nombre <= min : nombre < min);
  const surLeMax = max !== undefined && nombre > max;
  if (sousLeMin || surLeMax) return invalide(MESSAGES_REMUNERATION.invalide);
  return valide(nombre === 0 ? 0 : nombre);
}

// Fractions exactes, à dénominateur positif.
const fraction = (n, d = 1n) => ({ n, d });
const ZERO = fraction(0n);
const deSaisie = (nombre) => fraction(BigInt(Math.round(nombre * 100)), 100n);
const plus = (a, b) => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
const moins = (a, b) => fraction(a.n * b.d - b.n * a.d, a.d * b.d);
const fois = (a, b) => fraction(a.n * b.n, a.d * b.d);
const sur = (a, b) => fraction(a.n * b.d, a.d * b.n);
const auMoinsEgal = (a, b) => a.n * b.d >= b.n * a.d;

// Arrondis d'une fraction positive, `unites` donnant la précision (100n : le centime).
const CENTIME = 100n;
const EURO = 1n;
const DIXIEME = 10n;
const inferieur = (f, unites = CENTIME) => Number((f.n * unites) / f.d) / Number(unites);
const superieur = (f, unites = CENTIME) => Number((f.n * unites + f.d - 1n) / f.d) / Number(unites);

// 1 + taux : le taux est saisi en pourcentage (45 pour 45 %).
const coefficient = (taux) => plus(fraction(1n), sur(deSaisie(taux), fraction(100n)));

const fractionFraisDuMois = (frais, periodicite) =>
  periodicite === 'an' ? sur(deSaisie(frais), fraction(12n)) : deSaisie(frais);

/** Règle 2 : les frais saisis, ramenés au mois, sans arrondi. */
export function fraisDuMois(frais, periodicite) {
  const resultat = fractionFraisDuMois(frais, periodicite);
  return Number(resultat.n) / Number(resultat.d);
}

/**
 * Calcul A, règles 6 à 9. `reserve` vaut null si aucune réserve n'est saisie ;
 * `uniteReserve` vaut 'euro' ou 'pourcent'.
 */
export function calculerVersement({ tresorerie, reserve, uniteReserve, dejaVerse, taux }) {
  const treso = deSaisie(tresorerie);
  const deja = deSaisie(dejaVerse);
  const coef = coefficient(taux);

  let montantReserve = ZERO;
  if (reserve !== null) {
    montantReserve =
      uniteReserve === 'pourcent' ? fois(treso, sur(deSaisie(reserve), fraction(100n))) : deSaisie(reserve);
  }

  const ligne = (disponible) => {
    const encore = sur(disponible, coef);
    return { encoreAVerser: inferieur(encore), total: inferieur(plus(encore, deja)) };
  };

  const absorbe = auMoinsEgal(montantReserve, treso);
  return {
    sansReserve: ligne(treso),
    avecReserve: ligne(absorbe ? ZERO : moins(treso, montantReserve)),
    reserveAbsorbeTout: reserve !== null && absorbe,
  };
}

/** Calcul B, règles 10 à 12. */
export function calculerTarifAPratiquer({ objectif, frais, periodicite, jours, heures, taux }) {
  const chiffreAffaires = plus(fois(deSaisie(objectif), coefficient(taux)), fractionFraisDuMois(frais, periodicite));
  const parJour = sur(chiffreAffaires, deSaisie(jours));
  return {
    tjm: superieur(parJour, EURO),
    tauxHoraire: superieur(sur(parJour, deSaisie(heures))),
  };
}

/** Calcul C, règles 13 à 16. `mode` vaut 'jour' (TJM) ou 'heure' (taux horaire × heures). */
export function calculerNetProjete({ mode, tjm, tauxHoraire, heures, jours, frais, periodicite, taux }) {
  const tarifJournalier = mode === 'heure' ? fois(deSaisie(tauxHoraire), deSaisie(heures)) : deSaisie(tjm);
  const chiffreAffaires = fois(tarifJournalier, deSaisie(jours));
  const fraisMois = fractionFraisDuMois(frais, periodicite);
  const fraisAbsorbent = auMoinsEgal(fraisMois, chiffreAffaires);
  const net = fraisAbsorbent ? ZERO : sur(moins(chiffreAffaires, fraisMois), coefficient(taux));
  return {
    netMensuel: inferieur(net),
    netAnnuel: inferieur(fois(net, fraction(12n))),
    fraisAbsorbent,
  };
}

/** Calcul D, règles 17 et 18 : la durée part de la sortie mensuelle exacte. */
export function calculerDureeTenue({ tresorerie, net, frais, periodicite, taux }) {
  const sortie = plus(fois(deSaisie(net), coefficient(taux)), fractionFraisDuMois(frais, periodicite));
  return {
    sortieMensuelle: superieur(sortie),
    dureeMois: inferieur(sur(deSaisie(tresorerie), sortie), DIXIEME),
  };
}

/** « 6,1 mois », « 10 mois », « 0 mois » : décimale seulement si elle n'est pas nulle. */
export function formaterDuree(duree) {
  const chiffres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(duree);
  return `${chiffres} mois`;
}
