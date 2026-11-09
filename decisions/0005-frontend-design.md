# 0005 – Skill frontend-design d'Anthropic

- **Date** : 9 novembre 2026
- **Statut** : adoptée

## Contexte

La chaîne de travail n'avait ni compétence ni contrôle sur l'interface. Les spécifications décrivaient ce qui s'affiche, mais rien ne guidait l'allure de la page et rien ne vérifiait qu'elle tenait à l'écran.

Trois ajouts corrigent cela, avant la spécification 003 :

- ce skill, pour la qualité visuelle au moment d'écrire le code ;
- `docs/interface.md`, le référentiel commun, repris par `/cadrer` dans chaque spécification ;
- le contrôle du recetteur à trois tailles d'écran.

## Décision

Le skill `frontend-design` est activé **à l'échelle du projet**, sous forme d'extension (plugin) du catalogue officiel d'Anthropic. L'entrée se trouve dans `enabledPlugins` de `.claude/settings.json`, qui est commité. Il s'appelle `/frontend-design:frontend-design`, et Claude peut aussi le charger de lui-même quand il construit une interface.

### Ce qu'il apporte

Des consignes pour une interface au dessin réfléchi : direction visuelle tirée du sujet de l'appli, typographie, liste des défauts habituels des interfaces générées à éviter, sobriété des animations, textes clairs, relecture critique du résultat.

### Provenance

- **Source** : dépôt [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design), dossier `plugins/frontend-design`.
- **Version examinée** : commit `30202c767cfaf325212b3921ab484f83adaec850` (26 octobre 2026), le dernier à modifier ce dossier le jour du choix.
- **Licence** : Apache 2.0.
- **Contenu** : des consignes uniquement, sans script, ni hook, ni serveur.
- **Méthode d'installation** : documentation officielle de Claude Code, [Install and manage plugins](https://code.claude.com/docs/en/discover-plugins), section « Choose an install scope ».

### Sa limite

**Il travaille l'esthétique, pas l'ergonomie.** Il ne dit rien du nombre d'éléments à l'écran, de la tenue sans défilement ni de l'ordre de lecture. Sur le téléphone et l'accessibilité, il se contente de quelques mentions générales. Il ne vérifie rien non plus.

L'ergonomie reste donc portée par `docs/interface.md`, par les exigences écrites dans chaque spécification et par la recette. En cas de contradiction, la spécification et le référentiel l'emportent sur le skill. Son goût pour les partis pris marqués ne doit pas prendre le pas sur la lisibilité d'un calculateur.

## Options écartées

- **Copie du skill dans `.claude/skills/frontend-design/`** : version figée et relue en demande de fusion, mais à mettre à jour à la main, et sans lien avec sa source. La documentation officielle présente l'extension comme la voie normale pour installer un composant publié dans un catalogue.
- **Installation pour le seul poste du responsable** : la chaîne de travail ne serait plus décrite par le dépôt.

## Conséquences

- **Installation une fois par poste** : l'entrée commitée active le skill mais ne le télécharge pas. Dans l'application de bureau, passer par **+**, puis **Add plugins**, et choisir le projet. Dans un terminal : `claude plugin install frontend-design@claude-plugins-official --scope project`. Si le poste n'a pas encore enregistré le catalogue officiel, cette commande échoue en disant que le skill est introuvable : lancer d'abord `claude plugin marketplace add anthropics/claude-plugins-official`, qui inscrit le catalogue dans les réglages personnels, hors du dépôt.
- **Mises à jour automatiques** : le catalogue officiel se met à jour de lui-même. Contrairement à Playwright MCP et aux dépendances npm, ce skill n'est donc pas figé à une version, et Dependabot ne le surveille pas. Le risque est limité, puisqu'il ne contient que des consignes et que tests, relecture et recette restent en place.
- **Sessions en ligne** : elles ne chargent pas les extensions activées par le dépôt. Le skill n'y est pas disponible.
- **Dépendance** : il n'entre ni dans `package.json` ni dans l'appli publiée.
