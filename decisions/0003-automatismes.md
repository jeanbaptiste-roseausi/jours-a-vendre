# 0003 – Automatismes : hook, intégration continue, porte de fusion, mise en ligne, sécurité

- **Date** : 7 novembre 2026
- **Statut** : adoptée

## Contexte

La chaîne d'agents (fiche 0002) fixe qui fait quoi. Mais rien n'empêchait un commit avec des tests rouges, une fusion sans vérification ou une poussée directe sur `main`. Il n'y avait non plus ni mise en ligne ni veille de sécurité. Le responsable ne lit pas le code : ces contrôles doivent donc tourner seuls et sans exception.

## Décision

### Hook avant commit
- `.githooks/pre-commit` lance `npm test` et refuse le commit en cas d'échec. Le hook teste les fichiers du dossier de travail, et non seulement ceux qui sont prêts à être commités.
- Le script `prepare` de `package.json` (`git config core.hooksPath .githooks`) l'active à chaque `npm install` ou `npm ci`. Aucune dépendance n'est ajoutée.
- `.gitattributes` impose des fins de ligne Unix dans `.githooks/`, sinon le script ne se lancerait pas une fois extrait sous Windows.
- **Tests rouges, décision du responsable.** Le testeur écrit des tests qui doivent échouer, et le hook refuserait de les commiter seuls. Sans contournement, ils restent donc non commités jusqu'à ce que le code les fasse passer. On commite alors les tests, puis le code. Le rapport du testeur, avec ses tests en échec, est recopié dans la description de la demande de fusion pour prouver que les tests ont précédé le code.

### Intégration continue
- `.github/workflows/ci.yml` tourne à chaque demande de fusion et à chaque poussée sur `main`. Le job `verifications` enchaîne `npm ci`, `npm test` et `npm run build`.
- Node vient de `.nvmrc`, réglé sur `26`, la version majeure du poste. L'intégration continue prend le dernier correctif de Node 26, et non une version figée qui vieillirait.

### Porte de fusion
- Un jeu de règles sur `main`, appliqué par l'API GitHub et dont la description est dans `.github/regles/main.json`. Il est **actif sans aucune exception**, administrateur compris (`bypass_actors` vide).
- Il impose :
  - une demande de fusion ;
  - le job `verifications` au vert. Le check doit provenir de GitHub Actions (`integration_id` 15368), pour qu'aucune autre application ne puisse le simuler.
- Il interdit la réécriture de l'historique (`non_fast_forward`) et la suppression de `main` (`deletion`).
- **0 approbation requise.** GitHub ne permet pas d'approuver sa propre demande de fusion : avec un seul développeur, exiger une approbation bloquerait tout. Le contrôle humain reste la fusion elle-même, que seul le responsable fait.
- La branche n'a pas besoin d'être à jour avec `main` avant de fusionner (`strict` désactivé). Les mises à jour de Dependabot évitent ainsi d'être relancées à chaque fusion.
- Le dépôt autorise la fusion automatique, qui ne s'enclenche que si quelqu'un l'active sur une demande de fusion. Il supprime aussi automatiquement les branches fusionnées.

### Mise en ligne
- `.github/workflows/publication.yml` se lance à chaque poussée sur `main`, c'est-à-dire après chaque fusion.
- Il rejoue `npm test` avant `npm run build`. Un test rouge arrête donc la publication.
- La publication se fait sur GitHub Pages, configuré en mode « workflow ».
- `vite.config.js` place l'appli dans le sous-dossier `/jours-a-vendre/` pour la construction seulement. En local, `npm run dev` reste à la racine.
- Adresse : https://jeanbaptiste-roseausi.github.io/jours-a-vendre/
- L'environnement `github-pages` n'accepte que la branche `main`. Une autre branche ne peut donc pas publier, même avec un workflow modifié.

### Gardien de la chaîne
- Dependabot :
  - alertes de vulnérabilités et correctifs de sécurité automatiques ;
  - `.github/dependabot.yml` : mises à jour hebdomadaires de npm et des actions GitHub, y compris les empreintes figées ;
  - **14 jours d'attente** (`cooldown`) avant de proposer une nouvelle version. C'est la même règle que pour le choix des versions, car les paquets piégés sont souvent retirés en quelques jours. Les correctifs de sécurité ne sont pas concernés par ce délai.
