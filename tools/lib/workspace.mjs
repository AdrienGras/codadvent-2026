import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { findUpstreamDir } from "./languages.mjs";

/**
 * Crée `dayDir/<lang>` : projet officiel du zip s'il existe dans ce langage, sinon starter.
 * Ne touche jamais à un dossier existant.
 */
export function prepareWorkspace({ dayDir, startersDir, lang }) {
  const to = join(dayDir, lang);
  if (existsSync(to)) throw new Error(`${to} existe déjà : rien n'a été modifié`);
  const upstream = findUpstreamDir(join(dayDir, "upstream"), lang);
  const from = upstream ?? join(startersDir, lang);
  cpSync(from, to, { recursive: true });
  return { source: upstream ? "upstream" : "starter", from, to };
}
