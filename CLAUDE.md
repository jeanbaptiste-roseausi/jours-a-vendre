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

## Commandes

- `npm install` : installer les outils
- `npm run dev` : lancer la page en local (http://localhost:5173)
- `npm test` : lancer les tests
- `npm run build` : construire la version publiable dans `dist/`

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
