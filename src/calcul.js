// Calculs de la spécification 001 : analyse et contrôle des saisies, calcul des jours
// restant à vendre et du rythme mensuel, mise en forme des résultats.
// Fonctions pures, sans accès à la page, pour être testées directement.
//
// Précision : les montants et les heures ont au plus 2 décimales. Les calculs se font
// donc sur des entiers (centimes, ou dix-millièmes pour un taux × heures), pour qu'une
// division qui tombe juste ne soit jamais arrondie au jour suivant (règles 3 et 4).

export const MESSAGES = {
  obligatoire: 'Ce champ est obligatoire.',
  nombre: 'Saisissez un nombre.',
  negatif: 'Le montant ne peut pas être négatif.',
  superieurA0: 'Le montant doit être supérieur à 0.',
  decimales: '2 décimales au maximum.',
  heures: 'Saisissez un nombre de 1 à 24, avec 2 décimales au maximum.',
  mois: 'Saisissez un nombre entier de 1 à 12.',
  couvertes: 'Vos charges annuelles sont déjà couvertes.',
};

// Un nombre écrit : signe moins facultatif, chiffres, puis virgule ou point et chiffres.
const ECRITURE_NOMBRE = /^-?\d+(?:[.,]\d+)?$/;

// Les espaces (normales, insécables, fines) sont ignorées.
export const sansEspaces = (texte) => String(texte ?? '').replace(/\s+/g, '');

export function nombreDeDecimales(texte) {
  const partie = sansEspaces(texte).split(/[.,]/)[1];
  return partie ? partie.length : 0;
}

/** Nombre écrit dans `texte`, ou null s'il est vide ou n'est pas un nombre. */
export function analyserNombre(texte) {
  const brut = sansEspaces(texte);
  if (!ECRITURE_NOMBRE.test(brut)) return null;
  const nombre = Number(brut.replace(',', '.'));
  return Number.isFinite(nombre) ? nombre : null;
}

const valide = (valeur) => ({ valeur, erreur: null });
const invalide = (erreur) => ({ valeur: null, erreur });

/**
 * Contrôle d'un montant en euros. Un seul message, dans l'ordre de priorité de la spécification :
 * vide, non numérique, négatif, égal à 0, plus de 2 décimales.
 */
export function validerMontant(texte, { obligatoire = true, zeroAutorise = false } = {}) {
  if (sansEspaces(texte) === '') return obligatoire ? invalide(MESSAGES.obligatoire) : valide(0);
  const nombre = analyserNombre(texte);
  if (nombre === null) return invalide(MESSAGES.nombre);
  if (nombre < 0) return invalide(MESSAGES.negatif);
  if (nombre === 0 && !zeroAutorise) return invalide(MESSAGES.superieurA0);
  if (nombreDeDecimales(texte) > 2) return invalide(MESSAGES.decimales);
  return valide(nombre === 0 ? 0 : nombre);
}

/** Contrôle des heures travaillées par jour : de 1 à 24, 2 décimales au maximum. */
export function validerHeures(texte) {
  if (sansEspaces(texte) === '') return invalide(MESSAGES.obligatoire);
  const nombre = analyserNombre(texte);
  if (nombre === null || nombre < 1 || nombre > 24 || nombreDeDecimales(texte) > 2) {
    return invalide(MESSAGES.heures);
  }
  return valide(nombre);
}

/** Contrôle des mois restants : nombre entier de 1 à 12 (« 5,0 » vaut 5). */
export function validerMois(texte) {
  if (sansEspaces(texte) === '') return invalide(MESSAGES.obligatoire);
  const nombre = analyserNombre(texte);
  if (nombre === null || !Number.isInteger(nombre) || nombre < 1 || nombre > 12) {
    return invalide(MESSAGES.mois);
  }
  return valide(nombre);
}

// Conversion d'un nombre à 2 ou 4 décimales en entier exact.
const enCentimes = (n) => BigInt(Math.round(n * 100));
const enDixMilliemes = (n) => BigInt(Math.round(n * 10000));

// Division entière arrondie au supérieur, pour des entiers positifs.
const diviserAuSuperieur = (a, b) => (a + b - 1n) / b;

/** Règle 1 : charges − chiffre d'affaires, jamais négatif. */
export function calculerMontantRestant(charges, chiffreAffaires) {
  const reste = enCentimes(charges) - enCentimes(chiffreAffaires);
  return reste > 0n ? Number(reste) / 100 : 0;
}

/** Règle 2 : taux horaire × heures travaillées par jour, sans arrondi. */
export function calculerTarifJournalier(tauxHoraire, heures) {
  return Number(enCentimes(tauxHoraire) * enCentimes(heures)) / 10000;
}

/** Règle 3 : montant restant ÷ tarif journalier, arrondi au jour entier supérieur. */
export function calculerJours(montantRestant, tarifJournalier) {
  const montant = enDixMilliemes(montantRestant);
  if (montant <= 0n) return 0;
  return Number(diviserAuSuperieur(montant, enDixMilliemes(tarifJournalier)));
}

/** Règle 4 : jours (déjà arrondis) ÷ mois restants, arrondi au jour entier supérieur. */
export function calculerRythme(jours, mois) {
  if (jours <= 0) return 0;
  return Number(diviserAuSuperieur(BigInt(jours), BigInt(mois)));
}

/**
 * Calcul complet, à partir de saisies déjà contrôlées.
 * `mode` vaut 'jour' (TJM) ou 'heure' (taux horaire × heures).
 */
export function calculer({ mode, charges, chiffreAffaires, mois, tjm, tauxHoraire, heures }) {
  const montantRestant = calculerMontantRestant(charges, chiffreAffaires);
  const tarifJournalier = mode === 'heure' ? calculerTarifJournalier(tauxHoraire, heures) : tjm;
  const jours = calculerJours(montantRestant, tarifJournalier);
  return {
    montantRestant,
    tarifJournalier,
    jours,
    rythme: calculerRythme(jours, mois),
    chargesCouvertes: montantRestant === 0,
  };
}

const ESPACE_INSECABLE = ' ';

/** « 25 400 € », « 30 000,50 € » : centimes seulement s'ils ne sont pas nuls. */
export function formaterMontant(montant) {
  const avecCentimes = !Number.isInteger(montant);
  const chiffres = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: avecCentimes ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(montant);
  return `${chiffres}${ESPACE_INSECABLE}€`;
}

const jourAccorde = (n) => (n <= 1 ? `${n} jour` : `${n} jours`);

/** « 0 jour », « 1 jour », « 47 jours ». */
export function formaterJours(jours) {
  return jourAccorde(jours);
}

/** « 0 jour par mois », « 1 jour par mois », « 10 jours par mois ». */
export function formaterRythme(rythme) {
  return `${jourAccorde(rythme)} par mois`;
}
