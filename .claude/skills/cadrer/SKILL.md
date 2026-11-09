---
name: cadrer
description: Cadre une fonctionnalité avec le responsable du projet avant tout test ou code, en deux temps (macro puis détail), reprend proprement une spécification en cours, et rédige sa spécification dans specs/. Lancé uniquement à la main avec /cadrer.
disable-model-invocation: true
effort: high
argument-hint: "[fonctionnalité à cadrer]"
allowed-tools: Read Grep Glob AskUserQuestion Edit(specs/**)
---

# Cadrer une fonctionnalité

Tu cadres la fonctionnalité « $ARGUMENTS » avec le responsable du projet. Il ne code pas : il décide du métier, toi tu poses les bonnes questions et tu écris.

Tu n'écris ni test ni code. Tes seules productions sont une spécification dans `specs/` et, s'il n'existe pas encore, le cadre du projet `specs/mission-contexte.md`.

## Le fil du cadrage

Le cadrage descend cinq niveaux : **mission → contexte → besoin → problème → solution**.

- La mission et le contexte valent pour tout le projet. Ils se fixent une fois.
- Le besoin, le problème et la solution se traitent pour chaque fonctionnalité.
- Ce fil décide de ce qui mérite d'être demandé : la bonne solution, au vrai problème, avec la qualité que le contexte justifie, ni plus ni moins.

Pas d'excès de découpage : ces niveaux guident tes questions, ils n'ajoutent pas de formulaire. Quand tu as déjà compris un niveau, propose ta formulation à corriger au lieu de le demander.

**Remonter en cas de blocage.** Si le responsable hésite, ou si une réponse en contredit une autre, n'ajoute pas d'options : remonte d'un niveau (de la solution au problème, du problème au besoin, du besoin au contexte), puis redescends.

## 1. Au lancement

Lis d'abord `CLAUDE.md`, tout `specs/`, tout `decisions/` et `docs/interface.md`. Ne pose jamais une question dont la réponse y est déjà écrite. Si une réponse écrite te semble ambiguë ou contredite, signale-le et demande confirmation au lieu de reposer la question.

Puis, dans cet ordre :

1. **Cadre du projet.** Si `specs/mission-contexte.md` n'existe pas, rédige un brouillon depuis `CLAUDE.md`, fais-le corriger et valider, puis crée le fichier :

   ```markdown
   # Mission et contexte du projet

   - **Mise à jour** : AAAA-MM-JJ

   ## Mission
   ## Contexte
   ## Niveau de qualité par défaut
   faible, moyen ou élevé, avec sa raison en une ligne
   ## Changements
   - AAAA-MM-JJ : ce qui a changé et pourquoi
   ```

2. **Spécification en cours.** Est en cours tout fichier `specs/NNN-*.md` dont le statut n'est pas « validée ». S'il y en a plusieurs, demande laquelle reprendre.
   - **Avec sa note de cadrage** : présente un rappel de 5 à 8 lignes. La première ligne donne la mission et le contexte, les suivantes le périmètre et l'étape atteinte. Attends la confirmation ou les corrections du responsable avant de continuer.
   - **Sans note de cadrage**, donc commencée par le détail : reconstruis la note à partir des réponses déjà données, présente-la, et ne pose que les questions macro manquantes. Elle se valide comme au temps 1.

3. **Aucune spécification en cours.** Si aucune fonctionnalité n'est donnée en argument, demande laquelle cadrer. Si des réponses sur cette fonctionnalité existent déjà ailleurs, par exemple dans ta mémoire du projet, traite-la comme commencée par le détail.

### Si le contexte bouge

Si une fonctionnalité sort du cadre (vrais utilisateurs, données personnelles, mise en production…), signale-le avant de continuer et demande s'il faut mettre à jour `specs/mission-contexte.md`. Tout changement y est daté, dans « Changements ».

### Branche et sauvegarde

Avant le premier enregistrement d'une spécification, si la branche ouverte est `main` ou déjà fusionnée, crée `fonction/NNN-nom-court` à partir de `origin/main` à jour. Une branche par fonctionnalité.

Commite la spécification, en français, à deux moments seulement : quand la note de cadrage est validée, et au passage au statut « à valider ». Ne saute jamais le hook avant commit.

## 2. Comment poser les questions

Utilise l'outil de questions (AskUserQuestion) et attends les réponses avant la vague suivante. Chaque question :
- est compréhensible sans connaissance technique ;
- propose des réponses concrètes, avec **ta réponse recommandée en premier**, marquée « (Recommandé) » et justifiée en une phrase ;
- laisse le responsable répondre autrement s'il le souhaite.

**Après chaque échange**, mets à jour la section « Où on en est » de la spécification.

**Si une vague revient sans réponse**, ou si le responsable n'est pas disponible, ne repose rien : note les questions en suspens dans « Où on en est » et arrête-toi.

### Transformer le flou en mesurable

Dès qu'une réponse contient un mot flou (« rapide », « simple », « environ », « clair », « beaucoup », « arrondi »…), repose une question qui le chiffre. Exemple : « arrondi » devient « arrondi au jour supérieur » ou « à une décimale ». Un critère d'acceptation doit pouvoir être vérifié par un test ou par une observation sans interprétation.

### Ne jamais décider à sa place

Tu ne tranches aucune règle métier toi-même. Si une réponse manque, tu la demandes. Une recommandation reste une proposition tant qu'elle n'est pas acceptée.

## 3. Temps 1 : le macro

Peu de questions, une par une ou par petits groupes de deux au plus. Crée la spécification au statut « en cadrage » dès la première réponse.

- **Besoin** : qui, et ce qu'il cherche à accomplir. C'est le besoin de l'utilisateur, pas le nôtre.
- **Problème** : ce qui l'en empêche aujourd'hui, et ce que cela lui coûte.
- **Solution** : résultat attendu, ce qui est inclus et exclu, contraintes de données et de sécurité, niveau de risque (faible, moyen, élevé), critères de réussite.

Si le responsable arrive avec une solution, accueille-la, puis remonte au problème et au besoin avant d'aller plus loin.

Le **risque** part du niveau de qualité par défaut du contexte. S'il s'en écarte pour cette fonctionnalité, la raison tient en une ligne. C'est le responsable qui le déclare.

Le résultat est une **note de cadrage de 15 lignes au plus**, en tête de la spécification. Fais-la valider explicitement. **Aucune question de détail avant cette validation.** Note sa date dans « Où on en est ».

## 4. Temps 2 : le détail

Seulement sur le périmètre validé. Une question hors périmètre se traite comme un changement de la note, à faire valider.

Couvre ces thèmes dans cet ordre, en sautant ce qui est déjà tranché, et selon la profondeur du tableau. Le thème **Interface** est obligatoire à tous les niveaux de risque :
1. **Données saisies** : chaque champ, son unité, ses bornes, s'il est obligatoire, sa valeur par défaut.
2. **Règles de calcul** : formules, arrondis (à quoi, dans quel sens), ordre des opérations.
3. **Cas limites et d'erreur** : selon la finesse retenue ; message affiché pour chacun.
4. **Affichage** : ce qui s'affiche, où, dans quel format (séparateurs, unités, décimales).
5. **Interface** : la place de chaque élément à l'écran et sa tenue selon les tailles (voir « Questions d'interface » ci-dessous).
6. **Vocabulaire** : les mots exacts de l'interface et leur définition.
7. **Critères d'acceptation** : les conditions vérifiables qui diront que c'est fini.

| Risque | Quand | Vagues au plus | Thèmes | Cas limites |
|---|---|---|---|---|
| Faible | Une erreur reste visible et sans conséquence | 2 | Données, règles, cas principaux, interface ; 3 exemples chiffrés | Seulement ceux qui fausseraient le résultat ou bloqueraient la page. Une règle commune et un message simple pour les saisies invalides. |
| Moyen | Une erreur peut fausser une décision | 4 | Les 7 thèmes ; un exemple par règle | Bornes de chaque champ et résultats impossibles, un message par type de faute. |
| Élevé | Argent réel, données personnelles, action irréversible | sans plafond | Les 7 thèmes ; cas dégradés dans le scénario ; relecture des règles une à une avec le responsable avant rédaction | Combinaisons de fautes, priorité des messages, états intermédiaires, cas dégradés. |

**Finesse des cas limites.** Au début du temps 2, propose la finesse du tableau en une seule question. Le responsable peut la monter ou la baisser, pour l'ensemble ou pour un cas précis, sans changer le risque. Note le choix dans « Où on en est ». Tout cas limite repéré et écarté va dans « Cas limites non traités », avec sa raison en une ligne : c'est un choix assumé, pas un oubli, et il ne donne lieu à aucun critère d'acceptation.

**Le fil pilote le détail :**
- Ne pose une question que si sa réponse change la façon de traiter le problème. Sinon, propose une valeur par défaut, et fais valider ces valeurs en bloc.
- Un élément sans lien avec le problème est proposé en exclusion (sur-qualité).
- Un problème qu'aucun critère de réussite ne couvre est signalé (sous-qualité).

### Questions d'interface

Pose-les à chaque fonctionnalité, quel que soit le risque, en une seule vague. Elles comptent dans le nombre de vagues du tableau. Rappelle d'abord au responsable, en deux lignes, les règles de `docs/interface.md`.

1. **Écran et état le plus chargé** : quel écran la fonctionnalité crée ou modifie (nouvel onglet, onglet existant, simple ajout), et que contient-il quand tout est rempli, avec le résultat et le message le plus long ?
2. **Priorité de lecture** : ce que l'utilisateur doit voir en premier, puis ensuite. Si tout ne tient pas, ce qui peut se replier ou passer dans un autre onglet.
3. **Téléphone** : même ordre que sur PC, ou un autre.
4. **Écarts au référentiel** : confirme que chaque règle s'applique. Un écart est une décision du responsable, notée avec sa raison.
5. **Charte** : si la section « Charte RoseauSI » de `docs/interface.md` est remplie, demande si elle s'applique telle quelle. Si elle est vide, ne pose aucune question de couleur ou de police et note « charte non définie ».

La règle « transformer le flou en mesurable » vaut ici aussi : « aéré », « clair » ou « bien visible » se traduisent en position, taille, nombre d'éléments ou ordre.

## 5. Rédiger la spécification

Crée `specs/NNN-nom-court.md` (NNN = numéro suivant sur trois chiffres, nom en minuscules avec tirets) avec ce plan, et remplis-le au fil du cadrage :

```markdown
# NNN – Titre de la fonctionnalité

- **Statut** : en cadrage
- **Date** : AAAA-MM-JJ

## Note de cadrage
15 lignes au plus : besoin, problème, solution (résultat attendu, inclus, exclu, contraintes de données et de sécurité, risque, critères de réussite).
## Où on en est
- **Étape** : temps 1 / note validée le AAAA-MM-JJ, temps 2 / à valider
- **Décisions prises** :
- **Questions ouvertes** :
- **Prochaine question** :
## Objectif
## Périmètre
### Inclus
### Exclus
## Données saisies
| Champ | Unité | Obligatoire | Bornes | Par défaut |
## Règles de calcul
## Cas d'erreur
| Situation | Comportement attendu | Message affiché |
### Cas limites non traités
## Affichage
## Interface
- **Écran et état le plus chargé** :
- **Priorité de lecture** :
- **Téléphone** :
- **Écarts à `docs/interface.md`** : aucun, ou décision du responsable et sa raison
- **Charte** : appliquée, ou charte non définie

| Exigence | Taille d'écran | Comment la vérifier | Critère |
## Vocabulaire
| Terme | Définition |
## Exemples chiffrés
| Entrées | Résultat attendu | Remarque |
## Critères d'acceptation
- CA1 – …
## Scénario de bout en bout
1. …
## Questions ouvertes
```

Règles de rédaction :
- au moins trois **exemples chiffrés** : un cas courant, un cas limite, un cas d'erreur ; calcule-les toi-même et vérifie-les deux fois ;
- chaque critère d'acceptation est numéroté (CA1, CA2…) et vérifiable ;
- le **scénario de bout en bout** décrit pas à pas ce qu'un utilisateur saisit et voit, pour la recette ; il comporte une étape qui amène chaque écran concerné à son état le plus chargé ;
- chaque règle de `docs/interface.md`, à chaque taille où elle s'applique, devient une ligne du tableau « Interface » avec son critère d'acceptation (CAn), sauf écart décidé par le responsable ;
- une exigence d'interface donne sa taille d'écran, l'état de la page et un seuil ou une observation sans interprétation ;
- pendant le cadrage, tout point non tranché reste dans « Où on en est », jamais dans une règle ;
- au passage à « à valider », les points restants vont dans « Questions ouvertes », et « Où on en est » se réduit à l'étape atteinte.

## 6. S'arrêter sur une synthèse

Quand le détail est terminé, passe le statut à « à valider ». Termine par une synthèse courte en français : besoin et problème, règles retenues, exigences d'interface, exemples chiffrés, critères d'acceptation, cas limites non traités, questions ouvertes. Demande au responsable de valider la spécification. **Arrête-toi là.**

Seul le responsable fait passer le statut à « validée ». Tant qu'il ne l'a pas fait, aucun test ni code ne commence (porte 1 de la chaîne de travail, voir `CLAUDE.md`).
