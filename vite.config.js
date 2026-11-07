// Configuration de Vite (fiche 0003).
// En ligne, l'appli est servie dans le sous-dossier /jours-a-vendre/ de GitHub Pages.
// En local (npm run dev), elle reste à la racine : http://localhost:5173/.
export default ({ command }) => ({
  base: command === 'build' ? '/jours-a-vendre/' : '/',
});
