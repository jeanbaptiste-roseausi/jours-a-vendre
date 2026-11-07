# 001 – Calcul des jours restant à vendre et du rythme mensuel

- **Statut** : validée
- **Date** : 2026-11-08

## Objectif

Un indépendant veut savoir combien de jours il lui reste à vendre pour couvrir tout ce qu'il doit encaisser sur l'année, rémunération comprise, et combien de jours par mois cela représente sur la période qui lui reste. Il peut exprimer son tarif par jour (TJM) ou par heure (taux horaire et heures travaillées par jour).

## Périmètre

### Inclus

- Saisie des charges annuelles, du chiffre d'affaires déjà identifié et du nombre de mois restants.
- Choix du mode de tarif : « par jour » (TJM) ou « par heure » (taux horaire et heures travaillées par jour).
- Calcul, au clic sur « Calculer », du montant restant à couvrir, des jours restant à vendre et du rythme mensuel.
- Contrôle des saisies, avec un message sous chaque champ fautif.
- Cas où les charges sont déjà couvertes.

### Exclus

- Vérification de la capacité en jours (jours ouvrés, congés, jours disponibles).
- Sauvegarde des saisies d'une visite à l'autre : prévue dans une spécification ultérieure.
- Plusieurs TJM ou plusieurs taux horaires : prévu dans une spécification ultérieure.
- Calcul fiscal ou social (TVA, cotisations, impôts) : prévu dans une spécification ultérieure.
- Montants TTC : tous les montants sont hors taxes.
- Affichage d'un nombre d'heures à vendre : les résultats restent en jours, dans les deux modes.

## Données saisies

| Champ | Unité | Obligatoire | Bornes | Par défaut |
|---|---|---|---|---|
| Charges annuelles (€ HT) | euros hors taxes | oui | strictement supérieur à 0, 2 décimales au maximum, pas de plafond | vide |
| Chiffre d'affaires déjà identifié (€ HT) | euros hors taxes | non (vide = 0 €) | supérieur ou égal à 0, 2 décimales au maximum, pas de plafond | vide |
| Tarif (sélecteur) | — | oui | « par jour » ou « par heure » | « par jour » |
| TJM (€ HT) — mode « par jour » | euros hors taxes par jour | oui, en mode « par jour » | strictement supérieur à 0, 2 décimales au maximum, pas de plafond | vide |
| Taux horaire (€ HT) — mode « par heure » | euros hors taxes par heure | oui, en mode « par heure » | strictement supérieur à 0, 2 décimales au maximum, pas de plafond | vide |
| Heures travaillées par jour — mode « par heure » | heures | oui, en mode « par heure » | de 1 à 24 inclus, 2 décimales au maximum | vide |
| Mois restants | mois | oui | nombre entier de 1 à 12 ; une décimale nulle est acceptée (« 3,0 » ou « 3.0 » valent 3) | vide |

Écritures acceptées pour les montants et les heures : la virgule ou le point comme séparateur décimal, et des espaces, qui sont ignorés. « 25 000,50 », « 25000.50 » et « 25000,50 » valent tous 25 000,50 €.

**Changement de mode** : seuls les champs du mode sélectionné sont visibles. Les valeurs saisies dans les champs de l'autre mode sont conservées, et on les retrouve en revenant à ce mode. Elles sont ignorées pour le calcul comme pour les contrôles.

## Règles de calcul

1. **Montant restant à couvrir** = charges annuelles − chiffre d'affaires déjà identifié. S'il est négatif, il vaut 0 €.
2. **Tarif journalier** :
   - en mode « par jour », c'est le TJM saisi ;
   - en mode « par heure », c'est le taux horaire × les heures travaillées par jour, **sans arrondi**. Par exemple, 70,55 € × 7,25 h = 511,4875 €.
