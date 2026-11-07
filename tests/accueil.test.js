// Premier test : la page d'accueil affiche le titre de l'application.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const TITRE = 'Combien de jours dois-je vendre ?';
const page = readFileSync(new URL('../index.html', import.meta.url), 'utf-8');

describe("Page d'accueil", () => {
  it('affiche le titre principal', () => {
    expect(page).toContain(`<h1>${TITRE}</h1>`);
  });

  it("porte le titre dans l'onglet du navigateur", () => {
    expect(page).toContain(`<title>${TITRE}</title>`);
  });

  it('est déclarée en français', () => {
    expect(page).toContain('<html lang="fr">');
  });
});
