# 002 – Rémunération et trésorerie

- **Statut** : à valider
- **Date** : 2026-11-09

## Note de cadrage

- **Besoin** : un indépendant veut décider combien il se verse et à quel tarif travailler, pour vivre de son activité sans mettre sa trésorerie en danger, et savoir combien de temps il peut se rémunérer avec son stock actuel de trésorerie si aucune rentrée n'arrivait.
- **Problème** : avec les prélèvements, il ne voit pas ce que son tarif ou sa trésorerie donnent en net, et il se verse donc au jugé, trop peu ou trop. Il ne sait pas non plus combien garder de côté, ni combien de temps il tiendrait en cas de coup dur : il hésite à se verser ce qu'il pourrait.
- **Résultat attendu** : un onglet « Rémunération » à côté de « Jours à vendre », avec quatre calculs :
  - A : le net maximum que la trésorerie permet, avec ou sans réserve ;
  - B : d'un objectif de rémunération et d'un rythme de travail au tarif à pratiquer ;
  - C : d'un tarif et d'un rythme de travail au net projeté ;
  - D : le nombre de mois de rémunération que la trésorerie permet sans aucune rentrée.
- **Inclus** : ces quatre calculs, un taux de prélèvements global saisi par l'utilisateur, une réserve minimale de trésorerie.
- **Exclu** : impôt sur le revenu, calcul des cotisations selon le statut, TVA, sauvegarde des saisies, comparaison de scénarios, simulation sur plusieurs années.
- **Données et sécurité** : aucun compte, aucune donnée conservée ni envoyée ; tout se calcule dans la page.
- **Risque** : faible, sans écart au niveau par défaut du projet.
- **Critères de réussite** : pour chacun des quatre calculs, un clic donne un résultat qu'on retrouve à la main avec les mêmes saisies ; l'onglet « Jours à vendre » fonctionne comme avant.

## Où on en est

- **Étape** : temps 2 terminé, spécification à valider par le responsable (note validée le 2026-11-09).

## Objectif

Un indépendant veut savoir ce qu'il peut se verser, à quel tarif travailler pour atteindre la rémunération voulue, ce que son tarif actuel lui rapporte en net, et combien de temps sa trésorerie le ferait tenir sans aucune rentrée.

## Périmètre

### Inclus

- Un onglet « Rémunération » à côté de l'onglet « Jours à vendre », qui reste inchangé.
- Un sélecteur qui montre un calcul à la fois : A « Combien me verser », B « Quel tarif pratiquer », C « Combien je gagnerais », D « Combien de temps je tiens ».
- Un taux de prélèvements global, saisi par l'utilisateur, commun aux quatre calculs.
- Une réserve minimale de trésorerie, en montant ou en pourcentage, dans le calcul A seulement.
- Des frais facultatifs dans B, C et D, saisis par mois ou par an.

### Exclus

- Impôt sur le revenu : tous les nets s'entendent avant impôt sur le revenu.
- Calcul des cotisations selon le statut : un seul taux global, saisi.
- TVA : les tarifs, le chiffre d'affaires et les frais sont hors taxes.
- Sauvegarde des saisies d'une visite à l'autre.
- Comparaison de scénarios et simulation sur plusieurs années.

## Données saisies

Chaque calcul a ses propres champs, sauf le taux de prélèvements, qui est le même pour les quatre : le modifier dans un calcul le modifie dans les autres.

| Champ | Calculs | Unité | Obligatoire | Bornes | Par défaut |
|---|---|---|---|---|---|
| Taux de prélèvements | A, B, C, D | % | oui | de 0 à 200 inclus | 45 |
| Trésorerie disponible | A, D | € | oui | 0 ou plus | vide |
| Réserve à garder | A | € ou % selon le choix | non (vide = 0) | en € : 0 ou plus ; en % : de 0 à 100 inclus | vide |
| Unité de la réserve (sélecteur) | A | — | oui | « en € » ou « en % » | « en € » |
| Nette déjà versée | A | € | non (vide = 0) | 0 ou plus | vide |
| Objectif de rémunération nette mensuelle | B | € par mois | oui | strictement supérieur à 0 | vide |
| Jours facturés par mois | B, C | jours | oui | de 1 à 31 inclus | vide |
| Heures travaillées par jour | B ; C en mode « par heure » | heures | oui | de 1 à 24 inclus | vide |
| Tarif (sélecteur) | C | — | oui | « par jour » ou « par heure » | « par jour » |
| TJM | C en mode « par jour » | € HT par jour | oui | strictement supérieur à 0 | vide |
| Taux horaire | C en mode « par heure » | € HT par heure | oui | strictement supérieur à 0 | vide |
| Frais | B, C, D | € HT | non (vide = 0) | 0 ou plus | vide |
| Périodicité des frais (sélecteur) | B, C, D | — | oui | « par mois » ou « par an » | « par mois » |
| Rémunération nette mensuelle | D | € par mois | oui | strictement supérieur à 0 | vide |