3. **Jours restant à vendre** = montant restant à couvrir ÷ tarif journalier, **arrondi au jour entier supérieur**. Une division qui tombe juste n'est pas arrondie : 25 300 € ÷ 550 € donnent 46 jours, et non 47.
4. **Rythme mensuel** = jours restant à vendre, **déjà arrondis** (règle 3) ÷ mois restants, **arrondi au jour entier supérieur**. Une division qui tombe juste n'est pas arrondie.
5. Si le montant restant à couvrir vaut 0 €, les jours et le rythme valent 0.
6. Le calcul se fait au clic sur « Calculer », et seulement si toutes les saisies du mode sélectionné sont valides.

## Cas d'erreur

Chaque message s'affiche juste sous le champ concerné. Tant qu'une erreur reste, aucun résultat ne s'affiche. Si plusieurs champs sont fautifs, chacun a son message. Seuls les champs visibles, ceux du mode sélectionné, sont contrôlés.

**Un seul message par champ.** Quand un montant cumule plusieurs fautes, seul le message de la première dans cet ordre s'affiche : vide, non numérique, négatif, égal à 0, trop de décimales. Par exemple, « -1000,555 » affiche « Le montant ne peut pas être négatif. ». Cette règle vaut pour les charges, le CA, le TJM et le taux horaire.

**Effacement des messages.** Le message d'un champ disparaît dès que ce champ est modifié. Les contrôles se refont au prochain clic sur « Calculer ». Changer de mode efface les messages des champs qui deviennent masqués.

| Situation | Comportement attendu | Message affiché |
|---|---|---|
| Charges, TJM, taux horaire, heures par jour ou mois restants vides | aucun résultat | Ce champ est obligatoire. |
| Chiffre d'affaires déjà identifié vide | compté comme 0 €, pas d'erreur | aucun |
| Montant non numérique (ex. « abc ») | aucun résultat | Saisissez un nombre. |
| Montant négatif (ex. « -500 ») | aucun résultat | Le montant ne peut pas être négatif. |
| Charges, TJM ou taux horaire égal à 0 | aucun résultat | Le montant doit être supérieur à 0. |
| Chiffre d'affaires déjà identifié égal à 0 | accepté | aucun |
| Montant avec plus de 2 décimales (ex. « 1000,555 ») | aucun résultat | 2 décimales au maximum. |
| Heures par jour non numérique, inférieur à 1, supérieur à 24 ou avec plus de 2 décimales | aucun résultat | Saisissez un nombre de 1 à 24, avec 2 décimales au maximum. |
| Mois restants non entier, non numérique, inférieur à 1 ou supérieur à 12 | aucun résultat | Saisissez un nombre entier de 1 à 12. |
| Champ de l'autre mode vide ou invalide | ignoré, pas d'erreur | aucun |
| Chiffre d'affaires déjà identifié supérieur ou égal aux charges | résultats à 0 (voir Affichage) | Vos charges annuelles sont déjà couvertes. |

## Affichage

- **À l'ouverture** : le sélecteur « Tarif » est sur « par jour ». Les champs Charges, Chiffre d'affaires déjà identifié, TJM et Mois restants sont visibles et vides, chacun avec son libellé et son aide. Le bouton « Calculer » est présent. Aucun résultat n'est affiché.
- **Sélecteur** : « Tarif », avec deux choix, « par jour » et « par heure ». En mode « par jour », le champ TJM est visible. En mode « par heure », les champs Taux horaire et Heures travaillées par jour le remplacent.
- **Libellés et aides** :
  - Charges annuelles (€ HT) — aide : « Tout ce que vous devez encaisser sur l'année, rémunération comprise. »
  - Chiffre d'affaires déjà identifié (€ HT) — aide : « Missions signées ou facturées. Laissez vide si aucune. »
  - TJM (€ HT) — aide : « Taux journalier moyen facturé à vos clients. »
  - Taux horaire (€ HT) — aide : « Prix d'une heure facturée à vos clients. »
  - Heures travaillées par jour — aide : « Nombre d'heures facturées dans une journée, de 1 à 24. »
  - Mois restants — aide : « Nombre de mois pour vendre ces jours, de 1 à 12. »
