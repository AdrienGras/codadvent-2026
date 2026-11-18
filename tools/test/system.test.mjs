import { test } from "node:test";
import assert from "node:assert/strict";
import { assertCommands } from "../lib/system.mjs";

test("assertCommands passe quand tous les outils sont présents", () => {
  assert.doesNotThrow(() => assertCommands(["pandoc", "unzip"], () => true));
});

test("assertCommands liste tous les outils manquants", () => {
  assert.throws(() => assertCommands(["pandoc", "unzip", "git"], (name) => name === "git"), /pandoc, unzip/);
});

test("assertCommands détecte réellement un outil absent", () => {
  assert.throws(() => assertCommands(["outil-qui-n-existe-pas-42"]), /outil-qui-n-existe-pas-42/);
  assert.doesNotThrow(() => assertCommands(["node"]));
});
