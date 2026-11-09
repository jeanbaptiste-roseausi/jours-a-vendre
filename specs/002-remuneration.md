# 002 – Rémunération et trésorerie

- **Statut** : en cadrage
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

- **Étape** : temps 2, note validée le 2026-11-09.
- **Décisions prises** :
  - Besoin et problème, tels que formulés dans la note (2026-11-09).
  - Nouveau besoin par rapport au 2026-11-08 : la durée pendant laquelle la trésorerie permet de se rémunérer sans aucune rentrée.
  - Périmètre : les quatre calculs A, B, C et D dans cette spécification (2026-11-09).
  - Risque : faible (2026-11-09).
- **Questions ouvertes** : finesse des cas limites, règles du calcul D, éléments du 2026-11-08 à conserver ou à retirer.
- **Prochaine question** : première vague de détail.

### Réponses provisoires du 2026-11-08

Données avant que le besoin soit fixé, elles sont à revoir au temps 2 sur le périmètre validé. Aucune n'est une règle.

- Quatre calculs possibles, à côté de « Jours à vendre », dans un onglet « Rémunération » :
  - A : trésorerie → rémunération nette maximale, avec réserve ;
  - B : objectif de rémunération + rythme → tarif à pratiquer ;
  - C : tarif + rythme → rémunération projetée ;
  - D (ajouté le 2026-11-09) : trésorerie → nombre de mois de rémunération possibles sans rentrée.
- Taux de prélèvements global saisi, pré-rempli à 45 % (TNS), compté sur le net : net = total sorti ÷ (1 + taux) ; net avant impôt sur le revenu.
- A : trésorerie saisie telle quelle, obligatoire, 0 ou plus ; réserve facultative (vide = 0), en montant (0 ou plus) ou en % de la trésorerie (0 à 100), seulement dans A ; champ facultatif « nette déjà versée », ajouté pour le total de l'année ; deux lignes côte à côte, sans réserve et avec réserve ; réserve ≥ trésorerie → 0 € et « Votre réserve absorbe toute la trésorerie. ».
- B et C : frais facultatifs, saisissables au mois ou à l'an ; frais retirés avant les prélèvements.
- B : TJM et taux horaire tous deux affichés, heures obligatoires ; TJM à l'euro supérieur, taux horaire au centime supérieur.
- C : heures seulement en mode « par heure » ; net mensuel et annuel (12 mois).
- Jours par mois de 1 à 31, 2 décimales au maximum ; net arrondi au centime inférieur.
- Propositions restées sans réponse : A afficher « Encore à verser » et « Total de l'année » ; arrondis seulement à la fin ; taux de 0 à 200 % ; C frais ≥ CA → 0 € et message ; un sélecteur pour un calcul à la fois ; mêmes contrôles et comportements que la 001 ; frais « par mois » au départ.

## Objectif

## Périmètre

### Inclus

### Exclus

## Données saisies

| Champ | Unité | Obligatoire | Bornes | Par défaut |
|---|---|---|---|---|

## Règles de calcul

## Cas d'erreur

| Situation | Comportement attendu | Message affiché |
|---|---|---|

### Cas limites non traités

## Affichage

## Vocabulaire

| Terme | Définition |
|---|---|

## Exemples chiffrés

| Entrées | Résultat attendu | Remarque |
|---|---|---|

## Critères d'acceptation

## Scénario de bout en bout

## Questions ouvertes