- **Zone de résultats**, après un calcul valide, identique dans les deux modes :
  - Montant restant à couvrir : montant en euros, espace entre les milliers, virgule pour les décimales, centimes affichés seulement s'ils ne sont pas nuls (« 25 400 € », « 30 000,50 € »).
  - Jours restant à vendre : « 47 jours ». Au singulier pour 0 et 1 : « 0 jour », « 1 jour ».
  - Rythme mensuel : « 10 jours par mois ». Au singulier pour 0 et 1 : « 0 jour par mois », « 1 jour par mois ».
- **Charges déjà couvertes** : le montant restant affiche « 0 € », les jours « 0 jour », le rythme « 0 jour par mois », avec le message « Vos charges annuelles sont déjà couvertes. »
- **Après une modification** : dès qu'un champ est modifié, ou que le mode de tarif change, les résultats affichés sont effacés jusqu'au prochain clic sur « Calculer ». Le message d'erreur du champ modifié est effacé aussi, ainsi que ceux des champs masqués par un changement de mode.
- **Aucune sauvegarde** : recharger la page vide tous les champs et remet le sélecteur sur « par jour ».

## Vocabulaire

| Terme | Définition |
|---|---|
| Charges annuelles | Tout ce que l'indépendant doit encaisser sur l'année : frais, cotisations, impôts et rémunération qu'il veut se verser. Montant hors taxes. |
| Chiffre d'affaires déjà identifié | Montant hors taxes des missions déjà signées ou facturées pour l'année. |
| Tarif | Mode d'expression du prix : « par jour » (TJM) ou « par heure » (taux horaire). |
| TJM | Taux journalier moyen : prix hors taxes d'une journée facturée au client. |
| Taux horaire | Prix hors taxes d'une heure facturée au client. |
| Heures travaillées par jour | Nombre d'heures facturées dans une journée, de 1 à 24. |
| Tarif journalier | Prix d'une journée utilisé pour le calcul : le TJM, ou le taux horaire multiplié par les heures travaillées par jour. |
| Mois restants | Nombre de mois, de 1 à 12, sur lesquels répartir les jours restant à vendre. |
| Montant restant à couvrir | Charges annuelles moins chiffre d'affaires déjà identifié, jamais négatif. |
| Jours restant à vendre | Montant restant à couvrir divisé par le tarif journalier, arrondi au jour entier supérieur. |
| Rythme mensuel | Jours restant à vendre divisés par les mois restants, arrondi au jour entier supérieur. |

## Exemples chiffrés

Tous les chiffres sont fictifs.

### Mode « par jour »

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Charges 60 000 ; CA 34 600 ; TJM 550 ; mois 5 | 25 400 € ; 47 jours ; 10 jours par mois | Cas courant. 25 400 ÷ 550 = 46,18 → 47. 47 ÷ 5 = 9,4 → 10. |
| Charges 45 300 ; CA 20 000 ; TJM 550 ; mois 6 | 25 300 € ; 46 jours ; 8 jours par mois | Division juste, non arrondie : 25 300 ÷ 550 = 46. 46 ÷ 6 = 7,67 → 8. |
| Charges 48 000 ; CA vide ; TJM 400 ; mois 12 | 48 000 € ; 120 jours ; 10 jours par mois | CA vide compté comme 0. 120 ÷ 12 = 10 tout rond. |
| Charges 30 000,50 ; CA 0 ; TJM 500 ; mois 12 | 30 000,50 € ; 61 jours ; 6 jours par mois | Centimes. 30 000,50 ÷ 500 = 60,001 → 61. 61 ÷ 12 = 5,08 → 6. |
| Charges 10 000 ; CA 9 900 ; TJM 600 ; mois 4 | 100 € ; 1 jour ; 1 jour par mois | Cas limite : 100 ÷ 600 = 0,17 → 1. 1 ÷ 4 = 0,25 → 1. Singulier. |
| Charges 40 000 ; CA 40 000 ; TJM 500 ; mois 3 | 0 € ; 0 jour ; 0 jour par mois ; « Vos charges annuelles sont déjà couvertes. » | Cas limite : CA égal aux charges. |
| Charges 40 000 ; CA 42 000 ; TJM 500 ; mois 3 | 0 € ; 0 jour ; 0 jour par mois ; « Vos charges annuelles sont déjà couvertes. » | CA supérieur : le montant restant ne devient pas négatif. |
| Charges « 25 000,50 », puis « 25000.50 », puis « 25000,50 » ; CA 0 ; TJM 500 ; mois 10 | 25 000,50 € ; 51 jours ; 6 jours par mois, pour les trois écritures | 25 000,50 ÷ 500 = 50,001 → 51. 51 ÷ 10 = 5,1 → 6. |

