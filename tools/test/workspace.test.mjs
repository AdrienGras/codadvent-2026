import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareWorkspace } from "../lib/workspace.mjs";

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

test("prepareWorkspace refuse d'écraser un dossier déjà commencé", () => {
  const { startersDir, dayDir } = setup();
  mkdirSync(join(dayDir, "python"));
  writeFileSync(join(dayDir, "python", "mon-code.py"), "en cours");
  assert.throws(() => prepareWorkspace({ dayDir, startersDir, lang: "python" }), /existe déjà/);
  assert.equal(readFileSync(join(dayDir, "python", "mon-code.py"), "utf8"), "en cours");
});
