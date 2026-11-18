#!/usr/bin/env node
// Usage :
//   node tools/codadvent.mjs pull <jour>             récupère la consigne et les sources du jour
//   node tools/codadvent.mjs start <jour> <langage>  prépare days/day-XX/<langage>/
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dayDirName, extractChallenges, findChallenge, findScriptUrl, parseDay } from "./lib/site.mjs";
import { extractSnippets, snippetFileName } from "./lib/snippets.mjs";
import { LANGUAGES } from "./lib/languages.mjs";
import { prepareWorkspace, replaceDir, resolveWorkspaceLanguage } from "./lib/workspace.mjs";
import { fetchOk } from "./lib/http.mjs";
import { assertCommands } from "./lib/system.mjs";

const BASE_URL = "https://codadvent.fr/";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STARTERS = join(ROOT, "starters");
const rel = (p) => relative(process.cwd(), p) || ".";

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...options });
  if (res.error) throw new Error(`${cmd} introuvable : installe-le (${res.error.message})`);
  if (res.status !== 0) throw new Error(`${cmd} a échoué : ${res.stderr}`);
  return res.stdout;
}

async function pull(day) {
  assertCommands(["pandoc", "unzip"]);
  const html = await (await fetchOk(BASE_URL)).text();
  const js = await (await fetchOk(findScriptUrl(html, BASE_URL))).text();
  const challenge = findChallenge(extractChallenges(js), day);
  const dayDir = join(ROOT, "days", dayDirName(day));
  mkdirSync(dayDir, { recursive: true });

  const markdown = run("pandoc", ["-f", "html", "-t", "gfm-raw_html", "--wrap=none"], { input: challenge.htmlContent });
  writeFileSync(
    join(dayDir, "CONSIGNE.md"),
    `# ${challenge.title}\n\n> Source : ${BASE_URL}?day=${day}\n\n${markdown}`,
  );
  console.log(`✓ ${rel(join(dayDir, "CONSIGNE.md"))} — ${challenge.title}`);

  const snippetsDir = join(dayDir, "snippets");
  rmSync(snippetsDir, { recursive: true, force: true });
  const snippets = extractSnippets(challenge.htmlContent);
  if (snippets.length) {
    mkdirSync(snippetsDir);
    snippets.forEach((s, i) => writeFileSync(join(snippetsDir, snippetFileName(i + 1, s.lang)), `${s.code}\n`));
    console.log(`✓ ${snippets.length} squelette(s) dans ${rel(snippetsDir)}`);
  }

  if (!challenge.hasSrcFolder) {
    console.log("· pas de sources officielles pour ce jour");
    return;
  }
  const zipUrl = new URL(`challenges/${dayDirName(day)}/src.zip`, BASE_URL).href;
  const zipPath = join(dayDir, "src.zip");
  writeFileSync(zipPath, Buffer.from(await (await fetchOk(zipUrl)).arrayBuffer()));
  const upstreamDir = join(dayDir, "upstream");
  try {
    replaceDir(upstreamDir, (tmp) => run("unzip", ["-q", "-o", zipPath, "-d", tmp]));
  } finally {
    rmSync(zipPath, { force: true });
  }
  const langs = readdirSync(upstreamDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  console.log(`✓ sources officielles dans ${rel(upstreamDir)} : ${langs.join(", ")}`);
}

function start(day, langArg) {
  const dayDir = join(ROOT, "days", dayDirName(day));
  if (!existsSync(join(dayDir, "CONSIGNE.md"))) throw new Error(`consigne du jour ${day} absente : lance d'abord « pull ${day} »`);
  const lang = resolveWorkspaceLanguage(dayDir, langArg);
  const { source, from, to } = prepareWorkspace({ dayDir, startersDir: STARTERS, lang });
  console.log(`✓ ${rel(to)} créé depuis ${rel(from)}`);
  if (source === "upstream") {
    console.log("· projet officiel : garde son outillage, lis son README/pom/package.json pour lancer les tests");
  } else {
    console.log(`· tests : cd ${rel(to)} && ${LANGUAGES[lang].testCmd}`);
    if (existsSync(join(dayDir, "snippets"))) {
      console.log(`· à fusionner : squelettes de ${rel(join(dayDir, "snippets"))} → remplacer le HelloWorld (namespace codadvent)`);
    }
  }
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "pull" && args.length === 1) await pull(parseDay(args[0]));
  else if (command === "start" && args.length === 2) start(parseDay(args[0]), args[1]);
  else {
    console.error("usage : node tools/codadvent.mjs pull <jour> | start <jour> <langage>");
    console.error(`langages : ${Object.keys(LANGUAGES).join(", ")}`);
    process.exit(2);
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