### Mode « par heure »

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Charges 60 000 ; CA 34 600 ; taux horaire 70 ; heures 7 ; mois 5 | 25 400 € ; 52 jours ; 11 jours par mois | Cas courant. Tarif journalier 70 × 7 = 490. 25 400 ÷ 490 = 51,84 → 52. 52 ÷ 5 = 10,4 → 11. |
| Charges 45 300 ; CA 20 000 ; taux horaire 50 ; heures 5,5 ; mois 6 | 25 300 € ; 92 jours ; 16 jours par mois | Heures décimales et division juste : 50 × 5,5 = 275. 25 300 ÷ 275 = 92. 92 ÷ 6 = 15,33 → 16. |
| Charges 10 000 ; CA 9 900 ; taux horaire 25 ; heures 24 ; mois 4 | 100 € ; 1 jour ; 1 jour par mois | Cas limite : 24 heures. 25 × 24 = 600. 100 ÷ 600 = 0,17 → 1. |
| Charges 2 187,05 ; CA 0 ; taux horaire 70,55 ; heures 7,75 ; mois 1 | 2 187,05 € ; 4 jours ; 4 jours par mois | Tarif journalier non arrondi : 70,55 × 7,75 = 546,7625. 2 187,05 ÷ 546,7625 = 4 tout rond. Arrondi au centime (546,76), il donnerait à tort 5 jours. |

### Erreurs

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Par jour : charges 60 000 ; CA 34 600 ; TJM 0 ; mois 5 | aucun résultat ; sous TJM : « Le montant doit être supérieur à 0. » | |
| Par jour : charges vide ; CA 1 000 ; TJM 500 ; mois 13 | aucun résultat ; sous Charges : « Ce champ est obligatoire. » ; sous Mois : « Saisissez un nombre entier de 1 à 12. » | Deux erreurs à la fois. |
| Par jour : charges 60 000 ; CA « -500 » ; TJM « abc » ; mois 5 | aucun résultat ; sous CA : « Le montant ne peut pas être négatif. » ; sous TJM : « Saisissez un nombre. » | |
| Par jour : charges « 1000,555 » ; CA 0 ; TJM 500 ; mois 5 | aucun résultat ; sous Charges : « 2 décimales au maximum. » | |
| Par jour : charges « -1000,555 » ; CA 0 ; TJM 500 ; mois 5 | aucun résultat ; sous Charges, un seul message : « Le montant ne peut pas être négatif. » | Deux fautes : la priorité au négatif s'applique. |
| Par jour : charges 60 000 ; CA 34 600 ; TJM 550 ; mois « 5,0 » | 25 400 € ; 47 jours ; 10 jours par mois, aucun message | Décimale nulle acceptée pour les mois. |
| Par heure : charges 60 000 ; CA 0 ; taux horaire 0 ; heures 25 ; mois 5 | aucun résultat ; sous Taux horaire : « Le montant doit être supérieur à 0. » ; sous Heures : « Saisissez un nombre de 1 à 24, avec 2 décimales au maximum. » | |
| Par heure : charges 60 000 ; CA 0 ; taux horaire 70 ; heures « 7,125 » ; mois 5 | aucun résultat ; sous Heures : « Saisissez un nombre de 1 à 24, avec 2 décimales au maximum. » | |
| Par heure : charges 60 000 ; CA 0 ; taux horaire 70 ; heures vide ; mois 5 | aucun résultat ; sous Heures : « Ce champ est obligatoire. » | |
| Par heure, avec « abc » laissé dans le TJM : charges 60 000 ; CA 34 600 ; taux horaire 70 ; heures 7 ; mois 5 | 25 400 € ; 52 jours ; 11 jours par mois, aucun message | Le champ de l'autre mode est ignoré. |