Pour tous les nombres : 2 décimales au maximum, la virgule ou le point comme séparateur décimal, et des espaces ignorés, comme dans la spécification 001.

## Règles de calcul

Dans toutes les règles, « taux » est le taux de prélèvements divisé par 100 : 45 % donne 0,45.

**Règles communes**

1. Les prélèvements se comptent sur le net : net = total sorti ÷ (1 + taux).
2. Frais du mois : le montant saisi s'il est « par mois », le montant saisi ÷ 12 s'il est « par an ». Des frais vides valent 0.
3. Les arrondis se font seulement sur les résultats affichés, jamais sur un calcul intermédiaire.
4. Les nets s'arrondissent au centime inférieur. Une division qui tombe juste n'est pas arrondie.
5. Le calcul se fait au clic sur « Calculer », et seulement si toutes les saisies visibles sont valides.

**A – Combien me verser**

6. Réserve : le montant saisi s'il est « en € », trésorerie × pourcentage ÷ 100 s'il est « en % ».
7. Sans réserve, encore à verser = trésorerie ÷ (1 + taux).
8. Avec réserve, encore à verser = (trésorerie − réserve) ÷ (1 + taux). Si la réserve est égale ou supérieure à la trésorerie, cela vaut 0 €.
9. Total de l'année = encore à verser + nette déjà versée, sur chacune des deux lignes.

**B – Quel tarif pratiquer**

10. Chiffre d'affaires mensuel nécessaire = objectif × (1 + taux) + frais du mois.
11. TJM à pratiquer = chiffre d'affaires mensuel nécessaire ÷ jours facturés par mois, arrondi à l'euro supérieur.
12. Taux horaire à pratiquer = chiffre d'affaires mensuel nécessaire ÷ jours facturés par mois ÷ heures par jour, arrondi au centime supérieur. Il part du montant non arrondi, et non du TJM affiché.

**C – Combien je gagnerais**

