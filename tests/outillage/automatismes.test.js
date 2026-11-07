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
    expect(hook.startsWith('#!/bin/sh\n')).toBe(true);
    expect(hook).not.toContain('\r');
    expect(hook).toMatch(/^\s*npm test \|\| \{/m);
    expect(hook).toMatch(/^\s*exit 1$/m);
    expect(hook).not.toMatch(/npm test\s*(\|\|\s*(true|exit 0)|;)/);
  });

  it('garde des fins de ligne Unix une fois extrait', () => {
    expect(lire('.gitattributes')).toMatch(/^\.githooks\/\* text eol=lf$/m);
  });

  it("est activé par npm install (script prepare), y compris sous Windows", () => {
    const paquet = JSON.parse(lire('package.json'));
    // « exit 0 » fonctionne en sh comme sous cmd.exe, qui ne connaît pas « true ».
    expect(paquet.scripts.prepare).toBe('git config core.hooksPath .githooks || exit 0');
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
    const checkouts = texte.match(/uses:\s*actions\/checkout@/g) ?? [];
    const sansJeton = texte.match(/persist-credentials:\s*false/g) ?? [];
    expect(checkouts.length).toBeGreaterThan(0);
    expect(sansJeton).toHaveLength(checkouts.length);
  });

  it.each(WORKFLOWS)("%s n'utilise aucun déclencheur à privilèges", (chemin) => {
    expect(lire(chemin)).not.toMatch(/pull_request_target|workflow_run/);
  });

  it("l'intégration continue ne demande aucune écriture", () => {
    const ci = lire('.github/workflows/ci.yml');
    expect(ci).not.toMatch(/:\s*write\b|write-all/);
    expect(ci).toMatch(/^\s*contents: read$/m);
  });

  it('la publication ne donne les droits d’écriture qu’au job de déploiement', () => {
    const pub = lire('.github/workflows/publication.yml');
    expect(pub).not.toMatch(/write-all/);
    const debutDeploiement = pub.search(/^\s*deploiement:/m);
    expect(debutDeploiement).toBeGreaterThan(-1);
    const ecritures = [...pub.matchAll(/^\s*([\w-]+):\s*write\b/gm)];
    expect(ecritures.map((m) => m[1]).sort()).toEqual(['id-token', 'pages']);
    for (const m of ecritures) expect(m.index).toBeGreaterThan(debutDeploiement);
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

describe('Fusion soumise à l’accord du responsable', () => {
  it('gh pr merge demande toujours une autorisation, en Bash comme en PowerShell', () => {
    const reglages = JSON.parse(lire('.claude/settings.json'));
    const demander = reglages.permissions.ask;
    for (const terminal of ['Bash', 'PowerShell']) {
      expect(demander).toContain(`${terminal}(gh pr merge)`);
      expect(demander).toContain(`${terminal}(gh pr merge *)`);
    }
    const autoriser = reglages.permissions.allow ?? [];
    expect(autoriser.filter((r) => r.includes('gh pr merge'))).toEqual([]);
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

  it('attend 14 jours avant de proposer une nouvelle version', () => {
    expect(lire('.github/dependabot.yml').match(/cooldown:\s*\n\s*default-days:\s*14\b/g)).toHaveLength(2);
  });
});