## Critères d'acceptation

- CA1 – À l'ouverture, la page affiche le sélecteur « Tarif » sur « par jour », les champs Charges, Chiffre d'affaires déjà identifié, TJM et Mois restants vides avec les libellés et aides exacts de la section Affichage, le bouton « Calculer », et aucun résultat.
- CA2 – Avec charges 60 000, CA 34 600, TJM 550 et mois 5, un clic sur « Calculer » affiche « 25 400 € », « 47 jours » et « 10 jours par mois ».
- CA3 – Une division qui tombe juste n'est pas arrondie : charges 45 300, CA 20 000, TJM 550 et mois 6 donnent « 46 jours » et « 8 jours par mois ».
- CA4 – Le rythme mensuel se calcule sur les jours déjà arrondis, puis s'arrondit au jour entier supérieur (exemples des CA2 et CA3).
- CA5 – Un chiffre d'affaires déjà identifié vide est compté comme 0 € : charges 48 000, CA vide, TJM 400 et mois 12 donnent « 48 000 € », « 120 jours » et « 10 jours par mois ».
- CA6 – Les centimes sont pris en compte et affichés seulement s'ils ne sont pas nuls : charges 30 000,50, CA 0, TJM 500 et mois 12 donnent « 30 000,50 € », « 61 jours » et « 6 jours par mois ». Un montant rond s'affiche sans centimes (« 25 400 € »).
- CA7 – « 25 000,50 », « 25000.50 » et « 25000,50 » donnent le même résultat.
- CA8 – Quand le CA déjà identifié est égal ou supérieur aux charges, la page affiche « 0 € », « 0 jour », « 0 jour par mois » et « Vos charges annuelles sont déjà couvertes. »
- CA9 – « jour » s'écrit au singulier pour 0 et 1, et au pluriel au-delà, pour les jours comme pour le rythme : charges 10 000, CA 9 900, TJM 600 et mois 4 donnent « 1 jour » et « 1 jour par mois ».
- CA10 – En mode « par heure », le champ TJM est masqué, et les champs Taux horaire et Heures travaillées par jour sont visibles avec leurs libellés et aides exacts. En mode « par jour », c'est l'inverse.
- CA11 – En mode « par heure », le tarif journalier vaut taux horaire × heures par jour : charges 60 000, CA 34 600, taux horaire 70, heures 7 et mois 5 donnent « 25 400 € », « 52 jours » et « 11 jours par mois ».
- CA12 – Les heures par jour acceptent les décimales : taux horaire 50 et heures 5,5, avec charges 45 300, CA 20 000 et mois 6, donnent « 92 jours » et « 16 jours par mois ».
- CA13 – Le tarif journalier n'est pas arrondi : charges 2 187,05, CA 0, taux horaire 70,55, heures 7,75 et mois 1 donnent « 4 jours » et « 4 jours par mois ».
- CA14 – Chaque cas d'erreur du tableau « Cas d'erreur » affiche son message exact sous le champ concerné, et aucun résultat. Quand plusieurs champs sont fautifs, chacun affiche son message.
- CA15 – Les champs du mode non sélectionné sont ignorés : en mode « par heure », un TJM invalide n'empêche pas le calcul et n'affiche aucun message.
- CA16 – Les valeurs saisies sont conservées quand on change de mode : après être passé en mode « par heure » puis revenu en mode « par jour », le TJM saisi est toujours là.
- CA17 – Après un calcul, la modification d'un champ ou le changement de mode efface les résultats jusqu'au prochain clic sur « Calculer ».
- CA18 – Après un rechargement de la page, tous les champs sont vides et le sélecteur est sur « par jour ».
- CA19 – Un champ qui cumule plusieurs fautes n'affiche qu'un message, selon l'ordre de priorité de la section « Cas d'erreur » : « -1000,555 » dans les charges affiche seulement « Le montant ne peut pas être négatif. ».
- CA20 – « 5,0 » et « 5.0 » dans les mois restants sont acceptés et valent 5.
- CA21 – Le message d'erreur d'un champ disparaît dès que ce champ est modifié, sans attendre le clic sur « Calculer ». Les messages des champs masqués par un changement de mode disparaissent aussi.

