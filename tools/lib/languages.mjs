import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Langages des starters (clé = dossier dans starters/).
 * `aliases` sert à lire l'argument de la CLI et à reconnaître les dossiers des zips officiels (`c#`, `ts`...).
 * `testCmd` reprend le tableau du README des starters.
 */
export const LANGUAGES = {
  c: { aliases: ["c"], ext: "c", testCmd: "make test" },
  cobol: { aliases: ["cobol", "cbl"], ext: "cbl", testCmd: "make test" },
  csharp: { aliases: ["csharp", "c#", "cs", "dotnet"], ext: "cs", testCmd: "dotnet test" },
  java: { aliases: ["java"], ext: "java", testCmd: "mvn test" },
  php: { aliases: ["php"], ext: "php", testCmd: "composer install && composer test" },
  typescript: { aliases: ["typescript", "ts"], ext: "ts", testCmd: "npm install && npm test" },
  python: {
    aliases: ["python", "py"],
    ext: "py",
    testCmd: 'python3 -m venv .venv && .venv/bin/pip install -e ".[test]" && .venv/bin/pytest',
  },
  scala: { aliases: ["scala"], ext: "scala", testCmd: "sbt test" },
  kotlin: { aliases: ["kotlin", "kt"], ext: "kt", testCmd: "mvn test" },
  rust: { aliases: ["rust", "rs"], ext: "rs", testCmd: "cargo test" },
};

/** Nom canonique d'un langage, ou null s'il est inconnu. */
export function findLanguage(input) {
  const needle = String(input).toLowerCase();
  return Object.keys(LANGUAGES).find((key) => LANGUAGES[key].aliases.includes(needle)) ?? null;
}

export function resolveLanguage(input) {
  const lang = findLanguage(input);
  if (!lang) {
    throw new Error(`langage inconnu « ${input} ». Langages valides : ${Object.keys(LANGUAGES).join(", ")}`);
  }
  return lang;
}

/** Dossier du zip officiel correspondant au langage (connu des starters ou non), ou null. */
export function findUpstreamDir(upstreamDir, lang) {
  if (!existsSync(upstreamDir)) return null;
  const names = LANGUAGES[lang]?.aliases ?? [lang.toLowerCase()];
  const entry = readdirSync(upstreamDir, { withFileTypes: true }).find(
    (e) => e.isDirectory() && names.includes(e.name.toLowerCase()),
  );
  return entry ? join(upstreamDir, entry.name) : null;
}
