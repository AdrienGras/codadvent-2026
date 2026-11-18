import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LANGUAGES, resolveLanguage, findUpstreamDir } from "../lib/languages.mjs";

test("LANGUAGES couvre les dix starters", () => {
  assert.deepEqual(
    Object.keys(LANGUAGES).sort(),
    ["c", "cobol", "csharp", "java", "kotlin", "php", "python", "rust", "scala", "typescript"],
  );
});

test("resolveLanguage accepte les alias, sans tenir compte de la casse", () => {
  assert.equal(resolveLanguage("TS"), "typescript");
  assert.equal(resolveLanguage("c#"), "csharp");
  assert.equal(resolveLanguage("py"), "python");
  assert.equal(resolveLanguage("Java"), "java");
});

test("resolveLanguage lève en listant les langages valides", () => {
  assert.throws(() => resolveLanguage("brainfuck"), /typescript/);
});

test("findUpstreamDir retrouve le dossier officiel via ses alias", () => {
  const dir = mkdtempSync(join(tmpdir(), "upstream-"));
  mkdirSync(join(dir, "c#"));
  mkdirSync(join(dir, "ts"));
  writeFileSync(join(dir, "java"), "un fichier, pas un dossier");
  assert.equal(findUpstreamDir(dir, "csharp"), join(dir, "c#"));
  assert.equal(findUpstreamDir(dir, "typescript"), join(dir, "ts"));
  assert.equal(findUpstreamDir(dir, "java"), null);
  assert.equal(findUpstreamDir(dir, "rust"), null);
});

test("findUpstreamDir accepte un langage hors starters (nom de dossier exact)", () => {
  const dir = mkdtempSync(join(tmpdir(), "upstream-"));
  mkdirSync(join(dir, "Go"));
  assert.equal(findUpstreamDir(dir, "go"), join(dir, "Go"));
  assert.equal(findUpstreamDir(dir, "sql"), null);
});

test("findUpstreamDir renvoie null sans dossier upstream", () => {
  assert.equal(findUpstreamDir(join(tmpdir(), "absent-xyz-404"), "java"), null);
});
