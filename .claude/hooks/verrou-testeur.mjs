// Verrou du sous-agent testeur (hook PreToolUse déclaré dans .claude/agents/testeur.md).
//
// Règles :
// - lectures (Read, Grep, Glob) : autorisées ;
// - rendu du rapport à la session principale (SubagentHandback, nom exact) : autorisé.
//   Sans lui, le testeur ne peut pas rendre son rapport et il se perd ;
// - écritures (Write, Edit, NotebookEdit) : autorisées seulement dans tests/ ;
// - terminal (Bash, PowerShell) : seule la commande « npm test » est autorisée,
//   éventuellement suivie de « -- <arguments> » simples ;
// - tout autre outil : bloqué.
//
// En cas de blocage, le script écrit la raison sur la sortie d'erreur et se termine
// avec le code 2, ce qui empêche Claude Code d'exécuter l'outil.
// Limite connue : voir decisions/0002-chaine-agents.md.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSSIER_TESTS = path.join(RACINE, 'tests');

const LECTURES = new Set(['Read', 'Grep', 'Glob']);
const RAPPORT = 'SubagentHandback';
const ECRITURES = new Set(['Write', 'Edit', 'NotebookEdit']);
const TERMINAUX = new Set(['Bash', 'PowerShell']);

// « npm test », éventuellement suivi de « -- » et d'arguments faits de caractères simples.
const COMMANDE_AUTORISEE = /^npm test(?: -- [A-Za-z0-9_.\/\\:=, -]+)?$/;

const autoriser = () => ({ autorise: true });
const bloquer = (raison) => ({ autorise: false, raison });

// Vrai si le chemin désigne tests/ ou un fichier sous tests/.
function estDansTests(chemin) {
  const cible = path.resolve(RACINE, chemin).toLowerCase();
  const tests = DOSSIER_TESTS.toLowerCase();
  const relatif = path.relative(tests, cible);
  return relatif !== '' && !relatif.startsWith('..') && !path.isAbsolute(relatif);
}

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

  if (ECRITURES.has(outil)) {
    const chemin = parametres.file_path ?? parametres.notebook_path;
    if (typeof chemin !== 'string' || chemin === '') {
      return bloquer(`Écriture refusée : chemin absent pour ${outil}.`);
    }
    if (estDansTests(chemin)) return autoriser();
    return bloquer(`Écriture refusée : le testeur n'écrit que dans tests/ (demandé : ${chemin}).`);
  }

  if (TERMINAUX.has(outil)) {
    const commande = typeof parametres.command === 'string' ? parametres.command.trim() : '';
    if (COMMANDE_AUTORISEE.test(commande)) return autoriser();
    return bloquer(`Commande refusée : le testeur ne peut lancer que « npm test » (demandé : ${commande}).`);
  }

  return bloquer(`Outil refusé pour le testeur : ${outil || '(inconnu)'}.`);
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
