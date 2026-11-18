import { LANGUAGES, findLanguage } from "./languages.mjs";

const NAMED = { lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", amp: "&" };

/** Une seule passe : « &amp;lt; » donne « &lt; », jamais « < ». */
function decodeEntities(text) {
  return text.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-z]+);/g, (match, ent) => {
    if (ent[0] !== "#") return NAMED[ent] ?? match;
    const code = /^#[xX]/.test(ent) ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

/** Blocs `<pre><code class="language-X">` d'une fiche : les squelettes fournis par la consigne. */
export function extractSnippets(html) {
  const blocks = html.matchAll(/<pre>\s*<code(?:\s+class="([^"]*)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g);
  return [...blocks].map(([, cls, body]) => ({
    lang: cls?.match(/language-([\w#+-]+)/)?.[1] ?? null,
    code: decodeEntities(stripTags(body)),
  }));
}

export function snippetFileName(index, lang) {
  const num = String(index).padStart(2, "0");
  if (!lang) return `${num}.txt`;
  const known = findLanguage(lang);
  return `${num}.${lang}.${known ? LANGUAGES[known].ext : "txt"}`;
}
