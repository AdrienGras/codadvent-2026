import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { findLanguage, findUpstreamDir, resolveLanguage } from "./languages.mjs";

/**
 * Langage de travail : nom canonique d'un starter, ou à défaut un langage
 * fourni uniquement par les sources officielles du jour (ex. `go`).
 */
export function resolveWorkspaceLanguage(dayDir, input) {
  const known = findLanguage(input);
  if (known) return known;
  const lang = String(input).toLowerCase();
  if (findUpstreamDir(join(dayDir, "upstream"), lang)) return lang;
  return resolveLanguage(input); // lève avec la liste des langages valides
}

/**
 * Crée `dayDir/<lang>` : projet officiel du zip s'il existe dans ce langage, sinon starter.
 * Ne touche jamais à un dossier existant.
 */
export function prepareWorkspace({ dayDir, startersDir, lang }) {
  const to = join(dayDir, lang);
  if (existsSync(to)) throw new Error(`${basename(dayDir)}/${lang} existe déjà : rien n'a été modifié`);
  const upstream = findUpstreamDir(join(dayDir, "upstream"), lang);
  const from = upstream ?? join(startersDir, lang);
  cpSync(from, to, { recursive: true });
  return { source: upstream ? "upstream" : "starter", from, to };
}

/**
 * Remplit un dossier temporaire puis le substitue à `target`.
 * Si `fill` échoue, `target` reste tel quel.
 */
export function replaceDir(target, fill) {
  const tmp = `${target}.tmp-${process.pid}`;
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  try {
    fill(tmp);
  } catch (err) {
    rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
  rmSync(target, { recursive: true, force: true });
  renameSync(tmp, target);
}
