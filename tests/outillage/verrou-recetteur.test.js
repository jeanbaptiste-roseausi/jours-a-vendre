// Preuve du verrou du recetteur : il pilote le navigateur sans écrire dans le projet.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decider } from '../../.claude/hooks/verrou-recetteur.mjs';

const SCRIPT = fileURLToPath(new URL('../../.claude/hooks/verrou-recetteur.mjs', import.meta.url));
const pw = (nom, parametres = {}) => ({ tool_name: `mcp__playwright__${nom}`, tool_input: parametres });
// Outil par lequel un sous-agent rend son rapport. Sans lui, la recette se perd.
const RAPPORT = { tool_name: 'SubagentHandback', tool_input: { message: 'Verdict : aucun écart.' } };

describe('Verrou du recetteur : ce qui passe', () => {
  it.each([
    ['ouvrir une page', pw('browser_navigate', { url: 'http://localhost:5173' })],
    ['remplir un champ', pw('browser_type', { element: 'TJM', ref: 'e3', text: '500' })],
    ['lire la page', pw('browser_snapshot')],
    ['capture nommée par le serveur', pw('browser_take_screenshot')],
    ['lire la spécification', { tool_name: 'Read', tool_input: { file_path: 'specs/001-calcul.md' } }],
    ['rendre son rapport à la session principale', RAPPORT],
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
    ['message à un autre agent', { tool_name: 'SendMessage', tool_input: { to: 'main', message: 'x' } }],
    ['lancement d’un autre agent', { tool_name: 'Agent', tool_input: { prompt: 'x' } }],
    ['nom proche de l’outil de rapport', { tool_name: 'SubagentHandbackX', tool_input: {} }],
    ['outil de rapport d’un serveur tiers', { tool_name: 'mcp__autre__SubagentHandback', tool_input: {} }],
    ['outil de rapport en casse différente', { tool_name: 'subagenthandback', tool_input: {} }],
    ['outil de rapport suivi d’une espace', { tool_name: 'SubagentHandback ', tool_input: {} }],
    ['outil de rapport tronqué', { tool_name: 'SubagentHand', tool_input: {} }],
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

  it('laisse passer le rendu du rapport avec le code 0', () => {
    expect(lancer(RAPPORT).status).toBe(0);
  });

  it('bloque un nom voisin de l’outil de rapport avec le code 2', () => {
    expect(lancer({ tool_name: 'SubagentHandbackX', tool_input: {} }).status).toBe(2);
  });
});