13. Tarif journalier : le TJM en mode « par jour », le taux horaire × les heures par jour en mode « par heure », sans arrondi.
14. Chiffre d'affaires mensuel = tarif journalier × jours facturés par mois.
15. Net mensuel = (chiffre d'affaires mensuel − frais du mois) ÷ (1 + taux). Si les frais du mois sont égaux ou supérieurs au chiffre d'affaires mensuel, cela vaut 0 €.
16. Net annuel = net mensuel non arrondi × 12.

**D – Combien de temps je tiens**

17. Sortie mensuelle = rémunération nette mensuelle × (1 + taux) + frais du mois.
18. Durée = trésorerie ÷ sortie mensuelle non arrondie, arrondie à une décimale inférieure. La réserve n'intervient pas : D utilise toute la trésorerie.

## Cas d'erreur

Une règle commune, à la finesse du risque faible : un seul message par champ, juste sous le champ, et aucun résultat tant qu'il reste une erreur. Si plusieurs champs sont fautifs, chacun a son message. Seuls les champs visibles sont contrôlés. Le message d'un champ disparaît dès que ce champ est modifié, et ceux des champs masqués disparaissent au changement de calcul ou de mode.

| Situation | Comportement attendu | Message affiché |
|---|---|---|
| Champ obligatoire vide | aucun résultat | Ce champ est obligatoire. |
| Toute autre saisie fautive : non numérique, hors bornes, plus de 2 décimales | aucun résultat | Valeur invalide. |
| Champ facultatif vide | compté comme 0, pas d'erreur | aucun |
| Champ d'un autre calcul ou d'un autre mode, vide ou invalide | ignoré, pas d'erreur | aucun |
| A : une réserve est saisie et elle est égale ou supérieure à la trésorerie | ligne avec réserve à 0 € | Votre réserve absorbe toute la trésorerie. |
| A : trésorerie à 0 sans réserve saisie | deux lignes à 0 € | aucun |
| C : frais du mois égaux ou supérieurs au chiffre d'affaires mensuel | net mensuel et net annuel à 0 € | Vos frais absorbent tout votre chiffre d'affaires. |
| D : trésorerie à 0 | durée « 0 mois » | aucun |

### Cas limites non traités

- Priorité entre plusieurs fautes dans un même champ : un seul message « Valeur invalide. » suffit à la finesse retenue.
- Jours par mois supérieurs aux jours réels du mois ou à la capacité de travail : déjà exclu de la 001, sans effet sur le calcul.
- Nette déjà versée incohérente avec la trésorerie : le champ est additionné tel quel, l'utilisateur voit le total.
- Montants très élevés ou durées très longues : aucun plafond, sans intérêt pour un indépendant réel.

## Affichage

- **À l'ouverture** : l'onglet « Jours à vendre » est actif et identique à la spécification 001. L'onglet « Rémunération » est présent à côté.
- **Onglet « Rémunération »** : sélecteur « Calcul » sur « Combien me verser » au départ, champ Taux de prélèvements à 45, champs du calcul vides, bouton « Calculer », aucun résultat.
- **Changement d'onglet, de calcul ou de mode** : les valeurs saisies sont gardées, les résultats sont effacés.
- **Après une modification** : dès qu'un champ est modifié, les résultats sont effacés jusqu'au prochain clic sur « Calculer ».
- **Aucune sauvegarde** : recharger la page vide tous les champs, remet le taux à 45, l'onglet sur « Jours à vendre » et le sélecteur sur « Combien me verser ».
- **Montants** : espace entre les milliers, virgule pour les décimales, centimes affichés seulement s'ils ne sont pas nuls (« 20 000 € », « 16 551,72 € »).
- **Durée** : virgule pour la décimale, décimale affichée seulement si elle n'est pas nulle (« 6,1 mois », « 10 mois », « 0 mois »).

**Libellés et aides**

| Libellé | Aide |
|---|---|
| Taux de prélèvements (%) | Part des prélèvements, comptée sur le net, de 0 à 200 %. |
| Trésorerie disponible (€) | Ce que vous avez sur le compte aujourd'hui, 0 ou plus. |
| Réserve à garder | Un montant, ou de 0 à 100 % de la trésorerie. Laissez vide si aucune. |
| Nette déjà versée (€) | Rémunération nette déjà versée cette année, 0 ou plus. Laissez vide si aucune. |
| Objectif de rémunération nette mensuelle (€) | Ce que vous voulez toucher par mois, plus de 0 €. |
| Jours facturés par mois | Nombre de jours facturés dans un mois, de 1 à 31. |
| Heures travaillées par jour | Nombre d'heures facturées dans une journée, de 1 à 24. |
| TJM (€ HT) | Taux journalier moyen facturé à vos clients, plus de 0 €. |
| Taux horaire (€ HT) | Prix d'une heure facturée à vos clients, plus de 0 €. |
| Frais (€ HT) | Dépenses de l'activité, hors rémunération, 0 ou plus. Laissez vide s'il n'y en a pas. |
| Rémunération nette mensuelle (€) | Ce que vous voulez vous verser chaque mois, plus de 0 €. |

**Résultats**

- **A** : deux lignes côte à côte, « Sans réserve » et « Avec réserve », chacune avec « Encore à verser » et « Total de l'année ».
- **B** : « TJM à pratiquer » et « Taux horaire à pratiquer ».
- **C** : « Net mensuel » et « Net annuel ».
- **D** : « Sortie mensuelle » et « Durée sans rentrée ».

## Vocabulaire

| Terme | Définition |
|---|---|
| Taux de prélèvements | Ce qu'un euro de net coûte en plus en cotisations et prélèvements, exprimé en pourcentage du net. |
| Net | Rémunération versée à l'indépendant, après prélèvements et avant impôt sur le revenu. |
| Trésorerie disponible | Argent présent sur le compte aujourd'hui, saisi tel quel. |
| Réserve | Part de la trésorerie à ne pas se verser. |
| Encore à verser | Net que la trésorerie permet encore de se verser. |
| Total de l'année | Encore à verser augmenté de la nette déjà versée. |
| Frais | Dépenses de l'activité, hors rémunération et prélèvements. |
| Sortie mensuelle | Ce qui quitte la trésorerie chaque mois : net, prélèvements et frais. |
| Durée sans rentrée | Nombre de mois pendant lesquels la trésorerie couvre la sortie mensuelle, sans aucune rentrée. |

## Exemples chiffrés

Tous les chiffres sont fictifs. Le taux est à 45 % sauf mention contraire.

### A – Combien me verser

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Trésorerie 29 000 ; réserve 5 000 en € ; nette déjà versée 12 000 | Sans réserve : 20 000 € encore à verser, 32 000 € sur l'année. Avec réserve : 16 551,72 € encore à verser, 28 551,72 € sur l'année. | Cas courant. 29 000 ÷ 1,45 = 20 000, division juste. 24 000 ÷ 1,45 = 16 551,7241 → 16 551,72. |
| Trésorerie 29 000 ; réserve 10 en % | Sans réserve : 20 000 € et 20 000 €. Avec réserve : 18 000 € et 18 000 €. | Réserve de 2 900 €. 26 100 ÷ 1,45 = 18 000. Nette déjà versée vide comptée comme 0. |
| Trésorerie 10 000 ; réserve 10 000 en € | Sans réserve : 6 896,55 € et 6 896,55 €. Avec réserve : 0 € et 0 € ; « Votre réserve absorbe toute la trésorerie. » | Cas limite. 10 000 ÷ 1,45 = 6 896,5517 → 6 896,55. |
| Trésorerie 0 ; réserve vide | Sans réserve : 0 € et 0 €. Avec réserve : 0 € et 0 €. Aucun message. | Cas limite : pas de réserve saisie, donc pas de message. |

### B – Quel tarif pratiquer

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Objectif 3 000 ; frais 500 par mois ; jours 15 ; heures 7 | TJM 324 € ; taux horaire 46,20 € | Cas courant. 3 000 × 1,45 + 500 = 4 850. 4 850 ÷ 15 = 323,33 → 324. 323,33 ÷ 7 = 46,1905 → 46,20. |
| Objectif 2 000 ; taux 50 ; frais vide ; jours 10 ; heures 6 | TJM 300 € ; taux horaire 50 € | Divisions justes, non arrondies. 2 000 × 1,5 = 3 000. 3 000 ÷ 10 = 300. 300 ÷ 6 = 50. |
| Objectif 3 000 ; frais 6 000 par an ; jours 15 ; heures 7 | TJM 324 € ; taux horaire 46,20 € | 6 000 ÷ 12 = 500 : même résultat que 500 par mois. |

### C – Combien je gagnerais

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Par jour : TJM 400 ; jours 15 ; frais 500 par mois | Net mensuel 3 793,10 € ; net annuel 45 517,24 € | Cas courant. 400 × 15 = 6 000. 5 500 ÷ 1,45 = 3 793,1034. × 12 = 45 517,2413 → 45 517,24, et non 3 793,10 × 12 = 45 517,20. |
| Par heure : taux horaire 70 ; heures 7 ; jours 10 ; frais 6 000 par an | Net mensuel 3 034,48 € ; net annuel 36 413,79 € | 70 × 7 × 10 = 4 900. 4 400 ÷ 1,45 = 3 034,4827. × 12 = 36 413,7931. |
| Par jour : TJM 300 ; jours 2 ; frais 600 par mois | Net mensuel 0 € ; net annuel 0 € ; « Vos frais absorbent tout votre chiffre d'affaires. » | Cas limite : frais égaux au chiffre d'affaires. |

### D – Combien de temps je tiens

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| Trésorerie 30 000 ; net 3 000 ; frais 500 par mois | Sortie mensuelle 4 850 € ; 6,1 mois | Cas courant. 3 000 × 1,45 + 500 = 4 850. 30 000 ÷ 4 850 = 6,1855 → 6,1, et non 6,2. |
| Trésorerie 29 000 ; net 2 000 ; frais vide | Sortie mensuelle 2 900 € ; 10 mois | Division juste. |
| Trésorerie 0 ; net 2 000 ; frais vide | Sortie mensuelle 2 900 € ; 0 mois | Cas limite. |
| Trésorerie 30 000 ; net 3 000 ; frais 6 000 par an | Sortie mensuelle 4 850 € ; 6,1 mois | Frais annuels ramenés au mois. |

### Erreurs

| Entrées | Résultat attendu | Remarque |
|---|---|---|
| A : trésorerie vide | aucun résultat ; sous Trésorerie : « Ce champ est obligatoire. » | |
| A : trésorerie 29 000 ; réserve 150 en % | aucun résultat ; sous Réserve : « Valeur invalide. » | Hors bornes. |
| B : objectif 3 000 ; jours 32 ; heures vide | aucun résultat ; sous Jours : « Valeur invalide. » ; sous Heures : « Ce champ est obligatoire. » | Deux erreurs à la fois. |
| D : trésorerie 30 000 ; net 0 | aucun résultat ; sous Rémunération nette mensuelle : « Valeur invalide. » | |
| A : taux 250 ; trésorerie 29 000 | aucun résultat ; sous Taux : « Valeur invalide. » | |

## Critères d'acceptation

- CA1 – À l'ouverture, l'onglet « Jours à vendre » est actif et conforme à la spécification 001, et l'onglet « Rémunération » est présent à côté.
- CA2 – Dans l'onglet « Rémunération », le sélecteur propose les quatre calculs et s'ouvre sur « Combien me verser », avec le taux à 45, les autres champs vides, les libellés et aides exacts de la section Affichage, le bouton « Calculer » et aucun résultat.
- CA3 – Chaque calcul montre seulement ses champs, selon le tableau des données saisies. Dans C, le mode « par heure » remplace le TJM par le taux horaire et les heures.
- CA4 – A : trésorerie 29 000, réserve 5 000 en €, nette déjà versée 12 000 donnent, sans réserve, « 20 000 € » et « 32 000 € », et, avec réserve, « 16 551,72 € » et « 28 551,72 € ».
- CA5 – A : une réserve de 10 % sur une trésorerie de 29 000 donne, avec réserve, « 18 000 € ».
- CA6 – A : trésorerie 10 000 et réserve 10 000 donnent, avec réserve, « 0 € » et « Votre réserve absorbe toute la trésorerie. ». Une trésorerie à 0 sans réserve saisie donne 0 € sans ce message.
- CA7 – B : objectif 3 000, frais 500 par mois, jours 15 et heures 7 donnent « 324 € » et « 46,20 € ».
- CA8 – B : une division qui tombe juste n'est pas arrondie : objectif 2 000, taux 50, jours 10 et heures 6 donnent « 300 € » et « 50 € ».
- CA9 – Des frais « par an » comptent pour un douzième par mois, dans B, C et D : les exemples à 6 000 par an donnent les résultats attendus.
- CA10 – C, par jour : TJM 400, jours 15 et frais 500 par mois donnent « 3 793,10 € » et « 45 517,24 € » : l'arrondi se fait seulement à la fin.
- CA11 – C, par heure : taux horaire 70, heures 7, jours 10 et frais 6 000 par an donnent « 3 034,48 € » et « 36 413,79 € ».
- CA12 – C : des frais égaux ou supérieurs au chiffre d'affaires mensuel donnent « 0 € », « 0 € » et « Vos frais absorbent tout votre chiffre d'affaires. ».
- CA13 – D : trésorerie 30 000, net 3 000 et frais 500 par mois donnent « 4 850 € » et « 6,1 mois », arrondi à la décimale inférieure.
- CA14 – D : trésorerie 29 000 et net 2 000 donnent « 10 mois », sans décimale. Une trésorerie à 0 donne « 0 mois ». D ne propose aucun champ de réserve.
- CA15 – Le taux modifié dans un calcul se retrouve dans les trois autres, et chacun l'utilise.
- CA16 – Chaque cas du tableau « Cas d'erreur » affiche son message exact sous le champ concerné et aucun résultat. Quand plusieurs champs sont fautifs, chacun affiche son message. Les champs masqués sont ignorés.
- CA17 – « 29 000,50 », « 29000.50 » et « 29000,50 » donnent le même résultat.
- CA18 – Dès qu'un champ est modifié, les résultats sont effacés et le message de ce champ disparaît, jusqu'au prochain clic sur « Calculer ».
- CA19 – Les valeurs saisies sont gardées en changeant d'onglet, de calcul ou de mode, et les résultats sont effacés.
- CA20 – Après un rechargement, l'onglet « Jours à vendre » est actif, les champs sont vides, le taux est à 45 et le sélecteur sur « Combien me verser ».
- CA21 – Les tests de la spécification 001 restent au vert sans être modifiés.

## Scénario de bout en bout

1. Ouvrir la page. Vérifier que l'onglet « Jours à vendre » est actif et que l'onglet « Rémunération » est présent.
2. Ouvrir l'onglet « Rémunération ». Vérifier le sélecteur sur « Combien me verser », le taux à 45, les champs vides et l'absence de résultat.
3. Cliquer sur « Calculer ». Vérifier « Ce champ est obligatoire. » sous Trésorerie disponible, et aucun résultat.
4. Saisir trésorerie « 29 000 », réserve « 5000 » en €, nette déjà versée « 12 000 ». Cliquer sur « Calculer ». Vérifier « 20 000 € » et « 32 000 € » sans réserve, « 16 551,72 € » et « 28 551,72 € » avec réserve.
5. Remplacer la trésorerie par « 10 000 » et la réserve par « 10 000 ». Vérifier que les résultats ont disparu. Cliquer sur « Calculer ». Vérifier « 0 € » sur la ligne avec réserve et « Votre réserve absorbe toute la trésorerie. ».
6. Choisir « Quel tarif pratiquer ». Vérifier que le taux est toujours à 45. Saisir objectif « 3 000 », frais « 500 » par mois, jours « 32 », heures « 7 ». Cliquer sur « Calculer ». Vérifier « Valeur invalide. » sous Jours, et aucun résultat.
7. Remplacer les jours par « 15 ». Cliquer sur « Calculer ». Vérifier « 324 € » et « 46,20 € ».
8. Choisir « Combien je gagnerais ». Saisir TJM « 400 », jours « 15 », frais « 500 » par mois. Cliquer sur « Calculer ». Vérifier « 3 793,10 € » et « 45 517,24 € ».
9. Passer le tarif sur « par heure ». Saisir taux horaire « 70 », heures « 7 », remplacer les jours par « 10 », et les frais par « 6 000 » par an. Cliquer sur « Calculer ». Vérifier « 3 034,48 € » et « 36 413,79 € ».
10. Choisir « Combien de temps je tiens ». Saisir trésorerie « 30 000 », net « 3 000 », frais « 500 » par mois. Cliquer sur « Calculer ». Vérifier « 4 850 € » et « 6,1 mois ».
11. Revenir à « Combien me verser ». Vérifier que la trésorerie affiche toujours « 10 000 » et que les résultats ont disparu.
12. Ouvrir l'onglet « Jours à vendre ». Saisir charges « 60 000 », CA « 34600 », TJM « 550 », mois « 5 ». Cliquer sur « Calculer ». Vérifier « 25 400 € », « 47 jours » et « 10 jours par mois ».
13. Recharger la page. Vérifier que l'onglet « Jours à vendre » est actif et vide. Ouvrir « Rémunération » : vérifier le sélecteur sur « Combien me verser », le taux à 45 et les champs vides.

## Questions ouvertes

1. **Arrondi de la sortie mensuelle affichée dans D** : quand elle ne tombe pas juste (par exemple des frais annuels de 1 000 €, soit 83,33… € par mois), faut-il l'arrondir au centime supérieur, inférieur ou le plus proche ? Cela ne change que l'affichage : la durée se calcule sur le montant exact. Proposition : centime supérieur, car c'est une sortie et il vaut mieux la montrer par excès.
