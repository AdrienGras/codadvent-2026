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

test("extractChallenges refuse tout ce qui n'est pas une donnée littérale", () => {
  globalThis.__pwned = false;
  const evil = 'const CHALLENGES_DATA=[{day:0,title:this.constructor.constructor("globalThis.__pwned=true")()}];';
  assert.throws(() => extractChallenges(evil), /inattendu/);
  assert.equal(globalThis.__pwned, false);
});

test("extractChallenges gère échappements, nombres et booléens", () => {
  const js = 'const CHALLENGES_DATA=[{day:12,"title":"a\\"b\\u00e9\\n",ok:true,ko:!1,n:null,s:`x`,}];';
  assert.deepEqual(extractChallenges(js), [{ day: 12, title: 'a"bé\n', ok: true, ko: false, n: null, s: "x" }]);
});

test("extractChallenges signale un format inconnu au lieu de lire un autre tableau", () => {
  assert.throws(() => extractChallenges("const CHALLENGES_DATA=window.D;var x=[1,2];"), /format de CHALLENGES_DATA non reconnu/);
  assert.throws(() => extractChallenges("const CHALLENGES_DATA=window.D;"), /format de CHALLENGES_DATA non reconnu/);
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
