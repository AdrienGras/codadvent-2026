import vm from "node:vm";

/** URL absolue du script qui embarque les consignes (son nom change à chaque publication). */
export function findScriptUrl(html, baseUrl) {
  const match = html.match(/src="([^"]*script-[^"]*\.js)"/);
  if (!match) throw new Error("script des consignes introuvable dans index.html");
  return new URL(match[1], baseUrl).href;
}

/**
 * Isole le littéral `CHALLENGES_DATA=[...]` en respectant les chaînes JS,
 * puis l'évalue seul dans un contexte vide : le reste du script n'est jamais exécuté.
 */
export function extractChallenges(js) {
  const marker = js.indexOf("CHALLENGES_DATA=");
  if (marker === -1) throw new Error("CHALLENGES_DATA introuvable dans le script");
  const start = js.indexOf("[", marker);
  const end = findClosingBracket(js, start);
  const literal = js.slice(start, end + 1);
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
}

function findClosingBracket(src, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return i;
  }
  throw new Error("fin du tableau CHALLENGES_DATA introuvable");
}

export function findChallenge(list, day) {
  const challenge = list.find((c) => c.day === day);
  if (!challenge) throw new Error(`jour ${day} non publié pour l'instant`);
  return challenge;
}

export function dayDirName(day) {
  return `day-${String(day).padStart(2, "0")}`;
}