## Scénario de bout en bout

1. Ouvrir la page. Vérifier le sélecteur sur « par jour », les champs Charges, CA, TJM et Mois restants vides avec leurs libellés et aides, le bouton « Calculer », et l'absence de résultat.
2. Cliquer sur « Calculer » sans rien saisir. Vérifier « Ce champ est obligatoire. » sous Charges, TJM et Mois restants, rien sous le CA, et aucun résultat.
3. Saisir charges « 60 000 », CA « 34600 », TJM « 0 », mois « 5 ». Cliquer sur « Calculer ». Vérifier « Le montant doit être supérieur à 0. » sous TJM, et aucun résultat.
4. Remplacer le TJM par « 550 ». Cliquer sur « Calculer ». Vérifier « 25 400 € », « 47 jours », « 10 jours par mois », et plus aucun message d'erreur.
5. Remplacer le nombre de mois par « 6 ». Vérifier que les résultats ont disparu. Cliquer sur « Calculer ». Vérifier « 47 jours » et « 8 jours par mois » (47 ÷ 6 = 7,83 → 8).
6. Passer le sélecteur sur « par heure ». Vérifier que les résultats ont disparu, que le champ TJM est masqué, et que les champs Taux horaire et Heures travaillées par jour sont visibles et vides, avec leurs aides.
7. Saisir taux horaire « 70 » et heures « 25 ». Cliquer sur « Calculer ». Vérifier « Saisissez un nombre de 1 à 24, avec 2 décimales au maximum. » sous Heures, et aucun résultat.
8. Remplacer les heures par « 7 » et le nombre de mois par « 5 ». Cliquer sur « Calculer ». Vérifier « 25 400 € », « 52 jours » et « 11 jours par mois ».
9. Repasser le sélecteur sur « par jour ». Vérifier que le TJM affiche toujours « 550 » et que les résultats ont disparu. Cliquer sur « Calculer ». Vérifier « 47 jours » et « 10 jours par mois ».
10. Remplacer le CA par « 60 000 ». Cliquer sur « Calculer ». Vérifier « 0 € », « 0 jour », « 0 jour par mois » et « Vos charges annuelles sont déjà couvertes. »
11. Remplacer les charges par « 30 000,50 », le CA par « 0 », le TJM par « 500 » et le nombre de mois par « 12 ». Cliquer sur « Calculer ». Vérifier « 30 000,50 € », « 61 jours » et « 6 jours par mois ».
12. Recharger la page. Vérifier que tous les champs sont vides et que le sélecteur est sur « par jour ».

## Questions ouvertes

Aucune.

La rémunération nette possible avec la trésorerie, la réserve à garder et les calculs entre objectif de rémunération et tarif feront l'objet de la spécification 002, sur sa propre branche.
