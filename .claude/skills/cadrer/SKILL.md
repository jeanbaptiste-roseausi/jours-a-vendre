---
name: cadrer
description: Cadre une fonctionnalité avec le responsable du projet avant tout test ou code, puis rédige sa spécification dans specs/. Lancé uniquement à la main avec /cadrer.
disable-model-invocation: true
effort: high
argument-hint: "[fonctionnalité à cadrer]"
allowed-tools: Read Grep Glob AskUserQuestion
---

# Cadrer une fonctionnalité

Tu cadres la fonctionnalité « $ARGUMENTS » avec le responsable du projet. Il ne code pas : il décide du métier, toi tu poses les bonnes questions et tu écris.

Tu n'écris ni test ni code. Ta seule production est une spécification dans `specs/`, au statut « à valider ».

## 1. Lire avant de demander

Lis d'abord `CLAUDE.md`, tout `specs/` et tout `decisions/`. Ne pose jamais une question dont la réponse y est déjà écrite. Si une réponse écrite te semble ambiguë ou contredite, signale-le et demande confirmation au lieu de reposer la question.

Si aucune fonctionnalité n'est donnée en argument, demande d'abord laquelle cadrer.

## 2. Interroger par petites vagues

Utilise l'outil de questions (AskUserQuestion), **1 à 4 questions par vague**, et attends les réponses avant la vague suivante. Chaque question :
- est compréhensible sans connaissance technique ;
- propose des réponses concrètes, avec **ta réponse recommandée en premier**, marquée « (Recommandé) » et justifiée en une phrase ;
- laisse le responsable répondre autrement s'il le souhaite.

Couvre ces thèmes dans cet ordre, en sautant ce qui est déjà tranché :
1. **Objectif** : quel problème la fonctionnalité règle et pour qui.
2. **Périmètre et exclusions** : ce qui est dedans, et ce qui est explicitement dehors.
3. **Données saisies** : chaque champ, son unité, ses bornes, s'il est obligatoire, sa valeur par défaut.
4. **Règles de calcul** : formules, arrondis (à quoi, dans quel sens), ordre des opérations.
5. **Cas d'erreur** : saisie vide, nulle, négative, non numérique, résultat impossible ; message affiché pour chacun.
6. **Affichage** : ce qui s'affiche, où, dans quel format (séparateurs, unités, décimales).
7. **Vocabulaire** : les mots exacts de l'interface et leur définition.
8. **Critères d'acceptation** : les conditions vérifiables qui diront que c'est fini.

### Transformer le flou en mesurable

Dès qu'une réponse contient un mot flou (« rapide », « simple », « environ », « clair », « beaucoup », « arrondi »…), repose une question qui le chiffre. Exemple : « arrondi » devient « arrondi au jour supérieur » ou « à une décimale ». Un critère d'acceptation doit pouvoir être vérifié par un test ou par une observation sans interprétation.

### Ne jamais décider à sa place

Tu ne tranches aucune règle métier toi-même. Si une réponse manque, tu la demandes. Une recommandation reste une proposition tant qu'elle n'est pas acceptée.

## 3. Rédiger la spécification

Crée `specs/NNN-nom-court.md` (NNN = numéro suivant sur trois chiffres, nom en minuscules avec tirets) avec ce plan :

```markdown
# NNN – Titre de la fonctionnalité

- **Statut** : à valider
- **Date** : AAAA-MM-JJ

## Objectif
## Périmètre
### Inclus
### Exclus
## Données saisies
| Champ | Unité | Obligatoire | Bornes | Par défaut |
## Règles de calcul
## Cas d'erreur
| Situation | Comportement attendu | Message affiché |
## Affichage
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
- le **scénario de bout en bout** décrit pas à pas ce qu'un utilisateur saisit et voit, pour la recette ;
- tout point non tranché va dans « Questions ouvertes », jamais dans une règle.

L'écriture du fichier demande l'accord du responsable : c'est voulu.

## 4. S'arrêter sur une synthèse

Termine par une synthèse courte en français : objectif, règles retenues, exemples chiffrés, critères d'acceptation, questions ouvertes. Demande au responsable de valider la spécification. **Arrête-toi là.**

Seul le responsable fait passer le statut à « validée ». Tant qu'il ne l'a pas fait, aucun test ni code ne commence (porte 1 de la chaîne de travail, voir `CLAUDE.md`).
