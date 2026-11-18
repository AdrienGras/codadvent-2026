import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareWorkspace, resolveWorkspaceLanguage, replaceDir } from "../lib/workspace.mjs";

function setup() {
  const root = mkdtempSync(join(tmpdir(), "codadvent-"));
  const startersDir = join(root, "starters");
  const dayDir = join(root, "days", "day-00");
  mkdirSync(join(startersDir, "python", "tests"), { recursive: true });
  writeFileSync(join(startersDir, "python", ".gitignore"), ".venv/\n");
  writeFileSync(join(startersDir, "python", "tests", "test_hello.py"), "starter");
  mkdirSync(join(dayDir, "upstream", "ts", "src"), { recursive: true });
  writeFileSync(join(dayDir, "upstream", "ts", "src", "sock-matcher.ts"), "officiel");
  return { startersDir, dayDir };
}

test("prepareWorkspace copie le projet officiel quand le zip a le langage", () => {
  const { startersDir, dayDir } = setup();
  const res = prepareWorkspace({ dayDir, startersDir, lang: "typescript" });
  assert.equal(res.source, "upstream");
  assert.equal(res.to, join(dayDir, "typescript"));
  assert.equal(readFileSync(join(dayDir, "typescript", "src", "sock-matcher.ts"), "utf8"), "officiel");
});

test("prepareWorkspace part du starter sinon, fichiers cachés compris", () => {
  const { startersDir, dayDir } = setup();
  const res = prepareWorkspace({ dayDir, startersDir, lang: "python" });
  assert.equal(res.source, "starter");
  assert.equal(res.from, join(startersDir, "python"));
  assert.ok(existsSync(join(dayDir, "python", ".gitignore")));
  assert.ok(existsSync(join(dayDir, "python", "tests", "test_hello.py")));
});

test("prepareWorkspace refuse d'écraser un dossier déjà commencé, message en chemin relatif", () => {
  const { startersDir, dayDir } = setup();
  mkdirSync(join(dayDir, "python"));
  writeFileSync(join(dayDir, "python", "mon-code.py"), "en cours");
  assert.throws(
    () => prepareWorkspace({ dayDir, startersDir, lang: "python" }),
    (err) => /day-00\/python existe déjà/.test(err.message) && !err.message.includes(tmpdir()),
  );
  assert.equal(readFileSync(join(dayDir, "python", "mon-code.py"), "utf8"), "en cours");
});

test("resolveWorkspaceLanguage : alias connu → nom canonique", () => {
  const { dayDir } = setup();
  assert.equal(resolveWorkspaceLanguage(dayDir, "TS"), "typescript");
});

test("resolveWorkspaceLanguage : langage présent seulement dans upstream/ → accepté", () => {
  const { startersDir, dayDir } = setup();
  mkdirSync(join(dayDir, "upstream", "go"));
  writeFileSync(join(dayDir, "upstream", "go", "main.go"), "package main");
  const lang = resolveWorkspaceLanguage(dayDir, "go");
  assert.equal(lang, "go");
  const res = prepareWorkspace({ dayDir, startersDir, lang });
  assert.equal(res.source, "upstream");
  assert.ok(existsSync(join(dayDir, "go", "main.go")));
});

test("resolveWorkspaceLanguage : langage inconnu partout → erreur listant les langages", () => {
  const { dayDir } = setup();
  assert.throws(() => resolveWorkspaceLanguage(dayDir, "go"), /typescript/);
});

test("replaceDir remplace le dossier quand le remplissage réussit", () => {
  const { dayDir } = setup();
  const target = join(dayDir, "upstream");
  replaceDir(target, (tmp) => writeFileSync(join(tmp, "nouveau.txt"), "ok"));
  assert.deepEqual(readdirSync(target), ["nouveau.txt"]);
  assert.deepEqual(readdirSync(dayDir).sort(), ["upstream"]);
});

test("replaceDir laisse l'ancien dossier intact si le remplissage échoue", () => {
  const { dayDir } = setup();
  const target = join(dayDir, "upstream");
  assert.throws(() => replaceDir(target, () => { throw new Error("unzip a échoué"); }), /unzip a échoué/);
  assert.equal(readFileSync(join(target, "ts", "src", "sock-matcher.ts"), "utf8"), "officiel");
  assert.deepEqual(readdirSync(dayDir).sort(), ["upstream"]);
});