- Détection de secrets avec blocage à l'envoi, déjà active sur ce dépôt public.
- CodeQL en configuration par défaut.

### Sécurité des workflows
- **Actions figées par leur empreinte complète** (40 caractères), avec la version en commentaire. Une étiquette comme `v7` peut être déplacée vers un autre code, pas une empreinte. Les versions retenues avaient plus de deux semaines au moment du choix :

  | Action | Version | Publiée le |
  |---|---|---|
  | `actions/checkout` | v7.0.1 | 20 juillet 2026 |
  | `actions/setup-node` | v7.1.0 | 8 octobre 2026 |
  | `actions/upload-pages-artifact` | v5.0.0 | 10 avril 2026 |
  | `actions/deploy-pages` | v5.0.1 | 1er septembre 2026 |

- **Permissions minimales** :
  - `permissions: {}` au niveau de chaque workflow, puis chaque job ne demande que ce qu'il lui faut : `contents: read` pour lire le code, `pages: write` et `id-token: write` pour la seule publication ;
  - `persist-credentials: false` au checkout, pour que le jeton ne reste pas dans le dossier de travail.
- La conformité de ces fichiers est vérifiée à chaque `npm test` (`tests/outillage/automatismes.test.js`).

## Limites connues

- **Contourner le hook.** `git commit --no-verify` saute le hook. Le filet est l'intégration continue, exigée par la règle de `main`.
- **Check modifiable par la branche.** Lors d'une demande de fusion, GitHub exécute le `ci.yml` de la branche elle-même. Une branche qui affaiblit ce workflow, ou les tests de conformité, peut donc obtenir un `verifications` vert. Le contrôle reste la relecture : le relecteur sécurité doit signaler tout changement dans `.github/`, `.githooks/`, `.claude/` ou `tests/outillage/`. Toute demande de fusion qui touche `.github/`, `.claude/` ou `tests/outillage/` le signale en tête de sa description (règle de `CLAUDE.md`).
- **Fusion par la session.** La règle de `main` ne vérifie pas qui fusionne, et la session Claude utilise les identifiants du responsable.
  - `.claude/settings.json`, versionné, place `gh pr merge` en `ask`, en Bash comme en PowerShell. La session peut fusionner à la demande du responsable, mais Claude Code lui demande d'abord son accord, même en mode auto, et une règle `allow` locale ne passe pas avant.
  - Cette règle ne couvre que la commande `gh pr merge`. Une fusion par une autre voie, comme `gh api` sur l'adresse de fusion ou un clic dans le navigateur, n'est pas bloquée. Pour ces voies, seule la consigne de `CLAUDE.md` s'applique.
  - La fusion automatique est permise à la demande du responsable. Elle ne s'enclenche que si quelqu'un l'active, et l'activer passe par la même commande `gh pr merge --auto`.
- **Réglages hors du dépôt.** La règle, Pages, Dependabot et CodeQL se règlent sur GitHub et non dans des fichiers. `.github/regles/main.json` décrit la règle, mais une modification faite sur le site ne s'y reporterait pas.
- **Playwright MCP non surveillé.** Dependabot ne voit pas cette dépendance, figée à la version 0.0.83 dans la fiche du recetteur (`.claude/agents/recetteur.md`) et absente de `package.json`. Ses mises à jour et ses alertes de sécurité restent à vérifier à la main.
- **Auteur des tests.** Les tests de conformité de l'outillage sont écrits par la session principale : le testeur exige une spécification validée et reste réservé aux fonctionnalités.

## Conséquences

- Plus aucun changement n'arrive sur `main` sans demande de fusion et sans intégration continue au vert, y compris de la part de l'administrateur.
- Chaque commit coûte le temps de `npm test`, moins d'une seconde aujourd'hui.
- Les mises à jour de Dependabot arrivent sous forme de demandes de fusion à examiner, comme le reste.
