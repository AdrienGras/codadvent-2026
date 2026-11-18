/** URL absolue du script qui embarque les consignes (son nom change à chaque publication). */
export function findScriptUrl(html, baseUrl) {
  const match = html.match(/src="([^"]*script-[^"]*\.js)"/);
  if (!match) throw new Error("script des consignes introuvable dans index.html");
  return new URL(match[1], baseUrl).href;
}

/**
 * Lit le littéral `CHALLENGES_DATA=[...]` du script du site comme une donnée.
 * Rien n'est exécuté : seuls tableaux, objets, chaînes, nombres, booléens (`!0`/`!1`) et null sont acceptés.
 */
export function extractChallenges(js) {
  const marker = js.indexOf("CHALLENGES_DATA=");
  if (marker === -1) throw new Error("CHALLENGES_DATA introuvable dans le script");
  const start = marker + "CHALLENGES_DATA=".length;
  if (!/^\s*\[/.test(js.slice(start))) {
    throw new Error("format de CHALLENGES_DATA non reconnu (le site a changé ?)");
  }
  return new LiteralParser(js, start).value();
}

const ESCAPES = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", 0: "\0" };

class LiteralParser {
  constructor(src, pos) {
    this.src = src;
    this.pos = pos;
  }

  fail(what = "caractère") {
    throw new Error(`${what} inattendu à la position ${this.pos} : « ${this.src.slice(this.pos, this.pos + 20)} »`);
  }

  skipSpaces() {
    while (/\s/.test(this.src[this.pos] ?? "")) this.pos++;
  }

  eat(char) {
    this.skipSpaces();
    if (this.src[this.pos] !== char) return false;
    this.pos++;
    return true;
  }

  value() {
    this.skipSpaces();
    const c = this.src[this.pos];
    if (c === "[") return this.array();
    if (c === "{") return this.object();
    if (c === '"' || c === "'" || c === "`") return this.string();
    if (c === "!" && /^![01]/.test(this.src.slice(this.pos, this.pos + 2))) {
      this.pos += 2;
      return this.src[this.pos - 1] === "0";
    }
    const number = this.src.slice(this.pos).match(/^-?\d+(\.\d+)?/);
    if (number) {
      this.pos += number[0].length;
      return Number(number[0]);
    }
    for (const [word, val] of [["true", true], ["false", false], ["null", null]]) {
      if (this.src.startsWith(word, this.pos)) {
        this.pos += word.length;
        return val;
      }
    }
    return this.fail("élément");
  }

  array() {
    this.pos++;
    const items = [];
    while (!this.eat("]")) {
      items.push(this.value());
      if (!this.eat(",") && !this.eat("]")) this.fail();
      else if (this.src[this.pos - 1] === "]") break;
    }
    return items;
  }

  object() {
    this.pos++;
    const obj = {};
    while (!this.eat("}")) {
      this.skipSpaces();
      const key = /["']/.test(this.src[this.pos]) ? this.string() : this.identifier();
      if (!this.eat(":")) this.fail();
      obj[key] = this.value();
      if (!this.eat(",") && !this.eat("}")) this.fail();
      else if (this.src[this.pos - 1] === "}") break;
    }
    return obj;
  }

  identifier() {
    const id = this.src.slice(this.pos).match(/^[A-Za-z_$][\w$]*/);
    if (!id) this.fail("clé");
    this.pos += id[0].length;
    return id[0];
  }

  string() {
    const quote = this.src[this.pos++];
    let out = "";
    while (this.pos < this.src.length) {
      const c = this.src[this.pos++];
      if (c === quote) return out;
      if (quote === "`" && c === "$" && this.src[this.pos] === "{") this.fail("gabarit ${}");
      if (c !== "\\") {
        out += c;
        continue;
      }
      const e = this.src[this.pos++];
      if (e === "u") {
        out += String.fromCharCode(parseInt(this.src.slice(this.pos, this.pos + 4), 16));
        this.pos += 4;
      } else if (e === "x") {
        out += String.fromCharCode(parseInt(this.src.slice(this.pos, this.pos + 2), 16));
        this.pos += 2;
      } else if (e === "\n") {
        // continuation de ligne
      } else {
        out += ESCAPES[e] ?? e;
      }
    }
    return this.fail("fin de chaîne");
  }
}

export function findChallenge(list, day) {
  const challenge = list.find((c) => c.day === day);
  if (!challenge) throw new Error(`jour ${day} non publié pour l'instant`);
  return challenge;
}

export function dayDirName(day) {
  return `day-${String(day).padStart(2, "0")}`;
}
