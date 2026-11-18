import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findScriptUrl, extractChallenges, findChallenge, dayDirName } from "../lib/site.mjs";

const fixture = readFileSync(new URL("./fixtures/script.js", import.meta.url), "utf8");

test("findScriptUrl résout le script horodaté en URL absolue", () => {
  const html = '<script src="js/driver.min.js"></script><script src="script-20261101-125608.js"></script>';
  assert.equal(findScriptUrl(html, "https://codadvent.fr/"), "https://codadvent.fr/script-20261101-125608.js");
});

test("findScriptUrl lève si aucun script de consignes", () => {
  assert.throws(() => findScriptUrl("<html></html>", "https://codadvent.fr/"), /script/);
});

test("extractChallenges lit le tableau sans exécuter le reste du script", () => {
  const list = extractChallenges(fixture);
  assert.equal(list.length, 2);
  assert.equal(list[0].day, 0);
  assert.equal(list[0].hasSrcFolder, true);
  assert.equal(list[1].hasSrcFolder, false);
});

test("extractChallenges ne coupe pas sur des crochets présents dans les chaînes", () => {
  const [day0, day1] = extractChallenges(fixture);
  assert.match(day0.htmlContent, /a \}\]; \[b ' " `/);
  assert.equal(day1.htmlContent, "<p>it's [ok]</p>");
});

test("extractChallenges lève si CHALLENGES_DATA est absent", () => {
  assert.throws(() => extractChallenges("const X=[];"), /CHALLENGES_DATA/);
});

test("findChallenge lève pour un jour non publié", () => {
  assert.throws(() => findChallenge(extractChallenges(fixture), 3), /jour 3 non publié/);
});

test("findChallenge renvoie le défi du jour", () => {
  assert.equal(findChallenge(extractChallenges(fixture), 1).title, "Chapitre 1 — Deux");
});

test("dayDirName formate sur deux chiffres", () => {
  assert.equal(dayDirName(7), "day-07");
  assert.equal(dayDirName(24), "day-24");
});
