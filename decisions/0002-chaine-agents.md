# 0002 – Chaîne de travail par agents

- **Date** : 7 novembre 2026
- **Statut** : adoptée

## Contexte

Le responsable pilote sans coder. Il doit pouvoir faire confiance au résultat sans lire le code. Il faut donc que chaque étape soit faite par un rôle borné, et que les décisions qui lui reviennent passent par des points d'arrêt clairs.

## Décision

Un skill et trois sous-agents, définis dans `.claude/` et rédigés en français.

| Rôle | Fichier | Modèle, effort | Peut écrire ? |
|---|---|---|---|
| Cadrage | `skills/cadrer/SKILL.md` | celui de la session, effort élevé | seulement la spécification, avec l'accord du responsable |
| Testeur | `agents/testeur.md` | Sonnet, effort élevé | seulement `tests/` (verrou) |
| Relecteur sécurité | `agents/relecteur-securite.md` | Opus, effort élevé | non (Read, Grep, Glob) |
| Recetteur | `agents/recetteur.md` | Sonnet, effort moyen | non. Seul le serveur Playwright écrit les captures dans `recettes/` |

- **Cadrage lancé à la main** (`/cadrer`) : le responsable décide quand une fonctionnalité commence.
- **Modèles** : Opus pour la relecture, où une erreur manquée coûte cher. Sonnet pour les tâches mieux bornées, écrire des tests et rejouer un scénario.
- **Quatre portes** : spécification validée, tests au vert, relecture traitée, recette validée. Les portes 1 et 4 sont réservées au responsable.

### Verrous

Les consignes écrites ne suffisent pas. Chaque agent qui pourrait écrire a donc un verrou, c'est-à-dire un hook qui s'exécute avant chacun de ses outils :

- `hooks/verrou-testeur.mjs` : écriture seulement dans `tests/`. Pour le terminal, Bash et PowerShell compris, seulement `npm test`. Le reste est bloqué.
- `hooks/verrou-recetteur.mjs` : il refuse l'envoi de fichiers du disque vers une page, le code exécuté hors de la page, l'enregistrement de session, les traces et les vidéos. Il refuse aussi tout nom de fichier explicite, car Playwright MCP enregistre un fichier nommé à la racine du projet et non dans `recettes/`. Ces outils sont aussi retirés de la fiche de l'agent (`disallowedTools`). Il autorise en revanche `SubagentHandback`, par son nom exact, pour que le recetteur puisse rendre son rapport à la session principale. Sans lui, deux recettes ont été perdues le 7 novembre 2026.

**Sûrs en cas de panne** : les deux verrous sont appelés en forme exécutable (`command: node` et `args` avec `${CLAUDE_PROJECT_DIR}`, sans passer par un shell) avec `onFailure: block` (Claude Code 2.1.295 ou plus). Un verrou qui ne démarre pas, plante, dépasse son délai ou rend une sortie invalide bloque l'outil au lieu de le laisser passer.

Leur preuve est rejouée à chaque `npm test` (`tests/outillage/`). Le script est aussi lancé tel quel, pour vérifier le code de sortie qui bloque réellement l'outil.

### Nouvelle dépendance : Playwright MCP

`@playwright/mcp`, **version 0.0.83** (28 septembre 2026), sert au recetteur à piloter un vrai navigateur. Elle est déclarée dans la fiche du recetteur, donc disponible pour lui seul. `npx` la récupère au premier lancement. Elle n'entre ni dans `package.json` ni dans l'appli publiée. Elle utilise le Chrome déjà installé (`--browser chrome`), avec un profil temporaire (`--isolated`). Par défaut, elle n'ouvre pas les adresses `file://`.

La 0.0.84 a été écartée, car elle était publiée depuis moins de deux semaines au moment du choix.

## Limite connue

`npm test` exécute les tests écrits par le testeur. Un test peut contenir n'importe quel code JavaScript, y compris du code qui écrit hors de `tests/`. Le verrou évite donc les **erreurs**, mais pas un **contournement volontaire**.

Le dernier filet reste humain et outillé : le relecteur sécurité relit aussi les tests, et toute modification passe par une demande de fusion que seul le responsable fusionne.

## Conséquences

- Une fonctionnalité demande plusieurs passages (cadrage, tests, code, relecture, recette). C'est plus lent, mais chaque étape se vérifie.
- Les fiches des agents et les verrous font partie du dépôt. Les modifier passe par une demande de fusion, comme le code.
- Les définitions d'agents peuvent n'être prises en compte qu'au démarrage suivant de Claude Code.
