// Conformité des automatismes (fiche 0003) : hook avant commit, intégration continue,
// porte de fusion, mise en ligne et Dependabot. Les fichiers sont lus comme du texte.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RACINE = fileURLToPath(new URL('../../', import.meta.url));
const lire = (chemin) => readFileSync(RACINE + chemin, 'utf-8');
const WORKFLOWS = ['.github/workflows/ci.yml', '.github/workflows/publication.yml'];

describe('Hook avant commit', () => {
  it('existe et lance npm test', () => {
    expect(existsSync(RACINE + '.githooks/pre-commit')).toBe(true);
    const hook = lire('.githooks/pre-commit');
    expect(hook.startsWith('#!/bin/sh')).toBe(true);
    expect(hook).toMatch(/^\s*npm test\b/m);
  });

  it("est activé par npm install (script prepare)", () => {
    const paquet = JSON.parse(lire('package.json'));
    expect(paquet.scripts.prepare).toContain('git config core.hooksPath .githooks');
  });

  it("n'ajoute aucune dépendance", () => {
    const paquet = JSON.parse(lire('package.json'));
    expect(paquet.dependencies).toBeUndefined();
    expect(Object.keys(paquet.devDependencies).sort()).toEqual(['vite', 'vitest']);
  });
});

describe('Version de Node', () => {
  it('.nvmrc fixe la version majeure 26', () => {
    expect(lire('.nvmrc').trim()).toBe('26');
  });
});

describe('Workflows', () => {
  it.each(WORKFLOWS)('%s existe', (chemin) => {
    expect(existsSync(RACINE + chemin)).toBe(true);
  });

  it.each(WORKFLOWS)('%s fige chaque action sur une empreinte complète', (chemin) => {
    const usages = [...lire(chemin).matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
    expect(usages.length).toBeGreaterThan(0);
    for (const usage of usages) expect(usage).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
  });

  it.each(WORKFLOWS)('%s retire toute permission par défaut', (chemin) => {
    expect(lire(chemin)).toMatch(/^permissions:\s*\{\}\s*$/m);
  });

  it.each(WORKFLOWS)("%s prend la version de Node dans .nvmrc et ne garde pas l'accès git", (chemin) => {
    const texte = lire(chemin);
    expect(texte).toContain('node-version-file: .nvmrc');
    expect(texte).toContain('persist-credentials: false');
  });

  it("l'intégration continue tourne sur les demandes de fusion et sur main", () => {
    const ci = lire('.github/workflows/ci.yml');
    expect(ci).toMatch(/^\s*pull_request:/m);
    expect(ci).toMatch(/^\s*push:\s*\n\s*branches:\s*\[\s*main\s*\]/m);
    expect(ci).toMatch(/^\s*verifications:/m);
    for (const commande of ['npm ci', 'npm test', 'npm run build']) expect(ci).toContain(`run: ${commande}`);
  });

  it('la publication ne tourne que sur main et teste avant de construire', () => {
    const pub = lire('.github/workflows/publication.yml');
    expect(pub).toMatch(/^\s*push:\s*\n\s*branches:\s*\[\s*main\s*\]/m);
    expect(pub).not.toMatch(/pull_request/);
    const test = pub.indexOf('run: npm test');
    const build = pub.indexOf('run: npm run build');
    expect(test).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(test);
    expect(pub).toContain('pages: write');
    expect(pub).toContain('id-token: write');
  });
});

describe('Adresse en ligne', () => {
  it('la construction vise /jours-a-vendre/ et le serveur local reste à la racine', async () => {
    const { default: config } = await import('../../vite.config.js');
    expect(config({ command: 'build', mode: 'production' }).base).toBe('/jours-a-vendre/');
    expect(config({ command: 'serve', mode: 'development' }).base).toBe('/');
  });
});

describe('Porte de fusion', () => {
  const regle = () => JSON.parse(lire('.github/regles/main.json'));
  const trouver = (type) => regle().rules.find((r) => r.type === type);

  it('est active sur main, sans aucune exception', () => {
    expect(regle().enforcement).toBe('active');
    expect(regle().conditions.ref_name.include).toEqual(['~DEFAULT_BRANCH']);
    expect(regle().bypass_actors).toEqual([]);
  });

  it('impose une demande de fusion et la vérification venue de GitHub Actions', () => {
    expect(trouver('pull_request')).toBeDefined();
    const checks = trouver('required_status_checks').parameters.required_status_checks;
    expect(checks).toEqual([{ context: 'verifications', integration_id: 15368 }]);
  });

  it("interdit la réécriture de l'historique et la suppression", () => {
    expect(trouver('non_fast_forward')).toBeDefined();
    expect(trouver('deletion')).toBeDefined();
  });
});

describe('Dependabot', () => {
  it('surveille npm et les actions GitHub chaque semaine', () => {
    const texte = lire('.github/dependabot.yml');
    for (const ecosysteme of ['npm', 'github-actions']) {
      expect(texte).toMatch(new RegExp(`package-ecosystem:\\s*"?${ecosysteme}"?`));
    }
    expect(texte.match(/interval:\s*"?weekly"?/g)).toHaveLength(2);
  });
});
