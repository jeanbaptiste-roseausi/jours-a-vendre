// Preuve du verrou du recetteur : il pilote le navigateur sans écrire dans le projet.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decider } from '../../.claude/hooks/verrou-recetteur.mjs';

const SCRIPT = fileURLToPath(new URL('../../.claude/hooks/verrou-recetteur.mjs', import.meta.url));
const pw = (nom, parametres = {}) => ({ tool_name: `mcp__playwright__${nom}`, tool_input: parametres });

describe('Verrou du recetteur : ce qui passe', () => {
  it.each([
    ['ouvrir une page', pw('browser_navigate', { url: 'http://localhost:5173' })],
    ['remplir un champ', pw('browser_type', { element: 'TJM', ref: 'e3', text: '500' })],
    ['lire la page', pw('browser_snapshot')],
    ['capture nommée par le serveur', pw('browser_take_screenshot')],
    ['lire la spécification', { tool_name: 'Read', tool_input: { file_path: 'specs/001-calcul.md' } }],
  ])('%s', (_cas, entree) => {
    expect(decider(entree).autorise).toBe(true);
  });
});

describe('Verrou du recetteur : ce qui est bloqué', () => {
  it.each([
    ['envoi d’un fichier du disque', pw('browser_file_upload', { paths: ['C:/Users/x/secret.txt'] })],
    ['code exécuté hors de la page', pw('browser_run_code_unsafe', { code: 'x' })],
    ['capture nommée (écrite à la racine du projet)', pw('browser_take_screenshot', { filename: 'capture.png' })],
    ['capture vers src/', pw('browser_take_screenshot', { filename: '../src/x.png' })],
    ['instantané enregistré dans un fichier', pw('browser_snapshot', { filename: 'page.md' })],
    ['écriture de fichier', { tool_name: 'Write', tool_input: { file_path: 'recettes/x.md' } }],
    ['modification de fichier', { tool_name: 'Edit', tool_input: { file_path: 'src/main.js' } }],
    ['commande Bash', { tool_name: 'Bash', tool_input: { command: 'ls' } }],
    ['commande PowerShell', { tool_name: 'PowerShell', tool_input: { command: 'ls' } }],
  ])('%s', (_cas, entree) => {
    expect(decider(entree).autorise).toBe(false);
  });
});

describe('Verrou du recetteur : comportement réel du script', () => {
  const lancer = (entree) =>
    spawnSync(process.execPath, [SCRIPT], { input: JSON.stringify(entree), encoding: 'utf-8' });

  it("bloque l'envoi de fichier avec le code 2", () => {
    expect(lancer(pw('browser_file_upload', { paths: ['x'] })).status).toBe(2);
  });

  it('laisse passer une capture sans nom avec le code 0', () => {
    expect(lancer(pw('browser_take_screenshot')).status).toBe(0);
  });
});
