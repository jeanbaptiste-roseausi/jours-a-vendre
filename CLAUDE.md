# Combien de jours dois-je vendre ?

Calculateur pour indépendants. On saisit ses charges annuelles, le chiffre d'affaires déjà identifié et son TJM. L'appli affiche le nombre de jours restant à vendre et le rythme mensuel à tenir.

Le responsable du projet pilote sans coder. Le projet sert aussi à roder une méthode de développement par agents.

## Technique

HTML, CSS et JavaScript sans framework. Vite pour le serveur de développement et la construction, Vitest pour les tests (voir `decisions/0001-choix-techniques.md`).

- `src/` : code de l'application (la page elle-même est `index.html`, à la racine)
- `tests/` : tests automatiques
- `specs/` : spécifications fonctionnelles validées
- `decisions/` : fiches de décisions techniques datées
- `docs/` : documentation
- `.github/` : intégration continue, publication, Dependabot, description de la règle de `main`
- `.githooks/` : hook avant commit

En ligne : https://jeanbaptiste-roseausi.github.io/jours-a-vendre/ (publiée à chaque fusion sur `main`).

## Commandes

- `npm install` : installer les outils et activer le hook avant commit
- `npm run dev` : lancer la page en local (http://localhost:5173)
- `npm test` : lancer les tests
- `npm run build` : construire la version publiable dans `dist/`

## Chaîne de travail

Pour chaque fonctionnalité, sur sa propre branche :

1. **`/cadrer`** (skill, lancé par le responsable) : questions, puis spécification dans `specs/`.
   → **Porte 1 : spécification validée par le responsable.**
2. **testeur** (sous-agent) : écrit les tests depuis les critères d'acceptation et vérifie qu'ils échouent.
3. **Session principale** : écrit le code jusqu'à ce que les tests passent, sans modifier les tests.
   → **Porte 2 : tests au vert** (`npm test`).
4. **relecteur-securite** (sous-agent) : relit le diff et rend un rapport. La session principale corrige.
   → **Porte 3 : relecture traitée** (aucun point critique ou haut restant).
5. **recetteur** (sous-agent) : rejoue le scénario de bout en bout dans le navigateur et rend un rapport d'écarts.
   → **Porte 4 : recette validée par le responsable.**
6. Demande de fusion, que seul le responsable fusionne.
   → **Intégration continue au vert** (job `verifications`), exigée par la règle de `main`. Ensuite, la publication en ligne est automatique.

Aucune porte ne se franchit sans la précédente. Les verrous des agents sont dans `.claude/hooks/`, leur preuve dans `tests/outillage/` (voir `decisions/0002-chaine-agents.md`).

## Automatismes

Voir `decisions/0003-automatismes.md`.

- **Hook avant commit** : `npm test` doit passer, sinon le commit est refusé. Ne jamais le sauter (`--no-verify`) sans l'accord du responsable.
- **Tests rouges et commits** : les tests écrits par le testeur ne sont pas commités tant qu'ils échouent. Une fois le code au vert, on commite les tests, puis le code, et les deux passent le hook. Pour prouver que les tests ont précédé le code, le rapport du testeur, avec ses tests en échec, est recopié dans la description de la demande de fusion.
- **Règle de `main`, sans exception** : ni poussée directe, ni réécriture de l'historique, ni suppression. Toute modification passe par une demande de fusion avec `verifications` au vert.
- **Demandes de fusion sensibles** : toute demande de fusion qui touche `.github/`, `.claude/` ou `tests/outillage/` le signale en tête de sa description, avec la liste des fichiers concernés.
- **Fusion** : `gh pr merge` demande toujours l'autorisation du responsable, même en mode auto (`.claude/settings.json`). Ne jamais fusionner par une autre voie.
- **Workflows** : actions figées par leur empreinte complète, `permissions: {}` par défaut, et seulement les permissions nécessaires par job.
- **Dependabot** : ses demandes de fusion suivent la même porte. Playwright MCP, qu'il ne surveille pas, se vérifie à la main.

## Règles

1. Interface, documentation, commentaires et messages de commit en français.
2. Aucun code de fonctionnalité sans spécification validée dans `specs/`.
3. Les tests s'écrivent avant le code. Une fonctionnalité est finie quand ses tests passent, jamais en modifiant un test pour le faire passer.
4. Aucune décision métier prise à la place du responsable. En cas de doute, poser la question.
5. Une branche et une demande de fusion par changement. Seul le socle initial est allé directement sur `main`.
6. Petites étapes, un commit par étape logique.
7. Aucun secret ni donnée personnelle dans le dépôt.
8. Aucune nouvelle dépendance sans en donner la raison au responsable.
9. Chaque choix technique structurant fait l'objet d'une fiche datée dans `decisions/` (numérotée : `0002-...md`, etc.).
10. Avant chaque action, une phrase simple pour dire ce qui va être fait.
