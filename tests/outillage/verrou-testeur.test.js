// Preuve du verrou du testeur : ce qui doit passer passe, ce qui doit être bloqué l'est.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decider } from '../../.claude/hooks/verrou-testeur.mjs';

const SCRIPT = fileURLToPath(new URL('../../.claude/hooks/verrou-testeur.mjs', import.meta.url));

const ecrire = (chemin) => ({ tool_name: 'Write', tool_input: { file_path: chemin, content: 'x' } });
const terminal = (outil, commande) => ({ tool_name: outil, tool_input: { command: commande } });

describe('Verrou du testeur : ce qui passe', () => {
  it.each([
    ['écriture dans tests/', ecrire('tests/calcul.test.js')],
    ['écriture dans un sous-dossier de tests/', ecrire('tests/outillage/nouveau.test.js')],
    ['modification dans tests/', { tool_name: 'Edit', tool_input: { file_path: 'tests/accueil.test.js' } }],
    ['lecture de specs/', { tool_name: 'Read', tool_input: { file_path: 'specs/README.md' } }],
    ['recherche dans le code', { tool_name: 'Grep', tool_input: { pattern: 'x', path: 'src' } }],
    ['npm test par Bash', terminal('Bash', 'npm test')],
    ['npm test par PowerShell', terminal('PowerShell', 'npm test')],
    ['npm test avec un fichier ciblé', terminal('Bash', 'npm test -- tests/accueil.test.js')],
  ])('%s', (_cas, entree) => {
    expect(decider(entree).autorise).toBe(true);
  });
});

describe('Verrou du testeur : ce qui est bloqué', () => {
  it.each([
    ['écriture dans src/', ecrire('src/main.js')],
    ['sortie de tests/ par ..', ecrire('tests/../src/x.js')],
    ['écriture de index.html', ecrire('index.html')],
    ['écriture du dossier tests lui-même', ecrire('tests')],
    ['dossier voisin au nom proche', ecrire('tests-bis/x.js')],
    ['modification dans src/', { tool_name: 'Edit', tool_input: { file_path: 'src/style.css' } }],
    ['rm -rf src par Bash', terminal('Bash', 'rm -rf src')],
    ['rm -rf src par PowerShell', terminal('PowerShell', 'rm -rf src')],
    ['npm test enchaîné par Bash', terminal('Bash', 'npm test; rm x')],
    ['npm test enchaîné par PowerShell', terminal('PowerShell', 'npm test; rm x')],
    ['Remove-Item par Bash', terminal('Bash', 'Remove-Item src')],
    ['Remove-Item par PowerShell', terminal('PowerShell', 'Remove-Item src -Recurse')],
    ['redirection vers un fichier', terminal('PowerShell', 'npm test -- > src/x.js')],
    ['variable PowerShell', terminal('PowerShell', 'npm test -- $env:X')],
    ['autre commande npm', terminal('Bash', 'npm install malveillant')],
    ['outil non prévu', { tool_name: 'WebFetch', tool_input: { url: 'https://exemple.fr' } }],
  ])('%s', (_cas, entree) => {
    const decision = decider(entree);
    expect(decision.autorise).toBe(false);
    expect(decision.raison).toBeTruthy();
  });
});

describe('Verrou du testeur : comportement réel du script', () => {
  const lancer = (entree) =>
    spawnSync(process.execPath, [SCRIPT], { input: JSON.stringify(entree), encoding: 'utf-8' });

  it('bloque une écriture dans src/ avec le code 2 et un message', () => {
    const resultat = lancer(ecrire('src/main.js'));
    expect(resultat.status).toBe(2);
    expect(resultat.stderr).toContain("n'écrit que dans tests/");
  });

  it('laisse passer une écriture dans tests/ avec le code 0', () => {
    expect(lancer(ecrire('tests/calcul.test.js')).status).toBe(0);
  });

  it('bloque une entrée illisible', () => {
    const resultat = spawnSync(process.execPath, [SCRIPT], { input: 'pas du JSON', encoding: 'utf-8' });
    expect(resultat.status).toBe(2);
  });
});
