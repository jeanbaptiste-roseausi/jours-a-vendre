// Verrou du sous-agent recetteur (hook PreToolUse déclaré dans .claude/agents/recetteur.md).
//
// Le recetteur ne modifie aucun fichier du projet. Seul le serveur Playwright écrit,
// et seulement dans recettes/ (option --output-dir). Or Playwright MCP enregistre un
// fichier nommé explicitement à la racine du projet, pas dans recettes/ : on refuse
// donc tout nom de fichier explicite et on laisse le serveur nommer les captures.
//
// Règles :
// - lectures (Read, Grep, Glob) : autorisées ;
// - rendu du rapport à la session principale (SubagentHandback, nom exact) : autorisé.
//   Sans lui, le recetteur ne peut pas rendre son rapport et la recette se perd ;
// - outils Playwright : autorisés, sauf ceux de la liste OUTILS_INTERDITS
//   et sauf s'ils reçoivent un nom de fichier ;
// - tout autre outil : bloqué.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LECTURES = new Set(['Read', 'Grep', 'Glob']);
const RAPPORT = 'SubagentHandback';
const PREFIXE_PLAYWRIGHT = 'mcp__playwright__';

// Outils qui lisent un fichier du disque, exécutent du code hors de la page
// ou écrivent des fichiers ailleurs que pour une capture.
export const OUTILS_INTERDITS = [
  'browser_file_upload',
  'browser_run_code_unsafe',
  'browser_storage_state',
  'browser_set_storage_state',
  'browser_start_tracing',
  'browser_stop_tracing',
  'browser_start_video',
  'browser_stop_video',
  'browser_start_recording',
  'browser_stop_recording',
].map((nom) => PREFIXE_PLAYWRIGHT + nom);

const autoriser = () => ({ autorise: true });
const bloquer = (raison) => ({ autorise: false, raison });

/**
 * Décide si l'appel d'outil décrit par l'entrée du hook est autorisé.
 * @param {{ tool_name?: string, tool_input?: Record<string, unknown> }} entree
 * @returns {{ autorise: boolean, raison?: string }}
 */
export function decider(entree) {
  const outil = entree?.tool_name ?? '';
  const parametres = entree?.tool_input ?? {};

  if (LECTURES.has(outil)) return autoriser();
  if (outil === RAPPORT) return autoriser();

  if (outil.startsWith(PREFIXE_PLAYWRIGHT)) {
    if (OUTILS_INTERDITS.includes(outil)) {
      return bloquer(`Outil refusé pour le recetteur : ${outil}.`);
    }
    if (parametres.filename !== undefined && parametres.filename !== '') {
      return bloquer(
        'Nom de fichier refusé : ne donne pas de nom, le serveur range lui-même la capture dans recettes/.',
      );
    }
    return autoriser();
  }

  return bloquer(`Outil refusé pour le recetteur : ${outil || '(inconnu)'}.`);
}

// Exécution en tant que hook : lit l'entrée JSON sur l'entrée standard.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let decision;
  try {
    decision = decider(JSON.parse(readFileSync(0, 'utf-8')));
  } catch {
    decision = bloquer('Entrée du verrou illisible : appel bloqué par prudence.');
  }
  if (!decision.autorise) {
    process.stderr.write(`${decision.raison}\n`);
    process.exit(2);
  }
  process.exit(0);
}
